import { IncidenciasCard } from "@/components/dashboard/IncidenciasCard";
import { ProgressGrid } from "@/components/dashboard/ProgressGrid";
import { RecentJornadasCard } from "@/components/dashboard/RecentJornadasCard";
import { iniciarTourGlobal, registrarElementoTour } from "@/components/OnboardingModal";
import { useBiometrics } from "@/hooks/useBiometrics";
import { useDashboard } from "@/hooks/useDashboard";
import { useLocation } from "@/hooks/useLocation";
import { useUser } from "@/hooks/useUser";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from "react";
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabIndexScreen(){
  const {user: userData, logout: handleLogout} = useUser();
  const {obtenerUbicacion} = useLocation();
  const{ autenticar } = useBiometrics();
  const{
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
  }= useDashboard(userData);

  //estados para modal de avisos 
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalTitle, setModalTitle] = useState('');
  const[modalMessage, setModalMessage] = useState('');

  useFocusEffect( useCallback(() =>{
    loadData();
  }, [loadData]));

  const registrarHomeOfficeDirecto = async () =>{
    if(!userData?.id) return;
    const pasoActual = dashboardData?.hero_btn_text?.toLocaleLowerCase() || 'asistencia';

    const locPromise = obtenerUbicacion();
    const ok = await autenticar(`Confirma tu identidad para registrar ${pasoActual}`);
    if(!ok){
      setModalType('error');
      setModalTitle('Autenticación Requerida');
      setModalMessage('Debes validar tu huella digital para registrar asistencia Home Office.');
      setModalVisible(true);
      return;
    }

    const loc = await locPromise;
    const res = await registrarHomeOffice(loc);

    Haptics.notificationAsync(res.success ? Haptics.NotificationFeedbackType.Success :
      Haptics.NotificationFeedbackType.Error
    );

    setModalType(res.success ? 'success' : 'error');
    setModalTitle(res.title);
    setModalMessage(res.message);
    setModalVisible(true);
  };

  const horaNum = new Date().getHours();
  const saludoHorario = horaNum<12 ? 'BUENOS DÍAS,' : horaNum <19 ? 'BUENAS TARDES,' : 'BUENAS NOCHES';

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
              <Text style={styles.welcomeText}>{saludoHorario}</Text>
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
          <ProgressGrid dashboardData={dashboardData} horaActual={horaActual} />
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
        {/* ESTADÍSTICAS MENSUALES */}
        <View ref={registrarElementoTour('dash_resumen')} collapsable={false} style={styles.card}>
          <IncidenciasCard dashboardData={dashboardData} />
        </View>
        {/* ÚLTIMAS JORNADAS */}
        <RecentJornadasCard dashboardData={dashboardData} />
      </ScrollView>
      {/* MODAL DE RESULTADO / AVISOS */}
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
  homeOfficeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  hoIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center' },
  hoTitle: { fontSize: 14, fontWeight: 'bold', color: '#0369a1', marginBottom: 2 },
  hoSubtitle: { fontSize: 12, color: '#0284c7', lineHeight: 16 },
  bigScanBtn: {
    flexDirection: 'row',
    backgroundColor: '#0d6efd',
    paddingVertical: 18,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0d6efd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bigScanBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  btnHomeOfficeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
    borderWidth: 1.5,
    borderColor: '#7dd3fc',
    paddingVertical: 16,
    borderRadius: 16,
  },
  btnHomeOfficeActionText: { color: '#0369a1', fontSize: 15, fontWeight: 'bold' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 340, backgroundColor: '#ffffff', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalIconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  modalMessage: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalButton: { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});
