import { Slot } from 'expo-router';

// Este es el Layout principal de TODA la aplicación.
// Usar <Slot /> significa: "No pongas ningún menú gráfico aquí, 
// solo deja que los archivos y carpetas decidan qué mostrar".
export default function RootLayout() {
  return <Slot />;
}