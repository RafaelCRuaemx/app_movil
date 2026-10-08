const fs = require('fs');

let content = fs.readFileSync('src/app/(tab)/index.tsx', 'utf8');

const apiUrlImport = `const API_URL = 'http://192.168.100.9/UAEMex/wsl/Checador/backend/api';\n`;

content = content.replace(/(import .*;\n)+/, (match) => {
    return match + apiUrlImport;
});

content = content.replace(
  /const \[userData, setUserData\] = useState<any>\(null\);/,
  `const [userData, setUserData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);`
);

content = content.replace(
  /useEffect\(\(\) => \{\s*\/\/[^\n]*\s*const loadUserData = async \(\) => \{\s*const storedData = await SecureStore\.getItemAsync\('userData'\);\s*if \(storedData\) \{\s*setUserData\(JSON\.parse\(storedData\)\);\s*\}\s*\};\s*loadUserData\(\);\s*\}, \[\]\);/,
  `useEffect(() => {
    const loadUserData = async () => {
      const storedData = await SecureStore.getItemAsync('userData');
      if (storedData) {
        const user = JSON.parse(storedData);
        setUserData(user);
        fetchDashboardData(user.id);
      }
    };
    loadUserData();
  }, []);

  const fetchDashboardData = async (usuario_id: string | number) => {
    try {
      const res = await fetch(\`\${API_URL}/dashboard_app.php\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id })
      });
      const json = await res.json();
      if (json.success) {
        setDashboardData(json.dashboard);
      }
    } catch (e) {
      console.log('Error fetching dashboard:', e);
    } finally {
      setLoading(false);
    }
  };`
);

// Progreso de hoy
content = content.replace(
  /<View style=\{styles\.grid4\}>\s*<ProgressBox icon="log-in-outline" title="ENTRADA" time="--:--" \/>\s*<ProgressBox icon="cafe-outline" title="S. COMIDA" time="--:--" \/>\s*<ProgressBox icon="return-down-back-outline" title="V. COMIDA" time="--:--" \/>\s*<ProgressBox icon="log-out-outline" title="SALIDA" time="--:--" \/>\s*<\/View>/,
  `<View style={styles.grid4}>
            <ProgressBox icon="log-in-outline" title="ENTRADA" time={dashboardData?.progreso_hoy?.entrada || "--:--"} />
            <ProgressBox icon="cafe-outline" title="S. COMIDA" time={dashboardData?.progreso_hoy?.salida_comida || "--:--"} />
            <ProgressBox icon="return-down-back-outline" title="V. COMIDA" time={dashboardData?.progreso_hoy?.regreso_comida || "--:--"} />
            <ProgressBox icon="log-out-outline" title="SALIDA" time={dashboardData?.progreso_hoy?.salida || "--:--"} />
          </View>`
);

// Estadísticas de mes
content = content.replace(
  /<Text style=\{\[styles\.label, \{ marginBottom: 10 \}\]\}>ESTADÍSTICAS DE OCT 2026<\/Text>/,
  `<Text style={[styles.label, { marginBottom: 10 }]}>ESTADÍSTICAS DE {dashboardData?.mes_texto || "MES"}</Text>`
);

content = content.replace(
  /<Text style=\{styles\.statNumYellow\}>0<\/Text>/,
  `<Text style={styles.statNumYellow}>{dashboardData?.estadisticas?.retardos || 0}</Text>`
);

content = content.replace(
  /<Text style=\{styles\.statNumRed\}>5<\/Text>/,
  `<Text style={styles.statNumRed}>{dashboardData?.estadisticas?.inasistencias || 0}</Text>`
);

// Lista de inasistencias
content = content.replace(
  /<View style=\{styles\.inasistenciaList\}>\s*<InasistenciaRow date="01\/10\/2026" \/>\s*<InasistenciaRow date="02\/10\/2026" \/>\s*<InasistenciaRow date="05\/10\/2026" \/>\s*<InasistenciaRow date="06\/10\/2026" \/>\s*<InasistenciaRow date="07\/10\/2026" isLast \/>\s*<\/View>/,
  `<View style={styles.inasistenciaList}>
                {dashboardData?.estadisticas?.fechas_inasistencias && dashboardData.estadisticas.fechas_inasistencias.length > 0 ? (
                  dashboardData.estadisticas.fechas_inasistencias.map((fecha: string, index: number) => (
                    <InasistenciaRow 
                      key={index} 
                      date={fecha} 
                      isLast={index === dashboardData.estadisticas.fechas_inasistencias.length - 1} 
                    />
                  ))
                ) : (
                  <View style={{ padding: 12 }}><Text style={{ color: '#7f1d1d' }}>Sin inasistencias este mes</Text></View>
                )}
              </View>`
);

// Jornadas
content = content.replace(
  /<View style=\{\[styles\.card, \{ marginBottom: 40, paddingHorizontal: 0, paddingVertical: 0 \}\]\}>\s*<JornadaRow date="Lunes 31 de Ago" time="Ent\. 08:00 · Sal\. 17:00" \/>\s*<JornadaRow date="Domingo 30 de Ago" time="Ent\. 08:00 · Sal\. 17:00" \/>\s*<JornadaRow date="Sábado 29 de Ago" time="Ent\. 08:00 · Sal\. 17:00" noBorder \/>\s*<\/View>/,
  `<View style={[styles.card, { marginBottom: 40, paddingHorizontal: 0, paddingVertical: 0 }]}>
          {dashboardData?.ultimas_jornadas && dashboardData.ultimas_jornadas.length > 0 ? (
            dashboardData.ultimas_jornadas.map((jornada: any, index: number) => (
              <JornadaRow 
                key={index} 
                date={jornada.fecha_formateada} 
                time={\`Ent. \${jornada.entrada} · Sal. \${jornada.salida}\`} 
                noBorder={index === dashboardData.ultimas_jornadas.length - 1} 
              />
            ))
          ) : (
            <View style={{ padding: 20 }}><Text style={{ color: '#64748b', textAlign: 'center' }}>No hay jornadas recientes</Text></View>
          )}
        </View>`
);

// Loading state
content = content.replace(
  /<ScrollView style=\{styles\.container\} showsVerticalScrollIndicator=\{false\}>/,
  `{loading && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Cargando información...</Text>
          </View>
        )}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>`
);

fs.writeFileSync('src/app/(tab)/index.tsx', content);
