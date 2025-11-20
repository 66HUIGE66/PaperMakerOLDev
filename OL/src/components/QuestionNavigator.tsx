import React, { useMemo } from 'react';
import { Drawer, Space, Button, Row, Col, Badge, Tooltip, Card, Progress, Typography, Divider } from 'antd';
import {
  CheckCircleOutlined,
  CheckSquareOutlined,
  FormOutlined,
  EditOutlined,
  CheckSquareTwoTone,
  EditTwoTone, QuestionCircleTwoTone, CheckCircleTwoTone, StarTwoTone
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface QuestionNavigatorProps {
  visible: boolean;
  onClose: () => void;
  questions: any[];
  currentIndex: number;
  answers: Record<string, any>;
  onQuestionSelect: (index: number) => void;
}

const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  visible,
  onClose,
  questions,
  currentIndex,
  answers,
  onQuestionSelect,
}) => {
  // 获取题目状态
  const getQuestionStatus = (questionId: string) => {
    if (!answers[questionId]) {
      return 'unanswered';
    }
    return 'answered';
  };

  // 获取状态样式
  const getStatusStyle = (status: string, isCurrentQuestion: boolean) => {
    if (isCurrentQuestion) {
      return {
        backgroundColor: '#1890ff',
        borderColor: '#1890ff',
        color: '#fff'
      };
    }
    switch (status) {
      case 'answered':
        return {
          backgroundColor: '#f6ffed',
          borderColor: '#b7eb8f',
          color: '#52c41a'
        };
      case 'unanswered':
        return {
          backgroundColor: '#fff',
          borderColor: '#d9d9d9',
          color: '#666'
        };
      default:
        return {
          backgroundColor: '#fff',
          borderColor: '#d9d9d9',
          color: '#666'
        };
    }
  };

  // 获取题型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SINGLE_CHOICE':
        return <StarTwoTone />;
      case 'MULTIPLE_CHOICE':
        return <CheckCircleTwoTone />;
      case 'FILL_BLANK':
        return <EditTwoTone />;
      case 'SHORT_ANSWER':
        return <QuestionCircleTwoTone />;
      case 'TRUE_FALSE':
        return <CheckSquareTwoTone />;
      default:
        return <CheckSquareTwoTone />;
    }
  };

  // 获取题型名称
  const getTypeName = (type: string) => {
    switch (type) {
      case 'SINGLE_CHOICE':
        return '单选题';
      case 'MULTIPLE_CHOICE':
        return '多选题';
      case 'FILL_BLANK':
        return '填空题';
      case 'SHORT_ANSWER':
        return '简答题';
      case 'TRUE_FALSE':
        return '判断题';
      default:
        return '其他';
    }
  };

  // 按题型分组题目
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    questions.forEach((question, index) => {
      const type = question.type || 'OTHER';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push({ ...question, index });
    });
    return groups;
  }, [questions]);

  // 计算每种题型的完成进度
  const typeProgress = useMemo(() => {
    const progress: Record<string, { total: number; answered: number }> = {};
    Object.entries(groupedQuestions).forEach(([type, typeQuestions]) => {
      progress[type] = {
        total: typeQuestions.length,
        answered: typeQuestions.filter(q => answers[q.id]).length
      };
    });
    return progress;
  }, [groupedQuestions, answers]);

  // 计算总体完成进度
  const totalProgress = useMemo(() => {
    const total = questions.length;
    const answered = Object.keys(answers).length;
    return {
      percent: Math.round((answered / total) * 100),
      answered,
      total
    };
  }, [questions, answers]);

  return (
    <Drawer
      title={
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>题目导航</div>
          <Progress 
            percent={totalProgress.percent}
            size="small"
            format={() => `${totalProgress.answered}/${totalProgress.total}`}
          />
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={360}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {Object.entries(groupedQuestions).map(([type, typeQuestions]) => (
          <Card 
            key={type}
            size="small"
            title={
              <Space>
                {getTypeIcon(type)}
                <span>{getTypeName(type)}</span>
                <Text type="secondary">
                  ({typeProgress[type].answered}/{typeProgress[type].total})
                </Text>
              </Space>
            }
            extra={
              <Progress 
                percent={Math.round((typeProgress[type].answered / typeProgress[type].total) * 100)}
                size="small"
                showInfo={false}
                strokeWidth={4}
                style={{ width: 60 }}
              />
            }
          >
            <Row gutter={[8, 8]}>
              {typeQuestions.map((question) => (
                <Col span={6} key={question.id}>
                  <Tooltip title={
                    <div>
                      <div>题目 {question.index + 1}</div>
                      <div>{getTypeName(question.type)}</div>
                      <div>状态：{getQuestionStatus(question.id) === 'answered' ? '已答' : '未答'}</div>
                    </div>
                  }>
                    <Button
                      style={{ 
                        width: '100%', 
                        height: '36px',
                        fontSize: '14px',
                        fontWeight: 'normal',
                        ...getStatusStyle(getQuestionStatus(question.id), currentIndex === question.index)
                      }}
                      onClick={() => onQuestionSelect(question.index)}
                    >
                      {question.index + 1}
                    </Button>
                  </Tooltip>
                </Col>
              ))}
            </Row>
          </Card>
        ))}
      </Space>
    </Drawer>
  );
};

export default QuestionNavigator;
