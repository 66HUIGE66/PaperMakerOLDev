import React, { useState, useCallback } from 'react';
import { Upload, Button, message, Progress, Card, Typography, Space, Tag } from 'antd';
import { InboxOutlined, FileExcelOutlined, FileWordOutlined } from '@ant-design/icons';
import { ImportResult } from '../types';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface FileUploadProps {
  onImportComplete?: (result: ImportResult) => void;
  acceptType?: 'excel' | 'word' | 'both';
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onImportComplete, 
  acceptType = 'both' 
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const getAcceptTypes = () => {
    switch (acceptType) {
      case 'excel':
        return '.xls,.xlsx';
      case 'word':
        return '.doc,.docx';
      case 'both':
      default:
        return '.xls,.xlsx,.doc,.docx';
    }
  };

  const getFileType = (fileName: string): 'excel' | 'word' => {
    const ext = fileName.toLowerCase().split('.').pop();
    return ext === 'xls' || ext === 'xlsx' ? 'excel' : 'word';
  };

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setImportResult(null);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const fileType = getFileType(file.name);
      let result: ImportResult;

      // 使用前端解析，不依赖后端
      if (fileType === 'excel') {
        const { parseExcelDocument } = await import('../utils/fileImport');
        result = await parseExcelDocument(file);
      } else {
        const { parseWordDocument } = await import('../utils/fileImport');
        result = await parseWordDocument(file);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      setImportResult(result);
      
      if (result.successCount > 0) {
        message.success(`成功解析 ${result.successCount} 道题目`);
      }
      
      if (result.errorCount > 0) {
        message.warning(`${result.errorCount} 道题目解析失败`);
      }

      onImportComplete?.(result);

    } catch (error: any) {
      console.error('文件解析失败:', error);
      
      // 根据错误类型显示不同的错误信息
      if (error.message?.includes('不支持的文件格式')) {
        message.error('不支持的文件格式，请选择Word或Excel文件');
      } else if (error.message?.includes('文件过大')) {
        message.error('文件过大，请选择小于10MB的文件');
      } else if (error.message) {
        message.error(`解析失败: ${error.message}`);
      } else {
        message.error('文件解析失败，请重试');
      }
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    }
  }, [onImportComplete]);

  const uploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    beforeUpload: (file: File) => {
      const isValidType = getAcceptTypes().split(',').some(type => 
        file.name.toLowerCase().endsWith(type)
      );

      if (!isValidType) {
        message.error('不支持的文件类型！');
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB！');
        return false;
      }

      handleUpload(file);
      return false; // 阻止自动上传
    },
  };

  const renderFileIcon = (type: string) => {
    return type === 'excel' ? <FileExcelOutlined /> : <FileWordOutlined />;
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>文件导入</Title>
          <Text type="secondary">
            支持导入 Excel (.xls, .xlsx) 和 Word (.doc, .docx) 格式的题目文件
          </Text>
        </div>

        <Dragger {...uploadProps} style={{ padding: '20px' }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">
            点击或拖拽文件到此区域上传
          </p>
          <p className="ant-upload-hint">
            支持单个文件上传，文件大小不超过 10MB
          </p>
        </Dragger>

        {uploading && (
          <div>
            <Text>上传中...</Text>
            <Progress percent={uploadProgress} status="active" />
          </div>
        )}

        {importResult && (
          <Card size="small" title="导入结果">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text>总计: </Text>
                <Tag color="blue">{importResult.totalCount}</Tag>
                <Text>成功: </Text>
                <Tag color="green">{importResult.successCount}</Tag>
                <Text>失败: </Text>
                <Tag color="red">{importResult.errorCount}</Tag>
              </div>
              
              {importResult.errors.length > 0 && (
                <div>
                  <Text strong>错误详情:</Text>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                    {importResult.errors.map((error, index) => (
                      <li key={index} style={{ color: '#ff4d4f', fontSize: '12px' }}>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Space>
          </Card>
        )}

        <div>
          <Title level={5}>文件格式要求</Title>
          <Space direction="vertical" size="small">
            <div>
              <Text strong>Excel 格式:</Text>
              <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                <li>第1列：题目标题</li>
                <li>第2列：题目类型（单选题、多选题、判断题、填空题、简答题）</li>
                <li>第3列：难度等级（简单、中等、困难、专家）</li>
                <li>第4-7列：选项内容（选择题）</li>
                <li>第8列：正确答案</li>
                <li>第9列：题目解析</li>
                <li>第10列：知识点</li>
                <li>第11列：标签</li>
              </ul>
            </div>
            <div>
              <Text strong>Word 格式（推荐）:</Text>
              <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                <li>题目格式：数字. 题干【题型】【难度】</li>
                <li>选项格式：A. 选项内容（选择题）</li>
                <li>答案格式：（答案内容）</li>
                <li>解析格式：答案详解：解析内容</li>
                <li>支持的题型：单选题、多选题、判断题、填空题、简答题</li>
                <li>支持的难度：简单、中等、困难、专家</li>
              </ul>
              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <strong>示例：</strong><br/>
                  1. 中国的首都是哪个城市？【单选题】【简单】<br/>
                  A. 上海<br/>
                  B. 北京<br/>
                  C. 广州<br/>
                  D. 深圳<br/>
                  （B）<br/>
                  答案详解：北京是中国的政治和文化中心。
                </Text>
              </div>
            </div>
          </Space>
        </div>
      </Space>
    </Card>
  );
};

export default FileUpload;




