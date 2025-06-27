import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, Card, Text, ActivityIndicator } from 'react-native-paper';
import { runNetworkDiagnostics } from '@/utils/test-formdata-native';

export function NetworkDiagnostics() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // Interceptar console.log para mostrar en pantalla
  const originalLog = console.log;
  const originalError = console.error;

  const startDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    setLogs([]);

    // Capturar logs
    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [...prev, args.join(' ')]);
    };

    console.error = (...args) => {
      originalError(...args);
      setLogs(prev => [...prev, `ERROR: ${args.join(' ')}`]);
    };

    try {
      const diagnosticResults = await runNetworkDiagnostics();
      setResults(diagnosticResults);
    } catch (error: any) {
      setLogs(prev => [...prev, `Error fatal: ${error.message}`]);
    } finally {
      // Restaurar console
      console.log = originalLog;
      console.error = originalError;
      setIsRunning(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Diagnóstico de Red" />
        <Card.Content>
          <Text variant="bodyMedium" style={styles.description}>
            Esta herramienta prueba la conectividad con el servidor remoto
            y diagnostica problemas con FormData en React Native.
          </Text>
          
          <Button
            mode="contained"
            onPress={startDiagnostics}
            disabled={isRunning}
            style={styles.button}
          >
            {isRunning ? 'Ejecutando pruebas...' : 'Iniciar Diagnóstico'}
          </Button>

          {isRunning && (
            <ActivityIndicator 
              animating={true} 
              size="large" 
              style={styles.loader}
            />
          )}
        </Card.Content>
      </Card>

      {results.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="Resultados" />
          <Card.Content>
            {results.map((result, index) => (
              <View key={index} style={styles.result}>
                <Text variant="titleMedium">
                  {result.test}: {result.success ? '✅' : '❌'}
                </Text>
                {!result.success && (
                  <Text variant="bodySmall" style={styles.error}>
                    {result.error}
                  </Text>
                )}
                {result.response && (
                  <Text variant="bodySmall" style={styles.response}>
                    Respuesta: {result.response.substring(0, 100)}...
                  </Text>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {logs.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="Logs Detallados" />
          <Card.Content>
            <ScrollView style={styles.logsContainer}>
              {logs.map((log, index) => (
                <Text 
                  key={index} 
                  variant="labelSmall" 
                  style={[
                    styles.log,
                    log.startsWith('ERROR') && styles.errorLog
                  ]}
                >
                  {log}
                </Text>
              ))}
            </ScrollView>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  loader: {
    marginTop: 16,
  },
  result: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  error: {
    color: '#d32f2f',
    marginTop: 4,
  },
  response: {
    color: '#666',
    marginTop: 4,
  },
  logsContainer: {
    maxHeight: 300,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  log: {
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 16,
  },
  errorLog: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
});