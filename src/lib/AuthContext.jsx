import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({ public_settings: {} }); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();

    const handleMaintenance = (e) => {
      setAuthError({
         type: 'maintenance',
         message: 'Server has gone down for maintenance.'
      });
      setIsLoadingAuth(false);
    };

    const handleAuthExpired = () => {
      setIsAuthenticated(false);
      setAuthError({
        type: 'auth_required',
        message: 'Your session has expired.'
      });
    };

    window.addEventListener('SYSTEM_MAINTENANCE', handleMaintenance);
    window.addEventListener('AUTH_EXPIRED', handleAuthExpired);
    
    return () => {
      window.removeEventListener('SYSTEM_MAINTENANCE', handleMaintenance);
      window.removeEventListener('AUTH_EXPIRED', handleAuthExpired);
    };
  }, []);

  const checkAppState = async () => {
    try {
      setAuthError(null);
      
      // Assume local backend handles the core config if needed
      setAppPublicSettings({ public_settings: {} });
        
      // If we got the app public settings successfully, check if user is authenticated
      const hasToken = localStorage.getItem('token') || localStorage.getItem('mock_token');
      if (hasToken) {
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthError({
        type: 'auth_required',
        message: 'Authentication failed due to network error'
      });
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await apiClient.auth.me();
      if (!currentUser) throw new Error("No user returned");
      
      try {
        const appSettings = await apiClient.entities.AppSettings.list();
        if (appSettings.length > 0 && appSettings[0].maintenance_mode) {
           const roles = currentUser.roles || [];
           const isStaff = roles.includes('owner') || roles.includes('admin') || roles.includes('tech_admin') || currentUser.panels?.includes('master_panel') || currentUser.panels?.includes('technical_panel');
           if (!isStaff) {
              setAuthError({
                 type: 'maintenance',
                 message: appSettings[0].maintenance_message || 'Server is under maintenance. Please try again later.'
              });
              setIsLoadingAuth(false);
              return;
           }
        }
      } catch (e) {
        console.error('Failed to check maintenance mode', e);
      }

      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      
      setAuthError({
        type: 'auth_required',
        message: 'Authentication required'
      });
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('mock_token');
    apiClient.auth.logout();
  };

  const navigateToLogin = () => {
    apiClient.auth.redirectToLogin();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};