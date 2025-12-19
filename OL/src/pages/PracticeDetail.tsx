import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  Tag,
  Statistic,
  Radio,
  Checkbox,
  Input,
  message,
  Breadcrumb,
  Space,
  Result
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { examPaperService } from '../services/examPaperService';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  HomeOutlined,
  BookOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { practiceRecordService, PracticeRecord } from '../services/practiceRecordService';
import SubjectiveQuestionDisplay from '../components/SubjectiveQuestionDisplay';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface QuestionDetail {
  id: number;
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  score: number;
  explanation?: string;
  // 新增字段用于相似度评分和AI评分
  answerId?: number;
  similarityScore?: number;
  finalScore?: number;
  scoreType?: string;
  aiScore?: number;
  aiFeedback?: string;
  aiSuggestions?: string;
  maxScore?: number;
}


const PracticeDetail: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [questions, setQuestions] = useState<QuestionDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (recordId) {
      loadRecordDetail();
    }
  }, [recordId]);

  const loadRecordDetail = async () => {
    setLoading(true);
    try {

      if (recordId) {
        // 优先从API获取练习记录详情
        try {
          // 从API获取练习记录详情
          const recordData = await practiceRecordService.getRecordById(parseInt(recordId));

          // 设置练习记录
          setRecord(recordData);

          // 获取试卷信息
          const paperInfo = await examPaperService.getExamPaper(recordData.paperId);

          // 如果练习记录中没有试卷标题，使用试卷信息中的标题
          if (!recordData.paperTitle && paperInfo.title) {
            recordData.paperTitle = paperInfo.title;
            setRecord(recordData); // 更新状态
          }

          // 获取试卷的题目列表
          const questionsData = await examPaperService.getPaperQuestions(recordData.paperId);

          // 优先从答题记录API获取答案数据
          let answers: Record<string, any> = {};
          let answerRecords: any[] = [];

          try {
            // 从答题记录API获取答案数据
            answerRecords = await practiceRecordService.getAnswersByExamRecordId(parseInt(recordId));
            console.log('从答题记录API获取到答案数据:', answerRecords);

            // 转换为答案映射
            answers = {};
            answerRecords.forEach(answer => {
              const questionId = answer.questionId.toString();
              answers[questionId] = answer.userAnswer;
            });
          } catch (answerError) {
            console.warn('获取答题记录失败，尝试从sessionStorage获取:', answerError);

            // 如果答题记录API失败，尝试从sessionStorage获取
            try {
              const storedData = sessionStorage.getItem('practiceResult');
              if (storedData) {
                const data = JSON.parse(storedData);
                // 检查是否是同一个试卷的答案数据
                if (data.paperId === recordData.paperId) {
                  answers = data.result?.answers || {};
                }
              }
            } catch (storageError) {
              console.warn('sessionStorage解析失败:', storageError);
            }
          }

          // 构建题目详情
          const questionDetails: QuestionDetail[] = [];

          questionsData.forEach((question: any) => {
            // 为判断题提供默认选项
            let questionOptions = Array.isArray(question.options) ? question.options : [];
            if (question.type === 'TRUE_FALSE' && questionOptions.length === 0) {
              questionOptions = ['正确', '错误'];
            }

            // 获取用户答案
            const questionId = question.questionId?.toString() || question.id?.toString() || '';
            let userAnswer = answers[questionId] || '未作答';

            // 特殊处理多选题答案：如果从数据库获取的是JSON字符串，解析为数组
            if (question.type === 'MULTIPLE_CHOICE' && userAnswer && typeof userAnswer === 'string') {
              try {
                // 尝试解析JSON格式的答案
                const parsedAnswer = JSON.parse(userAnswer);
                if (Array.isArray(parsedAnswer)) {
                  userAnswer = parsedAnswer;
                }
              } catch (e) {
                // 如果解析失败，保持原格式
                console.log('多选题答案解析失败:', userAnswer);
              }
            }

            // 检查答案是否正确
            let isCorrect = false;
            if (userAnswer !== '未作答') {
              // 先尝试从答题记录中获取正确性信息
              const answerRecord = answerRecords.find(ar => ar.questionId.toString() === questionId);
              if (answerRecord && answerRecord.isCorrect !== null) {
                isCorrect = answerRecord.isCorrect;
              } else {
                // 如果答题记录中没有正确性信息，则通过比较答案计算
                isCorrect = checkAnswer(question, userAnswer);
              }
            }

            // 从答题记录中获取信息
            const answerRecord = answerRecords.find(ar => ar.questionId.toString() === questionId);

            questionDetails.push({
              id: question.questionId || question.id,
              question: question.title,
              type: question.type,
              options: questionOptions,
              correctAnswer: question.correctAnswer,
              userAnswer: userAnswer,
              isCorrect: isCorrect,
              score: answerRecord?.finalScore ?? (isCorrect ? (question.score || 5) : 0),
              explanation: question.explanation || '暂无解析',
              // 添加相似度评分相关字段
              answerId: answerRecord?.id,
              similarityScore: answerRecord?.similarityScore,
              finalScore: answerRecord?.finalScore,
              scoreType: answerRecord?.scoreType,
              aiScore: answerRecord?.aiScore,
              aiFeedback: answerRecord?.aiFeedback,
              aiSuggestions: answerRecord?.aiSuggestions,
              maxScore: question.score || 5
            });
          });

          setQuestions(questionDetails);

        } catch (apiError: any) {
          console.error('API获取练习记录失败，尝试从sessionStorage获取:', apiError);
          message.error(apiError.message || '获取练习记录详情失败');

          // 降级到sessionStorage
          const storedData = sessionStorage.getItem('practiceResult');
          if (storedData) {
            const data = JSON.parse(storedData);

            // 设置练习记录
            setRecord(data.practiceRecord);

            // 获取试卷信息
            const paperInfo = await examPaperService.getExamPaper(data.paperId);

            // 如果练习记录中没有试卷标题，使用试卷信息中的标题
            if (!data.practiceRecord.paperTitle && paperInfo.title) {
              data.practiceRecord.paperTitle = paperInfo.title;
            }

            // 获取试卷的题目列表
            const questionsData = await examPaperService.getPaperQuestions(data.paperId);

            // 从练习结果中获取答案数据
            const answers = data.result.answers || {};

            // 构建题目详情
            const questionDetails: QuestionDetail[] = [];

            // 根据真实的试卷题目数据构建题目详情
            questionsData.forEach((question: any) => {
              const questionId = question.questionId?.toString() || question.id?.toString() || '';
              const userAnswer = answers[questionId];
              const isCorrect = userAnswer && checkAnswer(question, userAnswer);

              // 为判断题提供默认选项
              let questionOptions = Array.isArray(question.options) ? question.options : [];
              if (question.type === 'TRUE_FALSE' && questionOptions.length === 0) {
                questionOptions = ['正确', '错误'];
              }

              questionDetails.push({
                id: question.questionId || question.id,
                question: question.title,
                type: question.type,
                options: questionOptions,
                correctAnswer: question.correctAnswer,
                userAnswer: userAnswer || '未作答',
                isCorrect: isCorrect || false,
                score: isCorrect ? (question.score || 5) : 0,
                explanation: question.explanation || '暂无解析',
                maxScore: question.score || 5
              });
            });

            setQuestions(questionDetails);
          }
        }
      } else {
        // 既没有sessionStorage数据也没有recordId
        message.error('未找到练习记录数据，请重新进行练习');
      }
    } catch (error: any) {
      message.error(error.message || '加载练习详情失败');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}小时${minutes}分钟${secs}秒`;
    } else if (minutes > 0) {
      return `${minutes}分钟${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  // 解析正确答案格式（支持JSON数组字符串、逗号分隔字符串、选项文本字符串）
  const parseCorrectAnswer = (correctAnswer: string): string[] => {
    if (!correctAnswer) return [];

    // 尝试解析JSON数组格式（如 "[\"A\", \"B\", \"C\", \"D\"]"）
    try {
      const parsed = JSON.parse(correctAnswer);
      if (Array.isArray(parsed)) {
        return parsed.map((a: any) => String(a).trim());
      }
    } catch (e) {
      // 不是JSON格式，继续处理
    }

    // 尝试逗号分隔格式（如 "A,B,C,D" 或 "原子性,一致性,隔离性,持久性"）
    if (correctAnswer.includes(',')) {
      return correctAnswer.split(',').map((a: string) => a.trim());
    }

    // 单个答案
    return [correctAnswer.trim()];
  };

  // 检查答案是否正确
  const checkAnswer = (question: any, userAnswer: any): boolean => {
    if (!userAnswer || !question.correctAnswer) return false;


    switch (question.type) {
      case 'SINGLE_CHOICE':
        // 单选题：需要处理选项字母和选项文本两种格式
        if (Array.isArray(question.options)) {
          // 如果用户答案是选项文本，转换为选项字母
          const optionIndex = question.options.findIndex((option: string) => option === userAnswer);
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

          // 如果用户答案是选项文本，但正确答案也是选项文本，直接比较
          if (typeof userAnswer === 'string' && question.options.includes(userAnswer)) {
            return userAnswer === question.correctAnswer;
          }
        }

        // 直接比较（处理各种格式）
        const userAnswerStr = String(userAnswer).trim();
        const correctAnswerStr = String(question.correctAnswer).trim();

        // 如果完全匹配，返回true
        if (userAnswerStr === correctAnswerStr) {
          return true;
        }

        // 如果用户答案是选项文本，检查是否与正确答案匹配
        if (Array.isArray(question.options) && question.options.includes(userAnswerStr)) {
          return userAnswerStr === correctAnswerStr;
        }

        return false;

      case 'TRUE_FALSE':
        // 判断题：处理不同的文本格式
        const userAnswerStrTF = String(userAnswer).toLowerCase();
        const correctAnswerStrTF = String(question.correctAnswer).toLowerCase();

        // 处理中文和英文的对应关系
        if (userAnswerStrTF === '正确' || userAnswerStrTF === 'true') {
          return correctAnswerStrTF === 'true' || correctAnswerStrTF === '正确';
        } else if (userAnswerStrTF === '错误' || userAnswerStrTF === 'false') {
          return correctAnswerStrTF === 'false' || correctAnswerStrTF === '错误';
        }
        return userAnswerStrTF === correctAnswerStrTF;

      case 'MULTIPLE_CHOICE':
        // 多选题：用户选择的是选项文本数组
        if (Array.isArray(userAnswer) && Array.isArray(question.options)) {
          const userAnswers = userAnswer.map(a => String(a).trim()).sort();
          const correctAnswersParsed = parseCorrectAnswer(question.correctAnswer);
          const correctAnswers = correctAnswersParsed.map((a: string) => a.trim()).sort();

          // 判断正确答案格式：如果都是单个字母（A-D），则可能是字母格式
          const isLetterFormat = correctAnswers.every((ca: string) => /^[A-D]$/i.test(ca.trim()));

          if (isLetterFormat) {
            // 正确答案是字母格式（如"A,B,C,D"或["A","B","C","D"]），需要将用户答案转换为字母
            const userOptionLetters = userAnswer
              .map(answer => {
                const optionIndex = question.options.findIndex((option: string) => option === answer);
                return optionIndex !== -1 ? String.fromCharCode(65 + optionIndex) : null;
              })
              .filter(letter => letter !== null)
              .sort();

            return JSON.stringify(userOptionLetters) === JSON.stringify(correctAnswers);
          } else {
            // 正确答案是文本格式（如"原子性,一致性,隔离性,持久性"），直接比较文本
            return JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
          }
        }

        // 如果不是数组，按原来的逻辑处理
        const userAnswersStr = String(userAnswer).split(',').map((a: string) => a.trim()).sort();
        const correctAnswersParsedStr = parseCorrectAnswer(question.correctAnswer);
        const correctAnswersStr = correctAnswersParsedStr.map((a: string) => a.trim()).sort();
        return JSON.stringify(userAnswersStr) === JSON.stringify(correctAnswersStr);

      case 'FILL_BLANK':
        const normFB = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');
        const splitTokensFB = (v: string): string[] => v
          .replace(/[，、；]/g, ',')
          .split(',')
          .map(t => normFB(t))
          .filter(Boolean);
        const corrFB = splitTokensFB(String(question.correctAnswer));
        const uaFB = Array.isArray(userAnswer)
          ? (userAnswer as any[]).map(x => normFB(String(x))).filter(Boolean)
          : splitTokensFB(String(userAnswer));
        if (corrFB.length === 0) return uaFB.length === 0;
        if (corrFB.length === 1) return uaFB.includes(corrFB[0]);
        if (corrFB.length !== uaFB.length) return false;
        const setCorrFB = new Set(corrFB);
        for (const u of uaFB) { if (!setCorrFB.has(u)) return false; }
        return true;

      default:
        return false;
    }
  };

  const calculateTimeSpent = (startTime: string, endTime?: string): number => {
    if (!endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      COMPLETED: { color: 'green', text: '已完成' },
      IN_PROGRESS: { color: 'orange', text: '进行中' },
      TIMEOUT: { color: 'red', text: '超时' }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const typeMap = {
      PRACTICE: { color: 'blue', text: '练习模式' },
      EXAM: { color: 'purple', text: '考试模式' }
    };
    const typeInfo = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  const renderQuestionAnswer = (question: QuestionDetail) => {
    const { type, options, correctAnswer, userAnswer, isCorrect } = question;

    // 调试信息
    console.log('渲染题目答案:', {
      type,
      correctAnswer,
      userAnswer,
      isCorrect,
      options
    });

    switch (type) {
      case 'SINGLE_CHOICE':
        // 处理正确答案：可能是选项字母或选项文本
        let actualCorrectAnswer = correctAnswer;
        if (correctAnswer && correctAnswer.length === 1 && /[A-D]/.test(correctAnswer)) {
          // 如果正确答案是选项字母，转换为选项文本
          const correctIndex = correctAnswer.charCodeAt(0) - 65;
          actualCorrectAnswer = options && options[correctIndex] ? options[correctIndex] : correctAnswer;
        }

        return (
          <Radio.Group value={userAnswer} disabled>
            {options?.map((option: string, index: number) => {
              const isCorrectOption = option === actualCorrectAnswer;
              const isUserSelected = option === userAnswer;
              const isWrongSelection = isUserSelected && !isCorrect;

              return (
                <Radio key={index} value={option} style={{ display: 'block', marginBottom: 8 }}>
                  <span style={{
                    color: isCorrectOption ? '#52c41a' :
                      isWrongSelection ? '#ff4d4f' : '#000'
                  }}>
                    {option}
                    {isCorrectOption && <CheckCircleOutlined style={{ marginLeft: 8, color: '#52c41a' }} />}
                    {isWrongSelection && <CloseCircleOutlined style={{ marginLeft: 8, color: '#ff4d4f' }} />}
                  </span>
                </Radio>
              );
            })}
          </Radio.Group>
        );

      case 'MULTIPLE_CHOICE':
        // 解析正确答案格式（支持JSON数组字符串、逗号分隔字符串、选项文本字符串）
        const parseCorrectAnswerForDisplay = (correctAnswer: string): string[] => {
          if (!correctAnswer) return [];

          // 尝试解析JSON数组格式（如 "[\"A\", \"B\", \"C\", \"D\"]"）
          try {
            const parsed = JSON.parse(correctAnswer);
            if (Array.isArray(parsed)) {
              return parsed.map((a: any) => String(a).trim());
            }
          } catch (e) {
            // 不是JSON格式，继续处理
          }

          // 尝试逗号分隔格式（如 "A,B,C,D" 或 "原子性,一致性,隔离性,持久性"）
          if (correctAnswer.includes(',')) {
            return correctAnswer.split(',').map((a: string) => a.trim());
          }

          // 单个答案
          return [correctAnswer.trim()];
        };

        // 处理正确答案：支持多种格式
        const correctAnswersParsed = parseCorrectAnswerForDisplay(correctAnswer);
        let correctAnswers: string[] = [];

        // 将正确答案转换为选项文本
        correctAnswersParsed.forEach(ca => {
          const caTrimmed = ca.trim();
          // 如果是字母格式（A-D），转换为选项文本
          if (/^[A-D]$/i.test(caTrimmed) && options) {
            const index = caTrimmed.toUpperCase().charCodeAt(0) - 65;
            if (options[index]) {
              correctAnswers.push(options[index]);
            }
          } else if (options && options.includes(caTrimmed)) {
            // 如果已经是选项文本格式，直接使用
            correctAnswers.push(caTrimmed);
          }
        });

        // 处理用户答案：可能是数组或字符串
        let userAnswers: string[] = [];
        if (Array.isArray(userAnswer)) {
          userAnswers = userAnswer;
        } else if (typeof userAnswer === 'string' && userAnswer !== '未作答') {
          try {
            // 尝试解析JSON格式
            const parsed = JSON.parse(userAnswer);
            if (Array.isArray(parsed)) {
              userAnswers = parsed.map((a: any) => String(a).trim());
            } else {
              userAnswers = [String(parsed).trim()];
            }
          } catch (e) {
            // 不是JSON格式，按逗号分隔或单个答案处理
            if (userAnswer.includes(',')) {
              userAnswers = userAnswer.split(',').map(answer => answer.trim());
            } else {
              userAnswers = [userAnswer.trim()];
            }
          }
        }

        return (
          <Checkbox.Group value={userAnswers} disabled>
            <Space direction="vertical" style={{ width: '100%' }}>
              {options?.map((option: string, index: number) => {
                // 检查是否为正确答案
                const isCorrectOption = correctAnswers.includes(option);
                // 检查用户是否选择了这个选项
                const isUserSelected = userAnswers.includes(option);
                // 检查是否为错误选择（用户选择了但这不是正确答案）
                const isWrongSelection = isUserSelected && !isCorrectOption;

                return (
                  <Checkbox
                    key={index}
                    value={option}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: 8,
                      //  确保复选框和勾选标记正确对齐
                      lineHeight: '22px'
                    }}
                  >
                    <span style={{
                      color: isCorrectOption ? '#52c41a' :
                        isWrongSelection ? '#ff4d4f' : '#000',
                      flex: 1
                    }}>
                      {option}
                    </span>
                    {/*  只在用户未选择但选项是正确答案时显示额外图标 */}
                    {isCorrectOption && !isUserSelected && (
                      <CheckCircleOutlined style={{ marginLeft: 8, color: '#52c41a', fontSize: '16px' }} />
                    )}
                    {isWrongSelection && (
                      <CloseCircleOutlined style={{ marginLeft: 8, color: '#ff4d4f', fontSize: '16px' }} />
                    )}
                  </Checkbox>
                );
              })}
            </Space>
          </Checkbox.Group>
        );

      case 'TRUE_FALSE':
        // 判断题没有预定义选项，需要创建"正确"和"错误"选项
        const trueFalseOptions = ['正确', '错误'];

        // 将正确答案标准化为中文
        const normalizeCorrectAnswer = (answer: string): string => {
          const answerLower = String(answer).toLowerCase().trim();
          if (answerLower === 'true' || answerLower === '正确') {
            return '正确';
          } else if (answerLower === 'false' || answerLower === '错误') {
            return '错误';
          }
          return String(answer);
        };

        // 将用户答案标准化为中文
        const normalizeUserAnswer = (answer: any): string => {
          if (!answer || answer === '未作答') return '未作答';
          const answerStr = String(answer).toLowerCase().trim();
          if (answerStr === 'true' || answerStr === '正确') {
            return '正确';
          } else if (answerStr === 'false' || answerStr === '错误') {
            return '错误';
          }
          return String(answer);
        };

        const normalizedCorrectAnswer = normalizeCorrectAnswer(correctAnswer);
        const normalizedUserAnswer = normalizeUserAnswer(userAnswer);

        return (
          <Radio.Group value={normalizedUserAnswer} disabled>
            {trueFalseOptions.map((option, index) => {
              const isCorrectOption = option === normalizedCorrectAnswer;
              const isUserSelected = option === normalizedUserAnswer;
              const isWrongSelection = isUserSelected && !isCorrect;

              return (
                <Radio key={index} value={option} style={{ display: 'block', marginBottom: 8 }}>
                  <span style={{
                    color: isCorrectOption ? '#52c41a' :
                      isWrongSelection ? '#ff4d4f' : '#000'
                  }}>
                    {option}
                    {isCorrectOption && <CheckCircleOutlined style={{ marginLeft: 8, color: '#52c41a' }} />}
                    {isWrongSelection && <CloseCircleOutlined style={{ marginLeft: 8, color: '#ff4d4f' }} />}
                  </span>
                </Radio>
              );
            })}
          </Radio.Group>
        );

      case 'FILL_BLANK':
        // 使用SubjectiveQuestionDisplay组件显示主观题
        if (question.answerId) {
          return (
            <SubjectiveQuestionDisplay
              answerId={question.answerId}
              questionType={type}
              userAnswer={userAnswer}
              correctAnswer={correctAnswer}
              similarityScore={question.similarityScore}
              finalScore={question.finalScore}
              scoreType={question.scoreType}
              aiScore={question.aiScore}
              aiFeedback={question.aiFeedback}
              aiSuggestions={question.aiSuggestions}
              maxScore={question.maxScore || 5}
              onScoreUpdate={() => loadRecordDetail()}
            />
          );
        }
        return (
          <div>
            <TextArea
              value={userAnswer}
              disabled
              style={{
                backgroundColor: isCorrect ? '#f6ffed' : '#fff2f0',
                borderColor: isCorrect ? '#b7eb8f' : '#ffccc7'
              }}
            />
            <div style={{ marginTop: 8, color: '#666' }}>
              正确答案：<Text code>{correctAnswer}</Text>
            </div>
          </div>
        );

      case 'SHORT_ANSWER':
        // 使用SubjectiveQuestionDisplay组件显示主观题
        if (question.answerId) {
          return (
            <SubjectiveQuestionDisplay
              answerId={question.answerId}
              questionType={type}
              userAnswer={userAnswer}
              correctAnswer={correctAnswer}
              similarityScore={question.similarityScore}
              finalScore={question.finalScore}
              scoreType={question.scoreType}
              aiScore={question.aiScore}
              aiFeedback={question.aiFeedback}
              aiSuggestions={question.aiSuggestions}
              maxScore={question.maxScore || 5}
              onScoreUpdate={() => loadRecordDetail()}
            />
          );
        }
        return (
          <div>
            {/* 用户答案区域 */}
            <div style={{ marginBottom: 12 }}>
              <div style={{
                marginBottom: 8,
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#595959'
              }}>
                你的答案：
              </div>
              <div style={{
                backgroundColor: isCorrect ? '#f6ffed' : '#fff2f0',
                border: `2px solid ${isCorrect ? '#b7eb8f' : '#ffccc7'}`,
                borderRadius: '8px',
                padding: '16px',
                minHeight: '100px',
                position: 'relative'
              }}>
                <Text style={{
                  fontSize: '15px',
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: isCorrect ? '#389e0d' : '#cf1322'
                }}>
                  {userAnswer || '未作答'}
                </Text>
                {isCorrect && (
                  <CheckCircleOutlined
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      fontSize: '20px',
                      color: '#52c41a'
                    }}
                  />
                )}
                {!isCorrect && userAnswer && (
                  <CloseCircleOutlined
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      fontSize: '20px',
                      color: '#ff4d4f'
                    }}
                  />
                )}
              </div>
            </div>

            {/* 参考答案区域 */}
            <div style={{
              backgroundColor: '#e6f7ff',
              border: '2px solid #91d5ff',
              borderRadius: '8px',
              padding: '16px',
              minHeight: '100px'
            }}>
              <div style={{
                marginBottom: 8,
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <BookOutlined style={{ fontSize: '16px' }} />
                参考答案：
              </div>
              <Text style={{
                fontSize: '15px',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#0050b3',
                display: 'block'
              }}>
                {correctAnswer}
              </Text>
            </div>
          </div>
        );

      default:
        return <Text>{userAnswer}</Text>;
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!record) {
    return <div>练习记录不存在</div>;
  }

  const timeSpent = calculateTimeSpent(record.startTime, record.endTime);

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 面包屑导航 */}
      <Breadcrumb
        style={{ marginBottom: '16px' }}
        items={[
          {
            title: (
              <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                <HomeOutlined /> 首页
              </span>
            )
          },
          {
            title: (
              <span onClick={() => navigate('/practice-records')} style={{ cursor: 'pointer' }}>
                练习记录
              </span>
            )
          },
          {
            title: '练习详情'
          }
        ]}
      />

      {/* 返回按钮 */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/practice-records')}
        style={{ marginBottom: '16px' }}
      >
        返回练习记录
      </Button>

      {/* 练习基本信息 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Title level={3} style={{ margin: 0 }}>
              {record.paperTitle || '未命名试卷'}
            </Title>
            <div style={{ marginTop: 8 }}>
              {getTypeTag(record.examType)}
              {getStatusTag(record.status)}
            </div>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <div style={{ color: '#666', fontSize: '14px' }}>
              开始时间：{new Date(record.startTime).toLocaleString('zh-CN')}
            </div>
            {record.endTime && (
              <div style={{ color: '#666', fontSize: '14px' }}>
                结束时间：{new Date(record.endTime).toLocaleString('zh-CN')}
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="得分"
              value={record.score || 0}
              suffix={`/ ${record.totalScore || 0}`}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="正确率"
              value={record.accuracy ? Math.round(record.accuracy) : 0}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="答题情况"
              value={`${record.answeredQuestions || 0}/${record.totalQuestions || 0}`}
              prefix={<QuestionCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="用时"
              value={formatTime(timeSpent)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 答题详情 */}
      <Card
        title="答题详情"
        extra={
          <Button
            type="primary"
            onClick={() => setShowExplanation(!showExplanation)}
          >
            {showExplanation ? '隐藏解析' : '显示解析'}
          </Button>
        }
      >
        {!loading && questions.length === 0 && (
          <Result
            status="warning"
            title="暂无答题记录"
            subTitle="可能是记录刚创建或答案尚未保存。您可以稍后刷新或返回列表。"
            extra={<Button type="primary" onClick={() => navigate('/practice-records')}>返回练习记录</Button>}
          />
        )}
        {questions.map((question, index) => (
          <Card
            key={question.id}
            size="small"
            style={{ marginBottom: 16 }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>第 {index + 1} 题</span>
                <div>
                  <Tag color={question.isCorrect ? 'green' : 'red'}>
                    {question.isCorrect ? '正确' : '错误'}
                  </Tag>
                  <Tag color="blue">{question.score}分</Tag>
                </div>
              </div>
            }
          >
            <Paragraph style={{ fontSize: '16px', marginBottom: 16 }}>
              {question.question}
            </Paragraph>

            <div style={{ marginBottom: 16 }}>
              {renderQuestionAnswer(question)}
            </div>

            {showExplanation && question.explanation && (
              <div style={{
                backgroundColor: '#fff7e6',
                border: '2px solid #ffd591',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '12px',
                  gap: '8px'
                }}>
                  <BulbOutlined style={{ fontSize: '18px', color: '#fa8c16' }} />
                  <Text strong style={{
                    color: '#fa8c16',
                    fontSize: '16px'
                  }}>
                    题目解析
                  </Text>
                </div>
                <div style={{
                  fontSize: '15px',
                  lineHeight: '1.8',
                  color: '#595959',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  paddingLeft: '26px'
                }}>
                  {question.explanation}
                </div>
              </div>
            )}
          </Card>
        ))}
      </Card>
    </div>
  );
};

export default PracticeDetail;


