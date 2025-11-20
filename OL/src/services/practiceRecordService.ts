import { apiClient } from '../config/api';

export interface PracticeRecord {
  id: number;
  paperId: number;
  paperTitle?: string;
  userId: number;
  studentId?: number;
  startTime: string;
  endTime?: string;
  score?: number;
  totalScore?: number;
  answeredQuestions?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  accuracy?: number;
  timeSpent?: number;
  examType: 'PRACTICE' | 'EXAM';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'TIMEOUT';
  createdAt: string;
  updatedAt: string;
}

export interface PracticeStatistics {
  totalRecords: number;
  completedRecords: number;
  averageAccuracy: number;
  totalTime: number;
  practiceRecords: number;
  examRecords: number;
}

// 总体统计数据结构
export interface OverallStatistics {
  summary: {
    totalRecords: number;
    completedRecords: number;
    inProgressRecords: number;
    timeoutRecords: number;
    completionRate: string;
  };
  scoreStatistics: {
    totalScore: number;
    averageScore: string;
    maxScore: number;
    minScore: number;
    scoreCount: number;
  };
  accuracyStatistics: {
    averageAccuracy: string;
    maxAccuracy: string;
    minAccuracy: string;
    accuracyCount: number;
  };
  timeStatistics: {
    totalTimeSeconds: number;
    totalTimeFormatted: string;
    averageTimeSeconds: number;
    averageTimeFormatted: string;
    maxTimeSeconds: number;
    maxTimeFormatted: string;
    minTimeSeconds: number;
    minTimeFormatted: string;
  };
  questionStatistics: {
    totalQuestions: number;
    totalAnswered: number;
    totalCorrect: number;
    answerRate: string;
    correctRate: string;
  };
  typeStatistics: {
    practiceCount: number;
    examCount: number;
    practicePercentage: string;
    examPercentage: string;
  };
  lastPracticeTime: string;
  recentPracticeTrend: Record<string, number>;
}

// 学科统计数据结构
export interface SubjectStatistics {
  totalSubjects: number;
  subjects: Array<{
    subjectName: string;
    practiceCount: number;
    statistics: {
      totalScore: number;
      averageScore: string;
      maxScore: number;
      minScore: number;
      totalQuestions: number;
      totalCorrect: number;
      averageAccuracy: string;
      maxAccuracy: string;
      minAccuracy: string;
      totalTimeSeconds: number;
      totalTimeFormatted: string;
      averageTimeSeconds: number;
      averageTimeFormatted: string;
    };
  }>;
}

// 学科知识点统计数据结构
export interface SubjectKnowledgePointStatistics {
  totalSubjects: number;
  subjects: Array<{
    subjectName: string;
    totalKnowledgePoints: number;
    knowledgePoints: Array<{
      knowledgePointName: string;
      practiceCount: number;
      questionCount: number;
      correctCount: number;
      accuracy: string;
      totalTimeSeconds: number;
      totalTimeFormatted: string;
      averageTimeSeconds: number;
      averageTimeFormatted: string;
    }>;
  }>;
}

export interface SearchParams {
  paperTitle?: string;
  status?: string;
  type?: string;
  subjectId?: string;
  startDate?: string;
  endDate?: string;
}

export const practiceRecordService = {
  // 获取我的练习记录
  async getMyRecords(): Promise<PracticeRecord[]> {
    try {
      const response = await apiClient.get('/exam-record/my-records');
      if (response.data.code === 200) {
        return response.data.object || [];
      } else {
        throw new Error(response.data.message || '获取练习记录失败');
      }
    } catch (error: any) {
      // 如果是401错误，提供更友好的错误信息
      if (error.response?.status === 401) {
        throw new Error('用户未登录，请重新登录');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        throw new Error('网络连接失败，请检查后端服务是否启动');
      }
      throw new Error('获取练习记录失败，请稍后重试');
    }
  },

  // 根据ID获取练习记录详情
  async getRecordById(recordId: number): Promise<PracticeRecord> {
    try {
      const response = await apiClient.get(`/exam-record/${recordId}`);
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '获取练习记录详情失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('获取练习记录详情失败，请检查网络连接');
    }
  },

  // 根据状态获取练习记录
  async getRecordsByStatus(status: string): Promise<PracticeRecord[]> {
    try {
      const response = await apiClient.get(`/exam-record/my-records/status/${status}`);
      if (response.data.code === 200) {
        return response.data.object || [];
      } else {
        throw new Error(response.data.message || '获取练习记录失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('获取练习记录失败，请检查网络连接');
    }
  },

  // 根据类型获取练习记录
  async getRecordsByType(type: string): Promise<PracticeRecord[]> {
    try {
      const response = await apiClient.get(`/exam-record/my-records/type/${type}`);
      if (response.data.code === 200) {
        return response.data.object || [];
      } else {
        throw new Error(response.data.message || '获取练习记录失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('获取练习记录失败，请检查网络连接');
    }
  },

  // 获取练习统计信息
  async getStatistics(): Promise<PracticeStatistics> {
    try {
      const response = await apiClient.get('/exam-record/my-statistics');
      if (response.data.code === 200) {
        return response.data.object || {
          totalRecords: 0,
          completedRecords: 0,
          averageAccuracy: 0,
          totalTime: 0,
          practiceRecords: 0,
          examRecords: 0
        };
      } else {
        throw new Error(response.data.message || '获取统计信息失败');
      }
    } catch (error: any) {
      // 如果是401错误，提供更友好的错误信息
      if (error.response?.status === 401) {
        throw new Error('用户未登录，请重新登录');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        throw new Error('网络连接失败，请检查后端服务是否启动');
      }
      throw new Error('获取统计信息失败，请稍后重试');
    }
  },

  // 创建练习记录
  async createRecord(record: Partial<PracticeRecord>): Promise<PracticeRecord> {
    try {
      const response = await apiClient.post('/exam-record/create', record);
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '创建练习记录失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('创建练习记录失败，请检查网络连接');
    }
  },

  // 批量保存答题记录
  async saveAnswerBatch(examRecordId: number, answers: Array<{questionId: number; questionType?: string; userAnswer: any; isCorrect: boolean; timeSpent: number}>): Promise<void> {
    try {
      const payload = {
        examRecordId,
        answers: answers.map(a => ({
          questionId: a.questionId,
          questionType: a.questionType,
          userAnswer: Array.isArray(a.userAnswer) ? JSON.stringify(a.userAnswer) : String(a.userAnswer ?? ''),
          isCorrect: a.isCorrect,
          timeSpent: a.timeSpent
        }))
      };
      const response = await apiClient.post('/answer-record/save-batch', payload);
      if (response.data.code !== 200) {
        throw new Error(response.data.message || '保存答题记录失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('保存答题记录失败，请检查网络连接');
    }
  },

  // 获取某次练习的答题记录
  async getAnswersByExamRecordId(examRecordId: number): Promise<Array<{id:number; questionId:number; userAnswer:string; isCorrect:boolean; timeSpent:number}>> {
    try {
      const response = await apiClient.get(`/answer-record/by-exam/${examRecordId}`);
      if (response.data.code === 200) {
        return response.data.object || [];
      }
      throw new Error(response.data.message || '获取答题记录失败');
    } catch (error:any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('获取答题记录失败，请检查网络连接');
    }
  },

  // 更新练习记录
  async updateRecord(record: PracticeRecord): Promise<PracticeRecord> {
    try {
      const response = await apiClient.put('/exam-record/update', record);
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '更新练习记录失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('更新练习记录失败，请检查网络连接');
    }
  },

  // 删除练习记录
  async deleteRecord(recordId: number): Promise<void> {
    try {
      const response = await apiClient.delete(`/exam-record/delete/${recordId}`);
      if (response.data.code !== 200) {
        throw new Error(response.data.message || '删除练习记录失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('删除练习记录失败，请检查网络连接');
    }
  },

  // 搜索练习记录
  async searchRecords(params: SearchParams): Promise<PracticeRecord[]> {
    try {
      const response = await apiClient.post('/exam-record/search', params);
      if (response.data.code === 200) {
        return response.data.object || [];
      } else {
        throw new Error(response.data.message || '搜索练习记录失败');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('搜索练习记录失败，请检查网络连接');
    }
  },

  // 获取总体练习情况统计
  async getOverallStatistics(): Promise<OverallStatistics> {
    try {
      const response = await apiClient.get('/exam-record/overall-statistics');
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '获取总体统计失败');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('用户未登录，请重新登录');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('获取总体统计失败，请检查网络连接');
    }
  },

  // 获取学科分类练习情况统计
  async getSubjectStatistics(): Promise<SubjectStatistics> {
    try {
      const response = await apiClient.get('/exam-record/subject-statistics');
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '获取学科统计失败');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('用户未登录，请重新登录');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('获取学科统计失败，请检查网络连接');
    }
  },

  // 获取学科知识点统计
  async getSubjectKnowledgePointStatistics(): Promise<SubjectKnowledgePointStatistics> {
    try {
      const response = await apiClient.get('/exam-record/subject-knowledge-point-statistics');
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '获取学科知识点统计失败');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('用户未登录，请重新登录');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('获取学科知识点统计失败，请检查网络连接');
    }
  }
};



