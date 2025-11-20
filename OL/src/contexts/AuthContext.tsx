import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthContextType, AuthState, LoginRequest, RegisterRequest, User } from '../types/auth';
import { authService } from '../services/authService';

// 初始状态
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action类型
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
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

// 创建Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider组件
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初始化时检查本地存储的用户信息
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();
        
        if (user && isAuthenticated) {
          // 验证token有效性
          const isValid = await authService.validateToken();
          if (isValid) {
            dispatch({ type: 'AUTH_SUCCESS', payload: user });
          } else {
            // token无效，清除本地存储
            authService.logout();
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } else {
          // 没有用户登录，设置为未认证状态
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error);
        // 认证失败，设置为未认证状态
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initAuth();
  }, []);

  // 登录
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const user = await authService.login(credentials);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      throw error;
    }
  };

  // 注册
  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const user = await authService.register(userData);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      throw error;
    }
  };

  // 登出
  const logout = async (): Promise<void> => {
    await authService.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  // 清除错误
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

