import { apiClient } from '../config/api';
import { LoginRequest, RegisterRequest, AuthResponse, User, LoginResponse } from '../types/auth';

export const authService = {
  // 用户登录
  async login(credentials: LoginRequest): Promise<User> {
    // try {
      const response = await apiClient.post<AuthResponse>('/user/login', 
        new URLSearchParams({
          username: credentials.username,
          password: credentials.password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      console.log("response:" , response);
      if (response.data.code === 200 && response.data.object) {
        const loginResponse = response.data.object as LoginResponse;
        const user = loginResponse.user;
        const token = loginResponse.token;
        
        // 存储用户信息和真正的JWT token
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        
        return user;
      } else {
        throw new Error(response.data.message || '登录失败');
      }
    // } catch (error: any) {
    //   if (error.response?.data?.message) {
    //     throw new Error(error.response.data.message);
    //   }
    //   throw new Error('登录失败，请检查网络连接');
    // }
  },

  // 用户注册
  async register(userData: RegisterRequest): Promise<User> {
    try {
      const response = await apiClient.post<AuthResponse>('/user/create', {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: 'STUDENT', // 默认注册为学生
        status: 'ACTIVE',
      });

      if (response.data.code === 200 && response.data.object) {
        const loginResponse = response.data.object as LoginResponse;
        const user = loginResponse.user;
        const token = loginResponse.token;
        
        // 注册成功后自动登录，存储用户信息和token
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        
        return user;
      } else {
        throw new Error(response.data.message || '注册失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('注册失败，请检查网络连接');
    }
  },

  // 获取当前用户信息
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  },

  // 检查是否已登录
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // 检查是否是旧的模拟token，如果是则清除
    if (token && token.startsWith('mock-token-')) {
      console.log('检测到旧的模拟token，正在清除...');
      // 异步清除，不等待完成
      this.logout().catch(err => console.error('清除旧token失败:', err));
      return false;
    }
    
    return !!(token && user);
  },

  // 登出
  async logout(): Promise<void> {
    try {
      // 调用后端logout接口清除Redis缓存
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await apiClient.post('/user/logout', null, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (error) {
          // 即使后端调用失败，也清除本地存储
          console.error('调用退出登录接口失败:', error);
        }
      }
    } finally {
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // 获取token
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  // 验证token有效性（可选，用于检查token是否过期）
  async validateToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      // 检查是否是旧的模拟token
      if (token.startsWith('mock-token-')) {
        console.log('检测到旧的模拟token，需要重新登录');
        await this.logout();
        return false;
      }

      // 调用后端API验证token
      const response = await apiClient.get('/user/validate-token');
      return response.data.code === 200;
    } catch (error) {
      console.error('Token验证失败:', error);
      // 如果验证失败，清除无效token
      this.logout();
      return false;
    }
  }
};
