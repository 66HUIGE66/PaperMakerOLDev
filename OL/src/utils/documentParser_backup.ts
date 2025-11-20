import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// 题目类型映射
const QUESTION_TYPE_MAP: { [key: string]: string } = {
  '单选题': 'SINGLE_CHOICE',
  '多选题': 'MULTIPLE_CHOICE',
  '填空题': 'FILL_BLANK',
  '判断题': 'TRUE_FALSE',
  '简答题': 'SHORT_ANSWER',
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
      // 尝试多种选项格式
      let optionMatches: string[] | null = null;
      
      // 格式1：每行一个选项（A. 选项1\nB. 选项2）
      optionMatches = block.match(/[A-D]\.\s(.+?)(?=\n|$)/g);
      
      // 格式2：连续格式（A. 选项1B. 选项2C. 选项3）
      if (!optionMatches || optionMatches.length === 0) {
        // 处理类似 "上海B. 广州C. 北京D. 深圳" 的格式
        optionMatches = block.match(/[A-D]\.\s[^A-D]+(?=[A-D]\.|（|$)/g);
        
        // 如果还是没有匹配到，尝试更宽松的匹配
        if (!optionMatches || optionMatches.length === 0) {
          // 查找所有包含选项标识符的文本
          const optionText = block.match(/[A-D]\.\s[^（]*?(?=（|答案详解|$)/);
          if (optionText) {
            // 手动分割选项
            const text = optionText[0];
            const options: string[] = [];
            
            // 查找所有A. B. C. D. 的位置
            const positions: { letter: string; index: number }[] = [];
            for (let i = 0; i < text.length; i++) {
              if (text[i] >= 'A' && text[i] <= 'D' && text[i + 1] === '.') {
                positions.push({ letter: text[i], index: i });
              }
            }
            
            // 根据位置分割选项
            for (let i = 0; i < positions.length; i++) {
              const start = positions[i].index + 2; // 跳过 "A." 或 "B." 等
              const end = i < positions.length - 1 ? positions[i + 1].index : text.length;
              const option = text.substring(start, end).trim();
              if (option) {
                options.push(option);
              }
            }
            
            if (options.length > 0) {
              optionMatches = options.map(opt => opt);
            }
          }
        }
      }
      
      // 格式3：更宽松的匹配（处理可能的格式变化）
      if (!optionMatches || optionMatches.length === 0) {
        // 查找所有A. B. C. D. 开头的选项
        const optionPattern = /[A-D]\.\s[^A-D]*?(?=[A-D]\.|（|答案详解|$)/g;
        optionMatches = block.match(optionPattern);
      }
      
      if (optionMatches && optionMatches.length > 0) {
        options = optionMatches.map(opt => {
          // 移除选项标识符（A. B. C. D.）
          let cleanOption = opt.replace(/^[A-D]\.\s*/, '').trim();
          // 移除可能的后续选项标识符
          cleanOption = cleanOption.replace(/[A-D]\.\s*$/, '').trim();
          return cleanOption;
        }).filter(opt => opt.length > 0);
      }
      
      // 如果仍然没有找到选项，尝试从整个文本中提取
      if (options.length === 0) {
        // 查找题目标题后的选项部分
        const titleEndIndex = block.indexOf('】');
        if (titleEndIndex !== -1) {
          const afterTitle = block.substring(titleEndIndex + 1);
          // 查找选项部分（在答案详解之前）
          const beforeExplanation = afterTitle.split('答案详解')[0];
          const beforeAnswer = beforeExplanation.split('（')[0];
          
          // 尝试提取选项
          const optionText = beforeAnswer.trim();
          console.log('选项文本:', optionText);
          
          if (optionText) {
            // 处理连续格式的选项，如 "上海B. 广州C. 北京D. 深圳"
            // 首先查找所有选项标识符的位置
            const optionPositions: { letter: string; index: number }[] = [];
            for (let i = 0; i < optionText.length; i++) {
              if (optionText[i] >= 'A' && optionText[i] <= 'D' && optionText[i + 1] === '.') {
                optionPositions.push({ letter: optionText[i], index: i });
              }
            }
            
            console.log('选项位置:', optionPositions);
            
            if (optionPositions.length > 0) {
              // 根据位置分割选项
              for (let i = 0; i < optionPositions.length; i++) {
                const start = optionPositions[i].index + 2; // 跳过 "A." 或 "B." 等
                const end = i < optionPositions.length - 1 ? optionPositions[i + 1].index : optionText.length;
                const option = optionText.substring(start, end).trim();
                if (option) {
                  options.push(option);
                }
              }
            } else {
              // 如果没找到选项标识符，尝试按A. B. C. D. 分割
              const parts = optionText.split(/(?=[A-D]\.)/);
              console.log('分割后的部分:', parts);
              
              options = parts
                .map(part => part.replace(/^[A-D]\.\s*/, '').trim())
                .filter(part => part.length > 0);
            }
            
            console.log('最终选项:', options);
          }
        }
      }
      
      console.log('解析的选项:', options);
    }
    
    // 提取正确答案
    const answerMatch = block.match(/（(.+?)）/);
    if (!answerMatch) return null;
    
    let correctAnswer = answerMatch[1].trim();
    
    // 处理多选题答案格式（A,C -> A,C）
    if (type === '多选题' && correctAnswer.includes(',')) {
      correctAnswer = correctAnswer.replace(/\s/g, '');
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
      correctAnswer,
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
