<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceBayResource;
use App\Models\ServiceBay;
use Illuminate\Http\JsonResponse;

/**
 * Reference data the booking UI needs: the bays to choose from and the
 * timezone booking times are entered in.
 */
class WorkshopController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'data' => [
                'timezone' => config('workshop.timezone'),
                'service_bays' => ServiceBayResource::collection(ServiceBay::query()->orderBy('id')->get()),
            ],
        ]);
    }
}
