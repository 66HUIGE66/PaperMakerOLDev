// API配置文件
// 统一管理API请求配置和跨域设置

import axios from 'axios';

// API基础配置
export const API_CONFIG = {
  // 后端API基础地址
  BASE_URL: 'http://localhost:8080',
  
  // 请求超时时间
  TIMEOUT: 10000,
  
  // 是否允许携带凭证
  WITH_CREDENTIALS: true,
  
  // 默认请求头
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// 创建axios实例
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: API_CONFIG.WITH_CREDENTIALS,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('没有找到token，请求可能失败');
    }
    
    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API响应错误:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    // 处理401未授权
    if (error.response?.status === 401) {
      console.error('认证失败，清除本地存储');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // 如果是练习记录相关的API，提供更详细的错误信息
      if (error.config?.url?.includes('exam-record')) {
        console.error('练习记录API认证失败，用户未登录或token已过期');

        // 创建一个更友好的错误对象，包含认证失败的详细信息
        const authError = new Error('用户未登录');
        authError.response = error.response;
        throw authError;
      }

      // 自动跳转到登录页
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    
    // 处理网络错误
    if (!error.response) {
      console.error('网络错误，请检查后端服务是否启动');
    }
    
    return Promise.reject(error);
  }
);

// 导出常用的HTTP方法
export const api = {
  get: (url: string, config?: any) => apiClient.get(url, config),
  post: (url: string, data?: any) => apiClient.post(url, data),
  put: (url: string, data?: any) => apiClient.put(url, data),
  delete: (url: string) => apiClient.delete(url),
};

export default apiClient;

