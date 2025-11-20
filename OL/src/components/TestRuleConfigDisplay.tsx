import React from 'react';
import { Card, Typography, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import RuleConfigDisplay from '../components/RuleConfigDisplay';

const { Title, Text } = Typography;

// 测试组件
const TestRuleConfigDisplay: React.FC = () => {
  // 测试数据 - 基于OCR图片中的信息
  const testConfig = {
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
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>规则配置图形化展示测试</Title>
          <Text type="secondary">将原始JSON数据转换为直观的图形化界面</Text>
        </div>
      </Card>

      <Card 
        title="Java练习卷 - 详细配置信息"
        style={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8
        }}
      >
        <RuleConfigDisplay config={testConfig} />
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Title level={4}>对比展示</Title>
        <Text type="secondary">原始JSON格式：</Text>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '200px',
          fontSize: '12px',
          marginTop: '8px'
        }}>
{JSON.stringify(testConfig, null, 2)}
        </pre>
      </Card>
    </div>
  );
};

export default TestRuleConfigDisplay;