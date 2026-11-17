<?php

use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\WorkshopController;
use Illuminate\Support\Facades\Route;

Route::get('workshop', WorkshopController::class)->name('workshop');

Route::apiResource('bookings', BookingController::class);
