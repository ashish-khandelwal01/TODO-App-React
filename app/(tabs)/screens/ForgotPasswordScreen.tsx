import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import APIClient from '../../_api/APIClient';

const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSecurityQuestionFlow = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your Username first');
      return;
    }

    setLoading(true);
    try {
      await APIClient.forgotPassword(username);
      navigation.navigate('SecurityAnswer', { username });
    } catch (error) {
      Alert.alert('Error', 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password</Text>
        
        <Text style={styles.subtitle}>
          Enter your Username and we'll help you reset your password.
        </Text>

        <TextInput 
          placeholder="Username" 
          style={styles.input} 
          value={username} 
          onChangeText={setUsername}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#888"
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.secondaryBtn, loading && styles.disabledBtn]} 
          onPress={handleSecurityQuestionFlow}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#007AFF" size="small" />
          ) : (
            <Text style={styles.secondaryBtnText}>Security Question</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={[styles.backButtonText, loading && styles.disabledText]}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f9f9f9',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    marginBottom: 10,
    color: '#222',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    backgroundColor: '#fff',
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 20,
    fontSize: 16,
    color: '#000',
  },
  primaryBtn: { 
    backgroundColor: '#007AFF', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 20,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryBtnText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  backButton: {
    alignItems: 'center',
    padding: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledText: {
    opacity: 0.5,
  },
});