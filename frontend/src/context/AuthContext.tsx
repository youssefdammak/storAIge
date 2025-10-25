import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authAPI, authStorage } from '../utils/api.ts';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_FINISH' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_FINISH':
      return {
        ...state,
        isLoading: false,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

// Context
const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  refreshToken: () => Promise<boolean>;
} | undefined>(undefined);

// Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = authStorage.getToken();
      const user = authStorage.getUser();
      
      if (token && user) {
        // Check if token is still valid by making a test request
        try {
          const response = await authAPI.getProfile();
          if (response.success && response.data) {
            // Token is valid, update user data
            authStorage.setUser(response.data.user);
            
            // If a refreshed token is provided, store it (sliding expiration)
            if (response.data.token) {
              authStorage.setToken(response.data.token);
            }
            
            dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
          } else {
            // Token invalid, clear storage
            authStorage.clear();
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } catch (error) {
          // Token invalid or network error, clear storage
          authStorage.clear();
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    };

    initializeAuth();

    // Set up periodic token validation (every 1 hour)
    const tokenCheckInterval = setInterval(async () => {
      const token = authStorage.getToken();
      if (token && state.isAuthenticated) {
        try {
          const response = await authAPI.getProfile();
          
          // If successful and a refreshed token is provided, store it
          if (response.success && response.data?.token) {
            authStorage.setToken(response.data.token);
          }
        } catch (error) {
          // Token expired, logout user
          authStorage.clear();
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(tokenCheckInterval);
  }, [state.isAuthenticated]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.success && response.data) {
        // Store token and user data
        authStorage.setToken(response.data.token);
        authStorage.setUser(response.data.user);
        
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
        return true;
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.message });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return false;
    }
  }, []);

  // Signup function
  const signup = useCallback(async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const response = await authAPI.signup({ name, email, password });
      
      if (response.success && response.data) {
        return true;
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.message });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    authStorage.clear();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Refresh token function - call this on important user actions
  const refreshToken = useCallback(async () => {
    const token = authStorage.getToken();
    if (token && state.isAuthenticated) {
      try {
        const response = await authAPI.getProfile();
        if (response.success && response.data?.token) {
          authStorage.setToken(response.data.token);
          return true;
        }
      } catch (error) {
        // Token invalid, logout user
        authStorage.clear();
        dispatch({ type: 'AUTH_LOGOUT' });
        return false;
      }
    }
    return false;
  }, [state.isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      state,
      dispatch,
      login,
      signup,
      logout,
      clearError,
      refreshToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
