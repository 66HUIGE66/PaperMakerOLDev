import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { EyeOutlined, BarChartOutlined } from '@ant-design/icons';
import RuleConfigDisplay from '../components/RuleConfigDisplay';

const { Title, Text, Paragraph } = Typography;

const RuleConfigDemo: React.FC = () => {
  // 模拟从OCR图片中提取的配置数据
  const sampleConfig = {
    questionTypes: [
      { type: 'SINGLE_CHOICE', count: 4, score: 5 },
      { type: 'MULTIPLE_CHOICE', count: 2, score: 8 },
      { type: 'FILL_BLANK', count: 2, score: 6 },
      { type: 'TRUE_FALSE', count: 1, score: 3 },
      { type: 'SHORT_ANSWER', count: 1, score: 10 }
    ],
    knowledgePoints: [
      { name: '安全与中间件基础', weight: 20 },
      { name: '数据结构性', weight: 20 },
      { name: '面向对象', weight: 20 },
      { name: '基本数据类型与包装类', weight: 10 },
      { name: '方法定义与调用', weight: 10 }
    ],
    specialRequirements: '考试时间为1分钟，共10道左右',
    duration: 1,
    totalQuestions: 10,
    totalScore: 100
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8 }}>
              <BarChartOutlined /> 规则配置图形化展示
            </Title>
            <Text type="secondary">
              将复杂的JSON配置数据转换为直观、美观的图形化界面
            </Text>
          </div>
          
          <div style={{ backgroundColor: '#f0f5ff', padding: 16, borderRadius: 8 }}>
            <Text strong style={{ color: '#1890ff' }}>原始JSON数据：</Text>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px',
              marginTop: '8px',
              overflow: 'auto',
              maxHeight: '150px'
            }}>
{JSON.stringify(sampleConfig, null, 2)}
            </pre>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: 16 }}>↓ 转换为 ↓</Text>
          </div>

          <div style={{ textAlign: 'center' }}>
            <EyeOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          </div>
        </Space>
      </Card>

      <Card 
        title={
          <Space>
            <BarChartOutlined />
            <Title level={3} style={{ margin: 0 }}>
              图形化配置展示
            </Title>
          </Space>
        }
        style={{ 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: 12
        }}
      >
        <RuleConfigDisplay config={sampleConfig} />
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Title level={4} style={{ marginBottom: 16 }}>功能特点</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ padding: 12, backgroundColor: '#f6ffed', borderRadius: 6 }}>
            <Text strong style={{ color: '#52c41a' }}>✓ 知识点权重可视化</Text>
            <br />
            <Text type="secondary">使用进度条直观显示各知识点权重，不同权重使用不同颜色标识</Text>
          </div>
          
          <div style={{ padding: 12, backgroundColor: '#e6f7ff', borderRadius: 6 }}>
            <Text strong style={{ color: '#1890ff' }}>✓ 题型配置卡片化</Text>
            <br />
            <Text type="secondary">将题型信息以卡片形式展示，包含题目数量、分值和占比</Text>
          </div>
          
          <div style={{ padding: 12, backgroundColor: '#fff7e6', borderRadius: 6 }}>
            <Text strong style={{ color: '#fa8c16' }}>✓ 特殊要求友好显示</Text>
            <br />
            <Text type="secondary">特殊要求以醒目的绿色背景区域展示，易于阅读</Text>
          </div>
          
          <div style={{ padding: 12, backgroundColor: '#f9f0ff', borderRadius: 6 }}>
            <Text strong style={{ color: '#722ed1' }}>✓ 配置概览统计</Text>
            <br />
            <Text type="secondary">提供总题数、总分值、知识点数量等关键统计信息</Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default RuleConfigDemo;