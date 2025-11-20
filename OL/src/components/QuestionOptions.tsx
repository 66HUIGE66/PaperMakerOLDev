import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Space, Card } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

interface QuestionOptionsProps {
  questionType: string;
  value?: string[];
  onChange?: (value: string[]) => void;
}

const QuestionOptions: React.FC<QuestionOptionsProps> = ({ questionType, value = [], onChange }) => {
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
          <Space.Compact style={{ display: 'flex' }}>
            <Input
              placeholder={`选项 ${String.fromCharCode(65 + index)}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              style={{ flex: 1 }}
            />
            {options.length > 2 && (
              <Button
                type="text"
                icon={<MinusCircleOutlined />}
                onClick={() => removeOption(index)}
                danger
              />
            )}
          </Space.Compact>
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
