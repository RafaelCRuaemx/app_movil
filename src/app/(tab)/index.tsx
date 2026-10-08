import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
const API_URL = 'http://192.168.100.9/UAEMex/wsl/Checador/backend/api';

export default function DashboardScreen() {
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      const storedData = await SecureStore.getItemAsync('userData');
      if (storedData) {
        const user = JSON.parse(storedData);
        setUserData(user);
        fetchDashboardData(user.id);
      }
    };
    loadUserData();
  }, []);

  const fetchDashboardData = async (usuario_id: string | number) => {
    try {
      const res = await fetch(`${API_URL}/dashboard_app.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id })
      });
      const json = await res.json();
      if (json.success) {
        setDashboardData(json.dashboard);
      }
    } catch (e) {
      console.log('Error fetching dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const userName = userData?.nombre || "Cargando...";

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Cargando información...</Text>
          </View>
        )}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarMini}>
              <Ionicons name="person" size={20} color="white" />
            </View>
            <View>
              <Text style={styles.welcomeText}>BIENVENIDO</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.replace('/login' as any)}>
              <Ionicons name="log-out-outline" size={26} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* TARJETA 1: TURNO Y PROGRESO */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.label}>OFICINA</Text>
              <Text style={styles.value}>OFICINA TEXCOCO</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.label}>TURNO</Text>
              <Text style={styles.value}>17:00 a 17:25</Text>
            </View>
          </View>

          <Text style={[styles.label, { marginTop: 20, marginBottom: 10 }]}>PROGRESO DE HOY</Text>
          
          <View style={styles.grid4}>
            <ProgressBox icon="log-in-outline" title="ENTRADA" time={dashboardData?.progreso_hoy?.entrada || "--:--"} />
            <ProgressBox icon="cafe-outline" title="S. COMIDA" time={dashboardData?.progreso_hoy?.salida_comida || "--:--"} />
            <ProgressBox icon="return-down-back-outline" title="V. COMIDA" time={dashboardData?.progreso_hoy?.regreso_comida || "--:--"} />
            <ProgressBox icon="log-out-outline" title="SALIDA" time={dashboardData?.progreso_hoy?.salida || "--:--"} />
          </View>

          <View style={styles.nextScanRow}>
            <View style={styles.scanBadge}>
              <Text style={styles.scanBadgeText}>Escanear Entrada</Text>
            </View>
            <Text style={styles.nextScanText}>→ Siguiente escaneo</Text>
          </View>
        </View>

        {/* TARJETA 2: ESTADÍSTICAS */}
        <View style={styles.card}>
          <Text style={[styles.label, { marginBottom: 10 }]}>ESTADÍSTICAS DE {dashboardData?.mes_texto || "MES"}</Text>
          
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={20} color="#b45309" />
            <Text style={styles.warningText}>
              Recuerda que cada <Text style={{ fontWeight: 'bold' }}>3 retardos</Text> equivalen a <Text style={{ fontWeight: 'bold' }}>1 falta</Text>.
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBoxYellow}>
              <Text style={styles.statNumYellow}>{dashboardData?.estadisticas?.retardos || 0}</Text>
              <Text style={styles.statLabelYellow}>RETARDOS</Text>
            </View>
            <View style={styles.statBoxRed}>
              <Text style={styles.statNumRed}>{dashboardData?.estadisticas?.inasistencias || 0}</Text>
              <Text style={styles.statLabelRed}>INASISTENCIAS</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.btnOutline}
            onPress={() => setMostrarDetalles(!mostrarDetalles)}
          >
            <Ionicons name={mostrarDetalles ? "chevron-up" : "list"} size={16} color="#475569" style={{ marginRight: 8 }} />
            <Text style={styles.btnOutlineText}>
              {mostrarDetalles ? "Ocultar detalles de fechas" : "Ver detalles de fechas"}
            </Text>
          </TouchableOpacity>

          {/* CONTENEDOR DESPLEGABLE CON DISEÑO MEJORADO */}
          {mostrarDetalles && (
            <View style={styles.detallesContainer}>
              <View style={styles.inasistenciaHeader}>
                <Ionicons name="person-remove-outline" size={16} color="#b91c1c" />
                <Text style={styles.inasistenciaTitle}>Días de Inasistencia</Text>
              </View>
              
              <View style={styles.inasistenciaList}>
                {dashboardData?.estadisticas?.fechas_inasistencias && dashboardData.estadisticas.fechas_inasistencias.length > 0 ? (
                  dashboardData.estadisticas.fechas_inasistencias.map((fecha: string, index: number) => (
                    <InasistenciaRow 
                      key={index} 
                      date={fecha} 
                      isLast={index === dashboardData.estadisticas.fechas_inasistencias.length - 1} 
                    />
                  ))
                ) : (
                  <View style={{ padding: 12 }}><Text style={{ color: '#7f1d1d' }}>Sin inasistencias este mes</Text></View>
                )}
              </View>
            </View>
          )}

        </View>

        {/* BOTÓN GRANDE DE ESCANEO */}
        <TouchableOpacity style={styles.bigScanBtn} onPress={() => router.push('/scanner')}>
          <Ionicons name="qr-code-outline" size={24} color="white" style={{ marginRight: 10 }} />
          <Text style={styles.bigScanBtnText}>Escanear Entrada</Text>
        </TouchableOpacity>

        {/* ÚLTIMAS JORNADAS */}
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Últimas jornadas</Text>
          <TouchableOpacity onPress={() => router.push('/(tab)/historial')}>
            <Text style={styles.linkText}>Ver todo</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { marginBottom: 40, paddingHorizontal: 0, paddingVertical: 0 }]}>
          {dashboardData?.ultimas_jornadas && dashboardData.ultimas_jornadas.length > 0 ? (
            dashboardData.ultimas_jornadas.map((jornada: any, index: number) => (
              <JornadaRow 
                key={index} 
                date={jornada.fecha_formateada} 
                time={`Ent. ${jornada.entrada} · Sal. ${jornada.salida}`} 
                noBorder={index === dashboardData.ultimas_jornadas.length - 1} 
              />
            ))
          ) : (
            <View style={{ padding: 20 }}><Text style={{ color: '#64748b', textAlign: 'center' }}>No hay jornadas recientes</Text></View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// COMPONENTES REUTILIZABLES
function ProgressBox({ icon, title, time }: { icon: any, title: string, time: string }) {
  return (
    <View style={styles.progressBox}>
      <Ionicons name={icon} size={22} color="#94a3b8" />
      <Text style={styles.progressTitle}>{title}</Text>
      <Text style={styles.progressTime}>{time}</Text>
    </View>
  );
}

function InasistenciaRow({ date, isLast }: { date: string, isLast?: boolean }) {
  return (
    <View style={[styles.inasistenciaRow, !isLast && styles.inasistenciaRowBorder]}>
      <Ionicons name="calendar-outline" size={16} color="#b91c1c" style={{ marginRight: 10 }} />
      <Text style={styles.inasistenciaDate}>{date}</Text>
    </View>
  );
}

function JornadaRow({ date, time, noBorder }: { date: string, time: string, noBorder?: boolean }) {
  return (
    <View style={[styles.jornadaRow, !noBorder && styles.jornadaBorder]}>
      <View style={styles.jornadaIcon}>
        <Ionicons name="checkmark" size={18} color="#16a34a" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.jornadaDate}>{date}</Text>
        <Text style={styles.jornadaTime}>{time}</Text>
      </View>
      <View style={styles.pillGreen}>
        <Text style={styles.pillGreenText}>Completo</Text>
      </View>
    </View>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarMini: { width: 44, height: 44, backgroundColor: '#1e293b', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  welcomeText: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 20, marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  value: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginTop: 4 },
  
  grid4: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  progressBox: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 12, marginHorizontal: 3 },
  progressTitle: { fontSize: 9, fontWeight: 'bold', color: '#64748b', marginTop: 8, marginBottom: 4 },
  progressTime: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  
  nextScanRow: { flexDirection: 'row', alignItems: 'center' },
  scanBadge: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  scanBadgeText: { color: '#b45309', fontSize: 12, fontWeight: 'bold' },
  nextScanText: { color: '#64748b', fontSize: 13, marginLeft: 10 },

  warningBanner: { flexDirection: 'row', backgroundColor: '#fef3c7', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  warningText: { color: '#b45309', fontSize: 13, marginLeft: 8, flex: 1 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  statBoxYellow: { flex: 0.48, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 12, padding: 15, alignItems: 'center' },
  statNumYellow: { fontSize: 24, fontWeight: '900', color: '#b45309' },
  statLabelYellow: { fontSize: 10, fontWeight: 'bold', color: '#d97706', marginTop: 4 },
  
  statBoxRed: { flex: 0.48, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 15, alignItems: 'center' },
  statNumRed: { fontSize: 24, fontWeight: '900', color: '#b91c1c' },
  statLabelRed: { fontSize: 10, fontWeight: 'bold', color: '#dc2626', marginTop: 4 },
  
  btnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingVertical: 12 },
  btnOutlineText: { color: '#475569', fontSize: 14, fontWeight: '600' },

  // Estilos del acordeón
  detallesContainer: { marginTop: 10 },
  inasistenciaHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 10 },
  inasistenciaTitle: { color: '#b91c1c', fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
  inasistenciaList: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, overflow: 'hidden' },
  inasistenciaRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  inasistenciaRowBorder: { borderBottomWidth: 1, borderBottomColor: '#fecaca' },
  inasistenciaDate: { color: '#7f1d1d', fontSize: 14, fontWeight: '600' },

  bigScanBtn: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, paddingVertical: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  bigScanBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 5 },
  recentTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  linkText: { fontSize: 14, color: '#0d6efd', fontWeight: '500' },

  jornadaRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  jornadaBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  jornadaIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  jornadaDate: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  jornadaTime: { fontSize: 13, color: '#64748b', marginTop: 2 },
  pillGreen: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillGreenText: { color: '#16a34a', fontSize: 11, fontWeight: 'bold' }
});