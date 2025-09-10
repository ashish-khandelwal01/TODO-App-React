import React from 'react';
import { Slot } from 'expo-router';
import { AuthProvider } from '../_contexts/AuthContext';

const TabsLayout = () => (
  <AuthProvider>
    <Slot />
  </AuthProvider>
);

export default TabsLayout;
