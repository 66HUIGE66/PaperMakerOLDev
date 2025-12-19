import { apiClient } from '../config/api';
import { ApiResponse } from '../types';

export interface Subject {
    id: number;
    name: string;
    description?: string;
}

export const subjectService = {
    // 获取所有学科列表
    async getSubjects(): Promise<Array<{ label: string; value: string }>> {
        try {
            const response = await apiClient.get<ApiResponse<Subject[]>>('/api/subjects/list');
            if (response.data.code === 200) {
                // Controller returns 'data' in map, usually inconsistent with RespBean 'object'
                const subjects = response.data.object || (response.data as any).data || [];
                return subjects.map((subject: any) => ({
                    label: subject.name,
                    value: String(subject.id) // 使用学科ID作为值
                }));
            } else {
                throw new Error(response.data.message || '获取学科列表失败');
            }
        } catch (error: any) {
            console.error('获取学科列表失败:', error);
            throw new Error(error.response?.data?.message || '获取学科列表失败，请检查网络连接');
        }
    },

    // 根据ID获取学科详情
    async getSubjectById(id: number): Promise<Subject> {
        try {
            const response = await apiClient.get<ApiResponse<Subject>>(`/api/subjects/${id}`);
            if (response.data.code === 200) {
                return response.data.object;
            } else {
                throw new Error(response.data.message || '获取学科详情失败');
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || '获取学科详情失败，请检查网络连接');
        }
    }
};
