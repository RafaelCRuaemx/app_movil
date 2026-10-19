import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useState } from "react";

export function useBiometrics(){
    const [esCompatible, setEsCompatible] = useState(false);
    const [tieneHuella, setTieneHuella] = useState(false);
    const [loading, setLoading] = useState(false);

    //1. Comprobar si el dispositivo tiene sensor fisico y si el usuario registro huellas 
    const verificarBiometria = useCallback(async () =>{
        try {
            setLoading(true);
            const hardware = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setEsCompatible(hardware);
            setTieneHuella(enrolled);
            return {
                esCompatible : hardware,
                tieneHuella : enrolled
            };
        } catch (e) {
            console.log('error verificando biometria: ',e);
            setEsCompatible(false);
            setTieneHuella(false);
            return {esCompatible:false,
                tieneHuella : false
            };
        } finally{
            setLoading(false);
        }
    } ,[]);


    //2. Disparar el modal nativo de autenticacion con Huella / Face ID
    const autenticar = useCallback(async(
        promptMessage : string = 'Confirma tu identidad',
        options?: {
            cancelLabel?: string;
            disableDeviceFallback?: boolean;
            conHaptics?: boolean;
            conHaptic?: boolean;
        }
    ): Promise<boolean> => {
        try {
            const hardware = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();

            // Si el teléfono no tiene hardware o no tiene huella configurada
            if (!hardware || !enrolled) {
                return false;
            }

            const authResult = await LocalAuthentication.authenticateAsync({
                promptMessage,
                cancelLabel: options?.cancelLabel || 'Cancelar',
                disableDeviceFallback: options?.disableDeviceFallback ?? false,
            });

            const usarHaptic = (options?.conHaptics ?? options?.conHaptic) !== false;

            if (authResult.success) {
                if (usarHaptic) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                return true;
            } else {
                if (usarHaptic) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
                return false;
            }
        } catch (e) {
            console.log('Error en autenticacion biometrica: ', e);
            return false;
        }
    },[] );

    return{
        esCompatible,
        tieneHuella,
        biometriaDisponible : esCompatible && tieneHuella,
        loading,
        verificarBiometria,
        autenticar,
    };
}