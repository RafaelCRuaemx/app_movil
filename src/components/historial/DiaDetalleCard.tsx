import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface DiaDetalleCardProps {
  infoDiaSeleccionado: any;
}

export function DiaDetalleCard({ infoDiaSeleccionado }: DiaDetalleCardProps) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.detailHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailDate}>{infoDiaSeleccionado.fechaTexto}</Text>
          <Text style={styles.detailSub}>Detalle de la jornada</Text>
        </View>

        {infoDiaSeleccionado.existe ? (
          <View style={[
            styles.statusBadge, 
            infoDiaSeleccionado.categoria === 'puntual' && styles.statusBadgeGreen,
            infoDiaSeleccionado.categoria === 'retardo' && styles.statusBadgeYellow,
            infoDiaSeleccionado.categoria === 'falta' && styles.statusBadgeRed,
          ]}>
            <Text style={[
              styles.statusBadgeText,
              infoDiaSeleccionado.categoria === 'puntual' && { color: '#166534' },
              infoDiaSeleccionado.categoria === 'retardo' && { color: '#b45309' },
              infoDiaSeleccionado.categoria === 'falta' && { color: '#991b1b' },
            ]}>
              {infoDiaSeleccionado.categoria === 'puntual' ? '✓ Puntual' : 
               infoDiaSeleccionado.categoria === 'retardo' ? '⏰ Retardo' : '✕ Falta'}
            </Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, { backgroundColor: '#f1f5f9' }]}>
            <Text style={[styles.statusBadgeText, { color: '#64748b' }]}>
              {infoDiaSeleccionado.esFinDeSemana ? 'Fin de semana' : infoDiaSeleccionado.esFuturo ? 'Próximo' : 'Sin datos'}
            </Text>
          </View>
        )}
      </View>

      {infoDiaSeleccionado.existe && infoDiaSeleccionado.categoria !== 'falta' ? (
        <View style={styles.timesGrid}>
          <TimeBox icon="sunny-outline" title="Entrada" time={infoDiaSeleccionado.entrada} color="#0d6efd" />
          <TimeBox icon="cafe-outline" title="Sal. Comida" time={infoDiaSeleccionado.comidaSalida} color="#d97706" />
          <TimeBox icon="fast-food-outline" title="Reg. Comida" time={infoDiaSeleccionado.comidaRegreso} color="#059669" />
          <TimeBox icon="exit-outline" title="Salida" time={infoDiaSeleccionado.salida} color="#475569" />
        </View>
      ) : infoDiaSeleccionado.existe && infoDiaSeleccionado.categoria === 'falta' ? (
        <View style={styles.faltaAlertBox}>
          <Ionicons name="alert-circle" size={24} color="#dc2626" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.faltaAlertTitle}>Falta por inasistencia</Text>
            <Text style={styles.faltaAlertDesc}>No se registró entrada ni salida en este día laboral.</Text>
          </View>
        </View>
      ) : (
        <View style={styles.neutroAlertBox}>
          <Ionicons name="information-circle-outline" size={22} color="#64748b" style={{ marginRight: 8 }} />
          <Text style={styles.neutroAlertText}>
            {infoDiaSeleccionado.esFinDeSemana 
              ? 'Día de descanso semanal (Sábado / Domingo).' 
              : 'Este día no cuenta con registros requeridos.'}
          </Text>
        </View>
      )}
    </View>
  );
}

function TimeBox({ icon, title, time, color }: { icon: any; title: string; time: string; color: string }) {
  const isFilled = time && time !== '--:--';
  return (
    <View style={styles.timeBox}>
      <Ionicons name={icon} size={18} color={isFilled ? color : '#94a3b8'} style={{ marginBottom: 4 }} />
      <Text style={styles.timeBoxTitle}>{title}</Text>
      <Text style={[styles.timeBoxTime, isFilled && { color: '#0f172a' }]}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  detailCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  detailDate: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  detailSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusBadgeGreen: { backgroundColor: '#dcfce7' },
  statusBadgeYellow: { backgroundColor: '#fef3c7' },
  statusBadgeRed: { backgroundColor: '#fee2e2' },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold' },
  timesGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  timeBox: { flex: 1, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  timeBoxTitle: { fontSize: 10, color: '#64748b', fontWeight: 'bold', marginBottom: 4 },
  timeBoxTime: { fontSize: 13, fontWeight: 'bold', color: '#94a3b8' },
  faltaAlertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 14 },
  faltaAlertTitle: { fontSize: 14, fontWeight: 'bold', color: '#991b1b', marginBottom: 2 },
  faltaAlertDesc: { fontSize: 12, color: '#b91c1c' },
  neutroAlertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14 },
  neutroAlertText: { fontSize: 13, color: '#64748b', flex: 1 },
});