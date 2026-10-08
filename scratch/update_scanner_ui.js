const fs = require('fs');
let content = fs.readFileSync('src/app/scanner.tsx', 'utf8');

// Fix alert message logic to use json.motivo
content = content.replace(
  /json\.message \|\| "No se pudo registrar la asistencia\."/g,
  'json.motivo || json.message || "No se pudo registrar la asistencia."'
);

// Increase camera wrapper size from 280 to 320
content = content.replace(
  /cameraWrapper: \{ width: 280, height: 280, position: 'relative', marginBottom: 30 \},/,
  "cameraWrapper: { width: 330, height: 330, position: 'relative', marginBottom: 30 },"
);

// We should also reduce the corner sizes slightly if needed, or leave them as 40x40.
// Let's also adjust the scanLineAnim to value 295 (330 - 35) instead of 245
content = content.replace(
  /toValue: 245,/g,
  "toValue: 295,"
);

fs.writeFileSync('src/app/scanner.tsx', content);
