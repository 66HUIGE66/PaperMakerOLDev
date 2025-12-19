import React from 'react';
import { Input, Radio, Checkbox, Space } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AnswerInputProps {
  questionType: string;
  options?: string[];
  value?: string;
  onChange?: (value: string) => void;
}

const AnswerInput: React.FC<AnswerInputProps> = ({ questionType, options = [], value = '', onChange }) => {
  const handleRadioChange = (e: any) => {
    onChange?.(e.target.value);
  };

  const handleCheckboxChange = (checkedValues: string[]) => {
    onChange?.(checkedValues.join(','));
  };

  const handleTextChange = (e: any) => {
    onChange?.(e.target.value);
  };

  // 简单的 Markdown 渲染组件，带图片缩放处理
  const MarkdownLabel = ({ content }: { content: string }) => (
    <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ node, ...props }) => <img {...props} style={{ maxWidth: '100px', maxHeight: '100px', display: 'block', marginTop: '4px' }} alt="" />,
          p: ({ node, ...props }) => <span {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  // 根据题目类型渲染不同的答案输入组件
  const renderAnswerInput = () => {
    // 归一化处理后的值
    const normalizedValue = typeof value === 'string' ? value.toUpperCase() : String(value).toUpperCase();

    switch (questionType) {
      case 'SINGLE_CHOICE':
        return (
          <Radio.Group value={value} onChange={handleRadioChange}>
            <Space direction="vertical">
              {options.map((option, index) => (
                <Radio key={index} value={String.fromCharCode(65 + index)}>
                  <Space>
                    <span>{String.fromCharCode(65 + index)}. </span>
                    <MarkdownLabel content={option} />
                  </Space>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );

      case 'MULTIPLE_CHOICE':
        const selectedValues = value ? value.split(',') : [];
        return (
          <Checkbox.Group value={selectedValues} onChange={handleCheckboxChange}>
            <Space direction="vertical">
              {options.map((option, index) => (
                <Checkbox key={index} value={String.fromCharCode(65 + index)}>
                  <Space>
                    <span>{String.fromCharCode(65 + index)}. </span>
                    <MarkdownLabel content={option} />
                  </Space>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );

      case 'TRUE_FALSE':
        // 增强对多种真假值格式的兼容性（包括中文、布尔值、数字字符串）
        let tfValue: string | undefined = undefined;
        if (normalizedValue === 'TRUE' || normalizedValue === '1' || normalizedValue === '正确' || (value as any) === true || value === 'true') {
          tfValue = 'TRUE';
        } else if (normalizedValue === 'FALSE' || normalizedValue === '0' || normalizedValue === '错误' || (value as any) === false || value === 'false') {
          tfValue = 'FALSE';
        } else {
          tfValue = value;
        }

        return (
          <Radio.Group
            value={tfValue}
            onChange={handleRadioChange}
          >
            <Space direction="vertical">
              <Radio value="TRUE">正确</Radio>
              <Radio value="FALSE">错误</Radio>
            </Space>
          </Radio.Group>
        );

      case 'FILL_BLANK':
        return (
          <Input.TextArea
            rows={3}
            placeholder="请输入填空题答案，多个答案用分号(;)分隔"
            value={value}
            onChange={handleTextChange}
          />
        );

      case 'SHORT_ANSWER':
        return (
          <Input.TextArea
            rows={4}
            placeholder="请输入简答题答案"
            value={value}
            onChange={handleTextChange}
          />
        );

      default:
        return (
          <Input
            placeholder="请输入答案"
            value={value}
            onChange={handleTextChange}
          />
        );
    }
  };

  return renderAnswerInput();
};

export default AnswerInput;
