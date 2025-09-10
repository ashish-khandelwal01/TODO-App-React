import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import APIClient, { User } from '../_api/APIClient';
import * as Haptics from 'expo-haptics';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, securityQuestion: string, securityAnswer: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuthState(); }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      if (token && userData) setUser(JSON.parse(userData));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await APIClient.login(email, password);
      await AsyncStorage.setItem('token', res.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true };
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: e.message };
    }
  };

  const register = async (email: string, password: string, securityQuestion: string, securityAnswer: string) => {
    try {
      const res = await APIClient.register(email, password, securityQuestion, securityAnswer);
      await AsyncStorage.setItem('token', res.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true };
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: e.message };
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
