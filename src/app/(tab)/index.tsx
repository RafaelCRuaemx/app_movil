import { Ionicons } from '@expo/vector-icons';
import { iniciarTourGlobal, registrarElementoTour } from '@/components/OnboardingModal';
import { useLocation } from '@/hooks/useLocation';
import { useBiometrics } from '@/hooks/useBiometrics';
import { useUser } from '@/hooks/useUser';
import { useDashboard } from '@/hooks/useDashboard';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function TabIndexScreen() {
  const { user: userData, logout: handleLogout } = useUser();
  const { obtenerUbicacion } = useLocation();
  const { autenticar } = useBiometrics();
  const {
    dashboardData,
    horaActual,
    refreshing,
    registrandoHO,
    loadData,
    onRefresh,
    registrarHomeOffice,
    userName,
    getInitials,
    getIconForStep,
  } = useDashboard(userData);

  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  // Estados para modal elegante de confirmación / avisos
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const registrarHomeOfficeDirecto = async () => {
    if (!userData?.id) return;
    const pasoActual = dashboardData?.hero_btn_text?.toLowerCase() || 'asistencia';

    // Iniciar captura de ubicación en paralelo mientras el usuario coloca su huella
    const locPromise = obtenerUbicacion();

    // Validación obligatoria con huella digital / Face ID en Home Office
    const ok = await autenticar(`Confirma tu identidad para registrar ${pasoActual}`);
    if (!ok) {
      setModalType('error');
      setModalTitle('Autenticación Requerida');
      setModalMessage('Debes validar tu huella digital para registrar asistencia en Home Office.');
      setModalVisible(true);
      return;
    }

    const loc = await locPromise;
    const res = await registrarHomeOffice(loc);

    Haptics.notificationAsync(
      res.success 
        ? Haptics.NotificationFeedbackType.Success 
        : Haptics.NotificationFeedbackType.Error
    );

    setModalType(res.success ? 'success' : 'error');
    setModalTitle(res.title);
    setModalMessage(res.message);
    setModalVisible(true);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.avatarMini} onPress={() => router.push('/(tab)/perfil')}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>{getInitials(userData?.nombre)}</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.welcomeText}>HOLA,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={iniciarTourGlobal}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle-outline" size={22} color="#0d6efd" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={22} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* BANNER HOME OFFICE */}
        {dashboardData?.es_home_office && (
          <View style={styles.homeOfficeCard}>
            <View style={styles.hoIconCircle}>
              <Ionicons name="home" size={20} color="#0284c7" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.hoTitle}>Modalidad Home Office Activa</Text>
              <Text style={styles.hoSubtitle}>
                Hoy trabajas de forma remota. Puedes checar directamente sin restricciones de red ni distancia de oficina.
              </Text>
            </View>
          </View>
        )}

        {/* PROGRESO DE HOY (STEPPER) */}
        <View ref={registrarElementoTour('dash_progreso')} collapsable={false} style={styles.card}>
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
        </View>

        {/* ACCIONES DE REGISTRO */}
        {dashboardData?.proximo_paso !== 'completo' && (
          <View ref={registrarElementoTour('dash_accion')} collapsable={false} style={{ marginBottom: 16 }}>
            {dashboardData?.es_home_office ? (
              <TouchableOpacity 
                style={[styles.btnHomeOfficeAction, { marginBottom: 0 }, registrandoHO && { opacity: 0.7 }]} 
                onPress={registrarHomeOfficeDirecto}
                disabled={registrandoHO}
              >
                {registrandoHO ? (
                  <ActivityIndicator size="small" color="#0369a1" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="finger-print" size={24} color="#0369a1" style={{ marginRight: 10 }} />
                )}
                <Text style={styles.btnHomeOfficeActionText}>
                  {registrandoHO ? 'Validando huella...' : `Checar con Huella (${dashboardData?.hero_btn_text || 'Remoto'})`}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.bigScanBtn, { marginBottom: 0 }]} onPress={() => router.push('/scanner')}>
                <Ionicons name={getIconForStep(dashboardData?.proximo_paso)} size={24} color="white" style={{ marginRight: 10 }} />
                <Text style={styles.bigScanBtnText}>
                  {dashboardData?.hero_btn_text || 'Escanear QR'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ESTADÍSTICAS MENSUALES Y AUDITORÍA DE FALTAS */}
        <View ref={registrarElementoTour('dash_resumen')} collapsable={false} style={styles.card}>
          <Text style={[styles.label, { marginBottom: 15 }]}>RESUMEN DE {dashboardData?.mes_texto || 'ESTE MES'}</Text>

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

          <TouchableOpacity style={styles.btnOutline} onPress={() => setMostrarDetalles(!mostrarDetalles)}>
            <Ionicons name={mostrarDetalles ? "chevron-up" : "chevron-down"} size={16} color="#475569" style={{ marginRight: 6 }} />
            <Text style={styles.btnOutlineText}>{mostrarDetalles ? 'Ocultar detalles' : 'Ver detalles de incidencias'}</Text>
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
                  <View style={{ padding: 12 }}><Text style={{ color: '#7f1d1d' }}>Sin faltas directas</Text></View>
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
                  <View style={{ padding: 12 }}><Text style={{ color: '#b45309' }}>Sin retardos este mes</Text></View>
                )}
              </View>
            </View>
          )}
        </View>

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

      {/* MODAL ELEGANTE DE RESULTADO / AVISOS */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconWrap, { backgroundColor: modalType === 'success' ? '#dcfce7' : '#fee2e2' }]}>
              <Ionicons 
                name={modalType === 'success' ? "checkmark-circle" : "alert-circle"} 
                size={48} 
                color={modalType === 'success' ? "#16a34a" : "#dc2626"} 
              />
            </View>

            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>

            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: modalType === 'success' ? '#16a34a' : '#0d6efd' }]} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ProgressBox({ icon, title, time, isActive }: { icon: any, title: string, time: string, isActive?: boolean }) {
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

function InasistenciaRow({ date, isLast, isRetardo }: { date: string, isLast?: boolean, isRetardo?: boolean }) {
  return (
    <View style={[styles.inasistenciaRow, !isLast && (isRetardo ? styles.retardoRowBorder : styles.inasistenciaRowBorder)]}>
      <Ionicons name="calendar-outline" size={16} color={isRetardo ? "#b45309" : "#b91c1c"} style={{ marginRight: 10 }} />
      <Text style={[styles.inasistenciaDate, isRetardo && { color: '#b45309' }]}>{date}</Text>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarMini: { width: 44, height: 44, backgroundColor: '#1e293b', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  welcomeText: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  helpButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 20, marginBottom: 16 },
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
  relojTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0d6efd',
  },
  grid4: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  progressBox: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 12, marginHorizontal: 3 },
  progressBoxActive: { borderColor: '#0d6efd', backgroundColor: '#eff6ff' },
  progressBoxCompleted: { borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' },
  progressTitle: { fontSize: 9, fontWeight: 'bold', color: '#64748b', marginTop: 8, marginBottom: 4 },
  progressTime: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  nextScanRow: { flexDirection: 'row', alignItems: 'center' },
  scanBadge: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  scanBadgeText: { color: '#b45309', fontSize: 12, fontWeight: 'bold' },
  nextScanText: { color: '#64748b', fontSize: 13, marginLeft: 10 },
  successBanner: { flexDirection: 'row', backgroundColor: '#dcfce7', padding: 12, borderRadius: 8, alignItems: 'center' },
  successBannerText: { color: '#166534', fontSize: 14, marginLeft: 8, fontWeight: '600' },
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
  detallesContainer: { marginTop: 10 },
  inasistenciaHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 10 },
  inasistenciaTitle: { color: '#b91c1c', fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
  inasistenciaList: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, overflow: 'hidden' },
  inasistenciaRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  inasistenciaRowBorder: { borderBottomWidth: 1, borderBottomColor: '#fecaca' },
  retardoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#fcd34d' },
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
  pillGreenText: { color: '#16a34a', fontSize: 11, fontWeight: 'bold' },

  // Estilos Home Office
  homeOfficeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd', borderRadius: 16, padding: 16, marginBottom: 16 },
  hoIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center' },
  hoTitle: { fontSize: 14, fontWeight: 'bold', color: '#0369a1' },
  hoSubtitle: { fontSize: 12, color: '#0284c7', marginTop: 2, lineHeight: 17 },
  btnHomeOfficeAction: { flexDirection: 'row', backgroundColor: '#e0f2fe', borderWidth: 1.5, borderColor: '#38bdf8', borderRadius: 12, paddingVertical: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  btnHomeOfficeActionText: { color: '#0284c7', fontSize: 15, fontWeight: 'bold' },

  // Modal de Aviso / Éxito Elegante
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 340, backgroundColor: '#ffffff', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16 },
  modalIconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 20, paddingHorizontal: 4 },
  modalButton: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalButtonText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' }
});
