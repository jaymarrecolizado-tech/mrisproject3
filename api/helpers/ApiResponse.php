<?php
/**
 * DICT MRIS — API Response Helper
 */

class ApiResponse {
    public static function success(mixed $data = null, string $message = 'OK', int $code = 200): void {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ]);
    }

    public static function error(string $message, int $code = 400, mixed $errors = null): void {
        http_response_code($code);
        header('Content-Type: application/json');
        $response = [
            'success' => false,
            'message' => $message,
        ];
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        echo json_encode($response);
    }

    public static function paginated(array $data, int $total, int $page, int $perPage): void {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => (int) ceil($total / $perPage),
            ],
        ]);
    }
}
