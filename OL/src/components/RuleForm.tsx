import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Card,
  Select,
  message,
  Row,
  Col,
  Divider,
  Slider
} from 'antd';
import { ExamRule, QuestionType, DifficultyLevel } from '../types';
import { generateId } from '../utils';

const { Option } = Select;
const { TextArea } = Input;

interface RuleFormProps {
  rule?: ExamRule | null;
  onSave: (rule: ExamRule) => void;
  onCancel: () => void;
}

const RuleForm: React.FC<RuleFormProps> = ({ rule, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [questionCount, setQuestionCount] = useState(10);
  const [difficultyDistribution, setDifficultyDistribution] = useState({
    [DifficultyLevel.EASY]: 2,
    [DifficultyLevel.MEDIUM]: 5,
    [DifficultyLevel.HARD]: 2,
    [DifficultyLevel.EXPERT]: 1,
  });
  const [typeDistribution, setTypeDistribution] = useState({
    [QuestionType.SINGLE_CHOICE]: 5,
    [QuestionType.MULTIPLE_CHOICE]: 2,
    [QuestionType.FILL_BLANK]: 2,
    [QuestionType.TRUE_FALSE]: 1,
    [QuestionType.SHORT_ANSWER]: 0,
  });

  useEffect(() => {
    if (rule) {
      form.setFieldsValue(rule);
      setQuestionCount(rule.questionCount);
      setDifficultyDistribution(rule.difficultyDistribution);
      setTypeDistribution(rule.typeDistribution);
    } else {
      form.resetFields();
      setQuestionCount(10);
      setDifficultyDistribution({
        [DifficultyLevel.EASY]: 2,
        [DifficultyLevel.MEDIUM]: 5,
        [DifficultyLevel.HARD]: 2,
        [DifficultyLevel.EXPERT]: 1,
      });
      setTypeDistribution({
        [QuestionType.SINGLE_CHOICE]: 5,
        [QuestionType.MULTIPLE_CHOICE]: 2,
        [QuestionType.FILL_BLANK]: 2,
        [QuestionType.TRUE_FALSE]: 1,
        [QuestionType.SHORT_ANSWER]: 0,
      });
    }
  }, [rule, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证难度分布总和
      const difficultySum = Object.values(difficultyDistribution).reduce((sum, count) => sum + count, 0);
      if (difficultySum !== questionCount) {
        message.error(`难度分布总和(${difficultySum})必须等于题目总数(${questionCount})`);
        return;
      }

      // 验证题型分布总和
      const typeSum = Object.values(typeDistribution).reduce((sum, count) => sum + count, 0);
      if (typeSum !== questionCount) {
        message.error(`题型分布总和(${typeSum})必须等于题目总数(${questionCount})`);
        return;
      }

      const ruleData: ExamRule = {
        id: rule?.id || generateId(),
        name: values.name,
        description: values.description,
        questionCount,
        timeLimit: values.timeLimit,
        difficultyDistribution,
        typeDistribution,
        knowledgePoints: values.knowledgePoints || [],
        tags: values.tags || [],
        excludeQuestions: values.excludeQuestions || [],
      };

      onSave(ruleData);
    } catch (error) {
      message.error('请检查表单填写是否完整');
    }
  };

  const handleDifficultyChange = (level: DifficultyLevel, value: number) => {
    const newDistribution = { ...difficultyDistribution, [level]: value };
    setDifficultyDistribution(newDistribution);
  };

  const handleTypeChange = (type: QuestionType, value: number) => {
    const newDistribution = { ...typeDistribution, [type]: value };
    setTypeDistribution(newDistribution);
  };

  const autoDistributeDifficulty = () => {
    const easy = Math.floor(questionCount * 0.2);
    const medium = Math.floor(questionCount * 0.5);
    const hard = Math.floor(questionCount * 0.2);
    const expert = questionCount - easy - medium - hard;
    
    setDifficultyDistribution({
      [DifficultyLevel.EASY]: easy,
      [DifficultyLevel.MEDIUM]: medium,
      [DifficultyLevel.HARD]: hard,
      [DifficultyLevel.EXPERT]: expert,
    });
  };

  const autoDistributeType = () => {
    const single = Math.floor(questionCount * 0.5);
    const multiple = Math.floor(questionCount * 0.2);
    const fill = Math.floor(questionCount * 0.2);
    const trueFalse = Math.floor(questionCount * 0.1);
    const shortAnswer = questionCount - single - multiple - fill - trueFalse;
    
    setTypeDistribution({
      [QuestionType.SINGLE_CHOICE]: single,
      [QuestionType.MULTIPLE_CHOICE]: multiple,
      [QuestionType.FILL_BLANK]: fill,
      [QuestionType.TRUE_FALSE]: trueFalse,
      [QuestionType.SHORT_ANSWER]: shortAnswer,
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        timeLimit: 60,
        knowledgePoints: [],
        tags: [],
        excludeQuestions: [],
      }}
    >
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="规则名称"
              rules={[{ required: true, message: '请输入规则名称' }]}
            >
              <Input placeholder="请输入规则名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="timeLimit"
              label="时间限制（分钟）"
              rules={[{ required: true, message: '请输入时间限制' }]}
            >
              <InputNumber
                min={1}
                max={300}
                style={{ width: '100%' }}
                placeholder="请输入时间限制"
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="description"
          label="规则描述"
        >
          <TextArea
            rows={3}
            placeholder="请输入规则描述..."
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Card>

      <Card title="题目设置" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="题目总数">
              <InputNumber
                min={1}
                max={100}
                value={questionCount}
                onChange={(value) => setQuestionCount(value || 10)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <div style={{ paddingTop: 30 }}>
              <Space>
                <Button size="small" onClick={autoDistributeDifficulty}>
                  自动分配难度
                </Button>
                <Button size="small" onClick={autoDistributeType}>
                  自动分配题型
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="难度分布" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                简单: {difficultyDistribution[DifficultyLevel.EASY]}
              </div>
              <Slider
                min={0}
                max={questionCount}
                value={difficultyDistribution[DifficultyLevel.EASY]}
                onChange={(value) => handleDifficultyChange(DifficultyLevel.EASY, value)}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                中等: {difficultyDistribution[DifficultyLevel.MEDIUM]}
              </div>
              <Slider
                min={0}
                max={questionCount}
                value={difficultyDistribution[DifficultyLevel.MEDIUM]}
                onChange={(value) => handleDifficultyChange(DifficultyLevel.MEDIUM, value)}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                困难: {difficultyDistribution[DifficultyLevel.HARD]}
              </div>
              <Slider
                min={0}
                max={questionCount}
                value={difficultyDistribution[DifficultyLevel.HARD]}
                onChange={(value) => handleDifficultyChange(DifficultyLevel.HARD, value)}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                专家: {difficultyDistribution[DifficultyLevel.EXPERT]}
              </div>
              <Slider
                min={0}
                max={questionCount}
                value={difficultyDistribution[DifficultyLevel.EXPERT]}
                onChange={(value) => handleDifficultyChange(DifficultyLevel.EXPERT, value)}
              />
            </div>
          </Col>
        </Row>
        <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 12 }}>
          难度分布总和: {Object.values(difficultyDistribution).reduce((sum, count) => sum + count, 0)} / {questionCount}
        </div>
      </Card>

      <Card title="题型分布" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                单选题: {typeDistribution[QuestionType.SINGLE_CHOICE]}
              </div>
              <Slider
                min={0}
                max={questionCount}
                value={typeDistribution[QuestionType.SINGLE_CHOICE]}
                onChange={(value) => handleTypeChange(QuestionType.SINGLE_CHOICE, value)}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                多选题: {typeDistribution[QuestionType.MULTIPLE_CHOICE]}
              </div>
              <Slider
                min={0}
                max={questionCount}
                value={typeDistribution[QuestionType.MULTIPLE_CHOICE]}
                onChange={(value) => handleTypeChange(QuestionType.MULTIPLE_CHOICE, value)}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                填空题: {typeDistribution[QuestionType.FILL_BLANK]}
              </div>
              <Slider
                min={0}
                max={questionCount}
                value={typeDistribution[QuestionType.FILL_BLANK]}
                onChange={(value) => handleTypeChange(QuestionType.FILL_BLANK, value)}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                判断题: {typeDistribution[QuestionType.TRUE_FALSE]}
              </div>
              <Slider
                min={0}
                max={questionCount}
                value={typeDistribution[QuestionType.TRUE_FALSE]}
                onChange={(value) => handleTypeChange(QuestionType.TRUE_FALSE, value)}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                简答题: {typeDistribution[QuestionType.SHORT_ANSWER]}
              </div>
              <Slider
                min={0}
                max={questionCount}
                value={typeDistribution[QuestionType.SHORT_ANSWER]}
                onChange={(value) => handleTypeChange(QuestionType.SHORT_ANSWER, value)}
              />
            </div>

          </Col>
        </Row>
        <div style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 12 }}>
          题型分布总和: {Object.values(typeDistribution).reduce((sum, count) => sum + count, 0)} / {questionCount}
        </div>
      </Card>

      <Card title="筛选条件" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="knowledgePoints"
              label="知识点"
            >
              <Select
                mode="tags"
                placeholder="输入知识点，按回车添加"
                style={{ width: '100%' }}
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

      <Divider />

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            {rule ? '更新' : '保存'}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default RuleForm;

