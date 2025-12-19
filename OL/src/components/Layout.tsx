import React, { useState, useMemo } from 'react';
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
  SettingOutlined,
  NotificationOutlined,
  MessageOutlined,
  DashboardOutlined,
  TeamOutlined,
  RocketOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import UserInfo from './UserInfo';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../types/auth';
import AnnouncementPopup from './AnnouncementPopup';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = useMemo(() => {
    const items = [
      { key: '/start-practice', icon: <PlayCircleOutlined />, label: '开始练习' },
      { key: '/practice-records', icon: <TrophyOutlined />, label: '练习记录' },
      { key: '/ai-assistant', icon: <ThunderboltOutlined />, label: 'Ai助手' },
      {
        key: 'personal-center',
        icon: <UserOutlined />,
        label: '个人中心',
        children: [
          { key: '/my-plans', icon: <RocketOutlined />, label: '学习计划' },
          { key: '/my-statistics', icon: <BarChartOutlined />, label: '学习统计' },
          { key: '/my-mistakes', icon: <ExclamationCircleOutlined />, label: '我的错题' },
        ],
      },
      {
        key: 'my-resources',
        icon: <BookOutlined />,
        label: '资源管理',
        children: [
          { key: '/my-questions', icon: <BookOutlined />, label: '我的题库' },
          { key: '/my-papers', icon: <FileTextOutlined />, label: '我的试卷' },
          { key: '/my-subject-knowledge', icon: <NodeIndexOutlined />, label: '我的学科/知识点' },
          { key: '/my-rules', icon: <SettingOutlined />, label: '我的规则' },
          { key: '/my-feedback', icon: <MessageOutlined />, label: '我的反馈' },
        ],
      },
    ];

    // 系统资源 - 所有用户可见
    items.push({
      key: 'system-resources',
      icon: <DatabaseOutlined />,
      label: '资源中心',
      children: [
        { key: '/system-questions', icon: <BookOutlined />, label: '系统题库' },
        { key: '/system-papers', icon: <FileTextOutlined />, label: '系统试卷' },
        { key: '/system-subject-knowledge', icon: <NodeIndexOutlined />, label: '公共学科/知识点' },
        { key: '/system-rules', icon: <SettingOutlined />, label: '公共规则' },
      ],
    });

    // 智能组卷 - 所有用户可见
    items.push({ key: '/generate', icon: <FileTextOutlined />, label: '智能组卷' });

    // 系统管理 - 仅对系统管理员可见
    if (isAdmin(user)) {
      items.push({
        key: 'system-admin',
        icon: <SettingOutlined />,
        label: '系统管理',
        children: [
          { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
          { key: '/admin/announcements', icon: <NotificationOutlined />, label: '公告管理' },
          { key: '/admin/feedbacks', icon: <MessageOutlined />, label: '反馈处理' },
          { key: '/admin/monitor', icon: <DashboardOutlined />, label: '系统监控' },
        ],
      });
    }

    return items;
  }, [user]);

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
          <AnnouncementPopup />
          <BackTop visibilityHeight={100} />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;

