import React, { useState, useEffect } from 'react';
import {
  Modal,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Table,
  Space,
  Typography,
  Spin,
  Alert
} from 'antd';
import {
  BookOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  UserOutlined
} from '@ant-design/icons';
import { ExamPaper } from '../types';
import { questionService, Question } from '../services/questionService';

const { Title, Text, Paragraph } = Typography;

interface PaperDetailModalProps {
  visible: boolean;
  paper: ExamPaper | null;
  onClose: () => void;
}

const PaperDetailModal: React.FC<PaperDetailModalProps> = ({
  visible,
  paper,
  onClose
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && paper) {
      loadQuestions();
    }
  }, [visible, paper]);

  const loadQuestions = async () => {
    if (!paper) return;
    
    setLoading(true);
    try {
      const paperId = typeof paper.id === 'string' ? parseInt(paper.id) : paper.id;
      const response = await questionService.getQuestionsByPaperId(paperId);
      
      if (response && response.length > 0) {
        const validatedQuestions = response.map(question => ({
          ...question,
          id: question.questionId || question.id,
          knowledgePoints: question.knowledgePoints || [],
          tags: question.tags || [],
          options: Array.isArray(question.options) ? question.options : (Array.isArray(question.optionsList) ? question.optionsList : [])
        }));
        setQuestions(validatedQuestions);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error('加载试卷题目失败:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      'SINGLE_CHOICE': '单选题',
      'MULTIPLE_CHOICE': '多选题',
      'FILL_BLANK': '填空题',
      'TRUE_FALSE': '判断题',
      'SHORT_ANSWER': '简答题',
    };
    return typeMap[type] || type;
  };

  const getDifficultyText = (difficulty: string) => {
    const difficultyMap: Record<string, string> = {
      'EASY': '简单',
      'MEDIUM': '中等',
      'HARD': '困难'
    };
    return difficultyMap[difficulty] || difficulty;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colorMap: Record<string, string> = {
      'EASY': 'green',
      'MEDIUM': 'orange',
      'HARD': 'red'
    };
    return colorMap[difficulty] || 'default';
  };

  const columns = [
    {
      title: '序号',
      dataIndex: 'questionOrder',
      key: 'questionOrder',
      width: 80,
      render: (order: number) => (
        <span style={{ 
          display: 'inline-block',
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: '#1890ff',
          color: 'white',
          textAlign: 'center',
          lineHeight: '24px',
          fontSize: 12
        }}>
          {order}
        </span>
      )
    },
    {
      title: '题目信息',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Question) => (
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>
            {title}
          </div>
          <Space size="small">
            <Tag color="blue">{getQuestionTypeText(record.type)}</Tag>
            <Tag color={getDifficultyColor(record.difficulty)}>
              {getDifficultyText(record.difficulty)}
            </Tag>
            {record.subject && (
              <Tag color="purple">{record.subject}</Tag>
            )}
          </Space>
        </div>
      )
    },
    {
      title: '分值',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {score}分
        </Text>
      )
    }
  ];

  if (!paper) return null;

  return (
    <Modal
      title={
        <Space>
          <BookOutlined />
          <span>试卷详情</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
    >
      <Spin spinning={loading}>
        {/* 试卷基本信息 */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Statistic
                title="题目数量"
                value={questions.length}
                prefix={<BookOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总分"
                value={paper.totalScore}
                suffix="分"
                valueStyle={{ color: '#52c41a' }}
                prefix={<TrophyOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="考试时长"
                value={paper.duration}
                suffix="分钟"
                valueStyle={{ color: '#fa8c16' }}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="学科"
                value={paper.subject || '未分类'}
                prefix={<UserOutlined />}
              />
            </Col>
          </Row>
        </Card>

        {/* 试卷描述 */}
        {paper.description && (
          <Card style={{ marginBottom: 16 }}>
            <Title level={5}>试卷描述</Title>
            <Paragraph>{paper.description}</Paragraph>
          </Card>
        )}

        {/* 题目列表 */}
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>题目列表</Title>
            <Text type="secondary">
              共{questions.length}道题目，总分{paper.totalScore}分
            </Text>
          </div>
          
          {questions.length > 0 ? (
            <Table
              columns={columns}
              dataSource={questions}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
            />
          ) : (
            <Alert
              message="暂无题目"
              description="该试卷还没有添加题目"
              type="info"
              showIcon
            />
          )}
        </Card>
      </Spin>
    </Modal>
  );
};

export default PaperDetailModal;
