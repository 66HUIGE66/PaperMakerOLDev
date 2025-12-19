import { apiClient } from '../config/api';
import { ApiResponse } from '../types';

export interface StudyPlan {
    id: number;
    userId: number;
    subjectId: number;
    targetDescription: string;
    deadline: string; // ISO String
    status: 'ONGOING' | 'COMPLETED';
    generatedPaperIds: string; // JSON
    aiSuggestion?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePlanRequest {
    subjectId: number;
    targetDescription: string;
    deadline: string;
    status: 'ONGOING' | 'COMPLETED';
}

export const studyPlanService = {
    // 获取我的学习计划
    getMyPlans: async (): Promise<StudyPlan[]> => {
        const response = await apiClient.get<ApiResponse<StudyPlan[]>>('/study-plan/my');
        return response.data.object;
    },

    // 获取单个学习计划详情
    getPlanById: async (id: number): Promise<StudyPlan> => {
        const response = await apiClient.get<ApiResponse<StudyPlan>>(`/study-plan/${id}`);
        return response.data.object;
    },

    // 创建学习计划
    createPlan: async (plan: CreatePlanRequest): Promise<StudyPlan> => {
        const response = await apiClient.post<ApiResponse<StudyPlan>>('/study-plan/create', plan);
        return response.data.object;
    },

    // AI生成计划
    generatePlanByAI: async (subjectId: number, target: string, deadline: string): Promise<StudyPlan> => {
        const response = await apiClient.post<ApiResponse<StudyPlan>>('/study-plan/ai-generate', null, {
            params: { subjectId, target, deadline }
        });
        return response.data.object;
    },

    // 根据计划生成试卷
    generatePaperFromPlan: async (planId: number): Promise<any> => {
        const response = await apiClient.post<ApiResponse<any>>(`/study-plan/${planId}/generate-paper`);
        return response.data.object;
    },

    // 删除学习计划
    deletePlan: async (planId: number): Promise<void> => {
        await apiClient.delete(`/study-plan/${planId}`);
    },

    // 搜索学习资源
    searchResources: async (keyword: string): Promise<string> => {
        const response = await apiClient.post<ApiResponse<string>>('/study-plan/search-resources', null, {
            params: { keyword }
        });
        return response.data.object;
    }
};
