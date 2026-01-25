<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include('../../db.php');


$sql = "
    SELECT id, nazev, obrazek, text, datum 
    FROM blog 
    Where aktivni = 1
    ORDER BY datum DESC 
    LIMIT 8
";

$query = mysqli_query($db, $sql);

$news = [];

while ($row = mysqli_fetch_assoc($query)) {
    $news[] = [
        'id' => (int)$row['id'],
        'title' => $row['nazev'],
        'image_url' => 'https://www.fmcityfest.cz/media/blog/nahled/' . $row['obrazek'],
        'date' => $row['datum'],
        'text' => $row['text']
    ];
}

header('Content-Type: application/json');
echo json_encode($news, JSON_PRETTY_PRINT);

mysqli_close($db);
