import { DashboardData } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RecentJornadasCardProps {
    dashboardData: DashboardData | null;
}

export function RecentJornadasCard({
    dashboardData}: RecentJornadasCardProps){
   return (
    <>
      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Últimas jornadas</Text>
        <TouchableOpacity onPress={() => router.push('/(tab)/historial')}>
          <Text style={styles.linkText}>Ver todo</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
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
          <View style={{ padding: 20 }}>
            <Text style={{ color: '#64748b', textAlign: 'center' }}>No hay jornadas recientes</Text>
          </View>
        )}
      </View>
    </>
  );
}
function JornadaRow({ date, time, noBorder }: { date: string; time: string; noBorder?: boolean }) {
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
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recentTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  linkText: { fontSize: 13, fontWeight: '600', color: '#0d6efd' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 40, overflow: 'hidden' },
  jornadaRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  jornadaBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  jornadaIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jornadaDate: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  jornadaTime: { fontSize: 12, color: '#64748b', marginTop: 2 },
  pillGreen: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pillGreenText: { color: '#16a34a', fontSize: 11, fontWeight: 'bold' },
});