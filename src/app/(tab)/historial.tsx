import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../../config/api';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA_COMPLETO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Función clasificadora para el semáforo
const clasificarEstado = (estadoRaw?: string): 'puntual' | 'retardo' | 'falta' | 'neutro' => {
  if (!estadoRaw) return 'neutro';
  const e = estadoRaw.toLowerCase().trim();
  if (e === 'retardo') return 'retardo';
  if (e === 'falta' || e === 'inasistencia') return 'falta';
  if (['normal', 'puntual', 'correcto', 'asistencia', 'completo'].includes(e)) return 'puntual';
  return 'puntual';
};

export default function HistorialScreen() {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState<number>(new Date().getDate());
  const [mostrarListaCompleta, setMostrarListaCompleta] = useState(false);
  const [filtroSeleccionado, setFiltroSeleccionado] = useState<'todos' | 'puntual' | 'retardo' | 'falta'>('todos');

  // Alternar filtro y saltar automáticamente al primer día encontrado 
  const toggleFiltro = (filtro: 'puntual' | 'retardo' | 'falta') => {
    if (filtroSeleccionado === filtro) {
      setFiltroSeleccionado('todos');
    } else {
      setFiltroSeleccionado(filtro);
      const encontrados = historial.filter(h => clasificarEstado(h.estado) === filtro);
      if (encontrados.length > 0 && encontrados[0].fecha) {
        const dia = parseInt(encontrados[0].fecha.split('-')[2], 10);
        if (!isNaN(dia)) setDiaSeleccionado(dia);
      }
    }
  };

  // Lista de incidencias según el filtro activo 
  const incidenciasFiltradas = useMemo(() => {
    if (filtroSeleccionado === 'todos') return [];
    return historial.filter(h => clasificarEstado(h.estado) === filtroSeleccionado);
  }, [historial, filtroSeleccionado]);

  const fetchHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const storedData = await SecureStore.getItemAsync('userData');
      if (storedData) {
        const user = JSON.parse(storedData);
        const res = await fetch(`${API_URL}/historial_app.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: user.id, mes: mesActual, anio: anioActual })
        });
        const json = await res.json();
        if (json.success) {
          setHistorial(json.historial || []);
        }
      }
    } catch (e) {
      console.log('Error fetching history:', e);
    } finally {
      setLoading(false);
    }
  }, [mesActual, anioActual]);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  useFocusEffect(
    useCallback(() => {
      fetchHistorial();
    }, [fetchHistorial])
  );

  const irMesAnterior = () => {
    if (mesActual === 1) {
      setMesActual(12);
      setAnioActual(a => a - 1);
    } else {
      setMesActual(m => m - 1);
    }
    setDiaSeleccionado(1);
  };

  const irMesSiguiente = () => {
    const hoy = new Date();
    if (anioActual === hoy.getFullYear() && mesActual === hoy.getMonth() + 1) return;
    
    if (mesActual === 12) {
      setMesActual(1);
      setAnioActual(a => a + 1);
    } else {
      setMesActual(m => m + 1);
    }
    setDiaSeleccionado(1);
  };

  // Mapeo indexado por número de día para acceso ultra-rápido O(1)
  const mapaDias = useMemo(() => {
    const mapa: Record<number, any> = {};
    historial.forEach(r => {
      if (r.fecha) {
        const partes = r.fecha.split('-');
        if (partes.length === 3) {
          const diaNum = parseInt(partes[2], 10);
          mapa[diaNum] = r;
        }
      }
    });
    return mapa;
  }, [historial]);

  // Resumen del mes para los chips informativos
  const resumen = useMemo(() => {
    let puntuales = 0;
    let retardos = 0;
    let faltas = 0;
    historial.forEach(h => {
      const cat = clasificarEstado(h.estado);
      if (cat === 'puntual') puntuales++;
      else if (cat === 'retardo') retardos++;
      else if (cat === 'falta') faltas++;
    });
    return { puntuales, retardos, faltas };
  }, [historial]);

  // Información del día seleccionado
  const infoDiaSeleccionado = useMemo(() => {
    const registro = mapaDias[diaSeleccionado];
    const fechaObj = new Date(anioActual, mesActual - 1, diaSeleccionado);
    const diaSemanaNum = fechaObj.getDay();
    const esFinDeSemana = diaSemanaNum === 0 || diaSemanaNum === 6;
    const esFuturo = fechaObj > new Date();

    const nombreDia = DIAS_SEMANA_COMPLETO[diaSemanaNum];
    const fechaTexto = `${nombreDia} ${diaSeleccionado} de ${MESES[mesActual - 1]}`;

    if (registro) {
      const categoria = clasificarEstado(registro.estado);
      return {
        existe: true,
        categoria,
        fechaTexto,
        entrada: registro.entrada || '--:--',
        comidaSalida: registro.comida_salida || '--:--',
        comidaRegreso: registro.comida_regreso || '--:--',
        salida: registro.salida || '--:--',
        estado: registro.estado
      };
    }

    return {
      existe: false,
      categoria: 'neutro' as const,
      fechaTexto,
      esFinDeSemana,
      esFuturo
    };
  }, [diaSeleccionado, mapaDias, mesActual, anioActual]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons name="calendar-outline" size={24} color="#0f172a" style={{ marginRight: 12 }} />
        <Text style={styles.headerTitle}>Calendario de Asistencias</Text>
      </View>

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={async () => {
              setRefreshing(true);
              await fetchHistorial();
              setRefreshing(false);
            }} 
          />
        }
      >
        {/* NAVEGADOR DE MES */}
        <View style={styles.monthSelectorCard}>
          <TouchableOpacity onPress={irMesAnterior} style={styles.monthNavBtn}>
            <Ionicons name="chevron-back" size={22} color="#0f172a" />
          </TouchableOpacity>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.monthTitle}>{MESES[mesActual - 1]} {anioActual}</Text>
                        {/* CHIPS INTERACTIVOS DE FILTRADO */}
            <View style={styles.summaryChipsRow}>
              <TouchableOpacity 
                style={[
                  styles.filterChip, 
                  filtroSeleccionado === 'puntual' && styles.filterChipPuntualActive
                ]}
                onPress={() => toggleFiltro('puntual')}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: '#16a34a' }]}>● {resumen.puntuales} Puntuales</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.filterChip, 
                  filtroSeleccionado === 'retardo' && styles.filterChipRetardoActive
                ]}
                onPress={() => toggleFiltro('retardo')}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: '#d97706' }]}>● {resumen.retardos} Retardos</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.filterChip, 
                  filtroSeleccionado === 'falta' && styles.filterChipFaltaActive
                ]}
                onPress={() => toggleFiltro('falta')}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: '#dc2626' }]}>● {resumen.faltas} Faltas</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            onPress={irMesSiguiente} 
            style={[styles.monthNavBtn, (anioActual === new Date().getFullYear() && mesActual === new Date().getMonth() + 1) && { opacity: 0.25 }]}
            disabled={anioActual === new Date().getFullYear() && mesActual === new Date().getMonth() + 1}
          >
            <Ionicons name="chevron-forward" size={22} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0d6efd" />
            <Text style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>Cargando registros...</Text>
          </View>
        ) : (
          <>
            {/* CUADRÍCULA DEL CALENDARIO PRINCIPAL */}
            <View style={styles.calendarCard}>
              <CalendarioGrid 
                mes={mesActual} 
                anio={anioActual} 
                mapaDias={mapaDias}
                diaSeleccionado={diaSeleccionado}
                onSeleccionarDia={(d) => setDiaSeleccionado(d)}
                clasificarEstado={clasificarEstado}
              />

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

            {/* LISTA DINÁMICA DE INCIDENCIAS FILTRADAS */}
            {filtroSeleccionado !== 'todos' && (
              <View style={styles.filterResultCard}>
                <View style={styles.filterResultHeader}>
                  <Text style={styles.filterResultTitle}>
                    {filtroSeleccionado === 'puntual' && `Asistencias Puntuales (${incidenciasFiltradas.length})`}
                    {filtroSeleccionado === 'retardo' && `Retardos Registrados (${incidenciasFiltradas.length})`}
                    {filtroSeleccionado === 'falta' && `Faltas Registradas (${incidenciasFiltradas.length})`}
                  </Text>
                  <TouchableOpacity onPress={() => setFiltroSeleccionado('todos')}>
                    <Text style={styles.clearFilterText}>Quitar filtro ✕</Text>
                  </TouchableOpacity>
                </View>

                {incidenciasFiltradas.length === 0 ? (
                  <Text style={styles.emptyFilterText}>No hay registros con este estatus en este mes.</Text>
                ) : (
                  incidenciasFiltradas.map((item, idx) => {
                    const diaNum = item.fecha ? parseInt(item.fecha.split('-')[2], 10) : 0;
                    const esSeleccionado = diaNum === diaSeleccionado;
                    return (
                      <TouchableOpacity
                        key={item.id || idx}
                        style={[styles.incidenciaRow, esSeleccionado && styles.incidenciaRowActive]}
                        onPress={() => {
                          if (diaNum) setDiaSeleccionado(diaNum);
                        }}
                      >
                        <View style={styles.incidenciaLeft}>
                          <Text style={styles.incidenciaDia}>Día {diaNum}</Text>
                          <Text style={styles.incidenciaFecha}>{item.fecha}</Text>
                        </View>
                        <View style={styles.incidenciaRight}>
                          <Text style={styles.incidenciaHora}>{item.entrada || '--:--'}</Text>
                          <View style={[
                            styles.incidenciaBadge,
                            filtroSeleccionado === 'puntual' && { backgroundColor: '#dcfce7' },
                            filtroSeleccionado === 'retardo' && { backgroundColor: '#fef3c7' },
                            filtroSeleccionado === 'falta' && { backgroundColor: '#fee2e2' },
                          ]}>
                            <Text style={[
                              styles.miniBadgeText,
                              filtroSeleccionado === 'puntual' && { color: '#166534' },
                              filtroSeleccionado === 'retardo' && { color: '#b45309' },
                              filtroSeleccionado === 'falta' && { color: '#991b1b' },
                            ]}>
                              {item.estado || filtroSeleccionado}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {/* TARJETA DETALLE DEL DÍA SELECCIONADO */}
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
                /* CUADRÍCULA DE 4 TIEMPOS DE ASISTENCIA */
                <View style={styles.timesGrid}>
                  <TimeBox 
                    icon="sunny-outline" 
                    title="Entrada" 
                    time={infoDiaSeleccionado.entrada} 
                    color="#0d6efd"
                  />
                  <TimeBox 
                    icon="cafe-outline" 
                    title="Sal. Comida" 
                    time={infoDiaSeleccionado.comidaSalida} 
                    color="#d97706"
                  />
                  <TimeBox 
                    icon="fast-food-outline" 
                    title="Reg. Comida" 
                    time={infoDiaSeleccionado.comidaRegreso} 
                    color="#059669"
                  />
                  <TimeBox 
                    icon="exit-outline" 
                    title="Salida" 
                    time={infoDiaSeleccionado.salida} 
                    color="#475569"
                  />
                </View>
              ) : infoDiaSeleccionado.existe && infoDiaSeleccionado.categoria === 'falta' ? (
                /* AVISO DE FALTA */
                <View style={styles.faltaAlertBox}>
                  <Ionicons name="alert-circle" size={24} color="#dc2626" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.faltaAlertTitle}>Falta por inasistencia</Text>
                    <Text style={styles.faltaAlertDesc}>No se registró entrada ni salida en este día laboral.</Text>
                  </View>
                </View>
              ) : (
                /* DÍA NO LABORABLE O FUTURO */
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

            {/* BOTÓN COLAPSABLE PARA VER TODAS LAS JORNADAS EN LISTA */}
            <TouchableOpacity 
              style={styles.toggleListBtn} 
              onPress={() => setMostrarListaCompleta(!mostrarListaCompleta)}
            >
              <Text style={styles.toggleListBtnText}>
                {mostrarListaCompleta ? 'Ocultar listado completo' : 'Ver todas las jornadas del mes (Lista)'}
              </Text>
              <Ionicons 
                name={mostrarListaCompleta ? "chevron-up" : "chevron-down"} 
                size={18} 
                color="#0d6efd" 
              />
            </TouchableOpacity>

            {mostrarListaCompleta && (
              <View style={styles.fullListCard}>
                {historial.map((h: any, idx: number) => {
                  const cat = clasificarEstado(h.estado);
                  const isFalta = cat === 'falta';
                  const isRet = cat === 'retardo';

                  return (
                    <View 
                      key={idx} 
                      style={[styles.fullListRow, idx < historial.length - 1 && styles.fullListRowBorder]}
                    >
                      <View style={[
                        styles.fullListDot, 
                        { backgroundColor: isFalta ? '#dc2626' : isRet ? '#d97706' : '#16a34a' }
                      ]} />
                      
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fullListDate}>{h.fecha_formateada}</Text>
                        {!isFalta ? (
                          <Text style={styles.fullListTimes}>
                            Ent. {h.entrada} · Com. {h.comida_salida} · Reg. {h.comida_regreso} · Sal. {h.salida}
                          </Text>
                        ) : (
                          <Text style={{ color: '#dc2626', fontSize: 12 }}>Sin asistencia</Text>
                        )}
                      </View>

                      <View style={[
                        styles.miniBadge, 
                        { backgroundColor: isFalta ? '#fef2f2' : isRet ? '#fffbeb' : '#f0fdf4' }
                      ]}>
                        <Text style={[
                          styles.miniBadgeText, 
                          { color: isFalta ? '#dc2626' : isRet ? '#d97706' : '#16a34a' }
                        ]}>
                          {isFalta ? 'Falta' : isRet ? 'Retardo' : 'Puntual'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── COMPONENTE CUADRÍCULA CALENDARIO CON SEMÁFORO ──
function CalendarioGrid({ 
  mes, anio, mapaDias, diaSeleccionado, onSeleccionarDia, clasificarEstado 
}: { 
  mes: number, 
  anio: number, 
  mapaDias: Record<number, any>, 
  diaSeleccionado: number, 
  onSeleccionarDia: (d: number) => void,
  clasificarEstado: (e?: string) => 'puntual' | 'retardo' | 'falta' | 'neutro'
}) {
  const diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const primerDiaSemana = new Date(anio, mes - 1, 1).getDay(); // 0 = Domingo

  const celdas = [];
  for (let i = 0; i < primerDiaSemana; i++) {
    celdas.push(<View key={`empty-${i}`} style={styles.calCellEmpty} />);
  }

  for (let d = 1; d <= diasEnMes; d++) {
    const registro = mapaDias[d];
    const categoria = clasificarEstado(registro?.estado);
    const estaSeleccionado = diaSeleccionado === d;

    let bgColor = '#f8fafc';
    let textColor = '#0f172a';
    let dotColor = '#cbd5e1';

    if (categoria === 'puntual') {
      bgColor = '#dcfce7'; // Verde suave
      textColor = '#166534';
      dotColor = '#16a34a';
    } else if (categoria === 'retardo') {
      bgColor = '#fef3c7'; // Amarillo suave
      textColor = '#b45309';
      dotColor = '#d97706';
    } else if (categoria === 'falta') {
      bgColor = '#fee2e2'; // Rojo suave
      textColor = '#991b1b';
      dotColor = '#dc2626';
    }

    celdas.push(
      <TouchableOpacity 
        key={`day-${d}`} 
        activeOpacity={0.7}
        onPress={() => onSeleccionarDia(d)}
        style={[
          styles.calCell, 
          { backgroundColor: bgColor },
          estaSeleccionado && styles.calCellSelected
        ]}
      >
        <Text style={[
          styles.calCellText, 
          { color: textColor },
          estaSeleccionado && { fontWeight: '900' }
        ]}>
          {d}
        </Text>
        
        {/* Bolita del semáforo */}
        <View style={[styles.semaforoMiniDot, { backgroundColor: dotColor }]} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.calWrapper}>
      <View style={styles.calWeekRow}>
        {diasSemana.map((dia, idx) => (
          <Text key={idx} style={[styles.calWeekHeader, (idx === 0 || idx === 6) && { color: '#cbd5e1' }]}>
            {dia}
          </Text>
        ))}
      </View>
      <View style={styles.calDaysGrid}>
        {celdas}
      </View>
    </View>
  );
}

// ── COMPONENTE DE CAJITA DE TIEMPO ──
function TimeBox({ icon, title, time, color }: { icon: any, title: string, time: string, color: string }) {
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
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  
  container: { flex: 1, padding: 16 },

  monthSelectorCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  monthNavBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  monthTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  summaryChipsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  chipText: { fontSize: 11, fontWeight: '700' },

  loadingContainer: { padding: 40, alignItems: 'center' },

  calendarCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  calWrapper: { marginBottom: 10 },
  calWeekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  calWeekHeader: { width: '14.28%', textAlign: 'center', fontWeight: 'bold', color: '#64748b', fontSize: 12 },
  calDaysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCellEmpty: { width: '14.28%', aspectRatio: 1 },
  calCell: { width: '13%', margin: '0.64%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  calCellSelected: { borderColor: '#0d6efd', borderWidth: 2, transform: [{ scale: 1.05 }] },
  calCellText: { fontSize: 13, fontWeight: '700' },
  semaforoMiniDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 3 },

  legendContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f8fafc', paddingVertical: 10, borderRadius: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  legendText: { fontSize: 11, color: '#64748b', fontWeight: '600' },

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

  toggleListBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, paddingVertical: 14, marginBottom: 16 },
  toggleListBtnText: { color: '#0d6efd', fontSize: 14, fontWeight: 'bold', marginRight: 6 },

  fullListCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16 },
  fullListRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  fullListRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  fullListDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  fullListDate: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  fullListTimes: { fontSize: 12, color: '#64748b', marginTop: 2 },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  miniBadgeText: { fontSize: 11, fontWeight: 'bold' },

  // Estilos del Filtro Interactivo de Incidencias
  filterChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipPuntualActive: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  filterChipRetardoActive: { backgroundColor: '#fef3c7', borderColor: '#d97706' },
  filterChipFaltaActive: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },

  filterResultCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  filterResultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  filterResultTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  clearFilterText: { fontSize: 12, color: '#0d6efd', fontWeight: '600' },
  emptyFilterText: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },

  incidenciaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, marginBottom: 4 },
  incidenciaRowActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  incidenciaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  incidenciaDia: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  incidenciaFecha: { fontSize: 12, color: '#64748b' },
  incidenciaRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  incidenciaHora: { fontSize: 13, fontWeight: '600', color: '#334155' },
  incidenciaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }
});
