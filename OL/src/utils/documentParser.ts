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
  knowledgePoint: string; // 知识点（新增）
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
    
    // 将HTML转换为保留换行的纯文本
    const text = html
      // 将常见块级元素置换为换行，避免段落被粘连
      .replace(/<(p|div|h[1-6]|li|tr|table|ul|ol)[^>]*>/gi, '\n')
      .replace(/<br\s*\/?>(\s*)/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '') // 移除其余标签
      .replace(/&nbsp;/g, ' ')
      .replace(/\r/g, '')
      .replace(/\n{2,}/g, '\n') // 折叠多余空行
      .trim();
    
    // 解析题目
    const questions = parseQuestionsFromText(text);
    console.log( 'questions===', questions)
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
  // 仅在“数字+分隔符+标题+【”的题目起始处切分，避免在简答题正文的“1.”、“2.”等处被误切
  // 示例：1. 题干内容【单选题】【简单】【学科】【知识点】...
  const questionBlocks = text.split(/(?=^\s*\d+[\.、\u3001\uFF0E]\s*[^\n]*?【)/m);
  for (let idx = 0; idx < questionBlocks.length; idx++) {
    const head = questionBlocks[idx].slice(0, 30).replace(/\n/g, '\\n');
    console.log(`block[${idx}]===`, head);
  }
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
  // 调试输出
  console.log('block原文：', block);
  const codepoints = Array.from(block)
    .map(c => {
      const cp = c.codePointAt(0) ?? 0;
      return c + '(U+' + cp.toString(16).toUpperCase().padStart(4, '0') + ')';
    })
    .join(' ');
  console.log('block字符及unicode：', codepoints);
  let title = '';
  let type = '';
  let difficulty = '';
  let subject = '';
  let knowledgePoint = '';
  let tags: string[] = [];
  let options: string[] = [];
  let correctAnswerText = '';
  let explanation = '';
  let rawCorrectAnswer: string | undefined = undefined;

  // 标题、标签
  const titleMatch = block.match(/^\s*\d+[\.、\u3001\uFF0E]\s*(.+?)【/);
  if (!titleMatch) return null;
  title = titleMatch[1].trim();
  const typeMatch = block.match(/【(.+?)】/g);
  if (!typeMatch || typeMatch.length < 4) return null;
  type = typeMatch[0].replace(/【|】/g, '').trim();
  difficulty = typeMatch[1].replace(/【|】/g, '').trim();
  subject = typeMatch[2].replace(/【|】/g, '').trim();
  knowledgePoint = typeMatch[3].replace(/【|】/g, '').trim();
  if (typeMatch.length > 4) {
    for (let i = 4; i < typeMatch.length; i++) {
      tags.push(typeMatch[i].replace(/【|】/g, '').trim());
    }
  }

  // 注意：简答题的解析逻辑移到后面统一处理，这里不再提前返回

  // 选项解析（分区块，精准截断）
  if (type === '单选题' || type === '多选题') {
    const titleEndIndex = block.indexOf('】');
    if (titleEndIndex !== -1) {
      const afterTitle = block.substring(titleEndIndex + 1);
      let optionAreaEnd = afterTitle.length;
      
      // 更智能地查找选项区域的结束位置
      // 1. 查找答案标记（"答案："后面的内容，包括括号）
      // 优先匹配：答案：后面跟括号（可能是答案）
      const answerPatterns = [
        /\n\s*答案[:：]\s*[（(]/,  // 换行后的"答案："+括号
        /\n\s*答案[:：]\s*[A-Z]/,  // 换行后的"答案："+字母（少见但可能）
        /^答案[:：]\s*[（(]/,      // 行首的"答案："+括号
        /^答案[:：]\s*[A-Z]/,      // 行首的"答案："+字母
      ];
      
      for (const pattern of answerPatterns) {
        const match = afterTitle.match(pattern);
        if (match && match.index !== undefined && match.index < optionAreaEnd) {
          optionAreaEnd = match.index;
        }
      }
      
      // 2. 查找解析标记（"解析："、"详解："或大括号）
      const explanationPatterns = [
        /\n\s*解析[:：]/,
        /\n\s*详解[:：]/,
        /\n\s*\{/,
        /^解析[:：]/,
        /^详解[:：]/,
        /^\{/,
      ];
      
      for (const pattern of explanationPatterns) {
        const match = afterTitle.match(pattern);
        if (match && match.index !== undefined && match.index < optionAreaEnd) {
          optionAreaEnd = match.index;
        }
      }
      
      // 3. 查找单独的答案括号（格式：单独的"（答案内容）"或"(答案内容)"，前面没有选项字母）
      // 前端不支持负向前瞻，改用更精确的匹配
      // 匹配：换行后的独立括号（不是选项内容的一部分）
      const standaloneAnswerPatterns = [
        /\n\s+[（(][A-Z][）)]/,  // 换行后跟独立括号，内容是单个字母（如换行后的"(B)"）
        /\n\s+[（(][A-Z,，]+[）)]/,  // 换行后跟独立括号，内容是多个字母（如换行后的"(A,B)"）
      ];
      
      for (const pattern of standaloneAnswerPatterns) {
        const match = afterTitle.match(pattern);
        if (match && match.index !== undefined && match.index < optionAreaEnd) {
          // 验证这个括号前面确实是选项字母或换行，而不是选项内容
          const beforeMatch = afterTitle.substring(Math.max(0, match.index - 50), match.index);
          // 如果前面有选项字母模式（如"A."、"B."等），说明可能是选项内容，跳过
          if (!/[A-Z]\.\s/.test(beforeMatch)) {
            optionAreaEnd = match.index;
            break;
          }
        }
      }
      
      const optionArea = afterTitle.substring(0, optionAreaEnd);
      console.log(`[选项解析] 选项区域结束位置: ${optionAreaEnd}, 选项区域长度: ${optionArea.length}`);
      console.log(`[选项解析] 选项区域内容: "${optionArea.substring(0, Math.min(200, optionArea.length))}"`);
      
      // A. ... B. ... Z. ...正则 (跨多行，允许选项内容包含括号)
      // 改进正则：选项内容可以包含括号、换行等，直到下一个选项字母或结束
      const optionReg = /([A-Z])\.\s*([\s\S]*?)(?=\n\s*[A-Z]\.\s|$)/g;
      let match;
      let opts: string[] = [];
      while ((match = optionReg.exec(optionArea)) !== null) {
        // 保留选项内容中的所有字符，包括括号
        let optionText = match[2].replace(/[\r\n]+$/, '').trim();
        opts.push(optionText);
      }
      options = opts;
      console.log(`[选项解析] 解析出 ${opts.length} 个选项:`, options);
    }
  }

  // 提取答案：优先从"答案："后面的括号中提取
  // 格式：答案：（答案内容） 或 答案：(答案内容)
  // 支持多行答案（简答题可能有多行）
  // 使用括号匹配方法，支持嵌套括号和多行内容
  
  // 尝试匹配：答案：（或答案：( 到对应的闭合括号
  const answerStartPattern = /答案[:：]\s*([（(])/;
  const answerStartMatch = block.match(answerStartPattern);
  
  if (answerStartMatch && answerStartMatch.index !== undefined && answerStartMatch[1]) {
    // answerStartMatch[1] 是捕获的括号字符（全角或半角）
    const bracketChar = answerStartMatch[1];
    const isFullWidth = bracketChar === '（';
    const openingBracket = isFullWidth ? '（' : '(';
    const closingBracket = isFullWidth ? '）' : ')';
    
    // 找到开括号的位置（在"答案："后面）
    const bracketStartIndex = answerStartMatch.index + answerStartMatch[0].length - 1; // 减1因为括号是匹配的最后一位
    const remainingText = block.substring(bracketStartIndex + 1); // 从开括号后开始
    
    // 查找匹配的闭合括号（支持嵌套括号）
    let depth = 1; // 已经有一个开括号
    let endPos = -1;
    
    // 从开括号后的第一个字符开始遍历
    for (let i = 0; i < remainingText.length; i++) {
      const char = remainingText[i];
      if (char === openingBracket) {
        depth++;
      } else if (char === closingBracket) {
        depth--;
        if (depth === 0) {
          endPos = i;
          break;
        }
      }
    }
    
    if (endPos !== -1) {
      rawCorrectAnswer = remainingText.substring(0, endPos).trim(); // 从开括号后到闭括号前的内容
      console.log(`[答案提取] 从"答案："提取成功: "${rawCorrectAnswer}"`);
    } else {
      console.warn(`[答案提取] 从"答案："提取失败：未找到匹配的闭合括号。开括号位置: ${bracketStartIndex}, 剩余文本长度: ${remainingText.length}`);
    }
  }
  
  // 如果没有找到，尝试查找单独的答案括号（不在"答案："后面的）
  // 这种情况通常出现在格式不规范的文档中
  if (!rawCorrectAnswer) {
    // 查找换行后的独立括号，使用括号匹配方法支持嵌套括号
    // 查找模式：换行+空格+开括号（全角或半角）
    const standaloneAnswerPattern = /\n\s*([（(])/;
    const standaloneMatch = block.match(standaloneAnswerPattern);
    
    if (standaloneMatch && standaloneMatch.index !== undefined) {
      const bracketStartIndex = standaloneMatch.index + standaloneMatch[0].length - 1; // 括号位置
      const bracketChar = block[bracketStartIndex];
      const isFullWidth = bracketChar === '（' || bracketChar === '）';
      const openingBracket = isFullWidth ? '（' : '(';
      const closingBracket = isFullWidth ? '）' : ')';
      
      // 验证前面不是选项字母模式（避免误匹配选项内容中的括号）
      const beforeMatch = block.substring(Math.max(0, bracketStartIndex - 50), bracketStartIndex);
      if (!/[A-Z]\.\s/.test(beforeMatch)) {
        // 从开括号开始查找匹配的闭合括号（支持嵌套）
        let depth = 1;
        let endPos = -1;
        for (let i = bracketStartIndex + 1; i < block.length; i++) {
          if (block[i] === openingBracket) {
            depth++;
          } else if (block[i] === closingBracket) {
            depth--;
            if (depth === 0) {
              endPos = i;
              break;
            }
          }
        }
        
        if (endPos !== -1) {
          rawCorrectAnswer = block.substring(bracketStartIndex + 1, endPos).trim();
          console.log(`[答案提取] 从独立括号提取成功: "${rawCorrectAnswer}"`);
        }
      }
    }
  }

  // 填空题特殊答案策略
  if (type === '填空题' || type === 'FILL_BLANK') {
    // 优先从"答案："后面提取
    if (rawCorrectAnswer) {
      correctAnswerText = rawCorrectAnswer;
    } else {
      // 下划线
      let underline = block.match(/_{2,}([^\n]*)/);
      if (underline && underline[1]) {
        correctAnswerText = underline[1].replace(/\s/g, '');
      }
    }
  }

  // default，赋值
  if (!correctAnswerText && rawCorrectAnswer) correctAnswerText = rawCorrectAnswer;

  // 单/多选题答案：保留为选项字母（A、B、C等）
  if ((type === '单选题' || type === '多选题') && rawCorrectAnswer) {
    console.log(`[单选题/多选题] 原始答案: "${rawCorrectAnswer}", 选项数量: ${options.length}`);
    
    if (options.length === 0) {
      console.error(`[单选题/多选题] 错误：题目 "${title}" 没有选项，无法验证答案`);
      // 即使没有选项，也保留原始答案
      correctAnswerText = rawCorrectAnswer.replace(/[()（）\s]/g, '').toUpperCase();
    } else {
      let answerLetters = rawCorrectAnswer
        .replace(/[()（）\s]/g, '')
        .toUpperCase()
        .split(/[,，、]/)
        .filter(Boolean);
      // 如果答案是连续字母（如"ABD"），需要拆分
      if (answerLetters.length === 1 && answerLetters[0].length > 1) {
        answerLetters = answerLetters[0].split('');
      }
      // 验证选项字母是否在有效范围内
      const mappedOptions = options.map((opt, idx) => ({
        letter: String.fromCharCode(65 + idx),
        text: opt
      }));
      const validLetters: string[] = [];
      for (const letter of answerLetters) {
        const foundOpt = mappedOptions.find(opt => opt.letter === letter);
        if (foundOpt) {
          validLetters.push(letter);
        } else {
          console.warn(`题目 "${title}" 的正确答案 "${letter}" 未找到对应选项`);
        }
      }
      // 保留选项字母，用逗号连接（如 "A" 或 "A,B,C"）
      correctAnswerText = validLetters.join(',');
      console.log(`[单选题/多选题] 最终答案: "${correctAnswerText}"`);
    }
  }
  
  // 判断题题型答案赋为true/false
  if ((type === '判断题' || type === 'TRUE_FALSE') && rawCorrectAnswer) {
    const answerValue = rawCorrectAnswer.trim();
    if (answerValue === '√' || answerValue.toLowerCase() === 'true' || answerValue === '正确') {
      correctAnswerText = 'true';
    } else if (answerValue === '×' || answerValue === '✗' || answerValue.toLowerCase() === 'false' || answerValue === '错误') {
      correctAnswerText = 'false';
    }
  }
  
  // 简答题答案处理：答案在"答案："后面的括号中，可能是多行
  if ((type === '简答题' || type === 'SHORT_ANSWER') && rawCorrectAnswer) {
    correctAnswerText = rawCorrectAnswer;
  }
  
  // 提取解析内容：从"答案解析："后面的大括号中提取
  // 格式：答案解析：{解析内容}
  // 支持多行解析内容（可能包含括号）
  const explanationStartPattern = /答案解析[:：]\s*\{/;
  const explanationStartMatch = block.match(explanationStartPattern);
  
  if (explanationStartMatch && explanationStartMatch.index !== undefined) {
    const startPos = explanationStartMatch.index + explanationStartMatch[0].length;
    const remainingText = block.substring(startPos);
    
    // 查找匹配的闭合大括号（支持嵌套大括号）
    let depth = 1;
    let endPos = -1;
    
    for (let i = 0; i < remainingText.length; i++) {
      if (remainingText[i] === '{') {
        depth++;
      } else if (remainingText[i] === '}') {
        depth--;
        if (depth === 0) {
          endPos = i;
          break;
        }
      }
    }
    
    if (endPos !== -1) {
      explanation = remainingText.substring(0, endPos).trim();
    }
  } else {
    // 如果没有"答案解析："标记，尝试从大括号{}中提取解析
    // 查找最后一个大括号对（通常是解析）
    const lidx = block.lastIndexOf('{');
    const ridx = block.lastIndexOf('}');
    if (lidx !== -1 && ridx !== -1 && ridx > lidx) {
      explanation = block.slice(lidx + 1, ridx).trim();
    }
    // 如果大括号中也没有，尝试从"解析："或"详解："后面提取
    if (!explanation) {
      const altExplanationMatch = block.match(/(?:解析|详解)[:：]\s*([^\n]+(?:\n[^{]*)*)/);
      if (altExplanationMatch && altExplanationMatch[1]) {
        explanation = altExplanationMatch[1].trim();
      }
    }
  }
  
  // 简答题调试输出
  if ((type === '简答题' || type === 'SHORT_ANSWER')) {
    console.log('简答题解析', {explanation, correctAnswerText, title});
  }
  
  // 最终结果调试
  console.log(`[解析完成] 题目类型: ${type}, 标题: "${title.substring(0, 30)}...", 答案: "${correctAnswerText}", 选项数: ${options.length}`);
  
  // 如果没有提取到答案，记录警告
  if (!correctAnswerText && type !== '简答题' && type !== 'SHORT_ANSWER') {
    console.warn(`[警告] 题目 "${title.substring(0, 50)}" 未提取到答案`);
  }
  
  // 返回构造对象
  return {
    title,
    type: QUESTION_TYPE_MAP[type] || 'SINGLE_CHOICE',
    difficulty: DIFFICULTY_MAP[difficulty] || 'EASY',
    subject,
    knowledgePoint,
    options: options.length > 0 ? options : undefined,
    correctAnswer: correctAnswerText,
    explanation,
    tags: tags.length > 0 ? tags : undefined,
  };
}

/**
 * 从Excel数据中解析题目
 */
function parseQuestionsFromExcel(rawData: any): ParsedQuestion[] {
  // 强制转换类型
  const data: any[][] = Array.isArray(rawData) ? rawData as any[][] : [];
  const questions: ParsedQuestion[] = [];
  if (data.length < 2) return questions;
  // const headers = data[0]; // 保留以备后续扩展（未用可删）
  const rows = data.slice(1);
  for (const row of rows) {
    if (row.length === 0) continue;
    try {
      const question: ParsedQuestion = {
        title: row[0] || '',
        type: QUESTION_TYPE_MAP[row[1]] || 'SINGLE_CHOICE',
        difficulty: DIFFICULTY_MAP[row[2]] || 'EASY',
        subject: row[3] || '',
        knowledgePoint: row[4] || '',
        correctAnswer: row[5] || '',
        explanation: row[6] || '',
      };
      // 处理选项（如果有）
      if (row[7]) {
        const optionsStr = row[7];
        if (typeof optionsStr === 'string' && optionsStr.includes('|')) {
          question.options = optionsStr.split('|').map((opt: any) => String(opt).trim());
        }
      }
      // 处理标签（如果有）
      if (row[8]) {
        const tagsStr = row[8];
        if (typeof tagsStr === 'string' && tagsStr.includes(',')) {
          question.tags = tagsStr.split(',').map((tag: any) => String(tag).trim());
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
    
    if (!question.subject || question.subject.trim() === '') {
      errors.push('学科不能为空');
    }
    
    if (!question.knowledgePoint || question.knowledgePoint.trim() === '') {
      errors.push('知识点不能为空');
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
