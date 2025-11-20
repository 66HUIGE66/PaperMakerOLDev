import { Question, ExamRule, ExamPaper, QuestionType, DifficultyLevel, GenerateResult } from '../types';

// 生成唯一ID
export const generateId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

// 格式化时间
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// 计算试卷总分
export const calculateTotalScore = (questions: Question[]): number => {
  return questions.length * 10; // 每题10分
};

// 根据规则筛选题目
export const filterQuestionsByRule = (questions: Question[], rule: ExamRule): Question[] => {
  let filtered = questions.filter(q => {
    // 排除指定题目
    if (rule.excludeQuestions?.includes(q.id)) {
      return false;
    }
    
    // 知识点匹配
    if (rule.knowledgePoints.length > 0) {
      const hasMatchingKnowledgePoint = rule.knowledgePoints.some(kp => 
        q.knowledgePoints.includes(kp)
      );
      if (!hasMatchingKnowledgePoint) return false;
    }
    
    // 标签匹配
    if (rule.tags.length > 0) {
      const hasMatchingTag = rule.tags.some(tag => q.tags.includes(tag));
      if (!hasMatchingTag) return false;
    }
    
    return true;
  });
  
  return filtered;
};

// 按难度分组题目
export const groupQuestionsByDifficulty = (questions: Question[]): Record<DifficultyLevel, Question[]> => {
  const groups: Record<DifficultyLevel, Question[]> = {
    [DifficultyLevel.EASY]: [],
    [DifficultyLevel.MEDIUM]: [],
    [DifficultyLevel.HARD]: [],
    [DifficultyLevel.EXPERT]: []
  };
  
  questions.forEach(q => {
    groups[q.difficulty].push(q);
  });
  
  return groups;
};

// 按题型分组题目
export const groupQuestionsByType = (questions: Question[]): Record<QuestionType, Question[]> => {
  const groups: Record<QuestionType, Question[]> = {
    [QuestionType.SINGLE_CHOICE]: [],
    [QuestionType.MULTIPLE_CHOICE]: [],
    [QuestionType.FILL_BLANK]: [],
    [QuestionType.TRUE_FALSE]: [],
    [QuestionType.SHORT_ANSWER]: [],
    [QuestionType.ESSAY]: []
  };
  
  questions.forEach(q => {
    groups[q.type].push(q);
  });
  
  return groups;
};

// 随机选择题目
export const selectRandomQuestions = (questions: Question[], count: number): Question[] => {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// 根据规则生成试卷
export const generateExamPaper = (questions: Question[], rule: ExamRule): GenerateResult => {
  try {
    // 筛选符合条件的题目
    const filteredQuestions = filterQuestionsByRule(questions, rule);
    
    if (filteredQuestions.length === 0) {
      return {
        success: false,
        message: '没有找到符合条件的题目，请检查筛选条件'
      };
    }
    
    // 按难度和题型分组
    const difficultyGroups = groupQuestionsByDifficulty(filteredQuestions);
    const typeGroups = groupQuestionsByType(filteredQuestions);
    
    const selectedQuestions: Question[] = [];
    const suggestions: string[] = [];
    
    // 按难度选择题目
    Object.entries(rule.difficultyDistribution).forEach(([difficulty, count]) => {
      const difficultyLevel = parseInt(difficulty) as DifficultyLevel;
      const availableQuestions = difficultyGroups[difficultyLevel];
      
      if (availableQuestions.length < count) {
        suggestions.push(`难度${difficultyLevel}的题目不足，需要${count}题，只有${availableQuestions.length}题`);
        selectedQuestions.push(...availableQuestions);
      } else {
        selectedQuestions.push(...selectRandomQuestions(availableQuestions, count));
      }
    });
    
    // 按题型选择题目（如果难度选择后题型分布不满足要求）
    const selectedTypeGroups = groupQuestionsByType(selectedQuestions);
    Object.entries(rule.typeDistribution).forEach(([type, count]) => {
      const questionType = type as QuestionType;
      const currentCount = selectedTypeGroups[questionType].length;
      
      if (currentCount < count) {
        const needed = count - currentCount;
        const availableOfType = typeGroups[questionType].filter(q => 
          !selectedQuestions.some(sq => sq.id === q.id)
        );
        
        if (availableOfType.length >= needed) {
          selectedQuestions.push(...selectRandomQuestions(availableOfType, needed));
        } else {
          suggestions.push(`${questionType}题型题目不足，需要${count}题，只有${currentCount + availableOfType.length}题`);
          selectedQuestions.push(...availableOfType);
        }
      }
    });
    
    // 如果总题数不足，补充其他题目
    if (selectedQuestions.length < rule.questionCount) {
      const remaining = rule.questionCount - selectedQuestions.length;
      const remainingQuestions = filteredQuestions.filter(q => 
        !selectedQuestions.some(sq => sq.id === q.id)
      );
      
      if (remainingQuestions.length >= remaining) {
        selectedQuestions.push(...selectRandomQuestions(remainingQuestions, remaining));
      } else {
        suggestions.push(`总题目数量不足，需要${rule.questionCount}题，只有${selectedQuestions.length + remainingQuestions.length}题`);
        selectedQuestions.push(...remainingQuestions);
      }
    }
    
    // 如果题目过多，随机减少
    if (selectedQuestions.length > rule.questionCount) {
      const shuffled = [...selectedQuestions].sort(() => Math.random() - 0.5);
      selectedQuestions.splice(0, selectedQuestions.length, ...shuffled.slice(0, rule.questionCount));
    }
    
    // 创建试卷
    const examPaper: ExamPaper = {
      id: generateId(),
      title: rule.name,
      description: rule.description,
      questions: selectedQuestions,
      totalScore: calculateTotalScore(selectedQuestions),
      timeLimit: rule.timeLimit,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };
    
    return {
      success: true,
      message: `成功生成试卷，共${selectedQuestions.length}题`,
      examPaper,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
    
  } catch (error) {
    return {
      success: false,
      message: `生成试卷时发生错误: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
};

// 验证答案
export const checkAnswer = (question: Question, userAnswer: string | string[]): boolean => {
  const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');
  const splitTokens = (v: string): string[] => v
    .replace(/[，、；]/g, ',')
    .split(',')
    .map(t => norm(t))
    .filter(Boolean);
  const caStr = String(question.correctAnswer);

  if (question.type === QuestionType.FILL_BLANK) {
    const corr = splitTokens(caStr);
    const ua = Array.isArray(userAnswer)
      ? userAnswer.map(a => norm(String(a))).filter(Boolean)
      : splitTokens(String(userAnswer));
    if (corr.length === 0) return ua.length === 0;
    if (corr.length === 1) return ua.includes(corr[0]);
    if (corr.length !== ua.length) return false;
    const setCorr = new Set(corr);
    for (const u of ua) {
      if (!setCorr.has(u)) return false;
    }
    return true;
  }

  if (question.type === QuestionType.MULTIPLE_CHOICE) {
    const parseCorr = (): string[] => {
      try {
        const parsed = JSON.parse(caStr);
        if (Array.isArray(parsed)) return parsed.map(x => norm(String(x))).filter(Boolean);
      } catch {}
      return caStr.split(/[，、；,\s]+/).map(x => norm(String(x))).filter(Boolean);
    };
    const corr = parseCorr();
    const uaArr = Array.isArray(userAnswer)
      ? userAnswer.map(x => norm(String(x))).filter(Boolean)
      : String(userAnswer).split(/[，、；,\s]+/).map(x => norm(String(x))).filter(Boolean);
    const isLetterCorr = corr.every(c => /^[a-d]$/i.test(c));
    if (isLetterCorr && Array.isArray(question.options) && question.options.length) {
      const letterize = (txt: string): string | null => {
        const idx = question.options.findIndex(o => norm(o) === txt);
        return idx >= 0 ? String.fromCharCode(65 + idx).toLowerCase() : null;
      };
      const uaLetters = uaArr
        .map(a => (/^[a-d]$/i.test(a) ? a.toLowerCase() : letterize(a)))
        .filter(Boolean) as string[];
      uaLetters.sort();
      const corrSorted = corr.map(c => c.toLowerCase()).sort();
      return JSON.stringify(uaLetters) === JSON.stringify(corrSorted);
    } else {
      uaArr.sort();
      corr.sort();
      return JSON.stringify(uaArr) === JSON.stringify(corr);
    }
  }

  if (question.type === QuestionType.SINGLE_CHOICE) {
    const ua = norm(String(userAnswer));
    const ca = norm(caStr);
    if (Array.isArray(question.options) && question.options.length) {
      if (/^[a-d]$/i.test(ca)) {
        const idx = ca.toUpperCase().charCodeAt(0) - 65;
        const corrText = question.options[idx] ? norm(question.options[idx]) : ca;
        if (/^[a-d]$/i.test(ua)) {
          return ua === ca;
        } else {
          return ua === corrText;
        }
      } else {
        if (/^[a-d]$/i.test(ua)) {
          const idx = ua.toUpperCase().charCodeAt(0) - 65;
          const uaText = question.options[idx] ? norm(question.options[idx]) : ua;
          return uaText === ca;
        } else {
          return ua === ca;
        }
      }
    }
    return ua === ca;
  }

  if (question.type === QuestionType.TRUE_FALSE) {
    const ua = norm(String(userAnswer));
    const ca = norm(caStr);
    const truthy = new Set(['true', '正确', '是', '对']);
    const falsy = new Set(['false', '错误', '否', '错']);
    return (truthy.has(ua) && truthy.has(ca)) || (falsy.has(ua) && falsy.has(ca)) || ua === ca;
  }

  return norm(caStr) === norm(String(userAnswer));
};

// 计算考试得分
export const calculateExamScore = (questions: Question[], answers: Record<string, string | string[]>): {
  totalScore: number;
  correctCount: number;
  totalCount: number;
  details: Array<{ questionId: string; isCorrect: boolean; score: number }>;
} => {
  const details: Array<{ questionId: string; isCorrect: boolean; score: number }> = [];
  let correctCount = 0;
  const totalCount = questions.length;
  const scorePerQuestion = 10; // 每题10分
  
  questions.forEach(question => {
    const userAnswer = answers[question.id];
    const isCorrect = userAnswer ? checkAnswer(question, userAnswer) : false;
    const score = isCorrect ? scorePerQuestion : 0;
    
    if (isCorrect) correctCount++;
    
    details.push({
      questionId: question.id,
      isCorrect,
      score
    });
  });
  
  const totalScore = correctCount * scorePerQuestion;
  
  return {
    totalScore,
    correctCount,
    totalCount,
    details
  };
};

