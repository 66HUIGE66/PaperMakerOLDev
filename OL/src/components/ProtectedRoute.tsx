import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 如果正在加载认证状态，显示加载中
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="正在验证用户身份..." />
      </div>
    );
  }

  // 如果需要认证但用户未登录，重定向到登录页
  if (requireAuth && !isAuthenticated) {
    // 保存当前路径，登录后可以跳转回来
    const from = location.pathname + location.search;
    return <Navigate to={`${redirectTo}?from=${encodeURIComponent(from)}`} replace />;
  }

  // 如果不需要认证或用户已登录，渲染子组件
  return <>{children}</>;
};

export default ProtectedRoute;

