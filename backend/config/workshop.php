<?php

return [

    /*
    | The dealer's local timezone. Booking times are entered and displayed in
    | this zone, and stored in UTC. In a multi-tenant platform this would be a
    | per-company setting rather than app config.
    */
    'timezone' => env('WORKSHOP_TIMEZONE', 'Australia/Melbourne'),

];
