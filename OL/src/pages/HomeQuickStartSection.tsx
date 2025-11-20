import React from 'react';
import { Card, Row, Col, Typography, Button } from 'antd';
import { RocketOutlined, BulbOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography as any;

const HomeQuickStartSection: React.FC = () => {
  const navigate = useNavigate();
  const steps = [
    {
      icon: <RocketOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
      title: '开始练习',
      desc: '进入试卷列表开始练习',
      action: () => navigate('/start-practice')
    },
    {
      icon: <BulbOutlined style={{ fontSize: 28, color: '#faad14' }} />,
      title: '智能组卷',
      desc: '使用规则生成试卷，精准匹配学习需求',
      action: () => navigate('/paper-generation')
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
      title: '查看练习记录',
      desc: '复盘错题与分析数据，持续提升',
      action: () => navigate('/practice-records')
    }
  ];

  return (
    <div className="home-section" style={{ marginTop: 40 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Title level={3} className="home-section-title">快速入门</Title>
        <Text type="secondary">按步骤完成从练习到复盘的完整路径</Text>
      </div>
      <Row gutter={[24, 24]}>
        {steps.map((s, i) => (
          <Col xs={24} md={8} key={i}>
            <Card hoverable className="home-step-card" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 12 }}>{s.icon}</div>
              <Title level={4} style={{ marginBottom: 8 }}>{s.title}</Title>
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>{s.desc}</Paragraph>
              <Button type="primary" onClick={s.action} aria-label={s.title}>前往</Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default HomeQuickStartSection;