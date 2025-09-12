import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const expoConfig = Constants.expoConfig as {
  releaseChannel?: string;
  extra?: {
    API_BASE_URL_DEV?: string;
    API_BASE_URL_PROD?: string;
  };
} | undefined;

const releaseChannel = expoConfig?.releaseChannel;

const isProd = releaseChannel === 'production';

export const API_BASE_URL = isProd
  ? expoConfig!.extra!.API_BASE_URL_PROD
  : expoConfig!.extra!.API_BASE_URL_DEV;


export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Task {
  id: number;
  title: string;
  username?: string;
  priority: number;
  completed: boolean;
  created_at: string;
  user_id?: number;
  parent_task_id?: number | null;
  depth?: number;
  is_subtask?: boolean;
  subtasks?: Task[];
  subtask_count?: number;
  completion_percentage?: number;
  completed_subtask_count?: number;
}

export interface SuggestedTask {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
}

class APIClient {
  private static token: string | null = null;

  /** Load token from AsyncStorage */
  private static async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('token');
    }
    return this.token;
  }

  static setToken(token: string) {
    this.token = token;
    AsyncStorage.setItem('token', token).catch(console.warn);
  }

  static clearToken() {
    this.token = null;
    AsyncStorage.removeItem('token').catch(console.warn);
  }

  /** Central request handler */
  static async request<T>(endpoint: string, options: any = {}): Promise<T> {
    const token = await this.getToken();

    const config: any = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log(`[API] ${config.method || 'GET'} ${API_BASE_URL}${endpoint}`);
      if (config.body) console.log(`[API Body]`, config.body);
      console.log(`API Request: ${API_BASE_URL}`);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || data?.detail || response.statusText;
        throw new Error(errorMessage || `HTTP ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error(`[API ERROR] ${endpoint}`, error.message);
      throw new Error(error.message || 'Network error - check your connection');
    }
  }

  // 🔑 Authentication
  static async login(username: string, password: string) {
    // Login does not require token
    const result = await this.request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: { username, password },
    });

    if (result.token) {
      this.setToken(result.token); // Save token after login
    }
    return result;
  }

  static register(username: string, email: string, password: string, securityQuestion: string, securityAnswer: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: { username, email, password, security_question: securityQuestion, security_answer: securityAnswer },
    });
  }

  // ✅ Tasks
  static getTasks() {
    return this.request('/tasks');
  }

  static getSubTasks(taskId: number) {
    return this.request(`/tasks/${taskId}/subtasks`);
  }

  static getTask(taskId: number) {
    return this.request(`/tasks/${taskId}`);
  }

  static createTask(title: string, priority: 'low' | 'medium' | 'high' = 'medium', parentTaskId?: number, depth?: number) {
    const priorityMap = { low: 1, medium: 2, high: 3 };
    const body: any = { title, priority: priorityMap[priority] };
    if (parentTaskId) body.parent_task_id = parentTaskId;
    if (depth) body.depth = depth;
    return this.request('/tasks', { method: 'POST', body });
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

  // 💡 Suggested Tasks
  static getSuggestedTasks() {
    return this.request('/suggested_tasks');
  }

  // 🔐 Password Recovery
  static forgotPassword(username: string) {
    return this.request('/forgot_password', { method: 'POST', body: { username } });
  }

  static getSecurityQuestion(username: string) {
    return this.request(`/users/${username}/security_question`);
  }

  static verifySecurityAnswer(username: string, answer: string) {
    return this.request('/security_answer/verify', { method: 'POST', body: { username, security_answer: answer } });
  }

  static resetPassword(token: string, newPassword: string) {
    return this.request('/reset_password', { method: 'POST', body: { token, new_password: newPassword } });
  }

  // Markdown Import/Export
  static importMarkdown(markdownContent: string) {
    return this.request('/import_markdown', { method: 'POST', body: { content: markdownContent } });
  }

  static exportTasks() {
    return this.request('/export_tasks');
  }

  static async uploadMarkdownFile(file: any) {
    const token = await this.getToken();
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    return fetch(`${API_BASE_URL}/import_markdown`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
  }
}

export default APIClient;
