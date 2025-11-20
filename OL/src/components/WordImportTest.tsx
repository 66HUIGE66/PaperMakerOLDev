import React, { useState } from 'react';
import { Upload, Button, Card, List, Typography, message, Space, Divider } from 'antd';
import { InboxOutlined, FileWordOutlined } from '@ant-design/icons';
import { parseWordDocument } from '../utils/fileImport';
import { Question, ImportResult } from '../types';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

const WordImportTest: React.FC = () => {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setImportResult(null);

    try {
      const result = await parseWordDocument(file);
      setImportResult(result);
      
      if (result.success) {
        message.success(`成功解析 ${result.successCount} 道题目`);
      } else {
        message.error(result.message);
      }
    } catch (error: any) {
      message.error(`解析失败: ${error.message}`);
    } finally {
      setLoading(false);
    }

    return false; // 阻止自动上传
  };

  const renderQuestion = (question: Question, index: number) => (
    <Card key={question.id} size="small" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>题目 {index + 1}:</Text>
          <Paragraph style={{ margin: '8px 0' }}>{question.title}</Paragraph>
        </div>
        
        {question.options && question.options.length > 0 && (
          <div>
            <Text strong>选项:</Text>
            <List
              size="small"
              dataSource={question.options}
              renderItem={(option, optionIndex) => (
                <List.Item style={{ padding: '4px 0' }}>
                  <Text>{String.fromCharCode(65 + optionIndex)}. {option}</Text>
                </List.Item>
              )}
            />
          </div>
        )}
        
        <div>
          <Text strong>正确答案: </Text>
          <Text code>{question.correctAnswer}</Text>
        </div>
        
        {question.explanation && (
          <div>
            <Text strong>解析: </Text>
            <Text>{question.explanation}</Text>
          </div>
        )}
        
        <div>
          <Text type="secondary">
            类型: {question.type} | 难度: {question.difficulty}
          </Text>
        </div>
      </Space>
    </Card>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>Word文档导入测试</Title>
      <Paragraph>
        此页面用于测试Word文档的题目解析功能。支持导入包含选择题的Word文档。
      </Paragraph>

      <Card style={{ marginBottom: 24 }}>
        <Dragger
          accept=".doc,.docx"
          beforeUpload={handleFileUpload}
          showUploadList={false}
          loading={loading}
        >
          <p className="ant-upload-drag-icon">
            <FileWordOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽Word文档到此区域上传</p>
          <p className="ant-upload-hint">
            支持 .doc 和 .docx 格式，文件大小不超过10MB
          </p>
        </Dragger>
      </Card>

      {importResult && (
        <Card>
          <Title level={3}>解析结果</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>状态: </Text>
              <Text type={importResult.success ? 'success' : 'danger'}>
                {importResult.success ? '成功' : '失败'}
              </Text>
            </div>
            
            <div>
              <Text strong>消息: </Text>
              <Text>{importResult.message}</Text>
            </div>
            
            <div>
              <Text strong>统计: </Text>
              <Text>总计 {importResult.totalCount} 题，成功 {importResult.successCount} 题，失败 {importResult.errorCount} 题</Text>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div>
                <Text strong>错误信息:</Text>
                <List
                  size="small"
                  dataSource={importResult.errors}
                  renderItem={(error) => (
                    <List.Item>
                      <Text type="danger">{error}</Text>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {importResult.questions && importResult.questions.length > 0 && (
              <>
                <Divider />
                <Title level={4}>解析的题目</Title>
                {importResult.questions.map((question, index) => 
                  renderQuestion(question, index)
                )}
              </>
            )}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default WordImportTest;











