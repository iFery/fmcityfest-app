<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/storage.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  sharedProgramJsonError('Tento endpoint podporuje pouze metodu POST.', 405);
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || trim($rawBody) === '') {
  sharedProgramJsonError('Odeslaná data jsou prázdná.');
}

$payload = json_decode($rawBody, true);
if (!is_array($payload)) {
  sharedProgramJsonError('Data nejsou ve formátu JSON.');
}

if (!array_key_exists('items', $payload)) {
  sharedProgramJsonError('Pole "items" je povinné.');
}

$items = sharedProgramNormalizeItems($payload['items']);
$code = sharedProgramGenerateCode();
sharedProgramSave($code, $items);

sharedProgramJsonResponse([
  'code' => $code,
], 201);
