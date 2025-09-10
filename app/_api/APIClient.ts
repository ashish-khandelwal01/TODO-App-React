import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.2.53:5050/api/v1';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  created_at: string;
}

class APIClient {
  static async request(endpoint: string, options: any = {}) {
    const token = await AsyncStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      return response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  }

  static login(username: string, password: string) {
    return this.request('/auth/login', { method: 'POST', body: { username, password } });
  }

  static register(email: string, password: string, securityQuestion: string, securityAnswer: string) {
    return this.request('/auth/register', { method: 'POST', body: { email, password, security_question: securityQuestion, security_answer: securityAnswer } });
  }

  static getTasks() {
    return this.request('/tasks');
  }

  static createTask(title: string, description?: string, priority: 'low' | 'medium' | 'high' = 'medium') {
    return this.request('/tasks', { method: 'POST', body: { title, description, priority } });
  }

  static updateTask(taskId: number, updates: Partial<Task>) {
    return this.request(`/tasks/${taskId}`, { method: 'PUT', body: updates });
  }

  static completeTask(taskId: number) {
    return this.request(`/tasks/${taskId}/complete`, { method: 'POST' });
  }

  static deleteTask(taskId: number) {
    return this.request(`/tasks/${taskId}`, { method: 'DELETE' });
  }

  static forgotPassword(email: string) {
    return this.request('/forgot_password', { method: 'POST', body: { email } });
  }
}

export default APIClient;
