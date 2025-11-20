import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Statistic, List, Tag, Space, Typography, Divider } from 'antd';
import { 
  BookOutlined, 
  FileTextOutlined, 
  TrophyOutlined, 
  UserOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface SystemStats {
  totalQuestions: number;
  totalPapers: number;
  totalRules: number;
  totalUsers: number;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  time: string;
  status: string;
}

const SimplifiedHome: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats>({
    totalQuestions: 0,
    totalPapers: 0,
    totalRules: 0,
    totalUsers: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setStats({
        totalQuestions: 1250,
        totalPapers: 45,
        totalRules: 12,
        totalUsers: 89
      });
      
      setRecentActivities([
        { id: 1, type: 'paper', title: 'Java基础测试试卷', time: '2024-01-15 14:30', status: 'completed' },
        { id: 2, type: 'practice', title: '随机练习会话', time: '2024-01-15 13:45', status: 'completed' },
        { id: 3, type: 'rule', title: 'Python进阶规则', time: '2024-01-15 12:20', status: 'created' },
        { id: 4, type: 'question', title: '数据结构题目', time: '2024-01-15 11:15', status: 'added' }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'created': return 'processing';
      case 'added': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'created': return '已创建';
      case 'added': return '已添加';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'paper': return <FileTextOutlined />;
      case 'practice': return <PlayCircleOutlined />;
      case 'rule': return <SettingOutlined />;
      case 'question': return <BookOutlined />;
      default: return <BookOutlined />;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>智能组卷刷题系统</Title>
      <Text type="secondary">基于规则的智能组卷系统，支持多种练习模式</Text>
      
      <Divider />
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="题目总数"
              value={stats.totalQuestions}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="试卷数量"
              value={stats.totalPapers}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="组卷规则"
              value={stats.totalRules}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="用户数量"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 快速操作 */}
        <Col xs={24} lg={12}>
          <Card title="快速操作" extra={<TrophyOutlined />}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                size="large" 
                block
                icon={<PlayCircleOutlined />}
                onClick={() => navigate('/practice')}
              >
                开始练习
              </Button>
              
              <Button 
                size="large" 
                block
                icon={<FileTextOutlined />}
                onClick={() => navigate('/paper-generation')}
              >
                智能组卷
              </Button>
              
              <Button 
                size="large" 
                block
                icon={<BookOutlined />}
                onClick={() => navigate('/questions')}
              >
                题库管理
              </Button>
              
              <Button 
                size="large" 
                block
                icon={<SettingOutlined />}
                onClick={() => navigate('/rules')}
              >
                组卷规则
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 最近活动 */}
        <Col xs={24} lg={12}>
          <Card title="最近活动" extra={<BarChartOutlined />}>
            <List
              loading={loading}
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getTypeIcon(item.type)}
                    title={item.title}
                    description={
                      <Space>
                        <Text type="secondary">{item.time}</Text>
                        <Tag color={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能特色 */}
      <Card title="系统特色" style={{ marginTop: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card size="small" hoverable>
              <Title level={4}>智能组卷</Title>
              <Text type="secondary">
                基于规则的智能组卷算法，支持按难度、题型、知识点等维度自动生成试卷
              </Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" hoverable>
              <Title level={4}>多种练习模式</Title>
              <Text type="secondary">
                支持随机练习、按难度练习、按知识点练习、错题复习等多种练习模式
              </Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" hoverable>
              <Title level={4}>学习统计</Title>
              <Text type="secondary">
                提供详细的学习统计和进度跟踪，帮助用户了解学习效果
              </Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default SimplifiedHome;

