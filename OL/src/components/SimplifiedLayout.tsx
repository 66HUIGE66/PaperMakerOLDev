import React, { useState } from 'react';
import { Layout, Menu, Button, Typography, Space, Avatar, Dropdown } from 'antd';
import { 
  HomeOutlined, 
  FileTextOutlined, 
  PlayCircleOutlined, 
  BookOutlined, 
  SettingOutlined, 
  BarChartOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface SimplifiedLayoutProps {
  children: React.ReactNode;
}

const SimplifiedLayout: React.FC<SimplifiedLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 简化版菜单：所有登录用户都可以使用所有功能
  const menuItems = [
    {
      key: '/home',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/paper-generation',
      icon: <FileTextOutlined />,
      label: '智能组卷',
    },
    {
      key: '/practice',
      icon: <PlayCircleOutlined />,
      label: '练习模式',
    },
    {
      key: '/questions',
      icon: <BookOutlined />,
      label: '题库管理',
    },
    {
      key: '/rules',
      icon: <SettingOutlined />,
      label: '组卷规则',
    },
    {
      key: '/my-content',
      icon: <UserOutlined />,
      label: '我的内容',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: '学习统计',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: '个人资料',
    },
    {
      key: 'settings',
      label: '系统设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: '退出登录',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        // 处理个人资料
        break;
      case 'settings':
        // 处理系统设置
        break;
      case 'logout':
        // 处理退出登录
        break;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)'
        }}
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            {collapsed ? '智能' : '智能组卷系统'}
          </Title>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 'none' }}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff',
          boxShadow: '0 2px 8px 0 rgba(29,35,41,.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
          <Space>
            <Dropdown
              menu={{ 
                items: userMenuItems,
                onClick: handleUserMenuClick 
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>管理员</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ 
          margin: '24px 16px',
          padding: 24,
          background: '#fff',
          minHeight: 280,
          borderRadius: '8px'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default SimplifiedLayout;
