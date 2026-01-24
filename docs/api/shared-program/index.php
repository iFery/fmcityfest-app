<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/storage.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  sharedProgramJsonError('Tento endpoint podporuje pouze metodu GET.', 405);
}

$code = $_GET['code'] ?? '';

if ($code === '' && isset($_SERVER['PATH_INFO'])) {
  $code = ltrim((string) $_SERVER['PATH_INFO'], '/');
}

$code = strtoupper(trim((string) $code));

if ($code === '') {
  sharedProgramJsonError('Sdílený kód je povinný.', 400);
}

if (!sharedProgramIsValidCode($code)) {
  sharedProgramJsonError('Sdílený kód má neplatný formát.', 400);
}

$record = sharedProgramLoad($code);
if (!$record) {
  sharedProgramJsonError('Sdílený kód nebyl nalezen.', 404);
}

sharedProgramAssertNotExpired($code, $record);

$items = [];
if (isset($record['items']) && is_array($record['items'])) {
  foreach ($record['items'] as $item) {
    if (!is_scalar($item)) {
      continue;
    }
    $value = trim((string) $item);
    if ($value !== '') {
      $items[] = $value;
    }
  }
}

if (empty($items)) {
  sharedProgramJsonError('Sdílený program je prázdný nebo poškozený.', 404);
}

sharedProgramJsonResponse([
  'items' => $items,
]);
