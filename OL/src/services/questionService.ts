import { apiClient } from '../config/api';
import { QuestionType, DifficultyLevel } from '../types';

// 题目类型定义
export interface Question {
  id: number;
  title: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  options?: string[];
  optionsList?: string[]; // 后端返回的选项列表
  correctAnswer: string;
  explanation?: string;
  knowledgePoints: string[]; // 知识点列表
  tags: string[]; // 标签列表
  subjectId?: number;
  subject?: string; // 学科名称（后端返回）
  isSystem?: boolean;
  creatorId: number;
  createTime: string;
  updateTime: string;
  // 试卷题目关联字段（从试卷获取题目时包含）
  questionId?: number; // 实际题目ID
  questionOrder?: number; // 题目顺序
  score?: number; // 题目分值
}

// 分页响应类型
export interface PageResponse<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// API响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  object: T;
}

export const questionService = {
  // 获取系统题目列表
  async getSystemQuestions(current: number = 1, size: number = 10): Promise<PageResponse<Question>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<any>>>('/question/system', {
        params: { current, size }
      });
      
      if (response.data.code === 200) {
        const pageData = response.data.object;
        // 处理日期字段映射
        const mappedRecords = (pageData.records || []).map((record: any) => ({
          ...record,
          createTime: record.createTime || record.createdAt || record.create_time,
          updateTime: record.updateTime || record.updatedAt || record.update_time
        }));
        return {
          ...pageData,
          records: mappedRecords
        };
      } else {
        throw new Error(response.data.message || '获取系统题目失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('获取系统题目失败，请检查网络连接');
    }
  },

  // 获取个人题目列表
  async getMyQuestions(
    current: number = 1, 
    size: number = 10,
    filters?: {
      keyword?: string;
      type?: string;
      difficulty?: string;
      subjectId?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<PageResponse<Question>> {
    try {
      const params: any = { current, size };
      
      // 添加筛选参数
      if (filters) {
        if (filters.keyword) params.keyword = filters.keyword;
        if (filters.type) params.type = filters.type;
        if (filters.difficulty) params.difficulty = filters.difficulty;
        if (filters.subjectId) params.subjectId = filters.subjectId;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
      }
      
      const response = await apiClient.get<ApiResponse<PageResponse<Question>>>('/question/my', {
        params
      });
      
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '获取个人题目失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('获取个人题目失败，请检查网络连接');
    }
  },

  // 创建系统题目（仅管理员）
  async createSystemQuestion(question: Omit<Question, 'id' | 'isSystem' | 'creatorId'>): Promise<Question> {
    try {
      const response = await apiClient.post<ApiResponse<Question>>('/question/system/create', question);
      
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '创建系统题目失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('创建系统题目失败，请检查网络连接');
    }
  },

  // 创建个人题目
  async createMyQuestion(question: Omit<Question, 'id' | 'isSystem' | 'creatorId'>): Promise<Question> {
    try {
      const response = await apiClient.post<ApiResponse<Question>>('/question/my/create', question);
      
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '创建个人题目失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('创建个人题目失败，请检查网络连接');
    }
  },

  // 复制系统题目到个人题库
  async copySystemQuestion(questionId: number): Promise<Question> {
    try {
      const response = await apiClient.post<ApiResponse<Question>>(`/question/copy/${questionId}`);
      
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '复制题目失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('复制题目失败，请检查网络连接');
    }
  },

  // 更新题目
  async updateQuestion(id: number, question: Partial<Question>): Promise<Question> {
    try {
      const response = await apiClient.put<ApiResponse<Question>>(`/question/update/${id}`, question);
      
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '更新题目失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('更新题目失败，请检查网络连接');
    }
  },

  // 删除题目
  async deleteQuestion(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<null>>(`/question/delete/${id}`);
      
      if (response.data.code !== 200) {
        throw new Error(response.data.message || '删除题目失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('删除题目失败，请检查网络连接');
    }
  },

  // 获取所有题目（兼容旧接口）
  async getAllQuestions(current: number = 1, size: number = 10): Promise<PageResponse<Question>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<Question>>>('/question', {
        params: { current, size }
      });
      
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '获取题目失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('获取题目失败，请检查网络连接');
    }
  },

  // 获取所有题目（用于题目选择器）
  async getAllQuestionsForSelector(): Promise<Question[]> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<Question>>>('/question', {
        params: { current: 1, size: 1000 }
      });
      
      if (response.data.code === 200) {
        return response.data.object?.records || [];
      } else {
        throw new Error(response.data.message || '获取题目失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('获取题目失败，请检查网络连接');
    }
  },

  // 批量导入系统题目
  async batchImportSystemQuestions(questions: any[]): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/question/system/batch-import', questions);
      
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '批量导入系统题目失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('批量导入系统题目失败，请检查网络连接');
    }
  },

  // 批量导入个人题目
  async batchImportMyQuestions(questions: any[]): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/question/my/batch-import', questions);
      
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '批量导入个人题目失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('批量导入个人题目失败，请检查网络连接');
    }
  },

  // 根据试卷ID获取题目列表
  async getQuestionsByPaperId(paperId: number): Promise<Question[]> {
    try {
      const response = await apiClient.get<ApiResponse<Question[]>>(`/exam-paper/${paperId}/questions`);
      
      if (response.data.code === 200) {
        return response.data.object || [];
      } else {
        throw new Error(response.data.message || '获取试卷题目失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('获取试卷题目失败，请检查网络连接');
    }
  }
};
