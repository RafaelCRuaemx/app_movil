import { useState, useEffect } from "react";
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { router } from "expo-router";
import { apiPost } from "@/config/api";
import { setCachedPreflight } from "@/config/preflightCache";
import { useBiometrics } from "./useBiometrics";
import { useLocation } from "@/hooks/useLocation";
import * as Haptics from "expo-haptics";

export function useAuth(){
    const {autenticar, verificarBiometria} = useBiometrics();
    const {obtenerUbicacion} = useLocation();

    //Estados del formulario 
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    //Estados de biometria y vinculacion 1 a 1 
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [hasSavedDeviceKey, setHasSavedDeviceKey] = useState(false);
    const [tempAuthData, setTempAuthData] = useState<any>(null);
    const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);

    //Estados para 2fa 
    const [showTotpModal, setShowTotpModal] = useState(false);
    const [totpCode, setTotpCode] = useState('');
    const [totpUserId, setTotpUserId]=useState<number | null>(null);

    useEffect(() =>{
        checkBiometrics();
    },[]);

    //1.Verificar soporte biometrico y si ya existe llave guardada
    const checkBiometrics = async () =>{
        const {esCompatible, tieneHuella} = await verificarBiometria();
        setIsBiometricSupported(esCompatible && tieneHuella);

        const savedKey = await SecureStore.getItemAsync('deviceKey');
        if(savedKey){
            setHasSavedDeviceKey(true);
            setTimeout(() =>{
                handleBiometricLogin(savedKey);
            }, 500);
        }
    };

    //2. Utilidades para identificar el dipositivo 
    const generateDeviceKey = () =>{
        return(
            'movil_' + Date.now().toString(36)+Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15)
        );
    };

    const getDeviceDisplayName = () =>{
        const brand = Device.brand || Device.manufacturer || '';
        const model = Device.modelName || Device.deviceName || 'Dispositivo';
        const os = Platform.OS === 'ios' ? 'iOS' : 'Android';
        const osVersion = Device.osVersion ? ` ${Device.osVersion}` : '';
        const full = `${brand} ${model} (${os}${osVersion})`.trim();
        return full.length > 0 ? full : Platform.OS === 'ios' ? 'iPhone' : 'Android';
    };

    //3.Guarda sesion y navegar al scanner 
    const finalizaLogin = async (user: any) => {
        await SecureStore.setItemAsync('userToken', 'active_session');
        await SecureStore.setItemAsync('userData', JSON.stringify(user));
        router.replace('/scanner' as any);
    };

    //4.Inicio de session con huella + Pre vuelo anticipado en paralelo 
    const handleBiometricLogin = async (KeyOverride?: string) =>{
        const locPromise = obtenerUbicacion();

        try{
            const ok = await autenticar('Usa tu huella para iniciar sesión', {
                disableDeviceFallback: true,
                conHaptic: false,
            });

            if(ok){
                setLoading(true);
                const deviceKey = KeyOverride && typeof KeyOverride === 'string'
                    ? KeyOverride
                    : await SecureStore.getItemAsync('deviceKey');

                const [loginRes, loc] = await Promise.all([
                    apiPost('login_biometrico_app.php', { device_key: deviceKey }),
                    locPromise,
                ]);

                if(loginRes.success){
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    await SecureStore.setItemAsync('userToken', 'active_session');
                    await SecureStore.setItemAsync('userData', JSON.stringify(loginRes.user));

                    //pre-vuelo anticipado para que /scanner abra en 0ms
                    if(loc && loginRes.user?.id){
                        try{
                            const preflightRes = await apiPost('validar_prevuelo_app.php', {
                                usuario_id : loginRes.user.id,
                                lat: loc.latitude,
                                lon: loc.longitude,
                            });

                            setCachedPreflight({
                                timestamp : Date.now(),
                                location: loc,
                                preflightRes,
                            });
                        }catch(errPrevuelo){
                            console.log('error preflight anticipado:', errPrevuelo);
                        }
                    }
                    router.replace('/scanner' as any);
                }else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    Alert.alert('Dispositivo no reconocido', loginRes.message);
                    await SecureStore.deleteItemAsync('deviceKey');
                    setHasSavedDeviceKey(false);
                }
            }
        }catch(error: any){
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error?.message || 'No se pudo conectar al servidor.');
        } finally{
            setLoading(false);
        }
    };

    //5.Inicio de session normal (correo y contraseña)
    const handleNormalLogin = async () => {
        if (!correo || !password){
            Alert.alert('Aviso', 'Por favor ingresa tu correo y contraseña.');
            return;
        }

        setLoading(true);
        try{
            const data = await apiPost('login_app.php', { correo, password });

            if (data.success){
                if(data.requiere_2fa){
                    setTotpUserId(data.usuario_id);
                    setTotpCode('');
                    setShowTotpModal(true);
                    return;
                }

                if(!isBiometricSupported){
                    Alert.alert('Sensor biométrico no detectado', 'Para la seguridad del checador de asistencia, este dispositivo requiere tener sensor de huella dactilar o Face ID activo.');
                    return;
                }

                setTempAuthData({ user: data.user, email: correo, pass: password });
                setShowBiometricPrompt(true);
            }else {
                Alert.alert('Acceso Denegado', data.message || 'Error desconocido.');
            }
        } catch (error: any) {
            Alert.alert('Error de red', error?.message || 'No se pudo conectar con el servidor.');
        } finally{
            setLoading(false);
        }
    };

    //6. Verificacion de codigo 2FA 
    const handleVerificarTotp = async () =>{
        if(totpCode.trim().length !== 6){
            Alert.alert('Aviso', 'El código de Google Authenticator debe tener exactamente 6 dígitos.');
            return;
        }

        setLoading(true);
        try{
            const data = await apiPost('verificar_2fa_app.php', {
                usuario_id: totpUserId,
                codigo_totp: totpCode.trim(),
            });

            if(data.success){
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setShowTotpModal(false);
                setTotpCode('');
                finalizaLogin(data.user);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Código incorrecto', data.message || 'El código no es válido o ha expirado.');
            }
        } catch (error: any){
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error de conexión', error?.message || 'No se pudo verificar el código con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    //7. Vinculacion de dipositivo 1 a 1
     const linkDevice = async (user: any, email: string, pass: string) => {
    try {
      const ok = await autenticar('Confirma tu huella para vincular este equipo exclusivamente a tu cuenta', {
        disableDeviceFallback: true,
      });
      if (ok) {
        setLoading(true);
        const newDeviceKey = generateDeviceKey();
        const deviceName = getDeviceDisplayName();
        const data = await apiPost('registrar_dispositivo_app.php', {
          correo: email,
          password: pass,
          device_key: newDeviceKey,
          nombre_device: deviceName,
        });
        if (data.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await SecureStore.setItemAsync('deviceKey', newDeviceKey);
          setHasSavedDeviceKey(true);
          Alert.alert(
            '¡Dispositivo Vinculado!',
            `Tu equipo (${deviceName}) ha quedado registrado exitosamente como tu dispositivo oficial de asistencia.`
          );
          finalizaLogin(data.user || user);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('No se pudo vincular', data.message || 'Error al vincular el dispositivo.');
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Cancelado', 'Debes confirmar tu huella para vincular este teléfono.');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo conectar con el servidor al vincular el dispositivo.');
    } finally {
      setLoading(false);
    }
  };
  const confirmarVinculacion = () => {
    setShowBiometricPrompt(false);
    if (tempAuthData) {
      linkDevice(tempAuthData.user, tempAuthData.email, tempAuthData.pass);
    }
  };
  const cancelarVinculacion = () => {
    setShowBiometricPrompt(false);
    setTempAuthData(null);
    Alert.alert(
      'Vinculación Requerida',
      'Por seguridad institucional, es obligatorio vincular tu huella para poder utilizar el checador en este dispositivo.'
    );
  };
  const cerrarTotpModal = () => {
    setShowTotpModal(false);
    setTotpCode('');
  };
  return {
    correo,
    setCorreo,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    hasSavedDeviceKey,
    showBiometricPrompt,
    showTotpModal,
    totpCode,
    setTotpCode,
    handleBiometricLogin,
    handleNormalLogin,
    handleVerificarTotp,
    confirmarVinculacion,
    cancelarVinculacion,
    cerrarTotpModal,
  };
}



