import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Typography,
  Progress,
  Modal,
  message,
  Row,
  Col,
  Statistic,
  Alert,
  Tooltip,
  Spin,
  Divider,
  Tag
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SaveOutlined,
  RedoOutlined,
  EyeOutlined
} from '@ant-design/icons';
import QuestionNavigator from './QuestionNavigator';
import { ExamPaper, QuestionType, DifficultyLevel } from '../types';
import { questionService, Question } from '../services/questionService';
import { practiceRecordService } from '../services/practiceRecordService';
import { examPaperService } from '../services/examPaperService';

const { Title, Text, Paragraph } = Typography;

interface OnlinePracticeProps {
  paper: ExamPaper;
  onComplete?: (result: PracticeResult) => void;
  onExit?: () => void;
}

interface PracticeResult {
  paperId: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  score: number;
  totalScore: number;
  timeSpent: number;
  startTime: string;
  endTime: string;
  answers: Record<string, any>;
  accuracy: number;
}


const OnlinePractice: React.FC<OnlinePracticeProps> = ({
  paper,
  onComplete,
  onExit
}) => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(paper.duration * 60); // 转换为秒
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null);
  const [autoSaveEnabled] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);


  // 加载题目数据
  const loadQuestions = async () => {
    setLoading(true);
    try {
      // 根据试卷ID获取对应的题目
      const paperId = typeof paper.id === 'string' ? parseInt(paper.id) : paper.id;
      const response = await questionService.getQuestionsByPaperId(paperId);
      
      if (response && response.length > 0) {
        // 确保每个题目都有必要的字段，并处理试卷题目关联数据
        const validatedQuestions = response.map(question => ({
          ...question,
          // 使用 questionId 作为主要ID，如果没有则使用 id
          id: question.questionId || question.id,
          knowledgePoints: question.knowledgePoints || [],
          tags: question.tags || [],
          options: Array.isArray(question.options) ? question.options : (Array.isArray(question.optionsList) ? question.optionsList : []),
          // 保持试卷题目关联信息
          questionOrder: question.questionOrder,
          score: question.score
        }));
        setQuestions(validatedQuestions);
      } else {
        // 如果试卷没有题目，显示错误信息
        message.error('该试卷没有题目，请联系管理员');
        setQuestions([]);
      }
    } catch (error) {
      message.error('加载试卷题目失败，请检查网络连接或联系管理员');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [paper.id]);

  useEffect(() => {
    // 从localStorage恢复答题进度
    const savedAnswers = localStorage.getItem(`practice_${paper.id}_answers`);
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }

    const savedTime = localStorage.getItem(`practice_${paper.id}_time`);
    if (savedTime) {
      setTimeLeft(parseInt(savedTime));
    }
  }, [paper.id]);

  useEffect(() => {
    if (isStarted && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStarted, isPaused, timeLeft]);

  useEffect(() => {
    // 自动保存答题进度
    if (autoSaveEnabled && Object.keys(answers).length > 0) {
      localStorage.setItem(`practice_${paper.id}_answers`, JSON.stringify(answers));
      localStorage.setItem(`practice_${paper.id}_time`, timeLeft.toString());
    }
  }, [answers, timeLeft, paper.id, autoSaveEnabled]);

  const handleStart = () => {
    setIsStarted(true);
    startTimeRef.current = new Date();
    message.success('练习开始！');
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    message.info(isPaused ? '练习继续' : '练习暂停');
  };

  const handleAnswerChange = (questionId: number, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId.toString()]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    const endTime = new Date();
    const startTime = startTimeRef.current || new Date();
    const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    let createdRecordId: number | undefined;
    
    // 如果是生成的试卷，先保存试卷
    if (paper.generationType === 'AUTO' && !paper.isSaved) {
      try {
        const savedPaper = await examPaperService.createExamPaper({
          title: paper.title || '未命名试卷',
          description: paper.description || '',
          totalScore: paper.totalScore,
          duration: paper.duration,
          difficulty: paper.difficulty || 'MEDIUM',
          type: paper.type || 'PRACTICE',
          generationType: 'AUTO',
          status: 'ACTIVE',
          questionIds: questions.map(q => q.id)
        });
        paper.id = savedPaper.id; // 更新试卷ID
        paper.isSaved = true;
      } catch (error) {
        message.error('保存试卷失败，但不影响本次练习');
      }
    }

    // 计算成绩
    let correctAnswers = 0;
    const totalQuestions = questions.length;

    questions.forEach(question => {
      const userAnswer = answers[question.id?.toString() || ''];
      if (userAnswer && checkAnswer(question, userAnswer)) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * paper.totalScore);

    const result: PracticeResult = {
      paperId: paper.id.toString(),
      totalQuestions,
      answeredQuestions: Object.keys(answers).length,
      correctAnswers,
      score,
      totalScore: paper.totalScore,
      timeSpent,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      answers,
      accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
    };


    // 保存到后端（同步等待保存完成）
    try {
      // 检查认证状态
      // const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      // 从认证上下文获取用户ID
      let currentUserId = 1; // 默认值
      if (user) {
        try {
          const userData = JSON.parse(user);
          currentUserId = userData.id || 1;
        } catch (error) {
        }
      }

      // 确保 paperId 是正确的数字类型
      let paperId: number;
      if (typeof paper.id === 'string') {
        paperId = parseInt(paper.id, 10);
        if (isNaN(paperId)) {
          console.error('无法解析 paper.id 为数字:', paper.id);
          throw new Error('试卷ID格式错误');
        }
      } else {
        paperId = paper.id;
      }


      const practiceRecord = {
        paperId: paperId,
        paperTitle: paper.title, // 直接设置试卷标题，避免后端自动获取时的错误
        userId: currentUserId, // 使用从认证上下文获取的用户ID
        studentId: currentUserId, // 学生ID与用户ID相同
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        score: score,
        totalScore: paper.totalScore,
        answeredQuestions: Object.keys(answers).length,
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswers,
        accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
        timeSpent: timeSpent,
        examType: 'PRACTICE' as const,
        status: 'COMPLETED' as const
      };

      
      const savedRecord = await practiceRecordService.createRecord(practiceRecord);
      createdRecordId = (savedRecord as any)?.id as number | undefined;
      // 保存每题答案
      const examRecordId = createdRecordId;
      if (examRecordId) {
        const answerPayload = questions.map(q => {
          const userAnswer = answers[q.id?.toString() || ''];
          return {
            questionId: Number(q.id),
            questionType: q.type,
            userAnswer,
            isCorrect: !!userAnswer && checkAnswer(q, userAnswer),
            timeSpent: 0
          };
        });
        try {
          await practiceRecordService.saveAnswerBatch(examRecordId, answerPayload);
        } catch (e:any) {
          console.warn('保存答题记录失败:', e?.message);
        }
      }
      message.success('练习记录已保存到数据库');
    } catch (error: any) {
      // 显示错误消息，让用户知道保存失败
      message.warning('练习记录保存失败: ' + (error.response?.data?.message || error.message));
    }

    setPracticeResult(result);
    setShowConfirmModal(false);
    
    // 清除保存的数据
    localStorage.removeItem(`practice_${paper.id}_answers`);
    localStorage.removeItem(`practice_${paper.id}_time`);

      // 跳转到练习结果页面（带上 examRecordId，结果页以后端为准加载）
    // 统一跳转到练习详情页（即使存在 onComplete 回调也执行跳转）
    const resultData = {
      paperId: paper.id,
      paperTitle: paper.title,
      result: result,
      practiceRecord: {
        paperId: typeof paper.id === 'string' ? parseInt(paper.id) : paper.id,
        userId: (JSON.parse(localStorage.getItem('user') || '{}')?.id) || 1,
        studentId: (JSON.parse(localStorage.getItem('user') || '{}')?.id) || 1,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        score: score,
        totalScore: paper.totalScore,
        answeredQuestions: Object.keys(answers).length,
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswers,
        accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
        examType: 'PRACTICE' as const,
        status: 'COMPLETED' as const
      },
      rid: createdRecordId
    };
    sessionStorage.setItem('practiceResult', JSON.stringify(resultData));
    const url = (typeof createdRecordId === 'number')
      ? `/practice-detail/${createdRecordId}`
      : '/practice-records';
    try {
      if (onComplete) {
        onComplete(result);
      }
    } catch {}
    navigate(url);
  };

  const handleTimeUp = () => {
    message.warning('时间到！自动提交试卷');
    handleSubmit();
  };

  const checkAnswer = (question: Question, userAnswer: any): boolean => {
    if (!userAnswer || !question.correctAnswer) return false;
    
    
    switch (question.type) {
      case 'SINGLE_CHOICE':
        // 单选题：需要处理选项字母和选项文本两种格式
        if (Array.isArray(question.options)) {
          // 如果用户答案是选项文本，转换为选项字母
          const optionIndex = question.options.findIndex(option => option === userAnswer);
          if (optionIndex !== -1) {
            const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D
            
            // 检查正确答案是选项字母还是选项文本
            if (question.correctAnswer.length === 1 && /[A-D]/.test(question.correctAnswer)) {
              // 正确答案是选项字母
              return optionLetter === question.correctAnswer;
            } else {
              // 正确答案是选项文本，直接比较
              return userAnswer === question.correctAnswer;
            }
          }
          
          // 如果用户答案是选项字母，检查正确答案
          if (typeof userAnswer === 'string' && userAnswer.length === 1 && /[A-D]/.test(userAnswer)) {
            if (question.correctAnswer.length === 1 && /[A-D]/.test(question.correctAnswer)) {
              // 都是选项字母，直接比较
              return userAnswer === question.correctAnswer;
            } else {
              // 正确答案是选项文本，需要转换
              const correctOptionIndex = userAnswer.charCodeAt(0) - 65;
              const correctOptionText = question.options[correctOptionIndex];
              return correctOptionText === question.correctAnswer;
            }
          }
        }
        
        // 直接比较
        return String(userAnswer) === question.correctAnswer;
        
      case 'TRUE_FALSE':
        // 判断题：处理不同的文本格式
        const userAnswerStr = String(userAnswer).toLowerCase();
        const correctAnswerStr = String(question.correctAnswer).toLowerCase();
        
        // 处理中文和英文的对应关系
        if (userAnswerStr === '正确' || userAnswerStr === 'true') {
          return correctAnswerStr === 'true' || correctAnswerStr === '正确';
        } else if (userAnswerStr === '错误' || userAnswerStr === 'false') {
          return correctAnswerStr === 'false' || correctAnswerStr === '错误';
        }
        return userAnswerStr === correctAnswerStr;
        
      case 'MULTIPLE_CHOICE':
        // 多选题：用户选择的是选项文本数组，需要转换为选项字母
        if (Array.isArray(userAnswer) && Array.isArray(question.options)) {
          const userOptionLetters = userAnswer
            .map(answer => {
              const optionIndex = question.options?.findIndex(option => option === answer) ?? -1;
              return optionIndex !== -1 ? String.fromCharCode(65 + optionIndex) : null;
            })
            .filter(letter => letter !== null)
            .sort();
          
          const correctAnswers = question.correctAnswer.split(',').sort();
          return JSON.stringify(userOptionLetters) === JSON.stringify(correctAnswers);
        }
        
        // 如果不是数组，按原来的逻辑处理
        const userAnswers = String(userAnswer).split(',').sort();
        const correctAnswers = question.correctAnswer.split(',').sort();
        return JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
        
      case 'FILL_BLANK':
        const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');
        const splitTokens = (v: string): string[] => v
          .replace(/[，、；]/g, ',')
          .split(',')
          .map(t => norm(t))
          .filter(Boolean);
        const corr = splitTokens(String(question.correctAnswer));
        const ua = Array.isArray(userAnswer)
          ? (userAnswer as any[]).map(x => norm(String(x))).filter(Boolean)
          : splitTokens(String(userAnswer));
        if (corr.length === 0) return ua.length === 0;
        if (corr.length === 1) return ua.includes(corr[0]);
        if (corr.length !== ua.length) return false;
        const setCorr = new Set(corr);
        for (const u of ua) { if (!setCorr.has(u)) return false; }
        return true;
        
      default:
        return false;
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return Math.round((Object.keys(answers).length / questions.length) * 100);
  };

  const getAnsweredCount = (): number => {
    return Object.keys(answers).length;
  };

  const currentQuestion = questions[currentQuestionIndex];

  // 检查当前题目是否存在
  if (!currentQuestion) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Alert message="题目加载失败" description="无法加载当前题目，请刷新页面重试" type="error" />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>正在加载题目...</div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Title level={2}>准备开始练习</Title>
          <Paragraph style={{ fontSize: 16, marginBottom: 30 }}>
            您即将开始练习：<strong>{paper.title}</strong>
          </Paragraph>
          
          <Row gutter={[16, 16]} style={{ marginBottom: 30 }}>
            <Col span={8}>
              <Statistic title="题目数量" value={questions.length} />
            </Col>
            <Col span={8}>
              <Statistic title="总分" value={paper.totalScore} />
            </Col>
            <Col span={8}>
              <Statistic title="考试时长" value={`${paper.duration}分钟`} />
            </Col>
          </Row>

          <Alert
            message="练习说明"
            description="请仔细阅读题目，选择正确答案。系统会自动保存您的答题进度，您可以随时暂停和继续。"
            type="info"
            style={{ marginBottom: 30, textAlign: 'left' }}
          />

          <Space size="large">
            <Button size="large" onClick={onExit}>
              返回
            </Button>
            <Button 
              type="primary" 
              size="large" 
              icon={<PlayCircleOutlined />}
              onClick={handleStart}
            >
              开始练习
            </Button>
          </Space>
        </div>
      </Card>
    );
  }

  if (showResultModal && practiceResult) {
    return (
      <Modal
        title="练习完成"
        open={showResultModal}
        onCancel={() => setShowResultModal(false)}
        footer={[
          <Button key="close" onClick={onExit}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <div style={{ textAlign: 'center' }}>
          <Title level={3}>练习结果</Title>
          
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col span={12}>
              <Statistic 
                title="答题数量" 
                value={practiceResult.answeredQuestions} 
                suffix={`/ ${practiceResult.totalQuestions}`}
              />
            </Col>
            <Col span={12}>
              <Statistic 
                title="正确数量" 
                value={practiceResult.correctAnswers} 
                suffix={`/ ${practiceResult.totalQuestions}`}
              />
            </Col>
            <Col span={12}>
              <Statistic 
                title="得分" 
                value={practiceResult.score} 
                suffix={`/ ${practiceResult.totalScore}`}
              />
            </Col>
            <Col span={12}>
              <Statistic 
                title="用时" 
                value={formatTime(practiceResult.timeSpent)}
              />
            </Col>
          </Row>

          <Progress 
            percent={Math.round((practiceResult.correctAnswers / practiceResult.totalQuestions) * 100)}
            status={practiceResult.correctAnswers === practiceResult.totalQuestions ? 'success' : 'normal'}
            style={{ marginBottom: 20 }}
          />

          <Text type="secondary">
            正确率: {Math.round((practiceResult.correctAnswers / practiceResult.totalQuestions) * 100)}%
          </Text>

          <Divider />

          <div style={{ textAlign: 'left' }}>
            <Title level={4}>答案解析</Title>
            {questions.map((question, index) => {
              const userAnswer = practiceResult.answers[question.id?.toString() || ''];
              const isCorrect = userAnswer && checkAnswer(question, userAnswer);
              
              return (
                <Card key={question.id} size="small" style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>第 {index + 1} 题: {question.title}</Text>
                    <Tag color={isCorrect ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                      {isCorrect ? '正确' : '错误'}
                    </Tag>
                  </div>
                  
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">你的答案: </Text>
                    <Text code>{userAnswer || '未作答'}</Text>
                  </div>
                  
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">正确答案: </Text>
                    <Text code style={{ color: '#52c41a' }}>{question.correctAnswer}</Text>
                  </div>
                  
                  {question.explanation && (
                    <div>
                      <Text type="secondary">解析: </Text>
                      <Text>{question.explanation}</Text>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
      {/* 顶部信息栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Title level={4} style={{ margin: 0 }}>{paper.title}</Title>
              <Text type="secondary">第 {currentQuestionIndex + 1} 题 / 共 {questions.length} 题</Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Tooltip title={isPaused ? '继续练习' : '暂停练习'}>
                <Button 
                  icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  onClick={handlePause}
                >
                  {isPaused ? '继续' : '暂停'}
                </Button>
              </Tooltip>
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />}
                onClick={handleSubmit}
              >
                提交试卷
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 进度和时间 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={12}>
            <Space>
              <Text>答题进度:</Text>
              <Progress 
                percent={getProgressPercentage()} 
                size="small" 
                style={{ width: 200 }}
              />
              <Text type="secondary">
                {getAnsweredCount()} / {questions.length}
              </Text>
            </Space>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <ClockCircleOutlined />
              <Text 
                style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold',
                  color: timeLeft < 300 ? '#ff4d4f' : '#1890ff' // 最后5分钟变红
                }}
              >
                {formatTime(timeLeft)}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 题目内容 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 20 }}>
          <Title level={4}>
            {currentQuestionIndex + 1}. {currentQuestion.title}
          </Title>
          <Space>
            <Text type="secondary">题型: {getQuestionTypeText(currentQuestion.type)}</Text>
            <Text type="secondary">难度: {getDifficultyText(currentQuestion.difficulty)}</Text>
            <Text type="secondary">科目: {currentQuestion.knowledgePoints?.join(', ') || '未分类'}</Text>
          </Space>
        </div>

        <QuestionAnswer
          question={currentQuestion}
          value={answers[currentQuestion.id.toString()]}
          onChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
        />
      </Card>

      {/* 导航按钮 */}
      <Card size="small">
        <Row justify="space-between">
          <Col>
            <Button 
              icon={<RedoOutlined />}
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              上一题
            </Button>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<SaveOutlined />}
                onClick={() => message.success('答题进度已自动保存')}
              >
                保存进度
              </Button>
              <Button 
                icon={<EyeOutlined />}
                onClick={() => setShowNavigator(true)}
              >
                题目导航
              </Button>
            </Space>
          </Col>
          <Col>
            <Button 
              type="primary"
              icon={<RedoOutlined />}
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              下一题
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 确认提交模态框 */}
      <Modal
        title="确认提交"
        open={showConfirmModal}
        onOk={handleConfirmSubmit}
        onCancel={() => setShowConfirmModal(false)}
        okText="确认提交"
        cancelText="继续答题"
      >
        <div style={{ textAlign: 'center' }}>
          <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
          <Title level={4}>确定要提交试卷吗？</Title>
          <Paragraph>
            您已经回答了 <strong>{getAnsweredCount()}</strong> 道题目，
            还有 <strong>{questions.length - getAnsweredCount()}</strong> 道题目未回答。
          </Paragraph>
          <Paragraph type="secondary">
            提交后将无法修改答案，请确认无误后再提交。
          </Paragraph>
        </div>
      </Modal>

      {/* 题目导航抽屉 */}
      <QuestionNavigator
        visible={showNavigator}
        onClose={() => setShowNavigator(false)}
        questions={questions}
        currentIndex={currentQuestionIndex}
        answers={answers}
        onQuestionSelect={(index) => {
          setCurrentQuestionIndex(index);
          setShowNavigator(false);
        }}
      />
    </div>
  );
};

// 题目答题组件
interface QuestionAnswerProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
}

const QuestionAnswer: React.FC<QuestionAnswerProps> = ({ question, value, onChange }) => {
  const renderSingleChoice = () => {
    // 检查选项是否存在
    if (!Array.isArray(question.options) || question.options.length === 0) {
      return (
        <Alert
          message="题目选项缺失"
          description="该题目缺少选项，请联系管理员"
          type="warning"
          showIcon
        />
      );
    }
    
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {question.options.map((option, index) => (
          <label key={index} style={{ display: 'block', cursor: 'pointer' }}>
            <input
              type="radio"
              name={`question_${question.id}`}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              style={{ marginRight: 8 }}
            />
            {option}
          </label>
        ))}
      </Space>
    );
  };

  const renderMultipleChoice = () => {
    // 检查选项是否存在
    if (!Array.isArray(question.options) || question.options.length === 0) {
      return (
        <Alert
          message="题目选项缺失"
          description="该题目缺少选项，请联系管理员"
          type="warning"
          showIcon
        />
      );
    }
    
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {question.options.map((option, index) => (
          <label key={index} style={{ display: 'block', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Array.isArray(value) && value.includes(option)}
              onChange={(e) => {
                const currentValue = Array.isArray(value) ? value : [];
                if (e.target.checked) {
                  onChange([...currentValue, option]);
                } else {
                  onChange(currentValue.filter((v: string) => v !== option));
                }
              }}
              style={{ marginRight: 8 }}
            />
            {option}
          </label>
        ))}
      </Space>
    );
  };

  const renderTrueFalse = () => {
    // 为判断题提供默认选项
    const options = Array.isArray(question.options) && question.options.length > 0 
      ? question.options 
      : ['正确', '错误'];
    
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {options.map((option, index) => (
          <label key={index} style={{ display: 'block', cursor: 'pointer' }}>
            <input
              type="radio"
              name={`question_${question.id}`}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              style={{ marginRight: 8 }}
            />
            {option}
          </label>
        ))}
      </Space>
    );
  };

  const renderShortAnswer = () => (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="请输入您的答案..."
      style={{
        width: '100%',
        minHeight: 120,
        padding: 12,
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        fontSize: 14,
        resize: 'vertical'
      }}
    />
  );

  const renderFillBlank = () => (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="请输入答案..."
      style={{
        width: '100%',
        padding: 8,
        border: '1px solid #d9d9d9',
        borderRadius: 4,
        fontSize: 14
      }}
    />
  );

  switch (question.type) {
    case QuestionType.SINGLE_CHOICE:
      return renderSingleChoice();
    case QuestionType.MULTIPLE_CHOICE:
      return renderMultipleChoice();
    case QuestionType.TRUE_FALSE:
      return renderTrueFalse();
    case QuestionType.SHORT_ANSWER:
      return renderShortAnswer();
    case QuestionType.FILL_BLANK:
      return renderFillBlank();
    default:
      return <div>不支持的题型</div>;
  }
};

// 辅助函数
const getQuestionTypeText = (type: QuestionType): string => {
  const typeMap: Record<QuestionType, string> = {
    [QuestionType.SINGLE_CHOICE]: '单选题',
    [QuestionType.MULTIPLE_CHOICE]: '多选题',
    [QuestionType.TRUE_FALSE]: '判断题',
    [QuestionType.SHORT_ANSWER]: '简答题',
    [QuestionType.FILL_BLANK]: '填空题',
  };
  return typeMap[type] || type;
};

const getDifficultyText = (difficulty: DifficultyLevel): string => {
  const difficultyMap: Record<DifficultyLevel, string> = {
    [DifficultyLevel.EASY]: '简单',
    [DifficultyLevel.MEDIUM]: '中等',
    [DifficultyLevel.HARD]: '困难',
    [DifficultyLevel.EXPERT]: '专家'
  };
  return difficultyMap[difficulty] || difficulty;
};

export default OnlinePractice;
