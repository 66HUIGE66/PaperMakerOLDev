import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, Card, Upload, message } from 'antd';
import { PlusOutlined, MinusCircleOutlined, PictureOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface QuestionOptionsProps {
  questionType: string;
  value?: string[];
  onChange?: (value: string[]) => void;
  onImageSelect?: (file: File) => string;
}

const QuestionOptions: React.FC<QuestionOptionsProps> = ({ questionType, value = [], onChange, onImageSelect }) => {
  const [options, setOptions] = useState<string[]>(() => {
    if (value && value.length > 0) {
      return value;
    }
    return questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE' ? ['', ''] : [];
  });

  useEffect(() => {
    if (value && value.length > 0) {
      setOptions(value);
    } else if (questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') {
      setOptions(['', '']);
    } else {
      setOptions([]);
    }
  }, [questionType, value]);

  const handleOptionChange = (index: number, optionValue: string) => {
    const newOptions = [...options];
    newOptions[index] = optionValue;
    setOptions(newOptions);
    onChange?.(newOptions);
  };

  const addOption = () => {
    const newOptions = [...options, ''];
    setOptions(newOptions);
    onChange?.(newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      onChange?.(newOptions);
    }
  };

  // 只有选择题才显示选项
  if (questionType !== 'SINGLE_CHOICE' && questionType !== 'MULTIPLE_CHOICE') {
    return null;
  }

  return (
    <Card size="small" title="题目选项" style={{ marginBottom: 16 }}>
      {options.map((option, index) => (
        <Form.Item
          key={index}
          style={{ marginBottom: 8 }}
        >
          <Space.Compact style={{ display: 'flex', width: '100%' }}>
            <Input
              placeholder={`选项 ${String.fromCharCode(65 + index)} (支持 Markdown 图片)`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              style={{ flex: 1 }}
            />
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('请上传图片文件');
                  return false;
                }

                if (onImageSelect) {
                  const tempId = onImageSelect(file);
                  const imageMarkdown = `![选项图片](${tempId})`;
                  handleOptionChange(index, (options[index] || '') + imageMarkdown);
                  message.success('图片已添加，将在保存时上传');
                } else {
                  message.warning('上传功能未就绪');
                }

                return false; // 阻止自动上传
              }}
            >
              <Button icon={<PictureOutlined />} title="插入图片" />
            </Upload>
            {options.length > 2 && (
              <Button
                type="text"
                icon={<MinusCircleOutlined />}
                onClick={() => removeOption(index)}
                danger
              />
            )}
          </Space.Compact>
          {option && (
            <div style={{
              marginTop: 4,
              padding: '4px 8px',
              backgroundColor: '#fafafa',
              borderRadius: 4,
              border: '1px dotted #d9d9d9',
              fontSize: '12px'
            }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                urlTransform={(uri) => uri.startsWith('blob:') ? uri : uri}
                components={{
                  img: ({ node, ...props }) => (
                    <img {...props} style={{ maxWidth: '100%', height: 'auto', maxHeight: '100px', display: 'block', margin: '4px 0' }} alt="预览图片" />
                  )
                }}
              >
                {option}
              </ReactMarkdown>
            </div>
          )}
        </Form.Item>
      ))}
      <Button
        type="dashed"
        onClick={addOption}
        block
        icon={<PlusOutlined />}
      >
        添加选项
      </Button>
    </Card>
  );
};

export default QuestionOptions;
