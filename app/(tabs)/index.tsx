import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../_contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import TodoScreen from './screens/TodoScreen';
import SubTaskScreen from './screens/SubTaskScreen'; // Add this import
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen 
            name="Todo" 
            component={TodoScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="SubTaskScreen" 
            component={SubTaskScreen} 
            options={{ 
              headerShown: true,
              title: 'Subtasks',
              headerTintColor: '#007AFF'
            }} 
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};

const App = () => <AppNavigator />;

export default App;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
});