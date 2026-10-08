import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HistorialScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* El botón de atrás es opcional en tabs, lo ponemos simulado o lo puedes envolver en TouchableOpacity */}
        <Ionicons name="arrow-back" size={24} color="#0f172a" style={styles.backIcon} />
        <Text style={styles.headerTitle}>Mi Historial de Asistencias</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <HistoryRow date="Lunes 31 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" />
          <HistoryRow date="Domingo 30 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" />
          <HistoryRow date="Sábado 29 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" />
          <HistoryRow date="Viernes 28 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" />
          <HistoryRow date="Jueves 27 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" />
          <HistoryRow date="Miércoles 26 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" />
          <HistoryRow date="Martes 25 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" />
          <HistoryRow date="Lunes 24 de Ago" ent="08:00" sc="--" vc="--" sal="17:00" noBorder />
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