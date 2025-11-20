import React, { useState, Suspense } from 'react';
import { Typography, Button, Space, Row, Col, Card } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();

  

  const [navigating, setNavigating] = useState<string | null>(null);
  const enableLazy = (import.meta as any).env?.VITE_LAZY_HOME_FEATURES !== 'false';
  const LazyFeaturesSection = enableLazy ? React.lazy(() => import('./HomeFeaturesSection')) : null as any;
  const LazyQuickStartSection = enableLazy ? React.lazy(() => import('./HomeQuickStartSection')) : null as any;
  const LazyStatsSection = enableLazy ? React.lazy(() => import('./HomeStatsSection')) : null as any;

  const go = (path: string, key: string) => {
    setNavigating(key);
    setTimeout(() => {
      navigate(path);
      setNavigating(null);
    }, 200);
  };

  return (
    <div className="fade-in" style={{ padding: 24 }}>
      <div className="home-hero brand-gradient" style={{ textAlign: 'center', marginBottom: 32, padding: '48px 24px', borderRadius: 16 }}>
        <Title level={1} className="home-hero-title">
          智能组卷刷题系统
        </Title>
        <Paragraph className="home-hero-subtitle">
          基于规则的智能组卷与多样化练习模式，助力高效学习
        </Paragraph>
        {/*<Space className="home-cta-group" size="large">*/}
        {/*  <Button type="primary" size="large" onClick={() => go('/practice', 'practice')} loading={navigating === 'practice'}>*/}
        {/*    立即开始*/}
        {/*  </Button>*/}
        {/*  <Button size="large" className="btn-ghost" onClick={() => go('/paper-generation', 'generation')} loading={navigating === 'generation'}>*/}
        {/*    智能组卷*/}
        {/*  </Button>*/}
        {/*</Space>*/}
      </div>

      

      {enableLazy ? (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: 16 }}><Text type="secondary">内容加载中...</Text></div>}>
          {LazyQuickStartSection && <LazyQuickStartSection />}
          {LazyFeaturesSection && <LazyFeaturesSection />}
          {LazyStatsSection && <LazyStatsSection />}
        </Suspense>
      ) : (
        <div className="home-section" style={{ marginTop: 40 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Title level={3} className="home-section-title">系统特色</Title>
            <Text type="secondary">突出核心价值主张与关键行动点</Text>
          </div>
          <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
            <Col xs={24} md={8}>
              <Card className="home-feature-card" hoverable>
                <Title level={4}>智能批卷</Title>
                <Paragraph>
                  支持所有题型的自动评分，答题后立即显示结果和解析
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="home-feature-card" hoverable>
                <Title level={4}>个性化学习</Title>
                <Paragraph>
                  支持多种练习模式，根据你的需求定制学习计划
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="home-feature-card" hoverable>
                <Title level={4}>规则驱动组卷</Title>
                <Paragraph>
                  基于规则的智能组卷，覆盖多知识点组合
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default Home;














