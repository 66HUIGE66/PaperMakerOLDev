import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// 题目类型映射
const QUESTION_TYPE_MAP: { [key: string]: string } = {
  '单选题': 'SINGLE_CHOICE',
  '多选题': 'MULTIPLE_CHOICE',
  '填空题': 'FILL_BLANK',
  '判断题': 'TRUE_FALSE',
  '简答题': 'SHORT_ANSWER'
};

// 难度映射
const DIFFICULTY_MAP: { [key: string]: string } = {
  '简单': 'EASY',
  '中等': 'MEDIUM',
  '困难': 'HARD'
};

export interface ParsedQuestion {
  title: string;
  type: string;
  difficulty: string;
  subject: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  tags?: string[];
}

export interface ParseResult {
  success: boolean;
  questions: ParsedQuestion[];
  errors: string[];
  totalCount: number;
}

/**
 * 解析Word文档中的题目
 */
export async function parseWordDocument(file: File): Promise<ParseResult> {
  const result: ParseResult = {
    success: false,
    questions: [],
    errors: [],
    totalCount: 0
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const html = htmlResult.value;
    
    // 将HTML转换为纯文本
    const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    
    // 解析题目
    const questions = parseQuestionsFromText(text);
    
    result.questions = questions;
    result.totalCount = questions.length;
    result.success = true;
    
    if (htmlResult.messages.length > 0) {
      result.errors = htmlResult.messages.map(msg => msg.message);
    }
    
  } catch (error: any) {
    result.errors.push(`Word文档解析失败: ${error.message}`);
  }

  return result;
}

/**
 * 解析Excel文档中的题目
 */
export async function parseExcelDocument(file: File): Promise<ParseResult> {
  const result: ParseResult = {
    success: false,
    questions: [],
    errors: [],
    totalCount: 0
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // 获取第一个工作表
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON格式
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // 解析题目数据
    const questions = parseQuestionsFromExcel(jsonData);
    
    result.questions = questions;
    result.totalCount = questions.length;
    result.success = true;
    
  } catch (error: any) {
    result.errors.push(`Excel文档解析失败: ${error.message}`);
  }

  return result;
}

/**
 * 从文本中解析题目
 */
function parseQuestionsFromText(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  // 按题目分割（以数字开头）
  const questionBlocks = text.split(/(?=\d+\.\s)/);
  
  for (const block of questionBlocks) {
    if (block.trim()) {
      const question = parseSingleQuestion(block.trim());
      if (question) {
        questions.push(question);
      }
    }
  }
  
  return questions;
}

/**
 * 解析单个题目
 */
function parseSingleQuestion(block: string): ParsedQuestion | null {
  try {
    // 提取题目标题
    const titleMatch = block.match(/^\d+\.\s(.+?)\【/);
    if (!titleMatch) return null;
    
    const title = titleMatch[1].trim();
    
    // 提取题目类型、难度、学科
    const typeMatch = block.match(/【(.+?)】/g);
    if (!typeMatch || typeMatch.length < 3) return null;
    
    const type = typeMatch[0].replace(/【|】/g, '');
    const difficulty = typeMatch[1].replace(/【|】/g, '');
    const subject = typeMatch[2].replace(/【|】/g, '');
    
    // 提取标签（如果有）
    const tags: string[] = [];
    if (typeMatch.length > 3) {
      for (let i = 3; i < typeMatch.length; i++) {
        tags.push(typeMatch[i].replace(/【|】/g, ''));
      }
    }
    
    // 提取选项（选择题）
    let options: string[] = [];
    if (type === '单选题' || type === '多选题') {
      // 查找题目标题后的选项部分
      const titleEndIndex = block.indexOf('】');
      if (titleEndIndex !== -1) {
        const afterTitle = block.substring(titleEndIndex + 1);
        // 查找选项部分（在答案详解之前）
        const beforeExplanation = afterTitle.split('答案详解')[0];
        const beforeAnswer = beforeExplanation.split('（')[0];
        
        // 尝试提取选项
        const optionText = beforeAnswer.trim();
        
        if (optionText) {
          const tempOptions: string[] = [];
          const markers: { char: string, index: number }[] = [];

          // 查找所有 A., B., C., D. 标记
          for (let i = 0; i < optionText.length; i++) {
            if (optionText[i] >= 'A' && optionText[i] <= 'D' && optionText[i + 1] === '.') {
              markers.push({ char: optionText[i], index: i });
            }
          }

          // 处理第一个选项，可能没有前缀（如 "上海B. 广州..."）
          if (markers.length > 0 && markers[0].index > 0) {
            const firstOptionContent = optionText.substring(0, markers[0].index).trim();
            if (firstOptionContent) {
              tempOptions.push(firstOptionContent);
            }
          } else if (markers.length === 0) {
            // 如果没有标记，将整个文本视为单个选项（或格式错误）
            const singleOptionContent = optionText.trim();
            if (singleOptionContent) {
              tempOptions.push(singleOptionContent);
            }
          }

          // 处理标记之间的选项
          for (let i = 0; i < markers.length; i++) {
            const marker = markers[i];
            const nextMarker = markers[i + 1];

            let endIndex = nextMarker ? nextMarker.index : optionText.length;
            
            // 提取标记之间的选项文本，跳过标记本身（如 "B. "）
            const startOfOptionContent = marker.index + 2; // +2 for "X."
            if (startOfOptionContent < endIndex) {
              const optionContent = optionText.substring(startOfOptionContent, endIndex).trim();
              if (optionContent) {
                tempOptions.push(optionContent);
              }
            }
          }
          options = tempOptions.filter(opt => opt.length > 0);
        }
      }
    }
    
    // 提取正确答案（字母，如 "C" 或 "A,C"）
    let rawCorrectAnswerLetters = block.match(/（(.+?)）/)?.[1];
    let correctAnswerText = '';

    if (type === '单选题' || type === '多选题') {
      if (rawCorrectAnswerLetters) {
        const answerLetters = rawCorrectAnswerLetters.split(',').map(s => s.trim().toUpperCase());
        const mappedOptions = options.map((opt, idx) => ({
          letter: String.fromCharCode(65 + idx), // A, B, C, D...
          text: opt
        }));

        const foundAnswers: string[] = [];
        for (const letter of answerLetters) {
          const matchingOption = mappedOptions.find(opt => opt.letter === letter);
          if (matchingOption) {
            foundAnswers.push(matchingOption.text);
          } else {
            console.warn(`题目 "${title}" 的正确答案 "${letter}" 未找到对应选项`);
          }
        }
        correctAnswerText = foundAnswers.join(','); // 对于多选题，用逗号连接
      } else {
        console.warn(`题目 "${title}" 缺少正确答案`);
        correctAnswerText = rawCorrectAnswerLetters || '';
      }
    } else {
      // 对于非选择题，答案直接在括号中
      correctAnswerText = rawCorrectAnswerLetters || '';
      if (!correctAnswerText) {
        console.warn(`题目 "${title}" 缺少正确答案`);
      }
    }
    
    // 提取答案详解
    const explanationMatch = block.match(/答案详解：(.+?)(?=\n|$)/);
    const explanation = explanationMatch ? explanationMatch[1].trim() : '';
    
    return {
      title,
      type: QUESTION_TYPE_MAP[type] || 'SINGLE_CHOICE',
      difficulty: DIFFICULTY_MAP[difficulty] || 'EASY',
      subject,
      options: options.length > 0 ? options : undefined,
      correctAnswer: correctAnswerText,
      explanation,
      tags: tags.length > 0 ? tags : undefined
    };
    
  } catch (error) {
    console.error('解析题目失败:', error);
    return null;
  }
}

/**
 * 从Excel数据中解析题目
 */
function parseQuestionsFromExcel(data: any[][]): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  // 假设第一行是标题行
  if (data.length < 2) return questions;
  
  const headers = data[0];
  const rows = data.slice(1);
  
  for (const row of rows) {
    if (row.length === 0) continue;
    
    try {
      const question: ParsedQuestion = {
        title: row[0] || '',
        type: QUESTION_TYPE_MAP[row[1]] || 'SINGLE_CHOICE',
        difficulty: DIFFICULTY_MAP[row[2]] || 'EASY',
        subject: row[3] || '',
        correctAnswer: row[4] || '',
        explanation: row[5] || ''
      };
      
      // 处理选项（如果有）
      if (row[6]) {
        const optionsStr = row[6];
        if (optionsStr.includes('|')) {
          question.options = optionsStr.split('|').map(opt => opt.trim());
        }
      }
      
      // 处理标签（如果有）
      if (row[7]) {
        const tagsStr = row[7];
        if (tagsStr.includes(',')) {
          question.tags = tagsStr.split(',').map(tag => tag.trim());
        }
      }
      
      if (question.title && question.correctAnswer) {
        questions.push(question);
      }
      
    } catch (error) {
      console.error('解析Excel行失败:', error);
    }
  }
  
  return questions;
}

/**
 * 验证解析的题目数据
 */
export function validateQuestions(questions: ParsedQuestion[]): { valid: ParsedQuestion[], invalid: string[] } {
  const valid: ParsedQuestion[] = [];
  const invalid: string[] = [];
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const errors: string[] = [];
    
    if (!question.title || question.title.trim() === '') {
      errors.push('题目标题不能为空');
    }
    
    if (!question.type) {
      errors.push('题目类型不能为空');
    }
    
    if (!question.difficulty) {
      errors.push('难度等级不能为空');
    }
    
    if (!question.correctAnswer || question.correctAnswer.trim() === '') {
      errors.push('正确答案不能为空');
    }
    
    if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') {
      if (!question.options || question.options.length === 0) {
        errors.push('选择题必须提供选项');
      }
    }
    
    if (errors.length === 0) {
      valid.push(question);
    } else {
      invalid.push(`题目${i + 1}: ${errors.join(', ')}`);
    }
  }
  
  return { valid, invalid };
}

























































