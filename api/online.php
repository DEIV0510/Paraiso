<?php
/* =====================================================================
   PARAISOS — personas con la página abierta ahora mismo.
   Cada navegador manda un latido cada 25 s con un id aleatorio (sin
   cookies ni datos personales). Cuenta quien latió en los últimos 60 s.
   La IP solo se usa resumida con un hash que cambia cada día, para que
   una misma conexión no sume más de MAX_POR_IP ids. Los robots y los
   navegadores automáticos no se cuentan.
   Datos fuera de public_html: /home/viajespa/paraisos-data/online.json
   ===================================================================== */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

const TTL = 60;          // segundos sin latido para dejar de contar a alguien
const MAX_POR_IP = 4;    // ids distintos que suma una misma conexión
const MAX_TOTAL = 2000;  // tope de seguridad del archivo

$dir = getenv('PARAISOS_DATA') ?: dirname(__DIR__, 2) . '/paraisos-data';
if (!is_dir($dir)) {
  @mkdir($dir, 0700, true);
}
$file = $dir . '/online.json';

$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
$esRobot = $ua === '' || preg_match('/bot|crawl|spider|slurp|headless|lighthouse|pagespeed/i', $ua) === 1;

$id = '';
$adios = false;
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
  $datos = json_decode((string) file_get_contents('php://input', false, null, 0, 200), true);
  if (is_array($datos) && isset($datos['id']) && is_string($datos['id']) && preg_match('/^[a-f0-9]{24}$/', $datos['id']) === 1) {
    $id = $datos['id'];
    $adios = !empty($datos['bye']);
  }
}

$fh = @fopen($file, 'c+');
if ($fh === false) {
  http_response_code(503);
  echo json_encode(['online' => null]);
  exit;
}
flock($fh, LOCK_EX);
$estado = json_decode((string) stream_get_contents($fh), true);
if (!is_array($estado)) {
  $estado = [];
}

// La sal del hash de IP cambia cada día y nunca sale del servidor
$hoy = gmdate('Y-m-d');
if (($estado['dia'] ?? '') !== $hoy || empty($estado['sal'])) {
  $estado['dia'] = $hoy;
  $estado['sal'] = bin2hex(random_bytes(16));
}

$ahora = time();
$vivos = [];
foreach (($estado['v'] ?? []) as $clave => $e) {
  if (is_array($e) && isset($e['t'], $e['ip']) && ($ahora - (int) $e['t']) < TTL) {
    $vivos[$clave] = $e;
  }
}

if ($id !== '' && !$esRobot) {
  if ($adios) {
    unset($vivos[$id]);
  } elseif (isset($vivos[$id])) {
    $vivos[$id]['t'] = $ahora;
  } else {
    $ip = substr(hash('sha256', $estado['sal'] . ($_SERVER['REMOTE_ADDR'] ?? '')), 0, 16);
    $deEstaIp = 0;
    foreach ($vivos as $e) {
      if ($e['ip'] === $ip) {
        $deEstaIp++;
      }
    }
    if ($deEstaIp < MAX_POR_IP && count($vivos) < MAX_TOTAL) {
      $vivos[$id] = ['t' => $ahora, 'ip' => $ip];
    }
  }
}

$estado['v'] = $vivos;
ftruncate($fh, 0);
rewind($fh);
fwrite($fh, json_encode($estado));
fflush($fh);
flock($fh, LOCK_UN);
fclose($fh);

echo json_encode(['online' => count($vivos)]);
