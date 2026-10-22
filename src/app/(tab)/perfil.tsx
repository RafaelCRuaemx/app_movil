import { registrarElementoTour } from '@/components/OnboardingModal';
import { usePerfil } from '@/hooks/usePerfil';
import { useUser } from '@/hooks/useUser';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PerfilScreen() {
  const { user, logout } = useUser();
  const {
    perfilData,
    loading,
    refreshing,
    onRefresh,
    userName,
    userEmail,
    userRole,
    getInitials,
  } = usePerfil(user?.id);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      )}
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={26} color="#0f172a" style={{ marginRight: 10 }} />
          <Text style={styles.headerTitle}>Mi perfil</Text>
        </View>

               <View style={styles.avatarSection}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarInitials}>
              {perfilData?.nombre ? getInitials(perfilData.nombre) : 'RC'}
            </Text>
          </View>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#0d6efd" style={{ marginRight: 5 }} />
            <Text style={styles.roleBadgeText}>{userRole}</Text>
          </View>
        </View>

        <View ref={registrarElementoTour('perfil_datos')} collapsable={false} style={styles.card}>
          <InfoRow
            icon="business-outline"
            iconColor="#0284c7"
            iconBg="#e0f2fe"
            label="OFICINA"
            value={perfilData?.oficina || "--"}
          />
          <InfoRow
            icon="ribbon-outline"
            iconColor="#4f46e5"
            iconBg="#eef2ff"
            label="ROL"
            value={userRole}
          />
          <InfoRow
            icon="calendar-outline"
            iconColor="#16a34a"
            iconBg="#dcfce7"
            label="DÍAS LAB."
            value={perfilData?.dias_lab || "--"}
          />
          <InfoRow
            icon="sunny-outline"
            iconColor="#d97706"
            iconBg="#fef3c7"
            label="ENTRADA"
            value={perfilData?.entrada || "--"}
          />
          <InfoRow
            icon="moon-outline"
            iconColor="#0d6efd"
            iconBg="#eff6ff"
            label="SALIDA"
            value={perfilData?.salida || "--"}
          />
          <InfoRow
            icon="time-outline"
            iconColor="#475569"
            iconBg="#f1f5f9"
            label="CREACIÓN"
            value={perfilData?.fecha_ingreso || "--"}
            noBorder
          />
        </View>

        <View ref={registrarElementoTour('perfil_logout')} collapsable={false} style={{ marginBottom: 40 }}>
          <TouchableOpacity style={[styles.logoutCard, { marginBottom: 0 }]} onPress={logout}>
            <View style={styles.logoutContent}>
              <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="log-out-outline" size={20} color="#dc2626" style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  noBorder,
}: {
  icon: any;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  noBorder?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !noBorder && styles.rowBorder]}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, marginTop: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  avatarSection: { alignItems: 'center', marginBottom: 24, marginTop: 4 },
  avatarBox: {
    width: 92,
    height: 92,
    backgroundColor: '#1e293b',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
    marginBottom: 14,
  },
  avatarInitials: { color: 'white', fontSize: 30, fontWeight: 'bold' },
  name: { fontSize: 21, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  email: { fontSize: 14, color: '#64748b', marginTop: 3 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
  },
  roleBadgeText: { color: '#0d6efd', fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: { width: 85, fontSize: 11.5, fontWeight: '700', color: '#64748b', letterSpacing: 0.4 },
  infoValue: { flex: 1, fontSize: 14.5, fontWeight: '700', color: '#0f172a', textAlign: 'right' },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  logoutContent: { flexDirection: 'row', alignItems: 'center' },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
});
