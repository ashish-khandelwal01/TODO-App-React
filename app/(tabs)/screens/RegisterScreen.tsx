import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../_contexts/AuthContext';

const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await register(username, email, password, securityQuestion, securityAnswer);
      if (res.success) {
        navigation.navigate('Login'); // Navigate to login after successful registration
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        placeholder="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="Security Question"
        style={styles.input}
        value={securityQuestion}
        onChangeText={setSecurityQuestion}
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="Security Answer"
        style={styles.input}
        value={securityAnswer}
        onChangeText={setSecurityAnswer}
        placeholderTextColor="#888"
      />

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register</Text>}
      </TouchableOpacity>

      <View style={styles.links}>
        <Text style={styles.linkText} onPress={() => navigation.navigate('Login')}>Back to Login</Text>
      </View>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
    color: '#222',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: '#000',
  },
  btn: {
    backgroundColor: '#28A745',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 14,
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});
