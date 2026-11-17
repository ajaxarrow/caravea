<?php

use Illuminate\Process\Pool;
use Illuminate\Support\Facades\Process;

/*
 * A real race: several PHP processes, each with its own database connection,
 * wait for the same instant and then try to book the same bay and time
 * against a shared on-disk SQLite database.
 *
 * Exactly one must win. Every other attempt must be told the slot is taken
 * (a clean 422 in the API), not crash with "database is locked" and not
 * create a duplicate.
 */
it('lets exactly one of several simultaneous requests take a slot', function () {
    $database = sys_get_temp_dir().'/bookings-race-'.uniqid().'.sqlite';
    touch($database);
    $env = ['DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => $database, 'DB_URL' => ''];

    try {
        Process::path(base_path())->env($env)->run([PHP_BINARY, 'artisan', 'migrate', '--force'])->throw();

        $pdo = new PDO("sqlite:{$database}");
        $pdo->exec("insert into service_bays (name, lock_version, created_at, updated_at) values ('Bay 1', 0, '2030-01-01', '2030-01-01')");

        $workers = 8;
        $goAt = (string) (microtime(true) + 2.0);

        $results = Process::pool(function (Pool $pool) use ($workers, $env, $goAt) {
            for ($i = 0; $i < $workers; $i++) {
                $pool->path(base_path())->env($env)->command([
                    PHP_BINARY, 'tests/Support/attempt-booking.php',
                    '1', '2030-03-05T22:00:00Z', '2030-03-06T00:00:00Z', $goAt,
                ]);
            }
        })->start()->wait();

        $outcomes = collect($results)->map(fn ($result) => trim($result->output().$result->errorOutput()));

        expect($outcomes->filter(fn ($o) => $o === 'created'))->toHaveCount(1)
            ->and($outcomes->filter(fn ($o) => $o === 'conflict'))->toHaveCount($workers - 1, 'Unexpected outcomes: '.$outcomes->toJson())
            ->and((int) $pdo->query('select count(*) from bookings')->fetchColumn())->toBe(1);
    } finally {
        $pdo = null;
        foreach (glob($database.'*') as $file) {
            @unlink($file);
        }
    }
})->group('concurrency');
