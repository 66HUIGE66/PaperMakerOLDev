import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { Suspense, lazy } from 'react';
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const Layout = lazy(() => import('./components/Layout'));
const QuestionManagement = lazy(() => import('./pages/QuestionManagement'));
const SystemQuestionManagement = lazy(() => import('./pages/SystemQuestionManagement'));
const MyQuestionManagement = lazy(() => import('./pages/MyQuestionManagement'));
const SystemPaperManagement = lazy(() => import('./pages/SystemPaperManagement'));
const MyPaperManagement = lazy(() => import('./pages/MyPaperManagement'));
const PaperDetail = lazy(() => import('./pages/PaperDetail'));
const RuleManagement = lazy(() => import('./pages/RuleManagement'));
const MyRulesPage = lazy(() => import('./pages/MyRulesPage'));
const SystemRulesPage = lazy(() => import('./pages/SystemRulesPage'));
const RuleCreatePage = lazy(() => import('./pages/RuleCreatePage'));
const RuleEditPage = lazy(() => import('./pages/RuleEditPage'));
const RuleViewPage = lazy(() => import('./pages/RuleViewPage'));
const ExamTaking = lazy(() => import('./pages/ExamTaking'));
const ExamPaperManagement = lazy(() => import('./pages/ExamPaperManagement'));
const PaperGeneration = lazy(() => import('./pages/PaperGeneration'));
const KnowledgePointManagement = lazy(() => import('./pages/KnowledgePointManagement'));
const SubjectKnowledgePointManagement = lazy(() => import('./pages/SubjectKnowledgePointManagement'));
const Home = lazy(() => import('./pages/Home'));
const PracticeModeSelector = lazy(() => import('./components/PracticeModeSelector'));
const WordImportTestPage = lazy(() => import('./pages/WordImportTestPage'));
const StartPracticePage = lazy(() => import('./pages/StartPracticePage'));
const PracticeRecordsPage = lazy(() => import('./pages/PracticeRecordsPage'));
const PracticeDetail = lazy(() => import('./pages/PracticeDetail'));
const PracticeStatisticsPage = lazy(() => import('./pages/PracticeStatisticsPage'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));
const RuleConfigDemo = lazy(() => import('./pages/RuleConfigDemo'));
// 系统管理相关页面
const SystemMonitorPage = lazy(() => import('./pages/SystemMonitorPage'));
const AnnouncementManagementPage = lazy(() => import('./pages/AnnouncementManagementPage'));
const FeedbackManagementPage = lazy(() => import('./pages/FeedbackManagementPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const MyFeedbackPage = lazy(() => import('./pages/MyFeedbackPage'));
const MyPlansPage = lazy(() => import('./pages/MyPlansPage'));
const MyPlanDetailPage = lazy(() => import('./pages/MyPlanDetailPage'));
const MyMistakesPage = lazy(() => import('./pages/MyMistakesPage'));
import './App.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConfigProvider locale={zhCN}>
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* 登录和注册路由 */}
              <Route path="/login" element={<Suspense fallback={<div>加载中...</div>}><Login /></Suspense>} />
              <Route path="/register" element={<Suspense fallback={<div>加载中...</div>}><Register /></Suspense>} />

              {/* 受保护的路由，需要用户登录 */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <Suspense fallback={<div>加载中...</div>}>
                    <Layout>
                      <Routes>
                        <Route index element={<Suspense fallback={<div>加载中...</div>}><Home /></Suspense>} />
                        <Route path="practice" element={<Suspense fallback={<div>加载中...</div>}><PracticeModeSelector onModeSelected={(mode, params) => {
                          // 这里可以添加跳转到练习页面的逻辑
                        }} userId={1} /></Suspense>} />
                        <Route path="start-practice" element={<Suspense fallback={<div>加载中...</div>}><StartPracticePage /></Suspense>} />
                        <Route path="practice-records" element={<Suspense fallback={<div>加载中...</div>}><PracticeRecordsPage /></Suspense>} />
                        <Route path="practice-statistics" element={<Suspense fallback={<div>加载中...</div>}><PracticeStatisticsPage /></Suspense>} />
                        <Route path="my-statistics" element={<Suspense fallback={<div>加载中...</div>}><PracticeStatisticsPage /></Suspense>} />
                        <Route path="ai-assistant" element={<Suspense fallback={<div>加载中...</div>}><AIAssistantPage /></Suspense>} />
                        <Route path="rule-config-demo" element={<Suspense fallback={<div>加载中...</div>}><RuleConfigDemo /></Suspense>} />
                        <Route path="practice-detail/:recordId" element={<Suspense fallback={<div>加载中...</div>}><PracticeDetail /></Suspense>} />
                        <Route path="my-questions" element={<Suspense fallback={<div>加载中...</div>}><MyQuestionManagement /></Suspense>} />
                        <Route path="system-questions" element={<Suspense fallback={<div>加载中...</div>}><SystemQuestionManagement /></Suspense>} />
                        <Route path="my-papers" element={<Suspense fallback={<div>加载中...</div>}><MyPaperManagement /></Suspense>} />
                        <Route path="my-plans" element={<Suspense fallback={<div>加载中...</div>}><MyPlansPage /></Suspense>} />
                        <Route path="my-plans/:id" element={<Suspense fallback={<div>加载中...</div>}><MyPlanDetailPage /></Suspense>} />
                        <Route path="my-mistakes" element={<Suspense fallback={<div>加载中...</div>}><MyMistakesPage /></Suspense>} />
                        <Route path="system-papers" element={<Suspense fallback={<div>加载中...</div>}><SystemPaperManagement /></Suspense>} />
                        <Route path="paper-detail/:id" element={<Suspense fallback={<div>加载中...</div>}><PaperDetail /></Suspense>} />
                        <Route path="generate" element={<Suspense fallback={<div>加载中...</div>}><PaperGeneration /></Suspense>} />
                        <Route path="my-subject-knowledge" element={<Suspense fallback={<div>加载中...</div>}><SubjectKnowledgePointManagement /></Suspense>} />
                        <Route path="system-subject-knowledge" element={<Suspense fallback={<div>加载中...</div>}><SubjectKnowledgePointManagement /></Suspense>} />
                        {/* 规则列表路由 - 默认重定向到我的规则 */}
                        <Route path="rules" element={<Navigate to="/my-rules" replace />} />
                        <Route path="my-rules" element={<Suspense fallback={<div>加载中...</div>}><MyRulesPage /></Suspense>} />
                        <Route path="system-rules" element={<Suspense fallback={<div>加载中...</div>}><SystemRulesPage /></Suspense>} />
                        <Route path="exam/:paperId" element={<Suspense fallback={<div>加载中...</div>}><ExamTaking /></Suspense>} />
                        <Route path="word-import-test" element={<Suspense fallback={<div>加载中...</div>}><WordImportTestPage /></Suspense>} />
                        {/* 规则管理模块路由（列表页已拆分为我的规则/系统规则，因此移除旧的总览页）*/}
                        <Route path="rules/create" element={<RuleCreatePage />} />
                        <Route path="rules/edit/:id" element={<RuleEditPage />} />
                        <Route path="rules/view/:id" element={<RuleViewPage />} />
                        {/* 用户反馈页面 */}
                        <Route path="my-feedback" element={<Suspense fallback={<div>加载中...</div>}><MyFeedbackPage /></Suspense>} />
                        {/* 系统管理页面 (仅系统管理员可见) */}
                        <Route path="admin/monitor" element={<Suspense fallback={<div>加载中...</div>}><SystemMonitorPage /></Suspense>} />
                        <Route path="admin/users" element={<Suspense fallback={<div>加载中...</div>}><UserManagementPage /></Suspense>} />
                        <Route path="admin/announcements" element={<Suspense fallback={<div>加载中...</div>}><AnnouncementManagementPage /></Suspense>} />
                        <Route path="admin/feedbacks" element={<Suspense fallback={<div>加载中...</div>}><FeedbackManagementPage /></Suspense>} />
                        {/* 保留原有路由以兼容 */}
                        <Route path="questions" element={<QuestionManagement />} />
                        <Route path="papers" element={<ExamPaperManagement />} />
                        <Route path="old-rules" element={<RuleManagement />} />
                        <Route path="paper-generation" element={<PaperGeneration />} />
                        <Route path="knowledge" element={<SubjectKnowledgePointManagement />} />
                        <Route path="knowledge-points" element={<KnowledgePointManagement />} />
                      </Routes>
                    </Layout>
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* 默认重定向到首页 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;

