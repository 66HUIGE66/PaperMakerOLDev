import React from 'react';
import { Dropdown, Avatar, Button, Space, Typography, message } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const UserInfo: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      message.success('已退出登录');
    } catch (error) {
      console.error('退出登录失败:', error);
      message.error('退出登录失败，请稍后重试');
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleProfile = () => {
    // 这里可以跳转到个人资料页面
    message.info('个人资料功能开发中...');
  };

  const menuItems = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: '个人资料',
      onClick: handleProfile,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  // 如果用户未登录，显示登录按钮
  if (!isAuthenticated || !user) {
    return (
      <Button 
        type="primary" 
        icon={<LoginOutlined />}
        onClick={handleLogin}
        style={{ 
          borderRadius: '6px',
          height: '32px',
          padding: '0 16px'
        }}
      >
        登录
      </Button>
    );
  }

  // 如果用户已登录，显示用户信息下拉菜单
  return (
    <Dropdown
      menu={{ items: menuItems }}
      placement="bottomRight"
      arrow
    >
      <Button type="text" style={{ height: 'auto', padding: '4px 8px' }}>
        <Space>
          <Avatar 
            size="small" 
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#262626' }}>
              {user.username}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {user.role === 'ADMIN' ? '管理员' : 
               user.role === 'TEACHER' ? '教师' : '学生'}
            </Text>
          </div>
        </Space>
      </Button>
    </Dropdown>
  );
};

export default UserInfo;

