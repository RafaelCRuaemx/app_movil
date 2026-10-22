import { CategoriaEstado } from '@/hooks/useHistorial';
import { HistorialRegistro } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FullHistorialListProps {
  historial: HistorialRegistro[];
  clasificarEstado: (e?: string) => CategoriaEstado;
}

export function FullHistorialList({ historial, clasificarEstado }: FullHistorialListProps) {
  const [mostrarListaCompleta, setMostrarListaCompleta] = useState(false);

  return (
    <>
      <TouchableOpacity 
        style={styles.toggleListBtn} 
        onPress={() => setMostrarListaCompleta(!mostrarListaCompleta)}
        activeOpacity={0.7}
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
                  <Text style={styles.fullListDate}>{h.fecha_formateada || h.fecha}</Text>
                  {!isFalta ? (
                    <Text style={styles.fullListTimes}>
                      Ent. {h.entrada || '--:--'} · Com. {h.comida_salida || '--:--'} · Reg. {h.comida_regreso || '--:--'} · Sal. {h.salida || '--:--'}
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
    </>
  );
}

const styles = StyleSheet.create({
  toggleListBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  toggleListBtnText: { color: '#0d6efd', fontSize: 14, fontWeight: 'bold', marginRight: 6 },
  fullListCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16 },
  fullListRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  fullListRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  fullListDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  fullListDate: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  fullListTimes: { fontSize: 12, color: '#64748b', marginTop: 2 },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  miniBadgeText: { fontSize: 11, fontWeight: 'bold' },
});