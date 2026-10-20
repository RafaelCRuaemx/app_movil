import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const ONBOARDING_KEY = 'activ2_onboarding_visto';

// Diccionario global donde cada cuadro/botón registra su referencia física
const elementosRef: Record<string, View | null> = {};

export const registrarElementoTour = (id: string) => (ref: View | null) => {
  elementosRef[id] = ref;
};

let abrirTourGlobal: (() => void) | null = null;
let tourMostradoEnSesion = false;
let tourActivoGlobal = false;

export const estaTourActivo = () => tourActivoGlobal;

export const iniciarTourGlobal = () => {
  tourActivoGlobal = true;
  if (abrirTourGlobal) abrirTourGlobal();
};

export const verificarTourPrimeraVez = async (): Promise<boolean> => {
  if (tourMostradoEnSesion) return tourActivoGlobal;
  try {
    const visto = await SecureStore.getItemAsync(ONBOARDING_KEY);
    if (!visto) {
      tourMostradoEnSesion = true;
      tourActivoGlobal = true;
      await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
      if (abrirTourGlobal) abrirTourGlobal();
      return true;
    }
  } catch (e) {
    // silencioso
  }
  return false;
};

// Lista de pasos cuadro por cuadro (10 elementos en las 4 pantallas, incluyendo Home Office)
const PASOS = [
  // --- PANTALLA 1: ESCÁNER QR ---
  {
    ruta: '/scanner',
    targetId: 'scanner_oficina',
    etapa: 'ESCÁNER QR · 1/10',
    titulo: 'Tu Oficina y Modalidad',
    descripcion:
      'Aquí verificas tu sede asignada. Si ese día tienes asignado Home Office, aparecerá un aviso azul indicándote que estás en modalidad remota.',
  },
  {
    ruta: '/scanner',
    targetId: 'scanner_marco',
    etapa: 'ESCÁNER QR · 2/10',
    titulo: 'Visor QR o Modo Home Office',
    descripcion:
      'En modalidad presencial aquí se abre la cámara para leer el QR. Si estás en Home Office, este cuadro cambia automáticamente por validación con Huella Digital sin pedir Wi-Fi ni geocerca.',
  },
  {
    ruta: '/scanner',
    targetId: 'scanner_boton',
    etapa: 'ESCÁNER QR · 3/10',
    titulo: 'Botón de Activación / Huella',
    descripcion:
      'En oficina comprueba tu Wi-Fi y GPS para encender la cámara. En Home Office cambia a "Checar con Huella Digital" para registrar tu asistencia remota.',
  },
  // --- PANTALLA 2: DASHBOARD ---
  {
    ruta: '/(tab)',
    targetId: 'dash_progreso',
    etapa: 'INICIO · 4/10',
    titulo: 'Reloj y Tus 4 Checadas',
    descripcion:
      'Aquí ves la hora en vivo y el estado de tus 4 registros del día: Entrada, A Comer, Regreso y Salida.',
  },
  {
    ruta: '/(tab)',
    targetId: 'dash_accion',
    etapa: 'INICIO · 5/10',
    titulo: 'Registro Rápido y Home Office',
    descripcion:
      'Desde aquí registras tu siguiente checada: si estás en oficina abre el Escáner QR, y si estás en Home Office te permite checar directo con tu Huella Digital.',
  },
  {
    ruta: '/(tab)',
    targetId: 'dash_resumen',
    etapa: 'INICIO · 6/10',
    titulo: 'Resumen de Incidencias',
    descripcion:
      'Consulta cuántos retardos y faltas acumulas en el mes. Recuerda que cada 3 retardos equivalen a 1 falta.',
  },
  // --- PANTALLA 3: HISTORIAL ---
  {
    ruta: '/(tab)/historial',
    targetId: 'hist_mes_filtros',
    etapa: 'HISTORIAL · 7/10',
    titulo: 'Navegador y Filtros Rápidos',
    descripcion:
      'Cambia de mes con las flechas o toca los botones de Puntuales, Retardos o Faltas para resaltar esos días.',
  },
  {
    ruta: '/(tab)/historial',
    targetId: 'hist_calendario',
    etapa: 'HISTORIAL · 8/10',
    titulo: 'Calendario Semáforo',
    descripcion:
      'Cada día se pinta de verde, amarillo o rojo. Toca cualquier número del calendario para ver sus horas exactas abajo.',
  },
  // --- PANTALLA 4: PERFIL ---
  {
    ruta: '/(tab)/perfil',
    targetId: 'perfil_datos',
    etapa: 'MI PERFIL · 9/10',
    titulo: 'Tu Horario y Datos Laborales',
    descripcion:
      'Revisa tu oficina, tus días laborales asignados, tu hora oficial de entrada y salida, tu rol y tu fecha de alta.',
  },
  {
    ruta: '/(tab)/perfil',
    targetId: 'perfil_logout',
    etapa: 'MI PERFIL · 10/10',
    titulo: 'Cerrar Sesión',
    descripcion:
      'Cuando desees desvincular tu cuenta o salir del sistema de forma segura, utiliza este botón.',
  },
];

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [pasoActual, setPasoActual] = useState(0);
  const [spotlight, setSpotlight] = useState<Rect | null>(null);
  const pathname = usePathname();
  const { height: screenH } = Dimensions.get('window');
  // Función que mide en pantalla el cuadro/botón del paso actual
  const medirElementoActual = useCallback((indicePaso: number) => {
    const paso = PASOS[indicePaso];
    if (!paso) return;
    let intentos = 0;
    const intervalo = setInterval(() => {
      intentos++;
      const ref = elementosRef[paso.targetId];
      if (ref && typeof ref.measureInWindow === 'function') {
        ref.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            const pad = 6; // Margen de respiro alrededor del cuadro iluminado
            setSpotlight({
              x: Math.max(0, x - pad),
              y: Math.max(0, y - pad),
              width: width + pad * 2,
              height: height + pad * 2,
            });
            clearInterval(intervalo);
          }
        });
      }
      if (intentos >= 12) {
        clearInterval(intervalo);
      }
    }, 90);
    return () => clearInterval(intervalo);
  }, []);
  useEffect(() => {
    abrirTourGlobal = () => {
      tourMostradoEnSesion = true;
      tourActivoGlobal = true;
      setSpotlight(null);
      setPasoActual(0);
      setVisible(true);
      if (pathname !== '/scanner') {
        router.replace('/scanner' as any);
      }
    };
    return () => {
      abrirTourGlobal = null;
    };
  }, [pathname]);
  // Cada vez que cambia el paso o la pantalla, medimos el nuevo cuadro
  useEffect(() => {
    if (!visible) return;
    setSpotlight(null);
    const limpiar = medirElementoActual(pasoActual);
    return limpiar;
  }, [visible, pasoActual, pathname, medirElementoActual]);
  const irAlPaso = (nuevoIndice: number) => {
    const rutaActual = PASOS[pasoActual]?.ruta;
    const rutaDestino = PASOS[nuevoIndice].ruta;
    setSpotlight(null);
    setPasoActual(nuevoIndice);
    if (rutaActual !== rutaDestino) {
      router.replace(rutaDestino as any);
    }
  };
  const finalizarTutorial = async (destino: '/(tab)' | '/scanner' = '/(tab)') => {
    tourActivoGlobal = false;
    try {
      await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    } catch (e) {
      // Silencioso
    }
    setVisible(false);
    setSpotlight(null);
    setPasoActual(0);
    router.replace(destino as any);
  };
  if (!visible) return null;
  const paso = PASOS[pasoActual];
  const esUltimoPaso = pasoActual === PASOS.length - 1;
  // Calculamos si el cuadro iluminado está en la mitad superior para poner el globo abajo (o viceversa)
  const centroElementoY = spotlight ? spotlight.y + spotlight.height / 2 : screenH / 2;
  const mostrarGloboAbajo = centroElementoY < screenH * 0.52;
  return (
    <View style={styles.rootOverlay} pointerEvents="box-none">
      {/* 1. RECORTE DE LUZ (4 rectángulos oscuros alrededor del cuadro iluminado) */}
      {spotlight ? (
        <>
          {/* Oscuro Arriba */}
          <View
            style={[
              styles.darkBlock,
              { top: 0, left: 0, right: 0, height: spotlight.y },
            ]}
          />
          {/* Oscuro Abajo */}
          <View
            style={[
              styles.darkBlock,
              {
                top: spotlight.y + spotlight.height,
                left: 0,
                right: 0,
                bottom: 0,
              },
            ]}
          />
          {/* Oscuro Izquierda */}
          <View
            style={[
              styles.darkBlock,
              {
                top: spotlight.y,
                left: 0,
                width: spotlight.x,
                height: spotlight.height,
              },
            ]}
          />
          {/* Oscuro Derecha */}
          <View
            style={[
              styles.darkBlock,
              {
                top: spotlight.y,
                left: spotlight.x + spotlight.width,
                right: 0,
                height: spotlight.height,
              },
            ]}
          />
          {/* Marco brillante azul alrededor del elemento */}
          <View
            pointerEvents="none"
            style={[
              styles.spotlightBorder,
              {
                top: spotlight.y,
                left: spotlight.x,
                width: spotlight.width,
                height: spotlight.height,
              },
            ]}
          />
        </>
      ) : (
        <View style={[styles.darkBlock, { top: 0, left: 0, right: 0, bottom: 0 }]} />
      )}
      {/* 2. GLOBO EXPLICATIVO CON FLECHA APUNTANDO AL ELEMENTO */}
      <View
        style={[
          styles.tooltipWrapper,
          spotlight
            ? mostrarGloboAbajo
              ? { top: Math.min(screenH - 250, spotlight.y + spotlight.height + 12) }
              : { bottom: Math.min(screenH - 80, screenH - spotlight.y + 12) }
            : { bottom: 40 },
        ]}
      >
        {/* Flecha superior (apunta hacia arriba cuando el globo está debajo del cuadro) */}
        {spotlight && mostrarGloboAbajo && <View style={styles.arrowUp} />}
        <View style={styles.tooltipCard}>
          <View style={styles.topRow}>
            <View style={styles.stepPill}>
              <Ionicons name="sparkles" size={12} color="#0d6efd" style={{ marginRight: 5 }} />
              <Text style={styles.stepPillText}>{paso.etapa}</Text>
            </View>
            {!esUltimoPaso && (
              <TouchableOpacity onPress={() => finalizarTutorial('/(tab)')}>
                <Text style={styles.skipText}>Omitir</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.title}>{paso.titulo}</Text>
          <Text style={styles.description}>{paso.descripcion}</Text>
          {/* Botones de navegación paso a paso */}
          {!esUltimoPaso ? (
            <View style={styles.buttonsRow}>
              {pasoActual > 0 ? (
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => irAlPaso(pasoActual - 1)}
                >
                  <Ionicons name="arrow-back" size={15} color="#475569" style={{ marginRight: 5 }} />
                  <Text style={styles.btnSecondaryText}>Anterior</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => irAlPaso(pasoActual + 1)}
              >
                <Text style={styles.btnPrimaryText}>Siguiente</Text>
                <Ionicons name="arrow-forward" size={15} color="#ffffff" style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ width: '100%', gap: 8 }}>
              <TouchableOpacity
                style={styles.btnFinish}
                onPress={() => finalizarTutorial('/(tab)')}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.btnPrimaryText}>Entendido, ir al Inicio</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnGoScanner}
                onPress={() => finalizarTutorial('/scanner')}
              >
                <Ionicons name="qr-code-outline" size={17} color="#0d6efd" style={{ marginRight: 6 }} />
                <Text style={styles.btnGoScannerText}>Ir a Escanear QR ahora</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {/* Flecha inferior (apunta hacia abajo cuando el globo está arriba del cuadro) */}
        {spotlight && !mostrarGloboAbajo && <View style={styles.arrowDown} />}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  rootOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  darkBlock: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  spotlightBorder: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: '#38bdf8',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  tooltipWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ffffff',
    marginBottom: -1,
  },
  arrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ffffff',
    marginTop: -1,
  },
  tooltipCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    elevation: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0d6efd',
    letterSpacing: 0.4,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 14,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  btnPrimary: {
    flex: 1.3,
    flexDirection: 'row',
    backgroundColor: '#0d6efd',
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  btnFinish: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#0d6efd',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGoScanner: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGoScannerText: {
    color: '#0d6efd',
    fontSize: 13,
    fontWeight: '700',
  },
});