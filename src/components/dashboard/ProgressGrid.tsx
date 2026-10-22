import { DashboardData } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface ProgressGridProps {
    dashboardData: DashboardData | null;
    horaActual : string;
}

export function ProgressGrid({
    dashboardData, horaActual}:
ProgressGridProps){
    const pasoshoy=[
        dashboardData?.progreso_hoy?.entrada,
        dashboardData?.progreso_hoy?.salida_comida,
        dashboardData?.progreso_hoy?.regreso_comida,
        dashboardData?.progreso_hoy?.salida,
    ];

    const completadosHoy = pasoshoy.filter((h) => h && h !== '--;--').length;
    const porcentajeAvance = (completadosHoy/4)/100;

    return(
        <>
   <View style={[styles.rowBetween, { marginBottom: 15, alignItems: 'center' }]}>
        <View>
          <Text style={styles.label}>PROGRESO DE HOY</Text>
          <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600' }}>
            {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}
          </Text>
        </View>
        <View style={styles.relojBadge}>
          <Ionicons name="time-outline" size={13} color="#0d6efd" style={{ marginRight: 4 }} />
          <Text style={styles.relojTexto}>{horaActual}</Text>
        </View>
      </View>
      <View style={styles.grid4}>
        <ProgressBox 
          icon="sunny" 
          title="Entrada" 
          time={dashboardData?.progreso_hoy?.entrada || '--:--'} 
          isActive={dashboardData?.proximo_paso === 'entrada'}
        />
        <ProgressBox 
          icon="cafe" 
          title="A Comer" 
          time={dashboardData?.progreso_hoy?.salida_comida || '--:--'} 
          isActive={dashboardData?.proximo_paso === 'salida_comida'}
        />
        <ProgressBox 
          icon="fast-food" 
          title="Regreso" 
          time={dashboardData?.progreso_hoy?.regreso_comida || '--:--'} 
          isActive={dashboardData?.proximo_paso === 'regreso_comida'}
        />
        <ProgressBox 
          icon="exit" 
          title="Salida" 
          time={dashboardData?.progreso_hoy?.salida || '--:--'} 
          isActive={dashboardData?.proximo_paso === 'salida'}
        />
      </View>
      {/* BARRA DE AVANCE DE LA JORNADA */}
      <View style={styles.progressBarWrap}>
        <View style={styles.progressBarHeader}>
          <Text style={styles.progressBarLabel}>Avance de jornada</Text>
          <Text style={styles.progressBarPercent}>{completadosHoy} de 4 ({porcentajeAvance}%)</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${porcentajeAvance}%`,
                backgroundColor: porcentajeAvance === 100 ? '#16a34a' : '#0d6efd',
              },
            ]}
          />
        </View>
      </View>
      {dashboardData?.proximo_paso === 'completo' ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
          <Text style={styles.successBannerText}>Jornada completada. ¡Buen descanso!</Text>
        </View>
      ) : (
        <View style={styles.nextScanRow}>
          <View style={styles.scanBadge}>
            <Text style={styles.scanBadgeText}>Pendiente</Text>
          </View>
          <Text style={styles.nextScanText}>{dashboardData?.hero_btn_text || 'Registrar asistencia'}</Text>
        </View>
      )}
    </>
  );
}
function ProgressBox({ icon, title, time, isActive }: { icon: any; title: string; time: string; isActive?: boolean }) {
  const isCompleted = time !== '--:--';
  return (
    <View style={[styles.progressBox, isActive && styles.progressBoxActive, isCompleted && styles.progressBoxCompleted]}>
      <Ionicons 
        name={isCompleted ? "checkmark-circle" : icon} 
        size={22} 
        color={isCompleted ? "#16a34a" : isActive ? "#0d6efd" : "#94a3b8"} 
      />
      <Text style={[styles.progressTitle, isActive && { color: '#0d6efd' }]}>{title}</Text>
      <Text style={[styles.progressTime, isCompleted && { color: '#16a34a' }]}>{time}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  relojBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  relojTexto: { fontSize: 11, fontWeight: '700', color: '#0d6efd' },
  grid4: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  progressBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  progressBoxActive: { borderColor: '#0d6efd', backgroundColor: '#eff6ff' },
  progressBoxCompleted: { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' },
  progressTitle: { fontSize: 11, fontWeight: '600', color: '#475569', marginTop: 6 },
  progressTime: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginTop: 2 },
  progressBarWrap: { marginBottom: 14, marginTop: 2 },
  progressBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressBarLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  progressBarPercent: { fontSize: 11, fontWeight: '800', color: '#0f172a' },
  progressBarTrack: { height: 7, backgroundColor: '#e2e8f0', borderRadius: 999, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 999 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  successBannerText: { color: '#16a34a', fontWeight: 'bold', fontSize: 13 },
  nextScanRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 10 },
  scanBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  scanBadgeText: { color: '#0369a1', fontSize: 10, fontWeight: 'bold' },
  nextScanText: { fontSize: 13, fontWeight: '600', color: '#334155' },
});