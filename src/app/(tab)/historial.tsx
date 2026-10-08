import React, { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
const API_URL = 'http://192.168.100.9/UAEMex/wsl/Checador/backend/api';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HistorialScreen() {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const storedData = await SecureStore.getItemAsync('userData');
        if (storedData) {
          const user = JSON.parse(storedData);
          const res = await fetch(`${API_URL}/historial_app.php`, {
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
  }, []);
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* El botón de atrás es opcional en tabs, lo ponemos simulado o lo puedes envolver en TouchableOpacity */}
        <Ionicons name="arrow-back" size={24} color="#0f172a" style={styles.backIcon} />
        <Text style={styles.headerTitle}>Mi Historial de Asistencias</Text>
      </View>

      {loading && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>Cargando historial...</Text>
        </View>
      )}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HistoryRow({ date, ent, sc, vc, sal, noBorder }: { date: string, ent: string, sc: string, vc: string, sal: string, noBorder?: boolean }) {
  return (
    <View style={[styles.row, !noBorder && styles.rowBorder]}>
      {/* Icono de check */}
      <View style={styles.checkIconBox}>
        <Ionicons name="checkmark" size={18} color="#16a34a" />
      </View>
      
      {/* Contenido Central */}
      <View style={styles.content}>
        <Text style={styles.dateText}>{date}</Text>
        <View style={styles.timesContainer}>
          <TimeItem icon="log-in-outline" time={ent} />
          <TimeItem icon="cafe-outline" time={sc} />
          <TimeItem icon="return-down-back-outline" time={vc} />
          <TimeItem icon="log-out-outline" time={sal} />
        </View>
      </View>

      {/* Etiqueta Verde */}
      <View style={styles.pillGreen}>
        <Text style={styles.pillGreenText}>Completo</Text>
      </View>
    </View>
  );
}

function TimeItem({ icon, time }: { icon: any, time: string }) {
  return (
    <View style={styles.timeItem}>
      <Ionicons name={icon} size={14} color="#0d6efd" style={{ marginRight: 2 }} />
      <Text style={styles.timeText}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backIcon: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  
  checkIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  
  content: { flex: 1 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 },
  
  timesContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeItem: { flexDirection: 'row', alignItems: 'center' },
  timeText: { fontSize: 13, color: '#64748b' },
  
  pillGreen: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 10 },
  pillGreenText: { color: '#16a34a', fontSize: 11, fontWeight: 'bold' }
});