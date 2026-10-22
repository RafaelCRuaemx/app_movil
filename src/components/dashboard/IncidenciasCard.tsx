import { DashboardData } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface IncidenciasCardProps{
    dashboardData: DashboardData | null
}

export function IncidenciasCard({
    dashboardData}: IncidenciasCardProps){
        const [mostrarDetalles, setMostrarDetalles] = useState(false);
     return (
    <>
      <Text style={[styles.label, { marginBottom: 15 }]}>
        RESUMEN DE {dashboardData?.mes_texto || 'ESTE MES'}
      </Text>
      <View style={styles.warningBanner}>
        <Ionicons name="information-circle" size={20} color="#b45309" />
        <Text style={styles.warningText}>Recuerda que cada 3 retardos equivalen a 1 falta.</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statBoxYellow}>
          <Text style={styles.statNumYellow}>{dashboardData?.estadisticas?.retardos || 0}</Text>
          <Text style={styles.statLabelYellow}>RETARDOS</Text>
        </View>
        <View style={styles.statBoxRed}>
          <Text style={styles.statNumRed}>{dashboardData?.estadisticas?.inasistencias || 0}</Text>
          <Text style={styles.statLabelRed}>FALTAS (INC. RETARDOS)</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.btnOutline} 
        onPress={() => setMostrarDetalles(!mostrarDetalles)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={mostrarDetalles ? "chevron-up" : "chevron-down"} 
          size={16} 
          color="#475569" 
          style={{ marginRight: 6 }} 
        />
        <Text style={styles.btnOutlineText}>
          {mostrarDetalles ? 'Ocultar detalles' : 'Ver detalles de incidencias'}
        </Text>
      </TouchableOpacity>
      {mostrarDetalles && dashboardData?.estadisticas && (
        <View style={styles.detallesContainer}>
          <View style={styles.inasistenciaHeader}>
            <Ionicons name="warning" size={18} color="#b91c1c" />
            <Text style={styles.inasistenciaTitle}>Faltas Directas</Text>
          </View>
          <View style={styles.inasistenciaList}>
            {dashboardData.estadisticas.fechas_inasistencias?.length > 0 ? (
              dashboardData.estadisticas.fechas_inasistencias.map((fecha: string, index: number) => (
                <InasistenciaRow 
                  key={index} 
                  date={fecha} 
                  isLast={index === dashboardData.estadisticas.fechas_inasistencias.length - 1} 
                />
              ))
            ) : (
              <View style={{ padding: 12 }}>
                <Text style={{ color: '#7f1d1d' }}>Sin faltas directas</Text>
              </View>
            )}
          </View>
          <View style={[styles.inasistenciaHeader, { marginTop: 20 }]}>
            <Ionicons name="time" size={18} color="#d97706" />
            <Text style={[styles.inasistenciaTitle, { color: '#d97706' }]}>Retardos Acumulados</Text>
          </View>
          <View style={[styles.inasistenciaList, { backgroundColor: '#fffbeb', borderColor: '#fcd34d' }]}>
            {dashboardData.estadisticas.fechas_retardos?.length > 0 ? (
              dashboardData.estadisticas.fechas_retardos.map((fecha: string, index: number) => (
                <InasistenciaRow 
                  key={index} 
                  date={fecha} 
                  isRetardo
                  isLast={index === dashboardData.estadisticas.fechas_retardos.length - 1} 
                />
              ))
            ) : (
              <View style={{ padding: 12 }}>
                <Text style={{ color: '#b45309' }}>Sin retardos este mes</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </>
  );
}
function InasistenciaRow({ date, isLast, isRetardo }: { date: string; isLast?: boolean; isRetardo?: boolean }) {
  return (
    <View style={[styles.inasistenciaRow, !isLast && (isRetardo ? styles.retardoRowBorder : styles.inasistenciaRowBorder)]}>
      <Ionicons 
        name="calendar-outline" 
        size={16} 
        color={isRetardo ? "#b45309" : "#b91c1c"} 
        style={{ marginRight: 10 }} 
      />
      <Text style={[styles.inasistenciaDate, isRetardo && { color: '#b45309' }]}>{date}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: 16,
  },
  warningText: { color: '#b45309', fontSize: 12, marginLeft: 8, flex: 1, fontWeight: '500' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBoxYellow: {
    flex: 1,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 16,
    borderRadius: 14,
    marginRight: 8,
  },
  statNumYellow: { fontSize: 24, fontWeight: 'bold', color: '#b45309' },
  statLabelYellow: { fontSize: 11, fontWeight: '700', color: '#d97706', marginTop: 4 },
  statBoxRed: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    padding: 16,
    borderRadius: 14,
    marginLeft: 8,
  },
  statNumRed: { fontSize: 24, fontWeight: 'bold', color: '#b91c1c' },
  statLabelRed: { fontSize: 11, fontWeight: '700', color: '#dc2626', marginTop: 4 },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  btnOutlineText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  detallesContainer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  inasistenciaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inasistenciaTitle: { fontSize: 13, fontWeight: 'bold', color: '#b91c1c', marginLeft: 6 },
  inasistenciaList: { backgroundColor: '#fef2f2', borderRadius: 10, borderWidth: 1, borderColor: '#fecaca', overflow: 'hidden' },
  inasistenciaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  inasistenciaRowBorder: { borderBottomWidth: 1, borderBottomColor: '#fecaca' },
  retardoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#fde68a' },
  inasistenciaDate: { fontSize: 13, color: '#991b1b', fontWeight: '500' },
});