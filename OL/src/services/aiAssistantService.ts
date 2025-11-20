import apiClient from '../config/api';

/**
 * AI助手服务
 * 提供与AI助手交互的功能
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface AIAssistantService {
  chat: (message: string, memoryId?: string) => Promise<ReadableStream<Uint8Array>>;
  generateStudyPlan: (goal?: string, targetDate?: string, subject?: string, knowledgePoint?: string, learningSituation?: string) => Promise<ReadableStream<Uint8Array>>;
  generateStudySummary: (subjectName?: string) => Promise<ReadableStream<Uint8Array>>;
  checkStatus: () => Promise<{ status: string }>;
}

export const aiAssistantService = {
  /**
   * 与AI助手聊天（流式响应）
   * @param message 用户消息
   * @param memoryId 会话记忆ID（可选）
   * @returns ReadableStream
   */
  async chat(message: string, memoryId?: string): Promise<ReadableStream<Uint8Array>> {
    try {
      const params: any = { message };
      if (memoryId) {
        params.memoryId = memoryId;
      }
      
      const baseURL = apiClient.defaults.baseURL || 'http://localhost:8080';
      const response = await fetch(`${baseURL}/api/ai-assistant/chat?${new URLSearchParams(params)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Accept': 'text/event-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.body as ReadableStream<Uint8Array>;
    } catch (error: any) {
      console.error('AI聊天失败:', error);
      throw new Error(error.message || 'AI聊天失败，请检查网络连接');
    }
  },

  /**
   * 生成个性化学习计划
   * @param goal 学习目标（可选）
   * @param targetDate 目标日期（可选）
   * @param subject 学科（可选）
   * @param knowledgePoint 知识点（可选，多个知识点时用逗号分隔）
   * @param learningSituation 学习情况（可选，JSON字符串格式）
   * @returns ReadableStream
   */
  async generateStudyPlan(goal?: string, targetDate?: string, subject?: string, knowledgePoint?: string, learningSituation?: string): Promise<ReadableStream<Uint8Array>> {
    try {
      const params: any = {};
      if (goal) {
        params.goal = goal;
      }
      if (targetDate) {
        params.targetDate = targetDate;
      }
      if (subject) {
        params.subject = subject;
      }
      if (knowledgePoint) {
        params.knowledgePoint = knowledgePoint;
      }
      if (learningSituation) {
        params.learningSituation = learningSituation;
      }
      console.log("params1111111 : " , params)
      const baseURL = apiClient.defaults.baseURL || 'http://localhost:8080';
      const response = await fetch(`${baseURL}/api/ai-assistant/generate-study-plan?${new URLSearchParams(params)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Accept': 'text/event-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.body as ReadableStream<Uint8Array>;
    } catch (error: any) {
      console.error('生成学习计划失败:', error);
      throw new Error(error.message || '生成学习计划失败，请检查网络连接');
    }
  },

  /**
   * 生成学习总结
   * @param subjectName 学科名称（可选）
   * @returns ReadableStream
   */
  async generateStudySummary(subjectName?: string): Promise<ReadableStream<Uint8Array>> {
    try {
      const baseURL = apiClient.defaults.baseURL || 'http://localhost:8080';
      // 构建查询参数
      const params = new URLSearchParams();
      if (subjectName && subjectName.trim()) {
        params.append('subjectName', subjectName.trim());
      }
      const url = `${baseURL}/api/ai-assistant/generate-study-summary${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Accept': 'text/event-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.body as ReadableStream<Uint8Array>;
    } catch (error: any) {
      console.error('生成学习总结失败:', error);
      throw new Error(error.message || '生成学习总结失败，请检查网络连接');
    }
  },

  /**
   * 检查AI服务状态
   * @returns 服务状态
   */
  async checkStatus(): Promise<{ status: string }> {
    try {
      const response = await apiClient.get('/api/ai-assistant/status');
      if (response.data.code === 200) {
        return response.data.object as { status: string };
      } else {
        throw new Error(response.data.message || '检查服务状态失败');
      }
    } catch (error: any) {
      console.error('检查AI服务状态失败:', error);
      throw new Error(error.response?.data?.message || '检查服务状态失败，请检查网络连接');
    }
  },
};

/**
 * 读取流式响应并处理
 * @param stream ReadableStream
 * @param onChunk 处理每个数据块的回调
 * @param onComplete 完成回调
 * @param onError 错误回调
 */
export async function readStream(
  stream: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // 处理剩余的缓冲区数据
        if (buffer.trim()) {
          processBuffer(buffer, onChunk);
        }
        if (onComplete) {
          onComplete();
        }
        break;
      }

      // 解码数据块（使用 stream: true 来处理多字节字符）
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      // 实时处理接收到的数据
      // 按行分割处理SSE格式
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后一个不完整的行
      
      // 处理完整的行
      for (const line of lines) {
        // 跳过空行（SSE事件分隔符）
        if (line.trim() === '') {
          continue;
        }
        processSSELine(line, onChunk);
      }
    }
  } catch (error: any) {
    console.error('读取流失败:', error);
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 处理SSE格式的行
 */
function processSSELine(line: string, onChunk: (text: string) => void) {
  // 移除回车符
  let processedLine = line.replace(/\r$/, '');
  
  // 如果行以 data: 开头（注意：data:后面可能有空格也可能没有）
  if (processedLine.startsWith('data:')) {
    // 提取 data: 后面的内容
    let content: string;
    if (processedLine.startsWith('data: ')) {
      // 标准格式：data: content
      content = processedLine.slice(6); // 移除 "data: " 前缀（6个字符）
    } else if (processedLine.startsWith('data:')) {
      // 无空格格式：data:content
      content = processedLine.slice(5); // 移除 "data:" 前缀（5个字符）
    } else {
      return;
    }
    
    // 只发送非空内容，立即触发回调以确保实时显示
    if (content && content.length > 0) {
      onChunk(content);
    }
  } 
  // 处理空行（SSE中的分隔符）- 空行表示一个事件结束
  else if (processedLine.trim() === '') {
    // 空行是SSE格式中的事件分隔符，忽略即可
    return;
  }
  // 处理其他SSE控制行（如 event:, id:, retry: 等）
  else if (processedLine.startsWith(':') || 
           processedLine.startsWith('event:') || 
           processedLine.startsWith('id:') ||
           processedLine.startsWith('retry:')) {
    // 忽略SSE控制行
    return;
  }
  // 如果是纯数据行（没有前缀），可能是非标准SSE格式
  else if (processedLine.trim()) {
    // 直接作为数据发送
    onChunk(processedLine);
  }
}

/**
 * 处理缓冲区数据
 */
function processBuffer(buffer: string, onChunk: (text: string) => void) {
  const lines = buffer.split('\n');
  for (const line of lines) {
    processSSELine(line, onChunk);
  }
}

