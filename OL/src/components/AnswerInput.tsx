import React from 'react';
import { Input, Radio, Checkbox, Space } from 'antd';

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

  // 根据题目类型渲染不同的答案输入组件
  const renderAnswerInput = () => {
    switch (questionType) {
      case 'SINGLE_CHOICE':
        return (
          <Radio.Group value={value} onChange={handleRadioChange}>
            <Space direction="vertical">
              {options.map((option, index) => (
                <Radio key={index} value={String.fromCharCode(65 + index)}>
                  {String.fromCharCode(65 + index)}. {option}
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
                  {String.fromCharCode(65 + index)}. {option}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );

      case 'TRUE_FALSE':
        return (
          <Radio.Group value={value} onChange={handleRadioChange}>
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
