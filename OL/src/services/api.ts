// API服务文件
// 统一管理所有API接口调用

import { api } from '../config/api';

// 智能组卷API
export const intelligentPaperApi = {
  // 获取规则模板
  getRuleTemplates: () => api.get('/intelligent-paper/rule-templates'),
  
  // 根据规则生成试卷
  generatePaper: (rule: any) => api.post('/intelligent-paper/generate', rule),
  
  // 验证组卷规则
  validateRule: (rule: any) => api.post('/intelligent-paper/validate-rule', rule),
  
  // 获取AI服务状态
  getAIStatus: () => api.get('/intelligent-paper/ai-status'),
  
  // 使用AI生成组卷规则
  generateRule: (params: {
    userInput?: string;
    subject?: string;
    examType?: string;
    requirements?: string;
  }) => api.post('/intelligent-paper/generate-rule', params),
  
  // 优化现有组卷规则
  optimizeRule: (params: {
    currentRule: string;
    optimizationRequirements?: string;
  }) => api.post('/intelligent-paper/optimize-rule', params),
  
  // 测试AI服务连接
  testAI: () => api.get('/intelligent-paper/test-ai'),
  
  // 获取数据库中的学科和知识点信息
  getDatabaseInfo: () => api.get('/intelligent-paper/database-info'),
  
  // 获取学科建议
  getSubjectSuggestions: () => api.get('/intelligent-paper/subject-suggestions'),
};

// 规则管理API
export const examRuleApi = {
  // 获取规则列表
  getRules: (params?: {
    page?: number;
    size?: number;
    name?: string;
    status?: string;
    isSystem?: boolean;
  }) => api.get(`/api/rules/list`, { params }),
  
  // 获取所有启用的规则
  getActiveRules: () => api.get('/api/rules/active'),
  
  // 根据ID获取规则详情
  getRuleById: (id: number) => api.get(`/api/rules/${id}`),
  
  // 创建用户规则
  createRule: (rule: any) => api.post('/api/rules/user', rule),
  
  // 创建系统规则（管理员）
  createSystemRule: (rule: any) => api.post('/api/rules/admin/system', rule),
  
  // 更新规则
  updateRule: (id: number, rule: any) => api.put(`/api/rules/${id}`, rule),
  
  // 删除规则
  deleteRule: (id: number) => api.delete(`/api/rules/${id}`),
  
  // 管理员获取所有规则
  getAllRulesForAdmin: (params?: {
    page?: number;
    size?: number;
    name?: string;
    status?: string;
    isSystem?: boolean;
  }) => api.get('/api/rules/admin/all', { params }),
};

// 学科管理API
export const subjectApi = {
  // 获取所有启用的学科
  getAllActiveSubjects: (includeKeywords: boolean = false, isSystem?: boolean) => 
    api.get('/api/subjects/list', { params: { includeKeywords, isSystem } }),
  
  // 根据ID获取学科
  getSubjectById: (id: number) => api.get(`/api/subjects/${id}`),
  
  // 创建学科
  createSubject: (subject: any) => api.post('/api/subjects/create', subject),
  
  // 更新学科
  updateSubject: (subject: any) => api.put('/api/subjects/update', subject),
  
  // 删除学科
  deleteSubject: (id: number) => api.delete(`/api/subjects/delete/${id}`),
  
  // 刷新学科映射缓存
  refreshMapping: () => api.post('/api/subjects/refresh-mapping'),
  
  // 获取学科映射状态
  getMappingStatus: () => api.get('/api/subjects/mapping-status'),
};

// 知识点管理API
export const knowledgePointApi = {
  // 获取知识点列表
  getKnowledgePoints: (subject?: string, isSystem?: boolean) => 
    api.get('/knowledge-points', { params: { subject, isSystem } }),
  
  // 获取知识点分页列表（服务端分页 + 学科筛选）
  getKnowledgePointsPage: (params?: { page?: number; size?: number; subjectId?: number; subjectName?: string; subjectCode?: string; keyword?: string; status?: string; }) => {
    return api.get('/knowledge-points', { params });
  },
  
  // 创建知识点
  createKnowledgePoint: (knowledgePoint: any) => 
    api.post('/knowledge-points', knowledgePoint),
  
  // 更新知识点
  updateKnowledgePoint: (id: number, knowledgePoint: any) => 
    api.put(`/knowledge-points/${id}`, knowledgePoint),
  
  // 删除知识点
  deleteKnowledgePoint: (id: number) => 
    api.delete(`/knowledge-points/${id}`),
  
  // 获取权重分布
  getWeightDistribution: (subject: string) => 
    api.get('/knowledge-points/weight-distribution', { params: { subject } }),
  
  // 批量更新权重
  batchUpdateWeights: (weightMap: Record<number, number>) => 
    api.put('/knowledge-points/batch-update-weights', weightMap),
  
  // 创建默认知识点
  createDefaultKnowledgePoints: (subject: string) => 
    api.post('/knowledge-points/create-default', null, { params: { subject } }),
};

// 智能组卷API
export const paperGenerationApi = {
  // 根据规则自动生成试卷
  generatePaperAutomatically: (ruleId: number) => 
    api.post(`/paper-generation/generate?ruleId=${ruleId}`),
  
  // 手动调整试卷
  adjustPaperManually: (paperId: number, operation: any) => 
    api.post(`/paper-generation/adjust/${paperId}?operationType=${operation.type}`, operation.parameters),
};

// 试卷管理API
export const examPaperApi = {
  // 获取试卷列表
  getExamPapers: (params?: any) => api.get('/exam-paper', { params }),
  
  // 根据ID获取试卷详情
  getExamPaper: (id: string) => api.get(`/exam-paper/${id}`),
  
  // 创建试卷
  createExamPaper: (data: any) => api.post('/exam-paper/create', data),
  
  // 更新试卷
  updateExamPaper: (id: string, data: any) => api.put(`/exam-paper/${id}`, data),
  
  // 删除试卷
  deleteExamPaper: (id: string) => api.delete(`/exam-paper/${id}`),
  
  // 获取系统试卷
  getSystemPapers: (params?: any) => api.get('/exam-paper/system', { params }),
  
  // 获取我的试卷
  getMyPapers: (params?: any) => api.get('/exam-paper/my', { params }),
};

// 题目管理API
export const questionApi = {
  // 获取题目列表
  getQuestions: (params?: any) => api.get('/question', { params }),
  
  // 根据ID获取题目详情
  getQuestion: (id: string) => api.get(`/question/${id}`),
  
  // 创建题目
  createQuestion: (data: any) => api.post('/question', data),
  
  // 更新题目
  updateQuestion: (id: string, data: any) => api.put(`/question/${id}`, data),
  
  // 删除题目
  deleteQuestion: (id: string) => api.delete(`/question/${id}`),
  
  // 获取系统题目
  getSystemQuestions: (params?: any) => api.get('/question/system', { params }),
  
  // 获取我的题目
  getMyQuestions: (params?: any) => api.get('/question/my', { params }),
  
  // 根据试卷ID获取题目列表
  getQuestionsByPaperId: (paperId: number) => api.get(`/exam-paper/${paperId}/questions`),
  
  // 获取题目统计信息（按学科和题型）
  getQuestionStatistics: (subjectId: number) => api.get('/question/statistics', { params: { subjectId } }),
};

// 用户认证API
export const authApi = {
  // 用户登录
  login: (data: any) => api.post('/user/login', data),
  
  // 用户注册
  register: (data: any) => api.post('/user/register', data),
  
  // 验证token
  validateToken: () => api.get('/user/validate-token'),
  
  // 获取用户信息
  getUserInfo: () => api.get('/user/info'),
  
  // 更新用户信息
  updateUserInfo: (data: any) => api.put('/user/info', data),
};

export default {
  intelligentPaperApi,
  paperGenerationApi,
  examPaperApi,
  questionApi,
  authApi,
  subjectApi,
  knowledgePointApi,
};
