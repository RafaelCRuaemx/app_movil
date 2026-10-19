import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function NetworkStatusBar() {
  const insets = useSafeAreaInsets();
  const netInfo = useNetInfo();

  const [mostrarBanner, setMostrarBanner] = useState(false);
  const [tipoBanner, setTipoBanner] = useState<'offline' | 'online'>('offline');
  const estabaOffline = useRef(false);

  useEffect(() => {
    // Si todavía está determinando la red al arrancar (null), esperamos
    if (netInfo.isConnected === null) return;

    const sinInternet = netInfo.isConnected === false || netInfo.isInternetReachable === false;

    if (sinInternet) {
      estabaOffline.current = true;
      setTipoBanner('offline');
      setMostrarBanner(true);
    } else if (estabaOffline.current) {
      // Solo mostramos "Conexión restablecida" si realmente se había ido antes
      setTipoBanner('online');
      setMostrarBanner(true);
      estabaOffline.current = false;

      // Ocultar la barra verde automáticamente tras 3 segundos
      const timer = setTimeout(() => {
        setMostrarBanner(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [netInfo.isConnected, netInfo.isInternetReachable]);

  if (!mostrarBanner) return null;

  const isOffline = tipoBanner === 'offline';

  return (
    <View style={[
      styles.banner, 
      { 
        paddingTop: Math.max(insets.top, 8),
        backgroundColor: isOffline ? '#dc2626' : '#16a34a' 
      }
    ]}>
      <Ionicons 
        name={isOffline ? 'cloud-offline-outline' : 'checkmark-circle-outline'} 
        size={16} 
        color="#ffffff" 
        style={{ marginRight: 6 }} 
      />
      <Text style={styles.bannerText}>
        {isOffline 
          ? 'Sin conexión a internet · Funciones limitadas' 
          : 'Conexión restablecida'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    paddingBottom: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  bannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});