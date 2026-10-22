import { apiPost } from '@/config/api';
import { PerfilData } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export function usePerfil(usuarioId?: number | string) {
  const [perfilData, setPerfilData] = useState<PerfilData|null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // 1. Obtener los datos del perfil desde el servidor
  const fetchPerfil = useCallback(async () => {
    if (!usuarioId) return;
    setLoading(true);
    try {
      const json = await apiPost('perfil_app.php', { usuario_id: usuarioId });

      if (json.success) {
        setPerfilData(json.perfil);
      }
    } catch (e) {
      if(__DEV__) console.log('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    if (usuarioId) {
      fetchPerfil();
    }
  }, [usuarioId, fetchPerfil]);

   const onRefresh = async () =>{
      setRefreshing(true);
      await fetchPerfil()
      setRefreshing(false);
    };

  // 2. Helpers de presentación
  const userName = perfilData?.nombre || 'Cargando...';
  const userEmail = perfilData?.correo || 'Cargando...';
  const userRole = perfilData?.rol || 'Colaborador';

  const getInitials = (name?: string) => {
    if (!name) return 'RC';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return {
    perfilData,
    loading,
    refreshing,
    onRefresh,
    userName,
    userEmail,
    userRole,
    getInitials,
    fetchPerfil,
  };
}

