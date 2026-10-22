// Purpose: Root application component displaying the MiniLedger initial screen, branding, and foundation status.
// Imported by: index.ts

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Renders the main container with the MiniLedger application header and welcome message
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>MiniLedger</Text>
      <Text style={styles.subtitle}>Personal Loan Tracking</Text>
      <Text style={styles.caption}>Phase 0 Foundation Ready</Text>
      <StatusBar style="auto" />
    </View>
  );
}

// Layout and typography styles for the root screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 16,
  },
  caption: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '500',
  },
});
