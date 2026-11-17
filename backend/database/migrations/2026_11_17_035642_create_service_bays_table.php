<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_bays', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60);
            // Bumped inside every booking write for this bay. The UPDATE is what
            // serialises concurrent bookings — see BookingScheduler::lockBay().
            $table->unsignedBigInteger('lock_version')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_bays');
    }
};
