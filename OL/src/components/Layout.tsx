import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Button, Space, BackTop } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOutlined,
  FileTextOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ThunderboltOutlined,
  NodeIndexOutlined,
  PlayCircleOutlined,
  DatabaseOutlined,
  TrophyOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons';
import UserInfo from './UserInfo';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/start-practice', icon: <PlayCircleOutlined />, label: '开始练习' },
    { key: '/practice-records', icon: <TrophyOutlined />, label: '练习记录' },
    { key: '/ai-assistant', icon: <ThunderboltOutlined />, label: 'Ai助手' },
    {
      key: 'my-content',
      icon: <UserOutlined />,
      label: '我的内容',
      children: [
        { key: '/my-questions', icon: <BookOutlined />, label: '我的题库' },
        { key: '/my-papers', icon: <FileTextOutlined />, label: '我的试卷' },
        { key: '/my-subject-knowledge', icon: <NodeIndexOutlined />, label: '我的学科/知识点' },
        { key: '/my-rules', icon: <SettingOutlined />, label: '我的规则' },
        { key: '/my-statistics', icon: <BarChartOutlined />, label: '学习统计' },
      ],
    },
    {
      key: 'system-content',
      icon: <DatabaseOutlined />,
      label: '系统内容',
      children: [
        { key: '/system-questions', icon: <BookOutlined />, label: '系统题库' },
        { key: '/system-papers', icon: <FileTextOutlined />, label: '系统试卷' },
        { key: '/system-subject-knowledge', icon: <NodeIndexOutlined />, label: '系统学科/知识点' },
        { key: '/system-rules', icon: <SettingOutlined />, label: '系统规则' },
      ],
    },
    { key: '/generate', icon: <FileTextOutlined />, label: '智能组卷' },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <AntLayout className="app-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        collapsedWidth={80}
        width={220}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          height: '100vh'
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <div className="app-logo">
            {collapsed ? '刷题' : '智能组卷刷题系统'}
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 'none' }}
        />
      </Sider>
      <AntLayout style={{ marginLeft: collapsed ? 80 : 220 }}>
        <Header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
          </div>
          <Space>
            <UserInfo />
          </Space>
        </Header>
        <Content className="app-content">
          {children}
          <BackTop visibilityHeight={100} />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;

