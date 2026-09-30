<?php

return [
    'cookie' => env('AUTH_SESSION_COOKIE', 'bimbelku_session'),
    'marker' => 'cookie-session',
    'standard_minutes' => (int) env('AUTH_SESSION_STANDARD_MINUTES', 720),
    'remembered_minutes' => (int) env('AUTH_SESSION_REMEMBERED_MINUTES', 43200),
    'admin_minutes' => (int) env('AUTH_SESSION_ADMIN_MINUTES', 720),
    'refresh_threshold_minutes' => (int) env('AUTH_SESSION_REFRESH_THRESHOLD_MINUTES', 10080),
];
