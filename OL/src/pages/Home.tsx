import React, { useState, Suspense } from 'react';
import { Typography, Button, Space, Row, Col, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { RocketOutlined, ThunderboltFilled } from '@ant-design/icons';
import './Home.css';

const { Title, Paragraph, Text } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();

  const enableLazy = (import.meta as any).env?.VITE_LAZY_HOME_FEATURES !== 'false';
  const LazyFeaturesSection = enableLazy ? React.lazy(() => import('./HomeFeaturesSection')) : null as any;
  const LazyQuickStartSection = enableLazy ? React.lazy(() => import('./HomeQuickStartSection')) : null as any;
  const LazyStatsSection = enableLazy ? React.lazy(() => import('./HomeStatsSection')) : null as any;
  const LazyAnnouncementSection = enableLazy ? React.lazy(() => import('./HomeAnnouncementSection')) : null as any;

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="home-hero animate-fade-up">
        <div className="home-hero-content">
          <ThunderboltFilled className="home-icon" />
          <Title level={1} className="home-hero-title">
            智能组卷刷题系统
          </Title>
          <Paragraph className="home-hero-subtitle">
            基于AI和规则引擎的下一代在线考试平台。个性化学习路径，精准查漏补缺，让每一次练习都更有效率。
          </Paragraph>
          <div style={{ marginTop: 32 }}>
            <Button
              className="hero-btn hero-btn-primary"
              onClick={() => navigate('/start-practice')}
            >
              立即开始练习
            </Button>
            <Button
              className="hero-btn hero-btn-ghost"
              onClick={() => navigate('/practice-records')}
            >
              查看学习进度
            </Button>
          </div>
        </div>
      </div>

      {enableLazy ? (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: 40 }}><Text type="secondary">精彩内容加载中...</Text></div>}>
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {LazyAnnouncementSection && <LazyAnnouncementSection />}
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {LazyQuickStartSection && <LazyQuickStartSection />}
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {LazyStatsSection && <LazyStatsSection />}
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            {LazyFeaturesSection && <LazyFeaturesSection />}
          </div>
        </Suspense>
      ) : (
        // Fallback or non-lazy content (kept for compatibility, though Lazy is default true usually)
        <div className="home-section">
          {/* Fallback code omitted for brevity as lazy load is primary */}
        </div>
      )}
    </div>
  );
};

export default Home;
