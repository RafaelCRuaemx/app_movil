import { CategoriaEstado, FiltroEstado } from '@/hooks/useHistorial';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CalendarioGridProps {
  mes: number;
  anio: number;
  mapaDias: Record<number, any>;
  diaSeleccionado: number;
  onSeleccionarDia: (d: number) => void;
  clasificarEstado: (e?: string) => CategoriaEstado;
  filtroSeleccionado: FiltroEstado;
}

export function CalendarioGrid({
  mes,
  anio,
  mapaDias,
  diaSeleccionado,
  onSeleccionarDia,
  clasificarEstado,
  filtroSeleccionado,
}: CalendarioGridProps) {
  const diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const primerDiaSemana = new Date(anio, mes - 1, 1).getDay(); // 0 = Domingo
  const hoyReal = new Date();
  const esMesActual = anio === hoyReal.getFullYear() && mes === hoyReal.getMonth() + 1;

  const celdas = [];
  for (let i = 0; i < primerDiaSemana; i++) {
    celdas.push(<View key={`empty-${i}`} style={styles.calCellEmpty} />);
  }

  for (let d = 1; d <= diasEnMes; d++) {
    const registro = mapaDias[d];
    const categoria = clasificarEstado(registro?.estado);
    const estaSeleccionado = diaSeleccionado === d;
    const esHoy = esMesActual && d === hoyReal.getDate();

    const coincideFiltro = filtroSeleccionado === 'todos' || categoria === filtroSeleccionado;
    const atenuado = filtroSeleccionado !== 'todos' && !coincideFiltro;

    let bgColor = '#f8fafc';
    let textColor = '#0f172a';
    let dotColor = '#cbd5e1';

    if (categoria === 'puntual') {
      bgColor = '#dcfce7';
      textColor = '#166534';
      dotColor = '#16a34a';
    } else if (categoria === 'retardo') {
      bgColor = '#fef3c7';
      textColor = '#b45309';
      dotColor = '#d97706';
    } else if (categoria === 'falta') {
      bgColor = '#fee2e2';
      textColor = '#991b1b';
      dotColor = '#dc2626';
    }

    if (atenuado) {
      bgColor = '#f8fafc';
      textColor = '#cbd5e1';
      dotColor = 'transparent';
    }

    celdas.push(
      <TouchableOpacity
        key={`day-${d}`}
        activeOpacity={0.7}
        onPress={() => onSeleccionarDia(d)}
        style={[
          styles.calCell,
          { backgroundColor: bgColor },
          atenuado && { opacity: 0.25 },
          esHoy && styles.calCellToday,
          estaSeleccionado && styles.calCellSelected,
        ]}
      >
        <Text style={[styles.calCellText, { color: textColor }, estaSeleccionado && { fontWeight: '900' }]}>
          {d}
        </Text>
        <View style={[styles.semaforoMiniDot, { backgroundColor: dotColor }]} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calWrapper}>
        <View style={styles.calWeekRow}>
          {diasSemana.map((dia, idx) => (
            <Text key={idx} style={[styles.calWeekHeader, (idx === 0 || idx === 6) && { color: '#cbd5e1' }]}>
              {dia}
            </Text>
          ))}
        </View>
        <View style={styles.calDaysGrid}>{celdas}</View>
      </View>

      {/* SIMBOLOGÍA DEL SEMÁFORO */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#16a34a' }]} />
          <Text style={styles.legendText}>Puntual</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#d97706' }]} />
          <Text style={styles.legendText}>Retardo</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#dc2626' }]} />
          <Text style={styles.legendText}>Falta</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#cbd5e1' }]} />
          <Text style={styles.legendText}>No laboral</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  calWrapper: { marginBottom: 10 },
  calWeekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  calWeekHeader: { width: '14.28%', textAlign: 'center', fontWeight: 'bold', color: '#64748b', fontSize: 12 },
  calDaysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCellEmpty: { width: '14.28%', aspectRatio: 1 },
  calCell: { width: '13%', margin: '0.64%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  calCellSelected: { borderColor: '#0d6efd', borderWidth: 2, transform: [{ scale: 1.05 }] },
  calCellToday: { borderColor: '#0f172a', borderWidth: 1.5, borderStyle: 'dashed' },
  calCellText: { fontSize: 13, fontWeight: '700' },
  semaforoMiniDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 3 },
  legendContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f8fafc', paddingVertical: 10, borderRadius: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  legendText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
});