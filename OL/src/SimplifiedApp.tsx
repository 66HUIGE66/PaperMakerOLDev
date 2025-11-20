import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// 页面组件
import SimplifiedHome from './pages/SimplifiedHome';
import SimplifiedPaperGeneration from './pages/SimplifiedPaperGeneration';
import SimplifiedPractice from './pages/SimplifiedPractice';
import MyContent from './pages/MyContent';

// 布局组件
import SimplifiedLayout from './components/SimplifiedLayout';

const SimplifiedApp: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <SimplifiedLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<SimplifiedHome />} />
            <Route path="/paper-generation" element={<SimplifiedPaperGeneration />} />
            <Route path="/practice" element={<SimplifiedPractice />} />
            <Route path="/my-content" element={<MyContent />} />
            <Route path="/questions" element={<div>题库管理页面</div>} />
            <Route path="/rules" element={<div>组卷规则页面</div>} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </SimplifiedLayout>
      </Router>
    </ConfigProvider>
  );
};

export default SimplifiedApp;
