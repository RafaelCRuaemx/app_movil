import { apiPost } from '@/config/api';
import { cancelarAlertaComida, programarAlertaComida } from '@/services/notificationService';
import { DashboardData, Usuario } from '@/types';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';

export function useDashboard(userData?: Usuario | null) {
  const [dashboardData, setDashboardData] = useState<DashboardData |null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [registrandoHO, setRegistrandoHO] = useState(false);

  // 1. Reloj digital en vivo (se actualiza automáticamente cada segundo con la hora)
  const [horaActual, setHoraActual] = useState(new Date().toLocaleTimeString('es-MX'));

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraActual(new Date().toLocaleTimeString('es-MX'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Cargar datos del dashboard (con caché offline en SecureStore)
  const loadData = useCallback(async () => {
    try {
      // Cargar caché local inmediato para evitar pantallas en blanco
      const cachedDash = await SecureStore.getItemAsync('cached_dashboard');
      if (cachedDash) {
        setDashboardData(JSON.parse(cachedDash));
      }

      // Si hay sesión de usuario, consultar datos en vivo al servidor
      if (userData?.id) {
        setLoading(true);
        const json = await apiPost('dashboard_app.php', { usuario_id: userData.id });
        if (json.success) {
          setDashboardData(json.dashboard);
          await SecureStore.setItemAsync('cached_dashboard', JSON.stringify(json.dashboard));
        }
      }
    } catch (e) {
      if (__DEV__) console.log('Error al obtener datos del dashboard:', e);
    } finally {
      setLoading(false);
    }
  }, [userData?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 3. Soporte para deslizar y recargar (Pull-to-refresh)
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // 4. Petición para registrar asistencia en modalidad remota (Home Office)
  const registrarHomeOffice = async (coordenadas?: { latitude: number; longitude: number; accuracy?: number | null } | null) => {
    if (!userData?.id) {
      return { success: false, title: 'Error', message: 'No se encontró la sesión del usuario.' };
    }

    setRegistrandoHO(true);
    try {
      const lat = coordenadas?.latitude ?? null;
      const lon = coordenadas?.longitude ?? null;
      const acc = coordenadas?.accuracy ?? null;

      const json = await apiPost('registrar_asistencia_home_office_app.php', {
        usuario_id: userData.id,
        lat,
        lon,
        gps_acc: acc,
      });

      setRegistrandoHO(false);

      if (json.success) {
        // Gestión inteligente de alertas para el horario de comida
        const tipo = json.tipo || 'asistencia';
        if (tipo === 'comidaSalida') {
          programarAlertaComida(45);
        } else if (tipo === 'comidaEntrada') {
          cancelarAlertaComida();
        }

        // Recargar dashboard tras marcaje exitoso
        await loadData();

        return {
          success: true,
          title: '¡Registro Exitoso!',
          message: json.registro?.hora
            ? `Tu marcaje fue registrado correctamente a las ${json.registro.hora} en modalidad remota.`
            : 'Asistencia en modalidad Home Office confirmada con éxito.',
        };
      } else {
        return {
          success: false,
          title: 'Aviso de Asistencia',
          message: json.motivo || json.message || 'No fue posible registrar tu asistencia en este momento.',
        };
      }
    } catch (err: any) {
      setRegistrandoHO(false);
      return {
        success: false,
        title: 'Error de Conexión',
        message: 'No se pudo conectar con el servidor: ' + err.message,
      };
    }
  };

  // 5. Funciones auxiliares de formateo visual
  const userName = userData?.nombre ? userData.nombre.split(' ')[0] : 'Colaborador';

  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getIconForStep = (step?: string) => {
    switch (step) {
      case 'entrada': return 'sunny-outline';
      case 'salida_comida': return 'cafe-outline';
      case 'regreso_comida': return 'fast-food-outline';
      case 'salida': return 'exit-outline';
      default: return 'qr-code-outline';
    }
  };

  return {
    dashboardData,
    loading,
    refreshing,
    horaActual,
    registrandoHO,
    loadData,
    onRefresh,
    registrarHomeOffice,
    userName,
    getInitials,
    getIconForStep,
  };
}
