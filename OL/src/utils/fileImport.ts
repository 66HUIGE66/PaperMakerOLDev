import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Question, QuestionType, DifficultyLevel, ImportResult } from '../types';
import { generateId } from './index';

// 解析Word文档
export const parseWordDocument = async (file: File): Promise<ImportResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    // 简单的题目解析逻辑（可以根据实际Word格式调整）
    const questions = parseTextToQuestions(text);
    
    return {
      success: true,
      message: `成功导入${questions.length}道题目`,
      totalCount: questions.length,
      successCount: questions.length,
      errorCount: 0,
      importedCount: questions.length,
      failedCount: 0,
      errors: [],
      questions: questions
    };
  } catch (error) {
    return {
      success: false,
      message: `导入Word文档失败: ${error instanceof Error ? error.message : '未知错误'}`,
      totalCount: 0,
      successCount: 0,
      errorCount: 1,
      importedCount: 0,
      failedCount: 0,
      errors: [error instanceof Error ? error.message : '未知错误']
    };
  }
};

// 解析Excel文档
export const parseExcelDocument = async (file: File): Promise<ImportResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    const questions: Question[] = [];
    const errors: string[] = [];
    
    jsonData.forEach((row: any, index: number) => {
      try {
        const question = parseExcelRowToQuestion(row, index + 1);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        errors.push(`第${index + 1}行解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    });
    
    return {
      success: questions.length > 0,
      message: `成功导入${questions.length}道题目，失败${errors.length}道`,
      totalCount: questions.length + errors.length,
      successCount: questions.length,
      errorCount: errors.length,
      importedCount: questions.length,
      failedCount: errors.length,
      errors,
      questions: questions
    };
  } catch (error) {
    return {
      success: false,
      message: `导入Excel文档失败: ${error instanceof Error ? error.message : '未知错误'}`,
      totalCount: 0,
      successCount: 0,
      errorCount: 1,
      importedCount: 0,
      failedCount: 0,
      errors: [error instanceof Error ? error.message : '未知错误']
    };
  }
};

// 解析文本为题目数组（基于新的Word格式规范）
const parseTextToQuestions = (text: string): Question[] => {
  const questions: Question[] = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  let currentQuestion: Partial<Question> | null = null;
  let questionIndex = 0;
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // 跳过空行和说明文字
    if (!line || isInstructionText(line)) {
      i++;
      continue;
    }
    
    // 检测题目开始 - 匹配格式：数字. 题干【题型】【难度】
    const questionMatch = line.match(/^(\d+)[.、．]\s*(.+?)\s*【(.+?)】\s*【(.+?)】/);
    if (questionMatch) {
      // 保存上一个题目
      if (currentQuestion && currentQuestion.title) {
        questions.push(createQuestionFromPartial(currentQuestion, questionIndex++));
      }
      
      // 解析新题目
      const [, , title, typeStr, difficultyStr] = questionMatch;
      
      // 解析题型
      const type = parseQuestionType(typeStr);
      const difficulty = parseDifficulty(difficultyStr);
      
      currentQuestion = {
        title: title.trim(),
        type: type,
        difficulty: difficulty,
        knowledgePoints: [],
        tags: [],
        correctAnswer: '',
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      };
      
      i++;
      continue;
    }
    
    // 如果当前有题目在处理
    if (currentQuestion) {
      // 检测选项（A. 选项内容）
      if (/^[A-Z][\.、:：]\s*/.test(line)) {
        if (!currentQuestion.options) {
          currentQuestion.options = [];
        }
        const optionText = line.replace(/^[A-Z][\.、:：]\s*/, '').trim();
        if (optionText) {
          currentQuestion.options.push(optionText);
        }
      }
      // 检测答案（用括号括起来的答案）
      else if (/^[（(]/.test(line) && /[）)]/.test(line)) {
        const answerMatch = line.match(/^[（(](.+?)[）)]/);
        if (answerMatch) {
          currentQuestion.correctAnswer = answerMatch[1].trim();
        }
      }
      // 检测答案详解
      else if (line.includes('答案详解') || line.includes('解析')) {
        const explanationMatch = line.match(/^(答案详解|解析)[:：]\s*(.+)/);
        if (explanationMatch) {
          currentQuestion.explanation = explanationMatch[2].trim();
        }
      }
    }
    
    i++;
  }
  
  // 添加最后一个题目
  if (currentQuestion && currentQuestion.title) {
    questions.push(createQuestionFromPartial(currentQuestion, questionIndex));
  }
  
  return questions;
};

// 解析题型
const parseQuestionType = (typeStr: string): QuestionType => {
  const type = typeStr.trim();
  if (type.includes('单选') || type === '单选题') {
    return QuestionType.SINGLE_CHOICE;
  } else if (type.includes('多选') || type === '多选题') {
    return QuestionType.MULTIPLE_CHOICE;
  } else if (type.includes('填空') || type === '填空题') {
    return QuestionType.FILL_BLANK;
  } else if (type.includes('判断') || type === '判断题') {
    return QuestionType.TRUE_FALSE;
  } else if (type.includes('简答') || type === '简答题') {
    return QuestionType.SHORT_ANSWER;
  } else {
    return QuestionType.SINGLE_CHOICE; // 默认单选题
  }
};

// 解析难度等级
const parseDifficulty = (difficultyStr: string): DifficultyLevel => {
  const difficulty = difficultyStr.trim();
  if (difficulty.includes('简单') || difficulty === '简单') {
    return DifficultyLevel.EASY;
  } else if (difficulty.includes('中等') || difficulty === '中等') {
    return DifficultyLevel.MEDIUM;
  } else if (difficulty.includes('困难') || difficulty === '困难') {
    return DifficultyLevel.HARD;
  } else if (difficulty.includes('专家') || difficulty === '专家') {
    return DifficultyLevel.EXPERT;
  } else {
    return DifficultyLevel.MEDIUM; // 默认中等难度
  }
};

// 检查是否是说明文字
const isInstructionText = (text: string): boolean => {
  const instructionKeywords = [
    '听下面', '每段对话', '从题中所给', '听完每段对话', '你都有', '每段对话仅读一遍',
    '第一节', '第二节', '共', '小题', '每小题', '分', '满分', '听下面', '对话', '选项', '选出', '最佳选项',
    '阅读下列短文', '从每题所给', '四个选项中', '选出最佳答案', '第二部分', '第三部分', '第四部分',
    '语言运知识用', '写作', '听力', '阅读理解', '普通高等学校', '招生全国统一考试', '英语试题',
    '听第', '段材料', '回答第', '至', '题', '阅读下面短文', '从短文后的选项中', '可以填入空白处',
    '选项中有两项为多余选项', '阅读下面短文', '在空白处填入', '个适当的单词', '括号内单词的正确形式',
    '假定你是', '给', '写一封邮件', '分享这次经历', '内容包括', '注意', '写作词数应为', '个左右',
    '请按如下格式', '在答题纸的相应位置作答', '阅读下面材料', '根据其内容和所给段落开头语续写',
    '使之构成一篇完整的短文', '续写词数应为', '请按如下格式在答题卡的相应位置作答'
  ];
  
  for (const keyword of instructionKeywords) {
    if (text.includes(keyword)) {
      return true;
    }
  }
  
  // 检查是否是标题行
  if (/^[A-Z].*/.test(text) && text.length < 50) {
    return true;
  }
  
  return false;
};


// 解析Excel行数据为题目
const parseExcelRowToQuestion = (row: any, _: number): Question | null => {
  const requiredFields = ['title', 'type', 'difficulty', 'correctAnswer'];
  
  // 检查必需字段
  for (const field of requiredFields) {
    if (!row[field] && !row[field.toLowerCase()]) {
      throw new Error(`缺少必需字段: ${field}`);
    }
  }
  
  const title = row.title || row['题目'] || row['问题'];
  const typeStr = (row.type || row['题型'] || row['类型']).toString().toLowerCase();
  const difficultyStr = (row.difficulty || row['难度'] || '2').toString();
  const correctAnswer = row.correctAnswer || row['答案'] || row['正确答案'];
  
  // 解析题型
  let type: QuestionType;
  if (typeStr.includes('单选') || typeStr.includes('single') || typeStr === 'single_choice') {
    type = QuestionType.SINGLE_CHOICE;
  } else if (typeStr.includes('多选') || typeStr.includes('multiple') || typeStr === 'multiple_choice') {
    type = QuestionType.MULTIPLE_CHOICE;
  } else if (typeStr.includes('填空') || typeStr.includes('fill') || typeStr === 'fill_blank') {
    type = QuestionType.FILL_BLANK;
  } else if (typeStr.includes('判断') || typeStr.includes('true') || typeStr === 'true_false') {
    type = QuestionType.TRUE_FALSE;
  } else if (typeStr.includes('简答') || typeStr.includes('short') || typeStr === 'short_answer') {
    type = QuestionType.SHORT_ANSWER;
  } else if (typeStr.includes('论述') || typeStr.includes('essay') || typeStr === 'essay') {
    type = QuestionType.ESSAY;
  } else {
    type = QuestionType.SINGLE_CHOICE; // 默认
  }
  
  // 解析难度
  let difficulty: DifficultyLevel;
  if (difficultyStr.includes('1') || difficultyStr.includes('简单') || difficultyStr.includes('easy') || difficultyStr === '1') {
    difficulty = DifficultyLevel.EASY;
  } else if (difficultyStr.includes('2') || difficultyStr.includes('中等') || difficultyStr.includes('medium') || difficultyStr === '2') {
    difficulty = DifficultyLevel.MEDIUM;
  } else if (difficultyStr.includes('3') || difficultyStr.includes('困难') || difficultyStr.includes('hard') || difficultyStr === '3') {
    difficulty = DifficultyLevel.HARD;
  } else if (difficultyStr.includes('4') || difficultyStr.includes('专家') || difficultyStr.includes('expert') || difficultyStr === '4') {
    difficulty = DifficultyLevel.EXPERT;
  } else {
    difficulty = DifficultyLevel.MEDIUM; // 默认
  }
  
  // 解析选项
  const options: string[] = [];
  
  // 尝试多种可能的选项列名格式
  const optionKeys = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', // 标准选项列名
    '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '选项G', '选项H', // 中文选项列名
    'optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'optionF', 'optionG', 'optionH', // 英文选项列名
    '选项1', '选项2', '选项3', '选项4', '选项5', '选项6', '选项7', '选项8', // 数字选项列名
    'option1', 'option2', 'option3', 'option4', 'option5', 'option6', 'option7', 'option8' // 英文数字选项列名
  ];
  
  // 按优先级顺序查找选项
  for (const key of optionKeys) {
    const option = row[key];
    if (option && option.toString().trim()) {
      let optionText = option.toString().trim();
      
      // 清理选项文本，移除可能的前缀
      // 处理 "A. 内容" 或 "选项A: 内容" 等格式
      optionText = optionText.replace(/^[A-Z][\.、:：]\s*/, ''); // 移除 A. 或 A、 或 A: 前缀
      optionText = optionText.replace(/^选项[A-Z][\.、:：]\s*/, ''); // 移除 选项A. 前缀
      optionText = optionText.replace(/^option[A-Z][\.、:：]\s*/i, ''); // 移除 optionA. 前缀
      optionText = optionText.replace(/^\d+[\.、:：]\s*/, ''); // 移除 1. 或 1、 前缀
      optionText = optionText.replace(/^选项\d+[\.、:：]\s*/, ''); // 移除 选项1. 前缀
      optionText = optionText.replace(/^option\d+[\.、:：]\s*/i, ''); // 移除 option1. 前缀
      
      if (optionText) {
        options.push(optionText);
      }
    }
  }
  
  // 如果上述方法没有找到选项，尝试按数字索引查找
  if (options.length === 0) {
    for (let i = 1; i <= 10; i++) {
      const option = row[`option${i}`] || row[`选项${i}`];
      if (option && option.toString().trim()) {
        options.push(option.toString().trim());
      }
    }
  }
  
  // 解析知识点
  const knowledgePointsStr = row.knowledgePoints || row['知识点'] || row['知识要点'] || '';
  const knowledgePoints = knowledgePointsStr ? 
    knowledgePointsStr.split(/[,，;；]/).map((kp: string) => kp.trim()).filter((kp: string) => kp) : [];
  
  // 解析标签
  const tagsStr = row.tags || row['标签'] || row['分类'] || '';
  const tags = tagsStr ? 
    tagsStr.split(/[,，;；]/).map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];
  
  const question: Question = {
    id: generateId(),
    title: title.trim(),
    type,
    difficulty,
    knowledgePoints,
    tags,
    options: options.length > 0 ? options : undefined,
    correctAnswer: correctAnswer.toString().trim(),
    explanation: row.explanation || row['解析'] || row['解释'] || undefined,
    source: row.source || row['来源'] || undefined,
    creatorId: 1,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  };
  
  return question;
};

// 从部分题目对象创建完整题目
const createQuestionFromPartial = (partial: Partial<Question>, index: number): Question => {
  return {
    id: generateId(),
    title: partial.title || `题目${index + 1}`,
    type: partial.type || QuestionType.SINGLE_CHOICE,
    difficulty: partial.difficulty || DifficultyLevel.MEDIUM,
    knowledgePoints: partial.knowledgePoints || [],
    tags: partial.tags || [],
    options: partial.options,
    correctAnswer: partial.correctAnswer || '',
    explanation: partial.explanation,
    source: partial.source,
    creatorId: 1,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  };
};


