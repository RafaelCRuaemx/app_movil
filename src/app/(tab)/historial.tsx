import { registrarElementoTour } from "@/components/OnboardingModal";
import { CalendarioGrid } from "@/components/historial/CalendarioGrid";
import { DiaDetalleCard } from "@/components/historial/DiaDetalleCard";
import { FullHistorialList } from "@/components/historial/FullHistorialList";
import { MonthSelectorCard } from "@/components/historial/MonthSelectorCard";
import { useHistorial } from "@/hooks/useHistorial";
import { useUser } from "@/hooks/useUser";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistorialScreen(){
  const {user} = useUser();
  const {
    historial,
    loading,
    refreshing,
    onRefresh,
    mesActual,
    anioActual,
    diaSeleccionado,
    setDiaSeleccionado,
    filtroSeleccionado,
    setFiltroSeleccionado,
    toggleFiltro,
    irMesAnterior,
    irMesSiguiente,
    irAHoy,
    mapaDias,
    resumen,
    infoDiaSeleccionado,
    clasificarEstado,
    MESES,
    recargar,
  } = useHistorial(user?.id);

  const hoyReal = new Date();
  const esMesActual = anioActual === hoyReal.getFullYear() && mesActual === hoyReal.getMonth() + 1;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      {/* HEADER */}
      <View style={[styles.header, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={24} color="#0f172a" style={{ marginRight: 12 }} />
          <Text style={styles.headerTitle}>Calendario de Asistencias</Text>
        </View>
        <TouchableOpacity onPress={irAHoy} style={styles.todayBtn} activeOpacity={0.7}>
          <Text style={styles.todayBtnText}>Ir a hoy</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* NAVEGADOR DE MES Y CHIPS */}
        <View ref={registrarElementoTour('hist_mes_filtros')} collapsable={false}>
          <MonthSelectorCard
            mesTexto={MESES[mesActual - 1]}
            anioActual={anioActual}
            resumen={resumen}
            filtroSeleccionado={filtroSeleccionado}
            toggleFiltro={toggleFiltro}
            irMesAnterior={irMesAnterior}
            irMesSiguiente={irMesSiguiente}
            esMesActual={esMesActual}
          />
        </View>
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#0d6efd" style={{ marginRight: 8 }} />
            <Text style={{ color: '#64748b', fontSize: 13 }}>Actualizando registros...</Text>
          </View>
        )}
        {/* BARRA INFORMATIVA DE FILTRO ACTIVO */}
        {filtroSeleccionado !== 'todos' && (
          <View style={styles.filterBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="funnel-outline" size={14} color="#0d6efd" style={{ marginRight: 6 }} />
              <Text style={styles.filterBannerText}>
                Filtrado por: <Text style={styles.filterBannerBold}>
                  {filtroSeleccionado === 'puntual' ? 'Puntuales' : filtroSeleccionado === 'retardo' ? 'Retardos' : 'Faltas'}
                </Text>
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.clearFilterBtn} 
              onPress={() => setFiltroSeleccionado('todos')}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={14} color="#0d6efd" style={{ marginRight: 2 }} />
              <Text style={styles.clearFilterBtnText}>Quitar filtro</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* CUADRÍCULA CALENDARIO */}
        <View ref={registrarElementoTour('hist_calendario')} collapsable={false}>
          <CalendarioGrid
            mes={mesActual}
            anio={anioActual}
            mapaDias={mapaDias}
            diaSeleccionado={diaSeleccionado}
            onSeleccionarDia={(d) => setDiaSeleccionado(d)}
            clasificarEstado={clasificarEstado}
            filtroSeleccionado={filtroSeleccionado}
          />
        </View>
        {/* DETALLE DEL DÍA SELECCIONADO */}
        <DiaDetalleCard infoDiaSeleccionado={infoDiaSeleccionado} />
        {/* LISTADO COMPLETO DEL MES */}
        <FullHistorialList historial={historial} clasificarEstado={clasificarEstado} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  todayBtn: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  todayBtnText: { color: '#0d6efd', fontSize: 12, fontWeight: 'bold' },
  container: { flex: 1, padding: 16 },
  loadingRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  filterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  filterBannerText: { fontSize: 13, color: '#1e40af' },
  filterBannerBold: { fontWeight: 'bold', textTransform: 'capitalize' },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  clearFilterBtnText: { fontSize: 12, fontWeight: '700', color: '#0d6efd' },
});