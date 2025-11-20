import { create } from 'zustand';
import { Question, ExamRule, ExamPaper, ExamRecord } from '../types';

// Store接口定义
export interface AppStore {
  // 题目相关状态和方法
  questions: Question[];
  knowledgePoints: string[];
  tags: string[];
  setQuestions: (questions: Question[]) => void;
  addQuestion: (question: Omit<Question, 'id' | 'createTime' | 'updateTime'>) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  
  // 试卷相关状态和方法
  examPapers: ExamPaper[];
  setExamPapers: (papers: ExamPaper[]) => void;
  addExamPaper: (paper: Omit<ExamPaper, 'id' | 'createTime' | 'updateTime'>) => void;
  updateExamPaper: (id: string, updates: Partial<ExamPaper>) => void;
  deleteExamPaper: (id: string) => void;
  
  // 组卷规则相关状态和方法
  examRules: ExamRule[];
  setExamRules: (rules: ExamRule[]) => void;
  addExamRule: (rule: Omit<ExamRule, 'id'>) => void;
  updateExamRule: (id: string, updates: Partial<ExamRule>) => void;
  deleteExamRule: (id: string) => void;
  
  // 考试进行相关状态和方法
  currentExam: {
    paperId: string;
    answers: Record<string, string | string[]>;
    startTime: string;
    timeLeft: number;
    status: 'in_progress' | 'completed' | 'abandoned';
  } | null;
  setCurrentExam: (examData: {
    paperId: string;
    answers?: Record<string, string | string[]>;
    startTime?: string;
    timeLeft?: number;
    status?: 'in_progress' | 'completed' | 'abandoned';
  }) => void;
  updateAnswer: (questionId: string, answer: string | string[]) => void;
  clearCurrentExam: () => void;
  
  // 考试记录相关状态和方法
  examRecords: ExamRecord[];
  setExamRecords: (records: ExamRecord[]) => void;
  addExamRecord: (record: Omit<ExamRecord, 'id' | 'startTime' | 'endTime'>) => void;
  getExamRecord: (id: string) => ExamRecord | undefined;
}

// 创建store
export const useAppStore = create<AppStore>((set, get) => ({
  // 初始状态
  questions: [],
  knowledgePoints: [],
  tags: [],
  examPapers: [],
  examRules: [],
  currentExam: null,
  examRecords: [],

  // 题目相关方法
  setQuestions: (questions) => set({ questions }),
  
  addQuestion: (question) => set((state) => {
    const newQuestion: Question = {
      ...question,
      id: question.id || Date.now().toString(), // 如果已有ID则使用，否则生成新ID
      createTime: question.createTime || new Date().toISOString(),
      updateTime: new Date().toISOString()
    };
    return {
      questions: [...state.questions, newQuestion]
    };
  }),
  
  updateQuestion: (id, updates) => set((state) => ({
    questions: state.questions.map(question =>
      question.id === id
        ? { ...question, ...updates, updateTime: new Date().toISOString() }
        : question
    )
  })),
  
  deleteQuestion: (id) => set((state) => ({
    questions: state.questions.filter(question => question.id !== id)
  })),
  
  // 试卷相关方法
  setExamPapers: (examPapers) => set({ examPapers }),
  
  addExamPaper: (paper) => set((state) => {
    const newPaper: ExamPaper = {
      ...paper,
      id: Date.now().toString(),
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };
    return {
      examPapers: [...state.examPapers, newPaper]
    };
  }),
  
  updateExamPaper: (id, updates) => set((state) => ({
    examPapers: state.examPapers.map(paper =>
      paper.id === id
        ? { ...paper, ...updates, updateTime: new Date().toISOString() }
        : paper
    )
  })),
  
  deleteExamPaper: (id) => set((state) => ({
    examPapers: state.examPapers.filter(paper => paper.id !== id)
  })),
  
  // 组卷规则相关方法
  setExamRules: (examRules) => set({ examRules }),
  
  addExamRule: (rule) => set((state) => {
    const newRule: ExamRule = {
      ...rule,
      id: Date.now().toString()
    };
    return {
      examRules: [...state.examRules, newRule]
    };
  }),
  
  updateExamRule: (id, updates) => set((state) => ({
    examRules: state.examRules.map(rule =>
      rule.id === id
        ? { ...rule, ...updates }
        : rule
    )
  })),
  
  deleteExamRule: (id) => set((state) => ({
    examRules: state.examRules.filter(rule => rule.id !== id)
  })),
  
  // 考试进行相关方法
  setCurrentExam: (examData) => set(() => ({
    currentExam: {
      paperId: examData.paperId,
      answers: examData.answers || {},
      startTime: examData.startTime || new Date().toISOString(),
      timeLeft: examData.timeLeft || 0,
      status: examData.status || 'in_progress'
    }
  })),
  
  updateAnswer: (questionId, answer) => set((state) => {
    if (!state.currentExam) return state;
    return {
      currentExam: {
        ...state.currentExam,
        answers: {
          ...state.currentExam.answers,
          [questionId]: answer
        }
      }
    };
  }),
  
  clearCurrentExam: () => set({ currentExam: null }),
  
  // 考试记录相关方法
  setExamRecords: (examRecords) => set({ examRecords }),
  
  addExamRecord: (record) => set((state) => {
    const newRecord: ExamRecord = {
      ...record,
      id: Date.now().toString(),
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    };
    return {
      examRecords: [...state.examRecords, newRecord]
    };
  }),
  
  getExamRecord: (id) => {
    const state = get();
    return state.examRecords.find(record => record.id === id);
  }
}));