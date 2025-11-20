import React from 'react';
import { Layout } from 'antd';
import WordImportTest from '../components/WordImportTest';

const { Content } = Layout;

const WordImportTestPage: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <WordImportTest />
      </Content>
    </Layout>
  );
};

export default WordImportTestPage;











