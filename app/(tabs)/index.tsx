import React, { useState, useEffect, useContext, createContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

// Types
interface User {
  id: number;
  email: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, securityQuestion: string, securityAnswer: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Configuration - Update this with your server URL
const API_BASE_URL = 'http://192.168.2.53:5050/api/v1';

// API Helper Class
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

    console.log('Making request to:', `${API_BASE_URL}${endpoint}`);
    console.log('Request config:', JSON.stringify(config, null, 2));


    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(response.headers, null, 2));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Network error');
    }
  }

  static async login(username: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  }

  static async register(email: string, password: string, securityQuestion: string, securityAnswer: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: { 
        email, 
        password, 
        security_question: securityQuestion, 
        security_answer: securityAnswer 
      },
    });
  }

  static async getTasks(): Promise<{ tasks: Task[] }> {
    return this.request('/tasks');
  }

  static async createTask(title: string, description?: string, priority: string = 'medium'): Promise<{ task: Task }> {
    return this.request('/tasks', {
      method: 'POST',
      body: { title, description, priority },
    });
  }

  static async updateTask(taskId: number, updates: Partial<Task>): Promise<{ task: Task }> {
    return this.request(`/tasks/${taskId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  static async completeTask(taskId: number): Promise<void> {
    return this.request(`/tasks/${taskId}/complete`, {
      method: 'POST',
    });
  }

  static async deleteTask(taskId: number): Promise<void> {
    return this.request(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  static async forgotPassword(email: string) {
    return this.request('/forgot_password', {
      method: 'POST',
      body: { email },
    });
  }
}

// Auth Provider Component
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Auth state check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await APIClient.login(email, password);
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true };
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: error.message };
    }
  };

  const register = async (email: string, password: string, securityQuestion: string, securityAnswer: string) => {
    try {
      const response = await APIClient.register(email, password, securityQuestion, securityAnswer);
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true };
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Login Screen Component
const LoginScreen: React.FC<{ onNavigate: (screen: string) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error || 'Unknown error occurred');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.authContainer}>
        <Text style={styles.title}>Todo App</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => onNavigate('register')}
        >
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => onNavigate('forgot')}
        >
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Register Screen Component
const RegisterScreen: React.FC<{ onNavigate: (screen: string) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !securityQuestion || !securityAnswer) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await register(email, password, securityQuestion, securityAnswer);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Registration Failed', result.error || 'Unknown error occurred');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.authContainer}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Todo App today</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="password-new"
        />

        <TextInput
          style={styles.input}
          placeholder="Security Question"
          value={securityQuestion}
          onChangeText={setSecurityQuestion}
        />

        <TextInput
          style={styles.input}
          placeholder="Security Answer"
          value={securityAnswer}
          onChangeText={setSecurityAnswer}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => onNavigate('login')}
        >
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Forgot Password Screen Component
const ForgotPasswordScreen: React.FC<{ onNavigate: (screen: string) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await APIClient.forgotPassword(email);
      Alert.alert('Success', 'Password reset instructions sent to your email');
      onNavigate('login');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.authContainer}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email to reset your password</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Sending...' : 'Send Reset Email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => onNavigate('login')}
        >
          <Text style={styles.linkText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Task Item Component
const TaskItem: React.FC<{
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onComplete: (taskId: number) => void;
}> = ({ task, onUpdate, onDelete, onComplete }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#00aa00';
      default: return '#666';
    }
  };

  const handleComplete = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete(task.id);
  };

  const handleEdit = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate(task);
  };

  const handleDelete = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onDelete(task.id);
  };

  return (
    <View style={[styles.taskItem, task.completed && styles.taskCompleted]}>
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
            {task.title}
          </Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
        </View>
        
        {task.description ? (
          <Text style={[styles.taskDescription, task.completed && styles.taskDescriptionCompleted]}>
            {task.description}
          </Text>
        ) : null}
        
        <View style={styles.taskActions}>
          {!task.completed && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleComplete}
            >
              <Text style={styles.actionButtonText}>✓ Complete</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
          >
            <Text style={styles.actionButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={styles.actionButtonText}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Task Form Modal Component
const TaskFormModal: React.FC<{
  visible: boolean;
  task?: Task | null;
  onClose: () => void;
  onSave: (taskData: { title: string; description: string; priority: string }) => void;
}> = ({ visible, task, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
    }
  }, [task, visible]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
    });
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {task ? 'Edit Task' : 'New Task'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            autoFocus
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter task description (optional)"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityContainer}>
            {(['low', 'medium', 'high'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityOption,
                  priority === p && styles.priorityOptionSelected
                ]}
                onPress={() => setPriority(p)}
              >
                <Text style={[
                  styles.priorityOptionText,
                  priority === p && styles.priorityOptionTextSelected
                ]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Main Todo Screen Component
const TodoScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const { logout, user } = useAuth();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await APIClient.getTasks();
      setTasks(response.tasks || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load tasks: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: { title: string; description: string; priority: string }) => {
    try {
      const response = await APIClient.createTask(taskData.title, taskData.description, taskData.priority);
      setTasks([response.task, ...tasks]);
      setShowTaskForm(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to create task: ' + error.message);
    }
  };

  const handleUpdateTask = async (taskData: { title: string; description: string; priority: string }) => {
    if (!editingTask) return;
    
    try {
      const response = await APIClient.updateTask(editingTask.id, taskData);
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? response.task : task
      ));
      setShowTaskForm(false);
      setEditingTask(null);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update task: ' + error.message);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await APIClient.completeTask(taskId);
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, completed: true } : task
      ));
    } catch (error: any) {
      Alert.alert('Error', 'Failed to complete task: ' + error.message);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await APIClient.deleteTask(taskId);
              setTasks(tasks.filter(task => task.id !== taskId));
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete task: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    return true;
  });

  const openEditTask = async (task: Task) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const openNewTask = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const closeTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>To-Do List</Text>
          <Text style={styles.headerSubtitle}>Welcome back, {user?.username}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onUpdate={openEditTask}
              onDelete={handleDeleteTask}
              onComplete={handleCompleteTask}
            />
          )}
          contentContainerStyle={styles.taskList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                {filter === 'all' ? '📝 No tasks yet' : `📋 No ${filter} tasks`}
              </Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all' ? 'Tap the + button to create your first task' : `Create some ${filter} tasks to see them here`}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openNewTask}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <TaskFormModal
        visible={showTaskForm}
        task={editingTask}
        onClose={closeTaskForm}
        onSave={editingTask ? handleUpdateTask : handleCreateTask}
      />
    </SafeAreaView>
  );
};

// Main App Component
const App: React.FC = () => {
  const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'forgot'>('login');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (user) {
    return <TodoScreen />;
  }

  const renderAuthScreen = () => {
    switch (authScreen) {
      case 'register':
        return <RegisterScreen onNavigate={setAuthScreen} />;
      case 'forgot':
        return <ForgotPasswordScreen onNavigate={setAuthScreen} />;
      default:
        return <LoginScreen onNavigate={setAuthScreen} />;
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      {renderAuthScreen()}
    </>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  authContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    padding: 12,
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff2f0',
  },
  logoutText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    textAlign: 'center',
    color: '#495057',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  taskList: {
    padding: 20,
    paddingBottom: 100,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  taskCompleted: {
    opacity: 0.7,
    backgroundColor: '#f8f9fa',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#868e96',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  priorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 20,
  },
  taskDescriptionCompleted: {
    color: '#adb5bd',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#28a745',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
  },
  emptyText: {
    fontSize: 18,
    color: '#868e96',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalCancel: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalSave: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    marginTop: 16,
  },
  priorityContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  priorityOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priorityOptionText: {
    color: '#495057',
    fontWeight: '600',
    fontSize: 14,
  },
  priorityOptionTextSelected: {
    color: '#fff',
  },
});

// Main App with Provider
const TodoApp: React.FC = () => {
  return (
    <AuthProvider>
      <StatusBar style="dark" backgroundColor="#fff" translucent={false} />
      <App />
    </AuthProvider>
  );
};

export default TodoApp;