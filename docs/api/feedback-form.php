<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['status' => 'error', 'message' => 'Tento endpoint podporuje pouze metodu POST.']);
  exit;
}

function jsonError(string $message, int $code = 400, array $extra = []): void {
  http_response_code($code);
  echo json_encode(array_merge([
    'status' => 'error',
    'message' => $message,
  ], $extra));
  exit;
}

function getFeedbackApiKey(): string {
  return getenv('FEEDBACK_API_KEY') ?: 'dev-feedback-key';
}

function readJsonBody(): array {
  $rawBody = file_get_contents('php://input');
  if ($rawBody === false || trim($rawBody) === '') {
    return [];
  }

  $decoded = json_decode($rawBody, true);
  if (!is_array($decoded)) {
    jsonError('Odeslaná data nejsou ve správném formátu.');
  }

  return $decoded;
}

function generateUuidV4(): string {
  $data = random_bytes(16);
  $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
  $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$isJson = stripos($contentType, 'application/json') !== false;

$providedKey = $_SERVER['HTTP_X_FMC_FEEDBACK_KEY'] ?? '';
$expectedKey = getFeedbackApiKey();
if ($expectedKey !== '' && !hash_equals($expectedKey, $providedKey)) {
  jsonError('Neautorizovaný požadavek.', 401);
}

$payload = $isJson ? readJsonBody() : $_POST;

$feedbackType = isset($payload['feedbackType']) ? trim((string) $payload['feedbackType']) : '';
$comment = isset($payload['comment']) ? trim((string) $payload['comment']) : '';
$email = isset($payload['email']) ? trim((string) $payload['email']) : '';
$appVersion = isset($payload['appVersion']) ? trim((string) $payload['appVersion']) : null;
$buildNumber = isset($payload['buildNumber']) ? trim((string) $payload['buildNumber']) : null;
$platform = isset($payload['platform']) ? trim((string) $payload['platform']) : null;
$deviceModel = isset($payload['deviceModel']) ? trim((string) $payload['deviceModel']) : null;
$systemVersion = isset($payload['systemVersion']) ? trim((string) $payload['systemVersion']) : null;

$allowedTypes = ['bug', 'improvement', 'other'];
if ($feedbackType === '' || !in_array($feedbackType, $allowedTypes, true)) {
  jsonError('Vyberte prosím typ zpětné vazby (chyba, návrh na zlepšení nebo jiná zpráva).');
}

if ($comment === '') {
  jsonError('Zadejte prosím svůj komentář.');
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  jsonError('Zadaná e-mailová adresa není ve správném formátu.');
}

function normalizeUploadedFiles(array $field): array {
  if (!is_array($field['name'])) {
    return [$field];
  }
  $files = [];
  foreach ($field['name'] as $index => $name) {
    $files[] = [
      'name' => $name,
      'type' => $field['type'][$index],
      'tmp_name' => $field['tmp_name'][$index],
      'error' => $field['error'][$index],
      'size' => $field['size'][$index],
    ];
  }
  return $files;
}

function storeUploadedPhoto(array $photo): string {
  if ($photo['error'] !== UPLOAD_ERR_OK) {
    jsonError('Fotografii se nepodařilo nahrát. Zkuste to prosím znovu.');
  }

  $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  $mimeType = mime_content_type($photo['tmp_name']);

  if ($mimeType === false || !in_array($mimeType, $allowedMimeTypes, true)) {
    jsonError('Nepodporovaný formát obrázku. Použijte JPG, PNG, WEBP nebo GIF.');
  }

  $uploadRoot = __DIR__ . '/uploads/feedback';
  if (!is_dir($uploadRoot) && !mkdir($uploadRoot, 0775, true) && !is_dir($uploadRoot)) {
    jsonError('Na serveru se nepodařilo připravit úložiště pro obrázky.', 500);
  }

  $extension = pathinfo($photo['name'], PATHINFO_EXTENSION) ?: 'jpg';
  $fileName = generateUuidV4() . '.' . strtolower($extension);
  $destination = $uploadRoot . '/' . $fileName;

  if (!move_uploaded_file($photo['tmp_name'], $destination)) {
    jsonError('Fotografii se nepodařilo uložit.', 500);
  }

  return '/uploads/feedback/' . $fileName;
}

$photoUrls = [];

if (!$isJson && isset($_FILES['photos'])) {
  foreach (normalizeUploadedFiles($_FILES['photos']) as $photo) {
    if (is_uploaded_file($photo['tmp_name'])) {
      $photoUrls[] = storeUploadedPhoto($photo);
    }
  }
}

if (!$isJson && isset($_FILES['photo']) && is_uploaded_file($_FILES['photo']['tmp_name'])) {
  $photoUrls[] = storeUploadedPhoto($_FILES['photo']);
}

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

  $stmt = $pdo->prepare('
    INSERT INTO feedback (
      feedback_type,
      comment,
      email,
      photo_url,
      app_version,
      build_number,
      platform,
      device_model,
      system_version,
      created_at
    )
    VALUES (
      :feedback_type,
      :comment,
      :email,
      :photo_url,
      :app_version,
      :build_number,
      :platform,
      :device_model,
      :system_version,
      NOW()
    )
  ');

  $stmt->execute([
    ':feedback_type' => $feedbackType,
    ':comment' => $comment,
    ':email' => $email !== '' ? $email : null,
    ':photo_url' => !empty($photoUrls) ? json_encode($photoUrls) : null,
    ':app_version' => $appVersion ?: null,
    ':build_number' => $buildNumber ?: null,
    ':platform' => $platform ?: null,
    ':device_model' => $deviceModel ?: null,
    ':system_version' => $systemVersion ?: null,
  ]);

  http_response_code(201);
  echo json_encode([
    'status' => 'ok',
    'message' => 'Děkujeme za zpětnou vazbu! Zpráva byla úspěšně odeslána.'
  ]);
} catch (Throwable $e) {
  error_log('Feedback API error: ' . $e->getMessage());
  jsonError('Na serveru došlo k chybě. Zkuste to prosím později.', 500, [
    'error_code' => 'feedback_db_error',
    'details' => $e->getMessage(),
  ]);
}