import { apiPost } from '@/config/api';
import { HistoriaRegistro } from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

// 1. Constantes y tipos de datos
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DIAS_SEMANA_COMPLETO = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export type CategoriaEstado = 'puntual' | 'retardo' | 'falta' | 'neutro';
export type FiltroEstado = 'todos' | 'puntual' | 'retardo' | 'falta';

// 2. Función clasificadora para el semáforo
export const clasificarEstado = (estadoRaw?: string): CategoriaEstado => {
  if (!estadoRaw) return 'neutro';
  const e = estadoRaw.toLowerCase().trim();
  if (e === 'retardo') return 'retardo';
  if (e === 'falta' || e === 'inasistencia') return 'falta';
  if (['normal', 'puntual', 'correcto', 'asistencia', 'completo'].includes(e)) return 'puntual';
  return 'puntual';
};

export function useHistorial(usuarioId?: number | string) {
  const [historial, setHistorial] = useState<HistoriaRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de calendario y día
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState<number>(new Date().getDate());
  const [filtroSeleccionado, setFiltroSeleccionado] = useState<FiltroEstado>('todos');

  // 3. Petición al backend para traer las checadas del mes
  const fetchHistorial = useCallback(async () => {
    if (!usuarioId) return;
    setLoading(true);
    try {
      const json = await apiPost('historial_app.php', {
        usuario_id: usuarioId,
        mes: mesActual,
        anio: anioActual,
      });
      if (json.success) {
        setHistorial(json.historial || []);
      }
    } catch (e) {
      if (__DEV__) console.log('Error fetching history:', e);
    } finally {
      setLoading(false);
    }
  }, [usuarioId, mesActual, anioActual]);

  // Recargar al cambiar de mes o usuario
  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistorial();
    setRefreshing(false);
  };

  // 4. Navegación de meses
  const irMesAnterior = () => {
    if (mesActual === 1) {
      setMesActual(12);
      setAnioActual(a => a - 1);
    } else {
      setMesActual(m => m - 1);
    }
    setDiaSeleccionado(1);
    setFiltroSeleccionado('todos');
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
    setFiltroSeleccionado('todos');
  };

  const irAHoy = () => {
    const hoy = new Date();
    setMesActual(hoy.getMonth() + 1);
    setAnioActual(hoy.getFullYear());
    setDiaSeleccionado(hoy.getDate());
    setFiltroSeleccionado('todos');
  };

  // 5. Mapeo indexado por número de día para acceso rápido en memoria
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

  // 6. Conteo y resumen mensual para los chips
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

  // 7. Alternar filtro y saltar automáticamente al primer día encontrado
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

  // 8. Detalle del día seleccionado para la tarjeta inferior
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

  return {
    historial,
    loading,
    refreshing,
    onRefresh,
    mesActual,
    anioActual,
    diaSeleccionado,
    setDiaSeleccionado,
    filtroSeleccionado,
    setFiltroSeleccionado,
    toggleFiltro,
    irMesAnterior,
    irMesSiguiente,
    irAHoy,
    mapaDias,
    resumen,
    infoDiaSeleccionado,
    clasificarEstado,
    MESES,
    recargar: fetchHistorial,
  };
}