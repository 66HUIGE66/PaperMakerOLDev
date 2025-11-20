import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Select, 
  InputNumber, 
  Typography, 
  Space, 
  Tag, 
  Progress,
  Modal,
  Radio,
  message,
  Divider,
  Statistic
} from 'antd';
import { 
  PlayCircleOutlined, 
  TrophyOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface PracticeSession {
  id: number;
  sessionName: string;
  practiceType: string;
  subject: string;
  difficulty: string;
  questionCount: number;
  currentQuestion: number;
  score: number;
  status: string;
  startTime: string;
}

interface Question {
  id: number;
  title: string;
  type: string;
  options?: Array<{ key: string; content: string }>;
  correctAnswer: string;
  explanation: string;
}

const SimplifiedPractice: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [practiceModalVisible, setPracticeModalVisible] = useState(false);

  // 练习配置
  const [practiceConfig, setPracticeConfig] = useState({
    practiceType: 'random',
    subject: '',
    difficulty: 'ALL',
    knowledgePoint: '',
    questionCount: 10
  });

  useEffect(() => {
    // 模拟加载当前练习会话
    const mockSession: PracticeSession = {
      id: 1,
      sessionName: '随机练习',
      practiceType: 'random',
      subject: 'Java编程',
      difficulty: 'ALL',
      questionCount: 10,
      currentQuestion: 3,
      score: 20,
      status: 'IN_PROGRESS',
      startTime: '2024-01-15 14:30:00'
    };
    setCurrentSession(mockSession);
  }, []);

  useEffect(() => {
    // 模拟加载当前题目
    const mockQuestion: Question = {
      id: 1,
      title: 'Java中，以下哪个关键字用于定义常量？',
      type: 'SINGLE_CHOICE',
      options: [
        { key: 'A', content: 'const' },
        { key: 'B', content: 'final' },
        { key: 'C', content: 'static' },
        { key: 'D', content: 'define' }
      ],
      correctAnswer: 'B',
      explanation: 'final关键字用于定义常量，一旦赋值后不能修改'
    };
    setCurrentQuestion(mockQuestion);
  }, []);

  const practiceTypes = [
    { value: 'random', label: '随机练习', icon: <PlayCircleOutlined /> },
    { value: 'by_difficulty', label: '按难度练习', icon: <TrophyOutlined /> },
    { value: 'by_knowledge', label: '按知识点练习', icon: <CheckCircleOutlined /> },
    { value: 'by_subject', label: '按学科练习', icon: <ReloadOutlined /> },
    { value: 'mistake_review', label: '错题复习', icon: <CloseCircleOutlined /> }
  ];

  const subjects = ['Java编程', 'Python编程', '数据结构', '算法', '数据库'];
  const difficulties = ['EASY', 'MEDIUM', 'HARD', 'ALL'];
  const knowledgePoints = ['Java基础', '面向对象', '集合框架', '异常处理', '多线程'];

  const handleStartPractice = async () => {
    setLoading(true);
    
    // 模拟开始练习
    setTimeout(() => {
      const newSession: PracticeSession = {
        id: Date.now(),
        sessionName: `${practiceTypes.find(t => t.value === practiceConfig.practiceType)?.label}`,
        practiceType: practiceConfig.practiceType,
        subject: practiceConfig.subject,
        difficulty: practiceConfig.difficulty,
        questionCount: practiceConfig.questionCount,
        currentQuestion: 1,
        score: 0,
        status: 'IN_PROGRESS',
        startTime: new Date().toLocaleString()
      };
      
      setCurrentSession(newSession);
      setPracticeModalVisible(false);
      setLoading(false);
      message.success('练习开始！');
    }, 1000);
  };

  const handleSubmitAnswer = () => {
    if (!userAnswer) {
      message.warning('请选择答案！');
      return;
    }

    setShowResult(true);
    
    // 模拟提交答案
    setTimeout(() => {
      const isCorrect = userAnswer === currentQuestion?.correctAnswer;
      if (isCorrect) {
        message.success('回答正确！');
      } else {
        message.error('回答错误！');
      }
    }, 500);
  };

  const handleNextQuestion = () => {
    if (currentSession && currentSession.currentQuestion < currentSession.questionCount) {
      setCurrentSession({
        ...currentSession,
        currentQuestion: currentSession.currentQuestion + 1
      });
      setUserAnswer('');
      setShowResult(false);
    } else {
      // 练习完成
      setCurrentSession({
        ...currentSession!,
        status: 'COMPLETED'
      });
      message.success('练习完成！');
    }
  };

  const handleFinishPractice = () => {
    Modal.confirm({
      title: '确认完成练习',
      content: '确定要完成当前练习吗？',
      onOk: () => {
        setCurrentSession({
          ...currentSession!,
          status: 'COMPLETED'
        });
        message.success('练习已完成！');
      }
    });
  };

  const getProgress = () => {
    if (!currentSession) return 0;
    return (currentSession.currentQuestion / currentSession.questionCount) * 100;
  };

  const getTypeLabel = (type: string) => {
    return practiceTypes.find(t => t.value === type)?.label || type;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colorMap: Record<string, string> = {
      'EASY': 'green',
      'MEDIUM': 'orange',
      'HARD': 'red',
      'ALL': 'blue'
    };
    return colorMap[difficulty] || 'default';
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>练习模式</Title>
      <Text type="secondary">多种练习模式，提升学习效果</Text>
      
      <Divider />
      
      {!currentSession || currentSession.status === 'COMPLETED' ? (
        // 练习选择界面
        <Row gutter={[16, 16]}>
          {practiceTypes.map(type => (
            <Col xs={24} sm={12} md={8} lg={6} key={type.value}>
              <Card
                hoverable
                onClick={() => {
                  setPracticeConfig(prev => ({ ...prev, practiceType: type.value }));
                  setPracticeModalVisible(true);
                }}
                style={{ textAlign: 'center', height: '120px' }}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  {type.icon}
                </div>
                <Title level={5}>{type.label}</Title>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        // 练习进行界面
        <div>
          {/* 练习信息 */}
          <Card style={{ marginBottom: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic title="练习类型" value={getTypeLabel(currentSession.practiceType)} />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic title="当前题目" value={`${currentSession.currentQuestion}/${currentSession.questionCount}`} />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic title="得分" value={currentSession.score} />
              </Col>
            </Row>
            
            <div style={{ marginTop: '16px' }}>
              <Text>进度：</Text>
              <Progress percent={getProgress()} />
            </div>
          </Card>

          {/* 题目内容 */}
          <Card title={`第${currentSession.currentQuestion}题`}>
            {currentQuestion && (
              <div>
                <Title level={4}>{currentQuestion.title}</Title>
                
                {currentQuestion.type === 'SINGLE_CHOICE' && currentQuestion.options && (
                  <Radio.Group 
                    value={userAnswer} 
                    onChange={(e) => setUserAnswer(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {currentQuestion.options.map(option => (
                        <Radio key={option.key} value={option.key} style={{ display: 'block' }}>
                          {option.key}. {option.content}
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                )}

                {currentQuestion.type === 'TRUE_FALSE' && (
                  <Radio.Group 
                    value={userAnswer} 
                    onChange={(e) => setUserAnswer(e.target.value)}
                  >
                    <Space>
                      <Radio value="true">正确</Radio>
                      <Radio value="false">错误</Radio>
                    </Space>
                  </Radio.Group>
                )}

                {showResult && (
                  <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                    <Title level={5}>答案解析</Title>
                    <Text>{currentQuestion.explanation}</Text>
                  </div>
                )}

                <Divider />

                <Space>
                  {!showResult ? (
                    <Button type="primary" onClick={handleSubmitAnswer}>
                      提交答案
                    </Button>
                  ) : (
                    <Button type="primary" onClick={handleNextQuestion}>
                      {currentSession.currentQuestion < currentSession.questionCount ? '下一题' : '完成练习'}
                    </Button>
                  )}
                  
                  <Button onClick={handleFinishPractice}>
                    结束练习
                  </Button>
                </Space>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 练习配置模态框 */}
      <Modal
        title="练习配置"
        open={practiceModalVisible}
        onCancel={() => setPracticeModalVisible(false)}
        onOk={handleStartPractice}
        confirmLoading={loading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>练习类型：</Text>
            <Text>{getTypeLabel(practiceConfig.practiceType)}</Text>
          </div>

          <div>
            <Text strong>学科：</Text>
            <Select
              value={practiceConfig.subject}
              onChange={(value) => setPracticeConfig(prev => ({ ...prev, subject: value }))}
              style={{ width: '200px' }}
              placeholder="选择学科"
            >
              {subjects.map(subject => (
                <Option key={subject} value={subject}>{subject}</Option>
              ))}
            </Select>
          </div>

          {practiceConfig.practiceType === 'by_difficulty' && (
            <div>
              <Text strong>难度：</Text>
              <Select
                value={practiceConfig.difficulty}
                onChange={(value) => setPracticeConfig(prev => ({ ...prev, difficulty: value }))}
                style={{ width: '200px' }}
              >
                {difficulties.map(difficulty => (
                  <Option key={difficulty} value={difficulty}>{difficulty}</Option>
                ))}
              </Select>
            </div>
          )}

          {practiceConfig.practiceType === 'by_knowledge' && (
            <div>
              <Text strong>知识点：</Text>
              <Select
                value={practiceConfig.knowledgePoint}
                onChange={(value) => setPracticeConfig(prev => ({ ...prev, knowledgePoint: value }))}
                style={{ width: '200px' }}
                placeholder="选择知识点"
              >
                {knowledgePoints.map(point => (
                  <Option key={point} value={point}>{point}</Option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Text strong>题目数量：</Text>
            <InputNumber
              value={practiceConfig.questionCount}
              onChange={(value) => setPracticeConfig(prev => ({ ...prev, questionCount: value || 10 }))}
              min={1}
              max={50}
              style={{ width: '200px' }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default SimplifiedPractice;

