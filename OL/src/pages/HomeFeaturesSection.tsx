import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { CloudUploadOutlined, RobotOutlined, BlockOutlined } from '@ant-design/icons';
import './HomeFeaturesSection.css'; // Import the new CSS

const { Title, Paragraph, Text } = Typography;

const HomeFeaturesSection: React.FC = () => {
  const features = [
    {
      title: '便捷导入',
      desc: '支持Word文档批量导入，智能解析题目结构，一键扩充您的专属题库',
      icon: <CloudUploadOutlined />,
      className: 'feature-icon-import'
    },
    {
      title: 'AI 助教',
      desc: '私人AI助手提供详细的题目解析和学习建议，哪里不会点哪里',
      icon: <RobotOutlined />,
      className: 'feature-icon-ai'
    },
    {
      title: '规则引擎',
      desc: '强大的组卷规则配置，支持多知识点、多题型组合，灵活应对各类考查需求',
      icon: <BlockOutlined />,
      className: 'feature-icon-rule'
    }
  ];

  return (
    <div className="home-section home-features-section">
      <div className="home-features-header">
        <Title level={2} className="home-section-title">核心特色</Title>
        <Text className="home-section-desc">智能化工具赋能，让教与学都更简单</Text>
      </div>
      <Row gutter={[32, 24]}>
        {features.map((f, i) => (
          <Col xs={24} md={8} key={i}>
            <Card className="feature-card" hoverable>
              <div className={`feature-icon-wrapper ${f.className}`}>
                {f.icon}
              </div>
              <div style={{ textAlign: 'center' }}>
                <Title level={4} className="feature-title">{f.title}</Title>
                <Paragraph type="secondary" className="feature-desc">
                  {f.desc}
                </Paragraph>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default HomeFeaturesSection;