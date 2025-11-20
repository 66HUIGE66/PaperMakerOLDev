import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Row, 
  Col, 
  Statistic, 
  List, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Progress,
  Table,
  Modal,
  message,
  Empty
} from 'antd';
import { 
  BookOutlined, 
  TrophyOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarOutlined,
  BarChartOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface PracticeStats {
  totalSessions: number;
  completedSessions: number;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  totalTime: number;
}

interface MistakeStats {
  totalMistakes: number;
  masteredMistakes: number;
  unmasteredMistakes: number;
  averageReviewCount: number;
}

interface PracticeSession {
  id: number;
  sessionName: string;
  practiceType: string;
  subject: string;
  questionCount: number;
  score: number;
  status: string;
  startTime: string;
  endTime: string;
}

interface UserMistake {
  id: number;
  questionId: number;
  questionTitle: string;
  subject: string;
  knowledgePoint: string;
  wrongAnswer: string;
  reviewCount: number;
  isMastered: boolean;
  createdAt: string;
}

interface FavoriteQuestion {
  id: number;
  title: string;
  type: string;
  difficulty: string;
  subject: string;
  knowledgePoint: string;
}

const MyContent: React.FC = () => {
  const [practiceStats, setPracticeStats] = useState<PracticeStats>({
    totalSessions: 0,
    completedSessions: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    averageScore: 0,
    totalTime: 0
  });
  
  const [mistakeStats, setMistakeStats] = useState<MistakeStats>({
    totalMistakes: 0,
    masteredMistakes: 0,
    unmasteredMistakes: 0,
    averageReviewCount: 0
  });
  
  const [practiceHistory, setPracticeHistory] = useState<PracticeSession[]>([]);
  const [mistakes, setMistakes] = useState<UserMistake[]>([]);
  const [favorites, setFavorites] = useState<FavoriteQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadMyContent();
  }, []);

  const loadMyContent = async () => {
    setLoading(true);
    
    // 模拟数据加载
    setTimeout(() => {
      setPracticeStats({
        totalSessions: 15,
        completedSessions: 12,
        totalQuestions: 150,
        correctAnswers: 120,
        averageScore: 80,
        totalTime: 1800
      });
      
      setMistakeStats({
        totalMistakes: 25,
        masteredMistakes: 15,
        unmasteredMistakes: 10,
        averageReviewCount: 2.5
      });
      
      setPracticeHistory([
        {
          id: 1,
          sessionName: 'Java基础练习',
          practiceType: 'random',
          subject: 'Java编程',
          questionCount: 10,
          score: 80,
          status: 'COMPLETED',
          startTime: '2024-01-15 14:30',
          endTime: '2024-01-15 15:00'
        },
        {
          id: 2,
          sessionName: 'Python进阶练习',
          practiceType: 'by_difficulty',
          subject: 'Python编程',
          questionCount: 15,
          score: 75,
          status: 'COMPLETED',
          startTime: '2024-01-14 16:20',
          endTime: '2024-01-14 17:05'
        }
      ]);
      
      setMistakes([
        {
          id: 1,
          questionId: 1,
          questionTitle: 'Java中，以下哪个关键字用于定义常量？',
          subject: 'Java编程',
          knowledgePoint: 'Java基础',
          wrongAnswer: 'A',
          reviewCount: 2,
          isMastered: false,
          createdAt: '2024-01-15'
        },
        {
          id: 2,
          questionId: 2,
          questionTitle: '以下哪个是Java的基本数据类型？',
          subject: 'Java编程',
          knowledgePoint: 'Java基础',
          wrongAnswer: 'B,D',
          reviewCount: 3,
          isMastered: true,
          createdAt: '2024-01-14'
        }
      ]);
      
      setFavorites([
        {
          id: 1,
          title: 'Java中，以下哪个关键字用于定义常量？',
          type: 'SINGLE_CHOICE',
          difficulty: 'EASY',
          subject: 'Java编程',
          knowledgePoint: 'Java基础'
        },
        {
          id: 2,
          title: '请简述Java中抽象类和接口的区别。',
          type: 'SHORT_ANSWER',
          difficulty: 'HARD',
          subject: 'Java编程',
          knowledgePoint: 'Java基础'
        }
      ]);
      
      setLoading(false);
    }, 1000);
  };

  const handleMarkAsMastered = (mistakeId: number) => {
    Modal.confirm({
      title: '确认标记为已掌握',
      content: '确定要将此错题标记为已掌握吗？',
      onOk: () => {
        setMistakes(prev => prev.map(mistake => 
          mistake.id === mistakeId 
            ? { ...mistake, isMastered: true }
            : mistake
        ));
        message.success('已标记为掌握');
      }
    });
  };

  const handleReviewMistake = (mistakeId: number) => {
    setMistakes(prev => prev.map(mistake => 
      mistake.id === mistakeId 
        ? { ...mistake, reviewCount: mistake.reviewCount + 1 }
        : mistake
    ));
    message.success('复习次数已增加');
  };

  const handleRemoveFavorite = (questionId: number) => {
    Modal.confirm({
      title: '确认取消收藏',
      content: '确定要取消收藏此题吗？',
      onOk: () => {
        setFavorites(prev => prev.filter(fav => fav.id !== questionId));
        message.success('已取消收藏');
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'processing';
      case 'ABANDONED': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '已完成';
      case 'IN_PROGRESS': return '进行中';
      case 'ABANDONED': return '已放弃';
      default: return status;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'green';
      case 'MEDIUM': return 'orange';
      case 'HARD': return 'red';
      default: return 'default';
    }
  };

  const practiceColumns = [
    {
      title: '练习名称',
      dataIndex: 'sessionName',
      key: 'sessionName',
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 100,
    },
    {
      title: '题目数',
      dataIndex: 'questionCount',
      key: 'questionCount',
      width: 80,
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score: number) => <Text strong>{score}分</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 150,
    }
  ];

  const mistakeColumns = [
    {
      title: '题目',
      dataIndex: 'questionTitle',
      key: 'questionTitle',
      ellipsis: true,
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 100,
    },
    {
      title: '知识点',
      dataIndex: 'knowledgePoint',
      key: 'knowledgePoint',
      width: 120,
    },
    {
      title: '错误答案',
      dataIndex: 'wrongAnswer',
      key: 'wrongAnswer',
      width: 100,
    },
    {
      title: '复习次数',
      dataIndex: 'reviewCount',
      key: 'reviewCount',
      width: 100,
    },
    {
      title: '掌握状态',
      dataIndex: 'isMastered',
      key: 'isMastered',
      width: 100,
      render: (isMastered: boolean) => (
        <Tag color={isMastered ? 'success' : 'warning'}>
          {isMastered ? '已掌握' : '未掌握'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: UserMistake) => (
        <Space>
          {!record.isMastered && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => handleMarkAsMastered(record.id)}
            >
              标记掌握
            </Button>
          )}
          <Button 
            size="small"
            onClick={() => handleReviewMistake(record.id)}
          >
            复习
          </Button>
        </Space>
      )
    }
  ];

  const favoriteColumns = [
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: string) => (
        <Tag color={getDifficultyColor(difficulty)}>
          {difficulty}
        </Tag>
      )
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: FavoriteQuestion) => (
        <Button 
          size="small" 
          danger
          onClick={() => handleRemoveFavorite(record.id)}
        >
          取消收藏
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>我的内容</Title>
      <Text type="secondary">管理您的个人学习内容和进度</Text>
      
      <Tabs defaultActiveKey="overview" style={{ marginTop: '24px' }}>
        <TabPane tab="学习概览" key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="练习次数"
                  value={practiceStats.totalSessions}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="完成率"
                  value={Math.round((practiceStats.completedSessions / practiceStats.totalSessions) * 100)}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="平均得分"
                  value={practiceStats.averageScore}
                  suffix="分"
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="错题数量"
                  value={mistakeStats.totalMistakes}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col xs={24} md={12}>
              <Card title="错题掌握情况" size="small">
                <div style={{ marginBottom: '16px' }}>
                  <Text>已掌握: {mistakeStats.masteredMistakes} / {mistakeStats.totalMistakes}</Text>
                </div>
                <Progress 
                  percent={Math.round((mistakeStats.masteredMistakes / mistakeStats.totalMistakes) * 100)} 
                  status="active"
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="学习时间统计" size="small">
                <Statistic
                  title="总学习时间"
                  value={Math.round(practiceStats.totalTime / 60)}
                  suffix="分钟"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="练习历史" key="practice">
          <Card>
            <Table
              columns={practiceColumns}
              dataSource={practiceHistory}
              rowKey="id"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: practiceHistory.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                pageSizeOptions: ['10', '20', '50'],
                onChange: (page, size) => {
                  setCurrentPage(page);
                  if (size !== pageSize) {
                    setPageSize(size);
                    setCurrentPage(1);
                  }
                },
                onShowSizeChange: (_, size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                },
              }}
              locale={{ emptyText: <Empty description="暂无练习记录" /> }}
            />
          </Card>
        </TabPane>

        <TabPane tab="我的错题本" key="mistakes">
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic title="总错题数" value={mistakeStats.totalMistakes} />
                </Col>
                <Col span={6}>
                  <Statistic title="已掌握" value={mistakeStats.masteredMistakes} />
                </Col>
                <Col span={6}>
                  <Statistic title="未掌握" value={mistakeStats.unmasteredMistakes} />
                </Col>
                <Col span={6}>
                  <Statistic title="平均复习次数" value={mistakeStats.averageReviewCount} precision={1} />
                </Col>
              </Row>
            </div>
            
            <Table
              columns={mistakeColumns}
              dataSource={mistakes}
              rowKey="id"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: mistakes.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                pageSizeOptions: ['10', '20', '50'],
                onChange: (page, size) => {
                  setCurrentPage(page);
                  if (size !== pageSize) {
                    setPageSize(size);
                    setCurrentPage(1);
                  }
                },
                onShowSizeChange: (_, size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                },
              }}
              locale={{ emptyText: <Empty description="暂无错题记录" /> }}
            />
          </Card>
        </TabPane>

        <TabPane tab="我的收藏" key="favorites">
          <Card>
            <Table
              columns={favoriteColumns}
              dataSource={favorites}
              rowKey="id"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: favorites.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                pageSizeOptions: ['10', '20', '50'],
                onChange: (page, size) => {
                  setCurrentPage(page);
                  if (size !== pageSize) {
                    setPageSize(size);
                    setCurrentPage(1);
                  }
                },
                onShowSizeChange: (_, size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                },
              }}
              locale={{ emptyText: <Empty description="暂无收藏题目" /> }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default MyContent;

