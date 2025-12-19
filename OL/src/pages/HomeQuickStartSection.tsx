import React from 'react';
import { Card, Row, Col, Typography, Button } from 'antd';
import { RocketOutlined, BulbOutlined, CheckCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography as any;

const HomeQuickStartSection: React.FC = () => {
  const navigate = useNavigate();
  const steps = [
    {
      icon: <RocketOutlined />,
      color: '#1890ff',
      bg: '#e6f7ff',
      title: '开始练习',
      desc: '浏览试卷库，开启您的练习挑战',
      action: () => navigate('/start-practice')
    },
    {
      icon: <BulbOutlined />,
      color: '#faad14',
      bg: '#fff7e6',
      title: '智能组卷',
      desc: '定制专属试卷，精准匹配需求',
      action: () => navigate('/paper-generation')
    },
    {
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      bg: '#f6ffed',
      title: '学习档案',
      desc: '追踪练习记录，见证每一次进步',
      action: () => navigate('/practice-records')
    }
  ];

  return (
    <div className="home-section">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2} className="home-section-title">快速开始</Title>
        <Text className="home-section-desc">三步构建您的完整学习闭环</Text>
      </div>
      <Row gutter={[32, 32]}>
        {steps.map((s, i) => (
          <Col xs={24} md={8} key={i}>
            <Card hoverable className="feature-card" style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="feature-icon-wrapper" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <Title level={4} style={{ marginBottom: 12 }}>{s.title}</Title>
              <Paragraph type="secondary" style={{ marginBottom: 24, padding: '0 20px' }}>
                {s.desc}
              </Paragraph>
              <Button
                type="primary"
                shape="round"
                ghost
                onClick={s.action}
                style={{ borderColor: s.color, color: s.color }}
              >
                前往 <ArrowRightOutlined />
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default HomeQuickStartSection;