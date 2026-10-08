const fs = require('fs');

let content = fs.readFileSync('src/app/scanner.tsx', 'utf8');

content = content.replace(
  /const iniciarCamara = async \(\) => \{[\s\S]*?setScanned\(false\);\s*\};/,
  `const iniciarCamara = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    
    // Encendemos la cámara inmediatamente para no hacer esperar al usuario
    setCameraActive(true);
    setScanned(false);

    // Solicitamos la ubicación sin bloquear la UI
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError("Permiso de ubicación denegado.");
        } else {
          // Usamos Balanced para que sea rápido y no se quede colgado buscando satélites
          let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setLocation(loc);
          setLocationError(null);
        }
      } catch (e) {
        console.log("Error de ubicación", e);
      }
    })();
  };`
);

fs.writeFileSync('src/app/scanner.tsx', content);
