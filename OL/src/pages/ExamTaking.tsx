import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Progress,
  Modal,
  message,
  Row,
  Col,
  Radio,
  Checkbox,
  Input,
  Typography,
  Divider,
  Tag,
  Statistic
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/index';
import { Question, QuestionType, DifficultyLevel, ExamRecord, ExamPaper } from '../types';
import { checkAnswer, calculateExamScore, formatTime, generateId } from '../utils';
import { practiceRecordService } from '../services/practiceRecordService';
import { subjectApi } from '../services/api';
import { examPaperService } from '../services/examPaperService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ExamTaking: React.FC = () => {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const { examPapers, setCurrentExam, updateAnswer, addExamRecord, clearCurrentExam } = useAppStore();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [subjectMap, setSubjectMap] = useState<Map<number, string>>(new Map()); // subjectId -> subjectName
  const [loadedPaper, setLoadedPaper] = useState<(ExamPaper & { questions: Question[] }) | null>(null); // 从后端加载的完整试卷数据

  // 优先使用从后端加载的试卷数据，否则使用store中的数据
  const currentPaper = loadedPaper || examPapers.find(paper => paper.id === paperId) as (ExamPaper & { questions?: Question[] }) | undefined;
  const currentQuestion = currentPaper && 'questions' in currentPaper ? currentPaper.questions?.[currentQuestionIndex] : undefined;
  const totalQuestions = currentPaper && 'questions' in currentPaper ? currentPaper.questions?.length || 0 : 0;
  const currentExamData = useAppStore.getState().currentExam;
  const answeredCount = currentExamData ? Object.keys(currentExamData.answers).length : 0;

  // 获取题目的学科名称
  const getQuestionSubject = (question: any): string | null => {
    // 1. 优先使用题目的subject字段（如果是字符串）
    if (question.subject && typeof question.subject === 'string' && question.subject !== '未分类') {
      return question.subject;
    }
    
    // 2. 如果题目有subjectId，尝试从subjectMap获取
    if (question.subjectId && subjectMap.has(question.subjectId)) {
      return subjectMap.get(question.subjectId)!;
    }
    
    // 3. 如果试卷有subject，使用试卷的subject
    if (currentPaper?.subject && typeof currentPaper.subject === 'string' && currentPaper.subject !== '未分类') {
      return currentPaper.subject;
    }
    
    return null;
  };

  // 加载题目学科信息
  useEffect(() => {
    if (!currentPaper?.questions || currentPaper.questions.length === 0) return;
    
    const loadSubjects = async () => {
      const subjectIds = new Set<number>();
      
      // 收集所有题目的subjectId
      if (currentPaper && 'questions' in currentPaper && currentPaper.questions) {
        currentPaper.questions.forEach((question: any) => {
          if (question.subjectId && typeof question.subjectId === 'number') {
            subjectIds.add(question.subjectId);
          }
        });
      }
      
      // 批量获取学科名称
      const newSubjectMap = new Map<number, string>();
      for (const subjectId of subjectIds) {
        try {
          const response = await subjectApi.getSubjectById(subjectId);
          const subject = response.data?.object || response.data?.data;
          if (subject && subject.name) {
            newSubjectMap.set(subjectId, subject.name);
          }
        } catch (error) {
          console.warn(`获取学科${subjectId}失败:`, error);
        }
      }
      
      setSubjectMap(newSubjectMap);
    };
    
    loadSubjects();
  }, [currentPaper]);

  // 加载试卷和题目数据
  useEffect(() => {
    const loadPaperData = async () => {
      if (!paperId) {
        message.error('试卷ID不存在');
        navigate('/papers');
        return;
      }

      try {
        // 从后端加载试卷详情
        const paperIdNum = typeof paperId === 'string' ? parseInt(paperId) : paperId;
        const paper = await examPaperService.getExamPaper(paperIdNum);
        
        // 从后端加载题目列表（包含完整的题目信息）
        const questions = await examPaperService.getPaperQuestions(paperIdNum);
        
        // 构建完整的试卷对象
        const fullPaper: ExamPaper & { questions: Question[] } = {
          ...paper,
          questions: questions.map((q: any) => ({
            id: q.questionId || q.id,
            title: q.title,
            type: q.type,
            difficulty: q.difficulty,
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            knowledgePoints: q.knowledgePoints || [],
            tags: q.tags || [],
            subject: q.subject || null, // 学科名称（如果有）
            subjectId: q.subjectId || null, // 学科ID（如果有）
            score: q.score,
            questionOrder: q.questionOrder,
            creatorId: q.creatorId || 1,
            createTime: q.createdAt || new Date().toISOString(),
            updateTime: q.updatedAt || new Date().toISOString()
          }))
        };
        
        setLoadedPaper(fullPaper);
        
        // 初始化考试状态
        setCurrentExam({
          paperId: String(fullPaper.id),
          answers: {},
          startTime: new Date().toISOString(),
          timeLeft: (fullPaper.duration || 60) * 60,
          status: 'in_progress'
        });
        setTimeLeft((fullPaper.duration || 60) * 60); // 转换为秒
        setExamStarted(true);
      } catch (error: any) {
        console.error('加载试卷失败:', error);
        message.error(error.message || '加载试卷失败');
        navigate('/papers');
      }
    };

    loadPaperData();
  }, [paperId, setCurrentExam, navigate]);

  const handleSubmitExam = async () => {
    if (!currentPaper) return;

    const currentExamData = useAppStore.getState().currentExam;
    if (!currentExamData) return;
    
    const { answers, startTime } = currentExamData;
    const endTime = new Date().toISOString();
    const timeSpent = Math.floor((new Date(endTime).getTime() - new Date(startTime!).getTime()) / 1000);

    // 计算得分
    const questions = currentPaper && 'questions' in currentPaper ? currentPaper.questions || [] : [];
    const scoreResult = calculateExamScore(questions, answers);

    // 创建考试记录
    const examRecord: ExamRecord = {
      id: Number(generateId()),
      paperId: Number(currentPaper.id),
      userId: 1,
      totalScore: scoreResult.totalScore,
      userScore: scoreResult.totalScore * (scoreResult.correctCount / scoreResult.totalCount),
      answers: Object.entries(answers).reduce((acc, [questionId, userAnswer]) => {
        const questions = currentPaper && 'questions' in currentPaper ? currentPaper.questions || [] : [];
        const question = questions.find((q: Question) => String(q.id) === questionId);
        if (question) {
          acc[questionId] = Array.isArray(userAnswer) ? userAnswer.join(',') : String(userAnswer);
        }
        return acc;
      }, {} as Record<string, string>),
      startTime: startTime!,
      endTime,
      status: 'COMPLETED',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };

    // 保存到本地存储
    addExamRecord(examRecord);

    // 保存到后端数据库
    try {
      const practiceRecord = {
        paperId: parseInt(String(currentPaper.id)),
        userId: 1,
        studentId: 1,
        startTime: startTime!,
        endTime: endTime,
        score: scoreResult.correctCount,
        totalScore: currentPaper.totalScore || 100,
        answeredQuestions: scoreResult.totalCount,
        totalQuestions: currentPaper && 'questions' in currentPaper ? currentPaper.questions?.length || 0 : 0,
        correctAnswers: scoreResult.correctCount,
        accuracy: scoreResult.totalCount > 0 ? (scoreResult.correctCount / scoreResult.totalCount) * 100 : 0,
        timeSpent: timeSpent,
        examType: 'PRACTICE' as const,
        status: 'COMPLETED' as const
      };

      const created = await practiceRecordService.createRecord(practiceRecord);

      const qs = currentPaper && 'questions' in currentPaper ? currentPaper.questions || [] : [];
      const answersPayload = qs.map((q: Question) => {
        const ua: any = answers[String(q.id)];
        return {
          questionId: Number(q.id),
          questionType: q.type,
          userAnswer: ua,
          isCorrect: ua ? checkAnswer(q, ua) : false,
          timeSpent: 0
        };
      });

      try {
        await practiceRecordService.saveAnswerBatch(created.id, answersPayload);
      } catch {}

      message.success('练习记录已保存');
      clearCurrentExam();
      navigate(`/practice-detail/${created.id}`);
      return;
    } catch (error: any) {
      message.warning('练习记录保存失败，但本地记录已保存');
      clearCurrentExam();
      navigate('/practice-records');
      return;
    }
  };

  // 定时器
  useEffect(() => {
    if (!examStarted || !currentPaper) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, currentPaper]);

  const handleAnswerChange = (value: string | string[]) => {
    if (currentQuestion) {
      updateAnswer(String(currentQuestion.id), value);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleGoToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleConfirmSubmit = () => {
    handleSubmitExam();
    setConfirmSubmit(false);
  };

  const handleCancelSubmit = () => {
    setConfirmSubmit(false);
  };

  const handleFinishExam = () => {
    navigate('/practice-records');
  };

  const renderQuestion = (question: Question) => {
    const currentExamData = useAppStore.getState().currentExam;
    if (!currentExamData) return null;
    const currentAnswer = currentExamData.answers[String(question.id)];

    switch (question.type) {
      case QuestionType.SINGLE_CHOICE:
        return (
          <Radio.Group
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.options?.map((option, index) => (
                <Radio key={index} value={String.fromCharCode(65 + index)} style={{ marginBottom: 8 }}>
                  <span style={{ marginRight: 8 }}>{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );

      case QuestionType.MULTIPLE_CHOICE:
        return (
          <Checkbox.Group
            value={currentAnswer as string[] || []}
            onChange={(values) => handleAnswerChange(values)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.options?.map((option, index) => (
                <Checkbox key={index} value={String.fromCharCode(65 + index)} style={{ marginBottom: 8 }}>
                  <span style={{ marginRight: 8 }}>{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );

      case QuestionType.FILL_BLANK:
        // 检测题目中的空白数量（____ 或 ______）
        const countBlanks = (text: string): number => {
          if (!text) return 1; // 默认至少一个空白
          // 匹配连续的下划线（至少2个）
          const blankMatches = text.match(/_{2,}/g);
          return blankMatches ? blankMatches.length : 1;
        };
        
        const blankCount = countBlanks(question.title || '');
        
        // 如果只有一个空白，使用单个输入框
        if (blankCount === 1) {
          return (
            <Input
              value={currentAnswer as string || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="请输入答案"
              style={{ width: '100%' }}
            />
          );
        }
        
        // 多个空白时，使用数组存储答案
        const fillAnswers = (() => {
          if (!currentAnswer) return Array(blankCount).fill('');
          // 尝试用分号、逗号或换行符分割
          if (typeof currentAnswer === 'string') {
            const splitAnswers = currentAnswer.split(/[;，,\n]/).map(a => a.trim());
            // 确保数组长度匹配空白数量
            const answers = Array(blankCount).fill('');
            splitAnswers.forEach((ans, idx) => {
              if (idx < blankCount) answers[idx] = ans;
            });
            return answers;
          }
          return Array.isArray(currentAnswer) ? currentAnswer : Array(blankCount).fill('');
        })();
        
        const handleFillAnswerChange = (index: number, value: string) => {
          const newAnswers = [...fillAnswers];
          newAnswers[index] = value;
          // 用分号连接多个答案
          handleAnswerChange(newAnswers.join(';'));
        };
        
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            {Array.from({ length: blankCount }).map((_, index) => (
              <Input
                key={index}
                value={fillAnswers[index] || ''}
                onChange={(e) => handleFillAnswerChange(index, e.target.value)}
                placeholder={`请输入第${index + 1}个空格的答案`}
                style={{ width: '100%' }}
              />
            ))}
          </Space>
        );

      case QuestionType.TRUE_FALSE:
        return (
          <Radio.Group
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio value="true" style={{ marginBottom: 8 }}>正确</Radio>
              <Radio value="false" style={{ marginBottom: 8 }}>错误</Radio>
            </Space>
          </Radio.Group>
        );

      case QuestionType.SHORT_ANSWER:
      case QuestionType.ESSAY:
        return (
          <TextArea
            value={currentAnswer as string || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="请输入答案..."
            rows={question.type === QuestionType.ESSAY ? 6 : 3}
            style={{ width: '100%' }}
          />
        );

      default:
        return null;
    }
  };

  const getQuestionTypeText = (type: QuestionType) => {
    const typeMap = {
      [QuestionType.SINGLE_CHOICE]: '单选题',
      [QuestionType.MULTIPLE_CHOICE]: '多选题',
      [QuestionType.FILL_BLANK]: '填空题',
      [QuestionType.TRUE_FALSE]: '判断题',
      [QuestionType.SHORT_ANSWER]: '简答题',
    };
    return typeMap[type];
  };

  const getDifficultyText = (difficulty: DifficultyLevel) => {
    const difficultyMap = {
      [DifficultyLevel.EASY]: '简单',
      [DifficultyLevel.MEDIUM]: '中等',
      [DifficultyLevel.HARD]: '困难',
      [DifficultyLevel.EXPERT]: '专家',
    };
    return difficultyMap[difficulty];
  };

  if (!currentPaper) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>试卷不存在</div>;
  }

  if (examCompleted && showResult) {
    return (
      <div className="exam-container" style={{ maxWidth: 600, margin: '50px auto' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
            <Title level={2}>考试完成</Title>
            <Text type="secondary">恭喜您完成了考试！</Text>
            
            <Divider />
            
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="总分" value={examResult?.totalScore} suffix="分" />
              </Col>
              <Col span={8}>
                <Statistic title="正确题数" value={examResult?.correctCount} suffix={`/ ${examResult?.totalCount}`} />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="正确率" 
                  value={Math.round((examResult?.correctCount / examResult?.totalCount) * 100)} 
                  suffix="%" 
                />
              </Col>
            </Row>
            
            <Divider />
            
            <Space>
              <Button type="primary" onClick={handleFinishExam}>
                查看详细统计
              </Button>
              <Button onClick={() => navigate('/papers')}>
                返回试卷列表
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="exam-container">
      {/* 考试头部 */}
      <div className="exam-header">
        <div className="exam-title">{currentPaper.title}</div>
        <div className="exam-timer">
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* 考试内容 */}
      <div className="exam-content">
        {/* 进度条 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>进度: {currentQuestionIndex + 1} / {totalQuestions}</span>
            <span>已答题: {answeredCount} / {totalQuestions}</span>
          </div>
          <Progress 
            percent={Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)} 
            showInfo={false}
          />
        </div>

        {/* 题目信息 */}
        {currentQuestion && (
          <div className="exam-question">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>
                第 {currentQuestionIndex + 1} 题
              </Title>
              <Space>
                <Tag color="blue">{getQuestionTypeText(currentQuestion.type)}</Tag>
                <Tag color="green">{getDifficultyText(currentQuestion.difficulty)}</Tag>
                {(() => {
                  const subject = getQuestionSubject(currentQuestion);
                  return subject ? <Tag color="orange">{subject}</Tag> : null;
                })()}
              </Space>
            </div>
            
            <div className="exam-question-title">
              {currentQuestion.title}
            </div>
            
            <div className="exam-question-options">
              {renderQuestion(currentQuestion)}
            </div>
          </div>
        )}

        {/* 导航按钮 */}
        <div className="exam-navigation">
          <div className="exam-progress">
            <QuestionCircleOutlined style={{ marginRight: 4 }} />
            已答题: {answeredCount} / {totalQuestions}
          </div>
          
          <Space>
            <Button 
              icon={<LeftOutlined />} 
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
            >
              上一题
            </Button>
            
            <Button 
              type="primary" 
              icon={<RightOutlined />} 
              onClick={handleNext}
              disabled={currentQuestionIndex === totalQuestions - 1}
            >
              下一题
            </Button>
            
            <Button 
              type="primary" 
              danger
              onClick={handleConfirmSubmit}
            >
              提交试卷
            </Button>
          </Space>
        </div>
      </div>

      {/* 确认提交模态框 */}
      <Modal
        title="确认提交"
        open={confirmSubmit}
        onOk={handleSubmitExam}
        onCancel={handleCancelSubmit}
        okText="确认提交"
        cancelText="继续答题"
      >
        <p>您确定要提交试卷吗？提交后将无法修改答案。</p>
        <p>已答题数: {answeredCount} / {totalQuestions}</p>
        <p>剩余时间: {formatTime(timeLeft)}</p>
      </Modal>
    </div>
  );
};

export default ExamTaking;
