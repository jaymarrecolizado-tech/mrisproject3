<?php
/**
 * DICT MRIS — API Integration Test Suite
 * Run via: php api/tests/run_tests.php
 */

define('API_URL', 'http://localhost/Projects/projecttracking3/api/index.php');

require_once __DIR__ . '/../helpers/RateLimiter.php';
RateLimiter::reset('admin@dict.gov.ph');
RateLimiter::reset('127.0.0.1');
RateLimiter::reset('::1');
RateLimiter::reset('unknown');

$testsRun = 0;
$testsPassed = 0;
$testsFailed = 0;

function assertEqual($expected, $actual, $message = '') {
    global $testsRun, $testsPassed, $testsFailed;
    $testsRun++;
    if ($expected === $actual) {
        $testsPassed++;
        echo "\033[32m[PASS]\033[0m $message\n";
    } else {
        $testsFailed++;
        echo "\033[31m[FAIL]\033[0m $message\n";
        echo "       Expected: " . json_encode($expected) . "\n";
        echo "       Actual:   " . json_encode($actual) . "\n";
    }
}

function makeRequest($action, $method = 'GET', $body = null, $token = null) {
    $url = API_URL . '?action=' . $action;
    $ch = curl_init($url);
    
    $headers = [
        'Content-Type: application/json',
    ];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => json_decode($response, true)
    ];
}

echo "=== DICT MRIS Integration Test Suite ===\n\n";

// 1. Test Login with invalid credentials
echo "1. Testing Login with invalid credentials...\n";
$loginFailRes = makeRequest('auth.login', 'POST', [
    'email' => 'admin@dict.gov.ph',
    'password' => 'wrong_password'
]);
assertEqual(401, $loginFailRes['code'], "Login fails with 401 on incorrect password");
assertEqual(false, $loginFailRes['body']['success'] ?? null, "Response indicates success=false");

// 2. Test Login with valid credentials
echo "\n2. Testing Login with valid credentials...\n";
$loginRes = makeRequest('auth.login', 'POST', [
    'email' => 'admin@dict.gov.ph',
    'password' => 'admin123'
]);
assertEqual(200, $loginRes['code'], "Login succeeds with 200 on correct credentials");
assertEqual(true, $loginRes['body']['success'] ?? null, "Response indicates success=true");
$token = $loginRes['body']['data']['token'] ?? null;
assertEqual(true, !empty($token), "Valid JWT token was returned");

if (!$token) {
    echo "\n\033[31m[CRITICAL] Login failed, skipping further authenticated tests.\033[0m\n";
    exit(1);
}

// 3. Test auth.me endpoint
echo "\n3. Testing Auth.Me identity verification...\n";
$meRes = makeRequest('auth.me', 'GET', null, $token);
assertEqual(200, $meRes['code'], "auth.me returns HTTP 200");
assertEqual('admin@dict.gov.ph', $meRes['body']['data']['email'] ?? null, "Correct user email returned in auth.me");
assertEqual('super_admin', $meRes['body']['data']['role'] ?? null, "Correct user role returned in auth.me");

// 4. Test projects.list endpoint
echo "\n4. Testing Projects List access...\n";
$projectsRes = makeRequest('projects.list', 'GET', null, $token);
assertEqual(200, $projectsRes['code'], "projects.list returns HTTP 200");
assertEqual(true, is_array($projectsRes['body']['data'] ?? null), "Projects list data is an array");
assertEqual(true, count($projectsRes['body']['data'] ?? []) > 0, "Projects list is not empty");

// 5. Test sites.list endpoint
echo "\n5. Testing Sites List access...\n";
$sitesRes = makeRequest('sites.list', 'GET', null, $token);
assertEqual(200, $sitesRes['code'], "sites.list returns HTTP 200");
assertEqual(true, is_array($sitesRes['body']['data'] ?? null), "Sites list data is an array");

// 6. Test project CRUD lifecycle
echo "\n6. Testing Project CRUD lifecycle...\n";
$projectCode = 'TEST-' . rand(1000, 9999);
$projectPayload = [
    'code' => $projectCode,
    'name' => 'Integration Test Project',
    'full_name' => 'Integration Test Project Full Name',
    'color' => '#FF5733',
    'icon' => 'test-icon',
    'description' => 'A temporary project for automated tests',
    'type' => 'milestone'
];

// Create
$createRes = makeRequest('projects.create', 'POST', $projectPayload, $token);
assertEqual(201, $createRes['code'], "projects.create returns HTTP 201 (Created)");
$projectId = $createRes['body']['data']['id'] ?? null;
assertEqual(true, !empty($projectId), "Created project returned a valid ID: $projectId");

if ($projectId) {
    // Update
    $updatePayload = $projectPayload;
    $updatePayload['name'] = 'Updated Integration Test Project';
    $updateRes = makeRequest('projects.update&id=' . $projectId, 'PUT', $updatePayload, $token);
    assertEqual(200, $updateRes['code'], "projects.update returns HTTP 200");
    
    // Read
    $getRes = makeRequest('projects.get', 'GET', null, $token);
    // Find the updated project in the list or via specific project fetch
    $projectList = makeRequest('projects.list', 'GET', null, $token);
    $foundUpdated = false;
    foreach ($projectList['body']['data'] ?? [] as $proj) {
        if ($proj['id'] == $projectId && $proj['name'] === 'Updated Integration Test Project') {
            $foundUpdated = true;
            break;
        }
    }
    assertEqual(true, $foundUpdated, "Updated project details are successfully saved and read from database");
    
    // Delete
    // The route maps projects.delete to DELETE method. We pass the id in the URL params or query.
    // In api/index.php: 'projects.delete' => ['routes/projects.php', 'DELETE']
    // And request takes id from $_GET['id'].
    // Let's pass it via curl parameter
    $deleteRes = makeRequest('projects.delete', 'DELETE', null, $token);
    // Wait, let's look at projects.delete route implementation. Does it take id?
    // In api/index.php: $id = $_GET['id'] ?? null;
    // So we can pass id=projectId. Let's make the request using url parameters.
    $deleteUrl = 'projects.delete&id=' . $projectId;
    $deleteRes = makeRequest($deleteUrl, 'DELETE', null, $token);
    assertEqual(200, $deleteRes['code'], "projects.delete returns HTTP 200");
    
    // Verify deletion
    $projectListAfter = makeRequest('projects.list', 'GET', null, $token);
    $foundDeleted = false;
    foreach ($projectListAfter['body']['data'] ?? [] as $proj) {
        if ($proj['id'] == $projectId) {
            $foundDeleted = true;
            break;
        }
    }
    assertEqual(false, $foundDeleted, "Project is successfully deleted from database");
}

echo "\n=== Test Summary ===\n";
echo "Tests Run:    $testsRun\n";
echo "Tests Passed: $testsPassed\n";
echo "Tests Failed: $testsFailed\n";

if ($testsFailed > 0) {
    exit(1);
}
exit(0);
