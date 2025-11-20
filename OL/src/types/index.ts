// 题目类型枚举
export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE', // 单选题
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // 多选题
  FILL_BLANK = 'FILL_BLANK', // 填空题
  TRUE_FALSE = 'TRUE_FALSE', // 判断题
  SHORT_ANSWER = 'SHORT_ANSWER' // 简答题
}

// 难度等级
export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT'
}

// 题目接口
export interface Question {
  id: number;
  title: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  options?: string[]; // 选择题选项
  correctAnswer: string; // 正确答案
  explanation?: string; // 解析
  knowledgePoints: string[]; // 知识点列表
  tags: string[]; // 标签列表
  subject?: string; // 学科
  source?: string; // 题目来源
  usageCount?: number; // 使用次数
  correctRate?: number; // 正确率
  status?: string; // 状态
  creatorId: number; // 创建者ID
  createTime: string;
  updateTime: string;
}

// 试卷接口
export interface ExamPaper {
  id: number | string;
  title: string;
  description?: string;
  questionIds?: string //| string[]; // 题目ID列表（字符串或数组格式）
  totalQuestions?: number; // 题目总数
  ruleId?: number; // 采用的规则ID
  totalScore: number;
  duration: number; // 考试时长（分钟）
  difficulty?: string; // 难度等级
  difficultyScore?: number; // 难度系数（0.0-1.0）
  knowledgeCoverage?: Record<string, any>; // 知识点覆盖情况
  type?: 'AUTO' | 'MANUAL'; // 生成类型
  generationType?: 'AUTO' | 'MANUAL'; // 生成类型（兼容字段）
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'ACTIVE'; // 状态
  tags?: string[]; // 标签列表
  subject?: string; // 学科（学科名）
  subjectId?: string | number; // 学科ID
  isSystem?: boolean; // 是否系统试卷
  isSaved?: boolean; // 是否已保存（用于生成的试卷）
  creatorId: number; // 创建者ID
  creatorName?: string; // 创建者用户名
  createTime?: string;
  updateTime?: string;
  createdAt?: string; // 兼容字段
  updatedAt?: string; // 兼容字段
}

// 组卷规则接口
export interface ExamRule {
  id: number;
  name: string;
  description?: string;
  totalQuestions: number; // 题目总数
  totalScore: number; // 总分
  duration: number; // 考试时长（分钟）
  ruleConfig?: string; // 规则配置（JSON格式）
  creatorId: number; // 创建者ID
  isSystem: boolean; // 是否系统规则
  status: string; // 规则状态
  createdAt: string;
  updatedAt: string;
}

// 答题记录接口
export interface AnswerRecord {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number; // 答题用时（秒）
  answerTime: string;
}

// 考试记录接口
export interface ExamRecord {
  id: number;
  paperId: number; // 试卷ID
  userId: number; // 用户ID
  startTime?: string;
  endTime?: string;
  totalScore: number; // 总分
  userScore: number; // 用户得分
  answers: Record<string, string>; // 用户答案
  status: 'IN_PROGRESS' | 'COMPLETED' | 'TIMEOUT'; // 状态
  createTime: string;
  updateTime: string;
}

// 学科接口
export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  keywords?: string[]; // 关键词列表（从关联的知识点获取）
  keywordCount?: number; // 关键词数量
  sortOrder: number;
  isActive: boolean;
  isSystem?: boolean; // 是否系统预设
  creatorId?: number; // 创建者ID
  createTime: string;
  updateTime: string;
}

// 知识点接口
export interface KnowledgePoint {
  id: number;
  name: string;
  parentId?: number;
  level: number;
  description?: string;
  subject?: string; // 学科名称（兼容字段）
  subjectId?: number; // 学科ID
  weight?: number; // 权重
  difficultyLevel?: string; // 难度等级
  sortOrder: number;
  creatorId: number;
  isSystem?: boolean; // 是否系统预设
  status?: string; // 状态
  createTime: string;
  updateTime: string;
}

// 标签接口
export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

// 文件导入结果
export interface ImportResult {
  success: boolean;
  message: string;
  totalCount: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  questions?: Question[];
  importedCount?: number;
  failedCount?: number;
}

// 组卷结果
export interface GenerateResult {
  success: boolean;
  message: string;
  examPaper?: ExamPaper;
  suggestions?: string[];
}

// 用户接口
export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  realName?: string;
  avatar?: string;
  status: string;
  lastLoginTime?: string;
  lastLoginIp?: string;
  createTime: string;
  updateTime: string;
}

// 题目分类接口
export interface QuestionCategory {
  id: number;
  name: string;
  parentId?: number;
  level: number;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isSystem: boolean;
  creatorId?: number;
  createTime: string;
  updateTime: string;
}

// 练习模式接口
export interface PracticeMode {
  id: number;
  name: string;
  code: string;
  description?: string;
  config?: any; // JSON配置
  isSystem: boolean;
  isActive: boolean;
  createTime: string;
  updateTime: string;
}

// 学习计划接口
export interface StudyPlan {
  id: number;
  userId: number;
  name: string;
  description?: string;
  targetScore?: number;
  targetDate?: string;
  dailyQuestions: number;
  categories?: any; // JSON格式
  difficultyDistribution?: any; // JSON格式
  status: string;
  progress: number;
  createTime: string;
  updateTime: string;
}

// 用户收藏接口
export interface UserFavorite {
  id: number;
  userId: number;
  targetType: string; // QUESTION, PAPER, CATEGORY
  targetId: number;
  createTime: string;
}

// 用户错题本接口
export interface UserMistake {
  id: number;
  userId: number;
  questionId: number;
  wrongAnswer?: string;
  correctAnswer?: string;
  mistakeType?: string;
  analysis?: string;
  reviewCount: number;
  lastReviewTime?: string;
  isMastered: boolean;
  createTime: string;
  updateTime: string;
}

// 学习成就接口
export interface LearningAchievement {
  id: number;
  userId: number;
  achievementType: string;
  achievementName: string;
  description?: string;
  icon?: string;
  points: number;
  unlockCondition?: any; // JSON格式
  isUnlocked: boolean;
  unlockTime?: string;
  createTime: string;
  updateTime: string;
}

// 练习会话接口
export interface PracticeSession {
  id: number;
  userId: number;
  modeCode: string;
  questions: Question[];
  answers: Record<string, string>;
  startTime: string;
  endTime?: string;
  score?: number;
  status: string; // IN_PROGRESS, COMPLETED, ABANDONED
  createTime: string;
  updateTime: string;
}

// 学习统计接口
export interface LearningStatistics {
  totalQuestions: number;
  completedQuestions: number;
  correctQuestions: number;
  accuracy: number;
  studyDays: number;
  currentStreak: number;
  longestStreak: number;
  achievements: LearningAchievement[];
  categoryStats: Record<string, number>;
  difficultyStats: Record<string, number>;
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  object: T;
}

// 分页响应类型
export interface PageResponse<T = any> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}
