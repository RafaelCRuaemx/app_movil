const fs = require('fs');

let content = fs.readFileSync('src/app/(tab)/perfil.tsx', 'utf8');

const importStr = `import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.100.9/UAEMex/wsl/Checador/backend/api';
`;

content = content.replace(/^.*import \* as SecureStore from 'expo-secure-store';/ms, importStr);

content = content.replace(
  /export default function PerfilScreen\(\) \{[\s\S]*?const handleLogout = async \(\) => \{/,
  `export default function PerfilScreen() {
  const [perfilData, setPerfilData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const storedData = await SecureStore.getItemAsync('userData');
        if (storedData) {
          const user = JSON.parse(storedData);
          const res = await fetch(\`\${API_URL}/perfil_app.php\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: user.id })
          });
          const json = await res.json();
          if (json.success) {
            setPerfilData(json.perfil);
          }
        }
      } catch (e) {
        console.log('Error fetching profile:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, []);

  const handleLogout = async () => {`
);

content = content.replace(
  /const userName = userData\?\.nombre \|\| "Cargando\.\.\.";\s*const userEmail = userData\?\.correo \|\| "Cargando\.\.\.";\s*const userRole = userData\?\.rol \|\| "Colaborador";/,
  `const userName = perfilData?.nombre || "Cargando...";
  const userEmail = perfilData?.correo || "Cargando...";
  const userRole = perfilData?.rol || "Colaborador";`
);

content = content.replace(
  /<View style=\{styles\.card\}>\s*<InfoRow label="OFICINA" value="OFICINA TEXCOCO" \/>\s*<InfoRow label="ROL" value=\{userRole\} \/>\s*<InfoRow label="DÍAS LAB\." value="Lun, Mar, Mié, Jue, Vie" \/>\s*<InfoRow label="ENTRADA" value="17:00" \/>\s*<InfoRow label="SALIDA" value="17:25" \/>\s*<InfoRow label="FECHA" value="2026-09-10" noBorder \/>\s*<\/View>/,
  `<View style={styles.card}>
          <InfoRow label="OFICINA" value={perfilData?.oficina || "--"} />
          <InfoRow label="ROL" value={userRole} />
          <InfoRow label="DÍAS LAB." value={perfilData?.dias_lab || "--"} />
          <InfoRow label="ENTRADA" value={perfilData?.entrada || "--"} />
          <InfoRow label="SALIDA" value={perfilData?.salida || "--"} />
          <InfoRow label="CREACIÓN" value={perfilData?.fecha_ingreso || "--"} noBorder />
        </View>`
);

content = content.replace(
  /<ScrollView style=\{styles\.container\} showsVerticalScrollIndicator=\{false\}>/,
  `{loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      )}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>`
);

fs.writeFileSync('src/app/(tab)/perfil.tsx', content);
