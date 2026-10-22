import { FiltroEstado } from '@/hooks/useHistorial';
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface MonthSelectorCardProps {
    mesTexto: string;
    anioActual: number;
    resumen : {puntuales:number;
        retardos: number;
        faltas: number;
    };
    filtroSeleccionado : FiltroEstado;
    toggleFiltro: (filtro: 'puntual'| 'retardo'| 'falta')=>void;
    irMesAnterior : () => void;
    irMesSiguiente: () => void;
    esMesActual: boolean;
}

export function MonthSelectorCard({
    mesTexto,
    anioActual,
    resumen,
    filtroSeleccionado,
    toggleFiltro,
    irMesAnterior,
    irMesSiguiente,
    esMesActual,
}: MonthSelectorCardProps){
    return (
    <View style={styles.monthSelectorCard}>
      <TouchableOpacity onPress={irMesAnterior} style={styles.monthNavBtn} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={22} color="#0f172a" />
      </TouchableOpacity>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.monthTitle}>{mesTexto} {anioActual}</Text>
        {/* CHIPS INTERACTIVOS DE FILTRADO */}
        <View style={styles.summaryChipsRow}>
          <TouchableOpacity
            style={[styles.filterChip, filtroSeleccionado === 'puntual' && styles.filterChipPuntualActive]}
            onPress={() => toggleFiltro('puntual')}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, { color: '#16a34a' }]}>● {resumen.puntuales} Puntuales</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filtroSeleccionado === 'retardo' && styles.filterChipRetardoActive]}
            onPress={() => toggleFiltro('retardo')}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, { color: '#d97706' }]}>● {resumen.retardos} Retardos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filtroSeleccionado === 'falta' && styles.filterChipFaltaActive]}
            onPress={() => toggleFiltro('falta')}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, { color: '#dc2626' }]}>● {resumen.faltas} Faltas</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        onPress={irMesSiguiente}
        style={[styles.monthNavBtn, esMesActual && { opacity: 0.25 }]}
        disabled={esMesActual}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-forward" size={22} color="#0f172a" />
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  monthSelectorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  monthNavBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  monthTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  summaryChipsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  chipText: { fontSize: 11, fontWeight: '700' },
  filterChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipPuntualActive: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  filterChipRetardoActive: { backgroundColor: '#fef3c7', borderColor: '#d97706' },
  filterChipFaltaActive: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
});