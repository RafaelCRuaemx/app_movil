const fs = require('fs');

let content = fs.readFileSync('src/app/(tab)/historial.tsx', 'utf8');

const importStr = `import React, { useState, useEffect } from 'react';\nimport * as SecureStore from 'expo-secure-store';\nconst API_URL = 'http://192.168.100.9/UAEMex/wsl/Checador/backend/api';\n`;

content = content.replace(/import React from 'react';\n/, importStr);

content = content.replace(
  /export default function HistorialScreen\(\) \{/,
  `export default function HistorialScreen() {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const storedData = await SecureStore.getItemAsync('userData');
        if (storedData) {
          const user = JSON.parse(storedData);
          const res = await fetch(\`\${API_URL}/historial_app.php\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: user.id, limite: 30 })
          });
          const json = await res.json();
          if (json.success) {
            setHistorial(json.historial);
          }
        }
      } catch (e) {
        console.log('Error fetching history:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, []);`
);

content = content.replace(
  /<View style=\{styles\.card\}>\s*<HistoryRow date="Lunes 31 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" \/>\s*<HistoryRow date="Domingo 30 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" \/>\s*<HistoryRow date="Sábado 29 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" \/>\s*<HistoryRow date="Viernes 28 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" \/>\s*<HistoryRow date="Jueves 27 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" \/>\s*<HistoryRow date="Miércoles 26 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" \/>\s*<HistoryRow date="Martes 25 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" \/>\s*<HistoryRow date="Lunes 24 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" noBorder \/>\s*<\/View>/,
  `<View style={styles.card}>
          {historial.length > 0 ? (
            historial.map((h: any, index: number) => (
              <HistoryRow 
                key={index} 
                date={h.fecha_formateada} 
                ent={h.entrada} 
                sc={h.comida_salida} 
                vc={h.comida_regreso} 
                sal={h.salida} 
                noBorder={index === historial.length - 1} 
              />
            ))
          ) : (
            <View style={{ padding: 20 }}><Text style={{ textAlign: 'center', color: '#64748b' }}>No hay historial disponible</Text></View>
          )}
        </View>`
);

content = content.replace(
  /<ScrollView style=\{styles\.container\} showsVerticalScrollIndicator=\{false\}>/,
  `{loading && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>Cargando historial...</Text>
        </View>
      )}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>`
);

fs.writeFileSync('src/app/(tab)/historial.tsx', content);
