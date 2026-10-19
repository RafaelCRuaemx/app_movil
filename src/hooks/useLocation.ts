import * as Location from 'expo-location';
import { useCallback, useState } from "react";
import { Alert, Linking } from "react-native";

//1. estructura limpia de las cordenadas que necesitan Home Office y el Escaner
export interface Coordenadas{
    latitude: number;
    longitude: number;
    accuracy: number |null;
}

export function useLocation(){
    const [coordenadas, setCoordenadas]=useState<Coordenadas | null> (null);
    const[loading, setLoading]=useState(false);
    const[error, setError] = useState<string |null>(null);

    //2 funcion para verificar o solicitar permisos en el telefono
    const verificarPermisos = useCallback(async (solicitarSiFalta = true): Promise<boolean> =>{
        try {
            let {status}=await Location.getForegroundPermissionsAsync();
            if (status !== 'granted' && solicitarSiFalta) {
                const req = await Location.requestForegroundPermissionsAsync();
                status = req.status;
            }
            return status === 'granted';
        } catch (e: any) {
            console.log('Error al consultar permisos de ubicacion:', e);
            return false;
        }
    }, []);

    //3. funcion principal para obtener coordenadas (con optimizacion de velocidad)
    const obtenerUbicacion = useCallback(async (): Promise<Coordenadas|null> =>{
        setLoading(true);
        setError(null);
        try{
            const tienePermiso = await verificarPermisos(true);
            if (!tienePermiso) {
                setError('Permiso de ubicacion denegado. Es obligatorio para validar el perimetro de asistencia.');
                //
                Alert.alert('Ubicacion REquerida', 'Para vliadar el primetro de asisitencia necesitas activar el permiso de ubicacion en los ajustes de tu telefono', 
                    [{
                        text: 'Cancelar',
                        style : 'cancel'
                    }, {
                        text : 'Abrir configuracion', onPress: ()=> Linking.openSettings()
                    }]
                );
                setLoading(false);
                return null;
            }

            //Optimizacion: Intentamos primero a ultima conocida para respuesta en 0 segundos
            let loc = await Location.getLastKnownPositionAsync();

            if(!loc || Date.now() - loc.timestamp > 30000){
                loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced});
            }
            // true || para realizar pruebas .
            if (loc?.mocked) {
                setError('Se detectó el uso de una ubicación simulada');
                Alert.alert(
                    'Seguridad Institucional',
                    'Se ha detectado una aplicación de simulación de ubicación. Desactívala para poder registrar tu asistencia.'
                );
                return null;
            }

            if (loc?.coords) {
                const coords: Coordenadas = {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    accuracy: loc.coords.accuracy ?? null,
                };
                setCoordenadas(coords);
                return coords;
            }

            setError('No fue posible determinar la posición GPS.');
            return null;
        } catch (err: any) {
            console.log('Error obtenido GPS:', err);
            setError('Error al obtener ubicacion: ' + (err?.message || 'GPS no disponible'));
            return null;
        } finally {
            setLoading(false);
        }
    }, [verificarPermisos]);
    
    return{
        coordenadas,
        loading,
        error,
        obtenerUbicacion,
        verificarPermisos,
    }
}