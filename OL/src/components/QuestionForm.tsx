import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Card,
  Divider,
  message,
  Row,
  Col,
  Tag
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { Question, QuestionType, DifficultyLevel, KnowledgePoint } from '../types';
import { generateId } from '../utils';
import { knowledgePointApi } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

interface QuestionFormProps {
  question?: Question | null;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ question, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.SINGLE_CHOICE);
  const [options, setOptions] = useState<string[]>([]);
  const [availableKnowledgePoints, setAvailableKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [selectedKnowledgePoints, setSelectedKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loadingKnowledgePoints, setLoadingKnowledgePoints] = useState(false);

  useEffect(() => {
    if (question) {
      form.setFieldsValue(question);
      setQuestionType(question.type);
      setOptions(question.options || []);
    } else {
      form.resetFields();
      setQuestionType(QuestionType.SINGLE_CHOICE);
      setOptions([]);
    }
  }, [question, form]);

  // 加载知识点
  useEffect(() => {
    loadKnowledgePoints();
  }, []);

  // 监听表单选项变化
  const formOptions = Form.useWatch('options', form);
  useEffect(() => {
    if (formOptions && Array.isArray(formOptions)) {
      setOptions(formOptions);
    }
  }, [formOptions]);

  // 加载知识点列表
  const loadKnowledgePoints = async () => {
    try {
      setLoadingKnowledgePoints(true);
      const response = await knowledgePointApi.getKnowledgePoints();
      if (response && response.data && response.data.data) {
        setAvailableKnowledgePoints(response.data.data);
      }
    } catch (error) {
      console.error('加载知识点失败:', error);
      message.error('加载知识点失败');
    } finally {
      setLoadingKnowledgePoints(false);
    }
  };

  const isChoiceQuestion = questionType === QuestionType.SINGLE_CHOICE || 
                          questionType === QuestionType.MULTIPLE_CHOICE;

  const isFillBlankQuestion = questionType === QuestionType.FILL_BLANK;

  // 当选项变化时，清空正确答案选择
  useEffect(() => {
    if (isChoiceQuestion && options.length > 0) {
      const currentAnswer = form.getFieldValue('correctAnswer');
      if (currentAnswer) {
        // 检查当前答案是否仍然有效
        if (Array.isArray(currentAnswer)) {
          // 多选题
          const validAnswers = currentAnswer.filter(answer => {
            const index = answer.charCodeAt(0) - 65;
            return index >= 0 && index < options.length;
          });
          if (validAnswers.length !== currentAnswer.length) {
            form.setFieldsValue({ correctAnswer: validAnswers.length > 0 ? validAnswers : undefined });
          }
        } else {
          // 单选题
          const index = currentAnswer.charCodeAt(0) - 65;
          if (index < 0 || index >= options.length) {
            form.setFieldsValue({ correctAnswer: undefined });
          }
        }
      }
    }
  }, [options, isChoiceQuestion, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const questionData: Question = {
        id: question?.id || generateId(),
        title: values.title,
        type: values.type,
        difficulty: values.difficulty,
        knowledgePoints: values.knowledgePoints || [],
        tags: values.tags || [],
        options: values.options || undefined,
        correctAnswer: values.correctAnswer,
        explanation: values.explanation,
        source: values.source,
        createTime: question?.createTime || new Date().toISOString(),
        updateTime: new Date().toISOString(),
      };

      onSave(questionData);
    } catch (error) {
      message.error('请检查表单填写是否完整');
    }
  };

  const handleTypeChange = (type: QuestionType) => {
    setQuestionType(type);
    // 清空选项和答案
    setOptions([]);
    form.setFieldsValue({
      options: undefined,
      correctAnswer: undefined,
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        type: QuestionType.SINGLE_CHOICE,
        difficulty: DifficultyLevel.MEDIUM,
        knowledgePoints: [],
        tags: [],
      }}
    >
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="type"
              label="题型"
              rules={[{ required: true, message: '请选择题型' }]}
            >
              <Select onChange={handleTypeChange}>
                <Option value={QuestionType.SINGLE_CHOICE}>单选题</Option>
                <Option value={QuestionType.MULTIPLE_CHOICE}>多选题</Option>
                <Option value={QuestionType.FILL_BLANK}>填空题</Option>
                <Option value={QuestionType.TRUE_FALSE}>判断题</Option>
                <Option value={QuestionType.SHORT_ANSWER}>简答题</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="difficulty"
              label="难度"
              rules={[{ required: true, message: '请选择难度' }]}
            >
              <Select>
                <Option value={DifficultyLevel.EASY}>简单</Option>
                <Option value={DifficultyLevel.MEDIUM}>中等</Option>
                <Option value={DifficultyLevel.HARD}>困难</Option>
                <Option value={DifficultyLevel.EXPERT}>专家</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="题目内容" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="title"
          label="题目"
          rules={[{ required: true, message: '请输入题目内容' }]}
        >
          <TextArea
            rows={4}
            placeholder="请输入题目内容..."
            showCount
            maxLength={1000}
          />
        </Form.Item>

        {isChoiceQuestion && (
          <Form.Item
            name="options"
            label="选项"
            rules={[{ required: true, message: '请添加选项' }]}
          >
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name]}
                        rules={[{ required: true, message: '请输入选项内容' }]}
                        style={{ marginBottom: 0, flex: 1 }}
                      >
                        <Input 
                          placeholder={`选项 ${String.fromCharCode(65 + name)}`}
                        />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加选项
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        )}

        {isFillBlankQuestion && (
          <Form.Item
            name="correctAnswer"
            label="正确答案"
            rules={[{ required: true, message: '请输入正确答案' }]}
          >
            <Input placeholder="请输入正确答案，多个答案用逗号分隔" />
          </Form.Item>
        )}

        {questionType === QuestionType.TRUE_FALSE && (
          <Form.Item
            name="correctAnswer"
            label="正确答案"
            rules={[{ required: true, message: '请选择正确答案' }]}
          >
            <Select placeholder="请选择正确答案">
              <Option value="true">正确</Option>
              <Option value="false">错误</Option>
            </Select>
          </Form.Item>
        )}

        {isChoiceQuestion && (
          <Form.Item
            name="correctAnswer"
            label="正确答案"
            rules={[{ required: true, message: '请选择正确答案' }]}
          >
            <Select
              mode={questionType === QuestionType.MULTIPLE_CHOICE ? 'multiple' : undefined}
              placeholder={questionType === QuestionType.MULTIPLE_CHOICE ? '请选择多个正确答案' : '请选择正确答案'}
              disabled={options.length === 0}
            >
              {options.map((option: string, index: number) => (
                <Option key={index} value={String.fromCharCode(65 + index)}>
                  {String.fromCharCode(65 + index)}. {option}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {questionType === QuestionType.SHORT_ANSWER && (
          <Form.Item
            name="correctAnswer"
            label="参考答案"
            rules={[{ required: true, message: '请输入参考答案' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入参考答案..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        )}
      </Card>

      <Card title="分类信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="knowledgePoints"
              label="知识点"
              rules={[{ required: true, message: '请选择至少一个知识点' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择知识点"
                style={{ width: '100%' }}
                loading={loadingKnowledgePoints}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={availableKnowledgePoints.map(kp => ({
                  value: kp.id,
                  label: kp.name,
                  subject: kp.subject
                }))}
                optionRender={(option) => (
                  <div>
                    <div>{option.label}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {option.data.subject}
                    </div>
                  </div>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="tags"
              label="标签"
            >
              <Select
                mode="tags"
                placeholder="输入标签，按回车添加"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="其他信息" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="explanation"
          label="解析"
        >
          <TextArea
            rows={3}
            placeholder="请输入题目解析..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="source"
          label="来源"
        >
          <Input placeholder="请输入题目来源..." />
        </Form.Item>
      </Card>

      <Divider />

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            {question ? '更新' : '保存'}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default QuestionForm;
