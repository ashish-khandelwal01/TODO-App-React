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
      console.log('API Request:', endpoint, config);
      console.log('API Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          
          // Your backend returns errors in format: {'error': 'message'}
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (jsonError) {
          console.log('Failed to parse error as JSON:', jsonError);
          try {
            const errorText = await response.text();
            console.log('Error response text:', errorText);
            if (errorText.trim()) {
              errorMessage = errorText;
            }
          } catch (textError) {
            console.log('Could not parse error response:', textError);
          }
        }
        
        console.log('Final error message:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log('API Response Data:', responseData);
      return responseData;
    } catch (error: any) {
      console.log('API Request Error:', error);
      // If it's already our custom error, re-throw it
      if (error.message && !error.message.includes('Network request failed')) {
        throw error;
      }
      // Otherwise, it's likely a network error
      throw new Error(error.message || 'Network error - please check your connection');
    }
  }

  // Authentication APIs
  static login(username: string, password: string) {
    return this.request('/auth/login', { method: 'POST', body: { username, password } });
  }

  static register(username: string, email: string, password: string, securityQuestion: string, securityAnswer: string) {
    return this.request('/auth/register', { 
      method: 'POST', 
      body: { username, email, password, security_question: securityQuestion, security_answer: securityAnswer } 
    });
  }

  // Task Management APIs
  static getTasks() {
    return this.request('/tasks');
  }

  static getTask(taskId: number) {
    return this.request(`/tasks/${taskId}`);
  }

  static createTask(title: string, priority: 'low' | 'medium' | 'high' = 'medium', parentTaskId?: number, depth?: number) {
    const priorityMap = {
      'low': 1,
      'medium': 2, 
      'high': 3
    };
    
    const body: any = { 
      title,
      priority: priorityMap[priority]
    };
    
    if (parentTaskId) {
      body.parent_task_id = parentTaskId;
    }

    if (depth) {
      body.depth = depth;
    }
    
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

  // Suggested Tasks API
  static getSuggestedTasks() {
    return this.request('/suggested_tasks');
  }

  // Password Recovery APIs
  static forgotPassword(username: string) {
    return this.request('/forgot_password', { method: 'POST', body: { username } });
  }

  static getSecurityQuestion(username: string) {
    return this.request(`/users/${username}/security_question`);
  }

  static verifySecurityAnswer(username: string, answer: string) {
    return this.request('/security_answer/verify', { 
      method: 'POST', 
      body: { username, security_answer: answer } 
    });
  }

  static resetPassword(token: string, newPassword: string) {
    return this.request('/reset_password', { 
      method: 'POST', 
      body: { token, new_password: newPassword } 
    });
  }

  // Import/Export APIs
  static importMarkdown(markdownContent: string) {
    return this.request('/import_markdown', { 
      method: 'POST', 
      body: { markdown_content: markdownContent } 
    });
  }

  static exportTasks(format: 'json' | 'markdown' | 'csv' = 'json') {
    return this.request(`/export_tasks?format=${format}`);
  }

  // File upload for markdown import
  static uploadMarkdownFile(file: any) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/import_markdown', { 
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData
    });
  }
}

export default APIClient;