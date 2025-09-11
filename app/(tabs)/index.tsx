import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../_contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import SecurityAnswerScreen from './screens/SecurityAnswerScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import TodoScreen from './screens/TodoScreen';
import SubTaskScreen from './screens/SubTaskScreen';
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
              headerTintColor: '#007AFF',
              headerStyle: {
                backgroundColor: '#f0f2f5',
              }
            }} 
          />
        </>
      ) : (
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="ForgotPassword" 
            component={ForgotPasswordScreen} 
            options={{ 
              headerShown: true,
              title: 'Reset Password',
              headerTintColor: '#007AFF',
              headerStyle: {
                backgroundColor: '#f9f9f9',
              }
            }} 
          />
          <Stack.Screen 
            name="SecurityAnswer" 
            component={SecurityAnswerScreen} 
            options={{ 
              headerShown: true,
              title: 'Security Question',
              headerTintColor: '#007AFF',
              headerStyle: {
                backgroundColor: '#f9f9f9',
              }
            }} 
          />
          <Stack.Screen 
            name="ResetPassword" 
            component={ResetPasswordScreen} 
            options={{ 
              headerShown: true,
              title: 'New Password',
              headerTintColor: '#007AFF',
              headerStyle: {
                backgroundColor: '#f9f9f9',
              },
              headerBackVisible: false, // Prevent going back
            }} 
          />
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