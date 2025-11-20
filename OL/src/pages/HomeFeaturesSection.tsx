import React from 'react';
import { Card, Row, Col, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const HomeFeaturesSection: React.FC = () => {
  return (
    <div className="home-section" style={{ marginTop: 40 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Title level={3} className="home-section-title">系统特色</Title>
        <Paragraph type="secondary">突出核心价值主张与关键行动点</Paragraph>
      </div>
      <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card className="home-feature-card" hoverable>
            <Title level={4}>批量导入</Title>
            <Paragraph>
              支持通过word文档批量导入试题并生成关联学科和知识点
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="home-feature-card" hoverable>
            <Title level={4}>Ai助手</Title>
            <Paragraph>
              根据个人学习情况生成学习计划和总结以及题目解答
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="home-feature-card" hoverable>
            <Title level={4}>规则驱动组卷</Title>
            <Paragraph>
              基于组卷规则智能生成试卷，支持灵活配置
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomeFeaturesSection;