import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import APIClient from '../../_api/APIClient';

const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await APIClient.forgotPassword(email);
      Alert.alert('Success', 'Password reset link sent!');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} />
      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff"/> : <Text style={{color:'#fff'}}>Submit</Text>}
      </TouchableOpacity>
      <Text onPress={() => navigation.goBack()} style={{marginTop:12}}>Back to Login</Text>
    </View>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:20 },
  title: { fontSize:24, fontWeight:'700', marginBottom:20 },
  input: { borderWidth:1, borderColor:'#ccc', padding:10, borderRadius:8, marginBottom:12 },
  btn: { backgroundColor:'#007AFF', padding:12, borderRadius:8, alignItems:'center', marginBottom:12 }
});
