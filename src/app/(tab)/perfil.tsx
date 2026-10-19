import { useUser } from '@/hooks/useUser';
import { usePerfil } from '@/hooks/usePerfil';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PerfilScreen() {
  const { user, logout } = useUser();
  const {
    perfilData,
    loading,
    userName,
    userEmail,
    userRole,
    getInitials,
    handleAvatarPress,
  } = usePerfil(user?.id);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      {loading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      )}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi perfil</Text>
        </View>

        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarBox} onPress={handleAvatarPress}>
            {perfilData?.foto_perfil ? (
              <Image source={{ uri: perfilData.foto_perfil }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{perfilData?.nombre ? getInitials(perfilData.nombre) : 'RC'}</Text>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>

        <View style={styles.card}>
          <InfoRow label="OFICINA" value={perfilData?.oficina || "--"} />
          <InfoRow label="ROL" value={userRole} />
          <InfoRow label="DÍAS LAB." value={perfilData?.dias_lab || "--"} />
          <InfoRow label="ENTRADA" value={perfilData?.entrada || "--"} />
          <InfoRow label="SALIDA" value={perfilData?.salida || "--"} />
          <InfoRow label="CREACIÓN" value={perfilData?.fecha_ingreso || "--"} noBorder />
        </View>

        <TouchableOpacity style={styles.logoutCard} onPress={logout}>
          <View style={styles.logoutContent}>
            <Ionicons name="log-out-outline" size={24} color="#dc3545" style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.logoutText}>Cerrar sesion</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, noBorder }: { label: string, value: string, noBorder?: boolean }) {
  return (
    <View style={[styles.infoRow, !noBorder && styles.rowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, marginTop: 10 },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  avatarSection: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatarBox: {
    width: 100, height: 100, 
    backgroundColor: '#1e293b', borderRadius: 30, 
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.1, shadowRadius: 15, elevation: 5,
    marginBottom: 15, position: 'relative'
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 30 },
  avatarInitials: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  cameraBadge: {
    position: 'absolute', bottom: -5, right: -5,
    backgroundColor: '#0ea5e9', width: 34, height: 34,
    borderRadius: 17, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#ffffff'
  },
  name: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  email: { fontSize: 16, color: '#64748b', marginTop: 4 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0',
    paddingHorizontal: 20, marginBottom: 20
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { width: 90, fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  infoValue: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0f172a' },
  logoutCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0',
    padding: 20, marginBottom: 40
  },
  logoutContent: { flexDirection: 'row', alignItems: 'center' },
  logoutText: { color: '#dc3545', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});
