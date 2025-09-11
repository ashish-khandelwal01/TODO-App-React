import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import APIClient from '../../_api/APIClient';

interface Props {
  navigation: any;
  route: any;
}

const SecurityAnswerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { username } = route.params;
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(true);

  useEffect(() => {
    fetchSecurityQuestion();
  }, []);

  const fetchSecurityQuestion = async () => {
    setQuestionLoading(true);
    try {
      const response = await APIClient.getSecurityQuestion(username);
      setSecurityQuestion(response.security_question);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch security question');
      navigation.goBack();
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!securityAnswer.trim()) {
      Alert.alert('Error', 'Please provide an answer');
      return;
    }

    setLoading(true);
    try {
      const response = await APIClient.verifySecurityAnswer(username, securityAnswer);
      
      if (response.success) {
        // Navigate to reset password screen with the token
        navigation.navigate('ResetPassword', { 
          token: response.reset_token,
          username: username 
        });
      } else {
        Alert.alert('Error', 'Incorrect answer. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify answer');
    } finally {
      setLoading(false);
    }
  };

  if (questionLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading security question...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Security Question</Text>
        
        <View style={styles.questionContainer}>
          <Text style={styles.questionLabel}>Please answer your security question:</Text>
          <Text style={styles.question}>{securityQuestion}</Text>
        </View>

        <TextInput
          placeholder="Your answer"
          style={styles.input}
          value={securityAnswer}
          onChangeText={setSecurityAnswer}
          placeholderTextColor="#888"
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Verify Answer</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Forgot Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SecurityAnswerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
    color: '#222',
    textAlign: 'center',
  },
  questionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  questionLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    fontWeight: '500',
  },
  question: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    lineHeight: 24,
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
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    padding: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  });