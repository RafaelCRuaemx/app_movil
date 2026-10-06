
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DashboardScreen() {
    //el futuro , qui se hara una peticion fetch a la api de php para traer los datos reales
    const nombreColaborador = "Rafael";

    return (
          <View style={styles.container}>
      {/* Tarjeta de Bienvenida */}
      <View style={styles.card}>
        <Text style={styles.greeting}>Hola, {nombreColaborador}</Text>
        <Text style={styles.subtitle}>Bienvenido a tu panel de control</Text>
      </View>
      {/* Botón principal (Reemplazo de un <button> o <a> en HTML) */}
      <TouchableOpacity 
        style={styles.primaryButton}
        // Así navegamos hacia otra pantalla en React Native
        onPress={() => router.push('/scanner')} 
      >
        <Text style={styles.buttonText}>📷 Escanear Código</Text>
      </TouchableOpacity>
      {/* Resumen rápido */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Entrada Hoy</Text>
          <Text style={styles.statValue}>08:00 AM</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Estado</Text>
          <Text style={[styles.statValue, { color: 'green' }]}>Activo</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ocupa toda la pantalla
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    // Sombra (Elevation en Android, Shadow en iOS)
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row', // Coloca los elementos uno al lado del otro
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: 'white',
    flex: 0.48, // Ocupa un poco menos de la mitad para dejar margen
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  statTitle: {
    fontSize: 14,
    color: '#888',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  }
});
