<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
  exit;
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || $rawBody === '') {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'Empty body']);
  exit;
}

$data = json_decode($rawBody, true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'Invalid JSON']);
  exit;
}

$requiredFields = [
  'fcm_token',
  'environment',
  'system_enabled',
  'app_enabled',
  'platform',
];

foreach ($requiredFields as $field) {
  if (!array_key_exists($field, $data)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => "Missing field: {$field}"]);
    exit;
  }
}

$fcmToken = trim((string) $data['fcm_token']);
if ($fcmToken === '') {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'fcm_token is required']);
  exit;
}

$environment = strtoupper(trim((string) $data['environment']));
if (!in_array($environment, ['DEV', 'PROD'], true)) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'Invalid environment']);
  exit;
}

$systemEnabled = filter_var($data['system_enabled'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
$appEnabled = filter_var($data['app_enabled'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

if ($systemEnabled === null || $appEnabled === null) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'Invalid boolean fields']);
  exit;
}

$platform = trim((string) $data['platform']);
if ($platform === '') {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'platform is required']);
  exit;
}

$deviceName = isset($data['device_name']) ? trim((string) $data['device_name']) : null;
$appVersion = isset($data['app_version']) ? trim((string) $data['app_version']) : null;
$buildNumber = isset($data['build_number']) ? trim((string) $data['build_number']) : null;

$activeForImportantAlerts = ($systemEnabled && $appEnabled) ? 1 : 0;

try {
  $dbHost = getenv('DB_HOST') ?: 'localhost';
  $dbName = getenv('DB_NAME') ?: 'fmcityfest';
  $dbUser = getenv('DB_USER') ?: 'fmcityfest';
  $dbPass = getenv('DB_PASS') ?: 'ENxZj8a9GK';

  $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
  $pdo = new PDO($dsn, $dbUser, $dbPass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ]);

  $sql = "
    INSERT INTO notification_tokens (
      fcm_token,
      environment,
      system_enabled,
      app_enabled,
      active_for_important_alerts,
      platform,
      device_name,
      app_version,
      build_number,
      last_seen_at
    ) VALUES (
      :fcm_token,
      :environment,
      :system_enabled,
      :app_enabled,
      :active_for_important_alerts,
      :platform,
      :device_name,
      :app_version,
      :build_number,
      NOW()
    )
    ON DUPLICATE KEY UPDATE
      system_enabled = VALUES(system_enabled),
      app_enabled = VALUES(app_enabled),
      active_for_important_alerts = VALUES(active_for_important_alerts),
      platform = VALUES(platform),
      device_name = VALUES(device_name),
      app_version = VALUES(app_version),
      build_number = VALUES(build_number),
      last_seen_at = VALUES(last_seen_at)
  ";

  $stmt = $pdo->prepare($sql);
  $stmt->execute([
    ':fcm_token' => $fcmToken,
    ':environment' => $environment,
    ':system_enabled' => $systemEnabled ? 1 : 0,
    ':app_enabled' => $appEnabled ? 1 : 0,
    ':active_for_important_alerts' => $activeForImportantAlerts,
    ':platform' => $platform,
    ':device_name' => $deviceName ?: null,
    ':app_version' => $appVersion ?: null,
    ':build_number' => $buildNumber ?: null,
  ]);

  echo json_encode(['status' => 'ok']);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['status' => 'error', 'message' => 'Server error']);
}
