import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    LayoutAnimation,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
    titulo: 'Oficina y Modalidad',
    descripcion:
      'Aquí verificas tu oficina asignada. Si ese día tienes asignado Home Office, aparecerá un aviso azul indicándote que estás en modalidad remota.',
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
    titulo: 'Reloj y Tus 4 Registros',
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
      'Cambia de mes con las flechas o toca los botones de Puntuales para solo visualizar: Asistencia, Retardos o Faltas para resaltar esos días.',
  },
  {
    ruta: '/(tab)/historial',
    targetId: 'hist_calendario',
    etapa: 'HISTORIAL · 8/10',
    titulo: 'Calendario Semáforo',
    descripcion:
      'Cada día se pinta de verde, amarillo o rojo. Toca cualquier número del calendario para ver tus registros o incidencias.',
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
      'Cuando desees salir del sistema de forma segura, utiliza este botón.',
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
  const [overlayHeight, setOverlayHeight] = useState(Dimensions.get('window').height);
  const overlayRef = useRef<View | null>(null);
  const pathname = usePathname();

  // Animaciones nativas suaves para el globo explicativo (fade + ligero desplazamiento)
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTranslateY = useRef(new Animated.Value(8)).current;

  const animarAparicionGlobo = useCallback(() => {
    tooltipOpacity.setValue(0);
    tooltipTranslateY.setValue(8);
    Animated.parallel([
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(tooltipTranslateY, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [tooltipOpacity, tooltipTranslateY]);

  // Función que mide en pantalla el cuadro/botón del paso actual descontando el offset del contenedor raíz
  const medirElementoActual = useCallback(
    (indicePaso: number, animarRecorte = true) => {
      const paso = PASOS[indicePaso];
      if (!paso) return;
      let intentos = 0;
      let yaAnimoGlobo = false;

      const medirUnaVez = () => {
        const ref = elementosRef[paso.targetId];
        const contenedor = overlayRef.current;

        if (
          ref &&
          contenedor &&
          typeof ref.measureInWindow === 'function' &&
          typeof contenedor.measureInWindow === 'function'
        ) {
          contenedor.measureInWindow((ox, oy, _ow, oh) => {
            if (oh > 0) {
              setOverlayHeight(oh);
            }
            ref.measureInWindow((tx, ty, width, height) => {
              if (width > 0 && height > 0) {
                const pad = 4; // Margen compacto y exacto alrededor del cuadro iluminado
                const relX = tx - ox;
                const relY = ty - oy;

                const nuevoRect: Rect = {
                  x: Math.max(0, Math.round(relX - pad)),
                  y: Math.max(0, Math.round(relY - pad)),
                  width: Math.round(width + pad * 2),
                  height: Math.round(height + pad * 2),
                };

                setSpotlight((prev) => {
                  if (
                    prev &&
                    Math.abs(prev.x - nuevoRect.x) <= 1 &&
                    Math.abs(prev.y - nuevoRect.y) <= 1 &&
                    Math.abs(prev.width - nuevoRect.width) <= 1 &&
                    Math.abs(prev.height - nuevoRect.height) <= 1
                  ) {
                    return prev;
                  }
                  if (animarRecorte && prev) {
                    LayoutAnimation.configureNext({
                      duration: 240,
                      update: { type: LayoutAnimation.Types.easeInEaseOut },
                    });
                  }
                  return nuevoRect;
                });

                if (!yaAnimoGlobo) {
                  yaAnimoGlobo = true;
                  animarAparicionGlobo();
                }
              }
            });
          });
        }
      };

      // Medición inmediata en el primer frame disponible
      const rafId = requestAnimationFrame(medirUnaVez);

      const intervalo = setInterval(() => {
        intentos++;
        medirUnaVez();
        if (intentos >= 15) {
          clearInterval(intervalo);
        }
      }, 90);

      return () => {
        cancelAnimationFrame(rafId);
        clearInterval(intervalo);
      };
    },
    [animarAparicionGlobo]
  );

  useEffect(() => {
    abrirTourGlobal = () => {
      tourMostradoEnSesion = true;
      tourActivoGlobal = true;
      tooltipOpacity.setValue(0);
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
  }, [pathname, tooltipOpacity]);

  // Cada vez que cambia el paso, medimos el nuevo cuadro conservando el anterior para animar el deslizamiento
  useEffect(() => {
    if (!visible) return;
    const limpiar = medirElementoActual(pasoActual, true);
    return limpiar;
  }, [visible, pasoActual, medirElementoActual]);

  const irAlPaso = (nuevoIndice: number) => {
    const rutaActual = PASOS[pasoActual]?.ruta;
    const rutaDestino = PASOS[nuevoIndice].ruta;
    const cambiaDePantalla = rutaActual !== rutaDestino;

    // 1. Primero desvanecemos suavemente el globo (110ms) para que no desaparezca de golpe
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 110,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      // 2. Cambiamos de pantalla sin poner spotlight en null, para que el recorte se deslice al nuevo elemento
      if (cambiaDePantalla) {
        router.replace(rutaDestino as any);
      }
      setPasoActual(nuevoIndice);
    });
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

  // Calculamos el espacio libre real arriba y abajo del recuadro iluminado para que el globo nunca lo tape
  const espacioArriba = spotlight ? spotlight.y : overlayHeight / 2;
  const espacioAbajo = spotlight ? overlayHeight - (spotlight.y + spotlight.height) : overlayHeight / 2;
  const mostrarGloboAbajo = espacioAbajo >= 220 || espacioAbajo >= espacioArriba;

  return (
    <View
      ref={overlayRef}
      collapsable={false}
      style={styles.rootOverlay}
      pointerEvents="box-none"
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h > 0) setOverlayHeight(h);
      }}
    >
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
      {/* 2. GLOBO EXPLICATIVO CON FLECHA APUNTANDO AL ELEMENTO (Solo se muestra cuando ya midió el recuadro) */}
      {spotlight && (
        <Animated.View
          style={[
            styles.tooltipWrapper,
            mostrarGloboAbajo
              ? { top: spotlight.y + spotlight.height + 8 }
              : { bottom: Math.max(16, overlayHeight - spotlight.y + 8) },
            {
              opacity: tooltipOpacity,
              transform: [{ translateY: tooltipTranslateY }],
            },
          ]}
        >
          {/* Flecha superior (apunta hacia arriba cuando el globo está debajo del cuadro) */}
          {mostrarGloboAbajo && <View style={styles.arrowUp} />}
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
          {!mostrarGloboAbajo && <View style={styles.arrowDown} />}
        </Animated.View>
      )}
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
    borderWidth: 2,
    borderColor: '#38bdf8',
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  tooltipWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ffffff',
    marginBottom: -1,
  },
  arrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ffffff',
    marginTop: -1,
  },
  tooltipCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    elevation: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  stepPillText: {
    fontSize: 10.5,
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
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  description: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: '700',
  },
  btnPrimary: {
    flex: 1.3,
    flexDirection: 'row',
    backgroundColor: '#0d6efd',
    paddingVertical: 9,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  btnFinish: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#0d6efd',
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGoScanner: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 9,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGoScannerText: {
    color: '#0d6efd',
    fontSize: 12.5,
    fontWeight: '700',
  },
});