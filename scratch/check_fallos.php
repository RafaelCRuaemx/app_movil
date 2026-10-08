<?php
require 'C:\xampp\htdocs\UAEMex\wsl\Checador\bootstrap.php';
$stmt = db_query('SELECT * FROM fallos_asistencia ORDER BY id DESC LIMIT 2');
print_r(db_fetch_all($stmt));
