<?php
declare(strict_types=1);

const SHARED_PROGRAM_CODE_LENGTH_MIN = 5;
const SHARED_PROGRAM_CODE_LENGTH_MAX = 6;
const SHARED_PROGRAM_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const SHARED_PROGRAM_TABLE = 'shared_programs';

/**
 * Emit JSON error response and exit
 */
function sharedProgramJsonError(string $message, int $status = 400, array $extra = []): void {
  http_response_code($status);
  echo json_encode(array_merge([
    'status' => 'error',
    'message' => $message,
  ], $extra));
  exit;
}

/**
 * Emit JSON success response and exit
 */
function sharedProgramJsonResponse(array $payload, int $status = 200): void {
  http_response_code($status);
  echo json_encode($payload);
  exit;
}

/**
 * Get singleton PDO instance for shared program storage
 */
function sharedProgramGetPdo(): PDO {
  static $pdo;

  if ($pdo instanceof PDO) {
    return $pdo;
  }

  try {
    $dbHost = getenv('DB_HOST') ?: 'localhost';
    $dbName = getenv('DB_NAME') ?: 'fmcityfest';
    $dbUser = getenv('DB_USER') ?: 'fmcityfest';
    $dbPass = getenv('DB_PASS') ?: 'ENxZj8a9GK';

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $dbHost, $dbName);
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
  } catch (Throwable $e) {
    error_log('SharedProgram DB connect error: ' . $e->getMessage());
    sharedProgramJsonError('Databáze není dostupná. Zkus to prosím později.', 500);
  }
}

/**
 * Normalize provided items array
 */
function sharedProgramNormalizeItems($items): array {
  if (!is_array($items)) {
    sharedProgramJsonError('Pole "items" musí být polem řetězců.');
  }

  $normalized = [];
  foreach ($items as $item) {
    if (!is_scalar($item)) {
      continue;
    }
    $value = trim((string) $item);
    if ($value === '') {
      continue;
    }
    $normalized[] = $value;
  }

  $normalized = array_values(array_unique($normalized));

  if (count($normalized) === 0) {
    sharedProgramJsonError('Seznam položek je prázdný.');
  }

  if (count($normalized) > 200) {
    sharedProgramJsonError('Najednou lze sdílet maximálně 200 položek.');
  }

  return $normalized;
}

/**
 * Validate code format (URL-safe alphanumeric, 5-6 chars)
 */
function sharedProgramIsValidCode(string $code): bool {
  return (bool) preg_match('/^[A-Z0-9]{5,6}$/', $code);
}

/**
 * Load stored program by code
 */
function sharedProgramLoad(string $code): ?array {
  try {
    $pdo = sharedProgramGetPdo();
    $stmt = $pdo->prepare(
      'SELECT code, items_json, created_at, expires_at FROM `' . SHARED_PROGRAM_TABLE . '` WHERE code = :code LIMIT 1'
    );
    $stmt->execute([':code' => $code]);
    $row = $stmt->fetch();

    if (!$row) {
      return null;
    }

    $items = json_decode($row['items_json'] ?? '[]', true);
    if (!is_array($items)) {
      $items = [];
    }

    return [
      'code' => $row['code'],
      'items' => $items,
      'created_at' => isset($row['created_at']) ? strtotime((string) $row['created_at']) : 0,
      'expires_at' => isset($row['expires_at']) ? strtotime((string) $row['expires_at']) : 0,
    ];
  } catch (Throwable $e) {
    error_log('SharedProgram load error: ' . $e->getMessage());
    sharedProgramJsonError('Sdílený program se nepodařilo načíst.', 500);
  }
}

/**
 * Save shared program to storage
 */
function sharedProgramSave(string $code, array $items): void {
  try {
    $pdo = sharedProgramGetPdo();
    $stmt = $pdo->prepare(
      'INSERT INTO `' . SHARED_PROGRAM_TABLE . '` (code, items_json, created_at, expires_at)
       VALUES (:code, :items, :created_at, :expires_at)'
    );

    $stmt->execute([
      ':code' => $code,
      ':items' => json_encode($items, JSON_UNESCAPED_UNICODE),
      ':created_at' => date('Y-m-d H:i:s'),
      ':expires_at' => date('Y-m-d H:i:s', time() + SHARED_PROGRAM_TTL_SECONDS),
    ]);
  } catch (Throwable $e) {
    error_log('SharedProgram save error: ' . $e->getMessage());
    sharedProgramJsonError('Sdílený program se nepodařilo uložit.', 500);
  }
}

/**
 * Generate short unique code and ensure it is not already used
 */
function sharedProgramGenerateCode(): string {
  $alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  $maxAttempts = 50;

  try {
    $pdo = sharedProgramGetPdo();

    for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
      $length = random_int(SHARED_PROGRAM_CODE_LENGTH_MIN, SHARED_PROGRAM_CODE_LENGTH_MAX);
      $code = '';
      for ($i = 0; $i < $length; $i++) {
        $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
      }

      $stmt = $pdo->prepare('SELECT expires_at FROM `' . SHARED_PROGRAM_TABLE . '` WHERE code = :code LIMIT 1');
      $stmt->execute([':code' => $code]);
      $row = $stmt->fetch();

      if (!$row) {
        return $code;
      }

      $expiresAt = isset($row['expires_at']) ? strtotime((string) $row['expires_at']) : 0;
      if ($expiresAt > 0 && $expiresAt < time()) {
        sharedProgramDelete($code);
        return $code;
      }
    }
  } catch (Throwable $e) {
    error_log('SharedProgram code generation error: ' . $e->getMessage());
    sharedProgramJsonError('Nelze vytvořit další sdílený kód. Zkus to prosím později.', 500);
  }

  sharedProgramJsonError('Nelze vytvořit další sdílený kód. Zkus to prosím později.', 500);
}

/**
 * Remove expired program file
 */
function sharedProgramDelete(string $code): void {
  try {
    $pdo = sharedProgramGetPdo();
    $stmt = $pdo->prepare('DELETE FROM `' . SHARED_PROGRAM_TABLE . '` WHERE code = :code');
    $stmt->execute([':code' => $code]);
  } catch (Throwable $e) {
    error_log('SharedProgram delete error: ' . $e->getMessage());
  }
}

/**
 * Ensure the loaded record is not expired
 */
function sharedProgramAssertNotExpired(string $code, array $record): void {
  $expiresAt = isset($record['expires_at']) ? (int) $record['expires_at'] : 0;
  if ($expiresAt === 0) {
    return;
  }

  if ($expiresAt < time()) {
    sharedProgramDelete($code);
    sharedProgramJsonError('Sdílený kód vypršel. Požádej kamaráda o nový.', 404);
  }
}
