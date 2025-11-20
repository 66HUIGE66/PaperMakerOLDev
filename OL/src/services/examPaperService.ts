import { apiClient } from '../config/api';
import { ExamPaper, PageResponse, ApiResponse } from '../types';

export interface ExamPaperCreateRequest {
  title: string;
  description?: string;
  totalScore: number;
  duration: number;
  difficulty: string;
  type: string;
  generationType: string;
  status: string;
  tags?: string[];
  subject?: string;
  questionIds?: number[]; // 用于手动组卷时关联题目
}

export interface ExamPaperUpdateRequest {
  id: number;
  title?: string;
  description?: string;
  totalScore?: number;
  duration?: number;
  difficulty?: string;
  type?: string;
  generationType?: string;
  status?: string;
  tags?: string[];
  subject?: string; // 学科名（前端使用）
  subjectId?: string | number; // 学科ID（后端使用）
}

export const examPaperService = {
  // 获取试卷分页列表
  async getExamPapers(params: {
    current: number;
    size: number;
    searchText?: string;
    type?: string;
    subjectId?: number;
  }): Promise<PageResponse<ExamPaper>> {
    try {
      // 移除空值参数，但保留数字0和false
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([k, v]) => {
          // 保留数字0（包括subjectId可能是0的情况）
          if (typeof v === 'number') return true;
          // 保留布尔值
          if (typeof v === 'boolean') return true;
          // 其他类型：保留非null、非undefined、非空字符串
          return v != null && v !== '';
        })
      );
      
      console.log('发送请求参数:', cleanParams);
      console.log('请求URL: /exam-paper/page');
      
      const response = await apiClient.get<ApiResponse<PageResponse<ExamPaper>>>('/exam-paper/page', { 
        params: cleanParams 
      });
      
      console.log('API原始响应:', response);
      console.log('响应状态码:', response.status);
      console.log('响应data.code:', response.data?.code);
      console.log('响应data.message:', response.data?.message);
      console.log('响应data.object:', response.data?.object);
      
      if (response.data.code === 200) {
        const pageData = response.data.object;
        console.log('获取试卷列表成功:', {
          total: pageData.total,
          size: pageData.size,
          current: pageData.current,
          records: pageData.records?.length,
          firstRecordKeys: pageData.records?.[0] ? Object.keys(pageData.records[0]) : []
        });
        
        // 详细检查records数组
        if (pageData.records && pageData.records.length > 0) {
          console.log('✅ records数组有', pageData.records.length, '条记录');
          pageData.records.forEach((record: any, index: number) => {
            console.log(`记录${index + 1}:`, {
              id: record.id,
              title: record.title,
              isSystem: record.isSystem,
              creatorId: record.creatorId,
              allKeys: Object.keys(record)
            });
          });
        } else {
          console.warn('⚠️ pageData.records为空或未定义');
          console.warn('pageData对象:', JSON.stringify(pageData, null, 2));
        }
        
        // 确保records数组中的每个对象都正确映射
        const mappedRecords = (pageData.records || []).map((record: any) => {
          // 调试：检查原始记录
          if (pageData.records.indexOf(record) === 0) {
            console.log('原始record（第一个）:', record);
            console.log('原始record的所有键:', Object.keys(record));
            console.log('原始record.creatorName:', record.creatorName);
            console.log('原始record.creatorId:', record.creatorId);
          }
          
          // 确保creatorName正确提取
          let creatorName = record.creatorName;
          if (creatorName === null || creatorName === undefined || creatorName === 'null' || creatorName === 'undefined') {
            creatorName = record.creatorId ? `用户${record.creatorId}` : '未知用户';
          } else {
            creatorName = String(creatorName);
          }
          
          return {
            ...record,
            creatorName: creatorName,
            subject: record.subject || undefined,
            createdAt: record.createdAt || record.createTime,
            updatedAt: record.updatedAt || record.updateTime
          };
        });
        
        return {
          ...pageData,
          records: mappedRecords
        };
      } else {
        console.error('获取试卷列表失败:', response.data.message);
        throw new Error(response.data.message || '获取试卷列表失败');
      }
    } catch (error: any) {
      console.error('获取试卷列表出错:', error);
      throw new Error(error.response?.data?.message || '获取试卷列表失败，请检查网络连接');
    }
  },

  // 获取试卷详情
  async getExamPaper(id: number): Promise<ExamPaper> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/exam-paper/${id}`);
      if (response.data.code === 200) {
        const paper = response.data.object;
        // 处理学科字段：将subjectName映射到subject
        if ((paper as any).subjectName && !paper.subject) {
          paper.subject = (paper as any).subjectName;
        }
        // 处理isSystem字段：确保字段名正确（可能是issystem或isSystem）
        if ((paper as any).issystem !== undefined && paper.isSystem === undefined) {
          paper.isSystem = (paper as any).issystem;
        }
        return paper;
      } else {
        throw new Error(response.data.message || '获取试卷详情失败');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取试卷详情失败，请检查网络连接');
    }
  },

  // 创建试卷（默认创建为个人试卷）
  async createExamPaper(data: ExamPaperCreateRequest): Promise<ExamPaper> {
    return this.createMyPaper(data);
  },

  // 更新试卷
  async updateExamPaper(data: ExamPaperUpdateRequest): Promise<ExamPaper> {
    try {
      const response = await apiClient.put<ApiResponse<ExamPaper>>('/exam-paper/update', data);
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '更新试卷失败');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '更新试卷失败，请检查网络连接');
    }
  },

  // 删除试卷
  async deleteExamPaper(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/exam-paper/${id}`);
      if (response.data.code !== 200) {
        throw new Error(response.data.message || '删除试卷失败');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '删除试卷失败，请检查网络连接');
    }
  },

  // 复制试卷
  async copyExamPaper(id: number): Promise<ExamPaper> {
    try {
      const response = await apiClient.post<ApiResponse<ExamPaper>>(`/exam-paper/${id}/copy`);
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '复制试卷失败');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '复制试卷失败，请检查网络连接');
    }
  },

  // 更新题目顺序
  async updateQuestionOrder(paperId: number, questionOrders: { questionId: number; questionOrder: number; score: number }[]): Promise<void> {
    try {
      const response = await apiClient.put<ApiResponse<void>>(`/exam-paper/${paperId}/questions/order`, questionOrders);
      if (response.data.code !== 200) {
        throw new Error(response.data.message || '更新题目顺序失败');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '更新题目顺序失败，请检查网络连接');
    }
  },

  // 获取试卷题目列表
  async getPaperQuestions(paperId: number): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(`/exam-paper/${paperId}/questions`);
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '获取试卷题目失败');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取试卷题目失败，请检查网络连接');
    }
  },

  // 获取我的试卷列表
  async getMyPapers(): Promise<ExamPaper[]> {
    try {
      const response = await apiClient.get<ApiResponse<ExamPaper[]>>('/exam-paper/my');
      if (response.data.code === 200) {
        return response.data.object || [];
      } else {
        throw new Error(response.data.message || '获取我的试卷失败');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取我的试卷失败，请检查网络连接');
    }
  },

  // 创建个人试卷
  async createMyPaper(data: ExamPaperCreateRequest): Promise<ExamPaper> {
    try {
      const response = await apiClient.post<ApiResponse<ExamPaper>>('/exam-paper/my/create', data);
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '创建个人试卷失败');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '创建个人试卷失败，请检查网络连接');
    }
  },

  // 更新试卷（兼容方法）
  async updatePaper(data: ExamPaperUpdateRequest): Promise<ExamPaper> {
    return this.updateExamPaper(data);
  },

  // 删除试卷（兼容方法）
  async deletePaper(id: number): Promise<void> {
    return this.deleteExamPaper(id);
  },

  // 获取试卷详情（兼容方法）
  async getPaperDetail(id: number): Promise<ExamPaper> {
    return this.getExamPaper(id);
  },

  // 获取系统试卷列表
  async getSystemPapers(): Promise<ExamPaper[]> {
    try {
      const response = await apiClient.get<ApiResponse<ExamPaper[]>>('/exam-paper/system');
      if (response.data.code === 200) {
        return response.data.object || [];
      } else {
        throw new Error(response.data.message || '获取系统试卷失败');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取系统试卷失败，请检查网络连接');
    }
  },

  // 创建系统试卷
  async createSystemPaper(data: ExamPaperCreateRequest): Promise<ExamPaper> {
    try {
      const response = await apiClient.post<ApiResponse<ExamPaper>>('/exam-paper/system/create', data);
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '创建系统试卷失败');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '创建系统试卷失败，请检查网络连接');
    }
  },

  // 复制系统试卷到个人题库
  async copySystemPaper(id: number): Promise<ExamPaper> {
    try {
      const response = await apiClient.post<ApiResponse<ExamPaper>>(`/exam-paper/copy/${id}`);
      if (response.data.code === 200) {
        return response.data.object;
      } else {
        throw new Error(response.data.message || '复制试卷失败');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '复制试卷失败，请检查网络连接');
    }
  }
};