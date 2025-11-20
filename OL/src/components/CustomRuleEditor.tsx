import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Card,
  Row,
  Col,
  Divider,
  Typography,
  message,
  Switch,
  Slider,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { knowledgePointApi, subjectApi } from '../services/api';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface QuestionTypeConfig {
  type: string;
  count: number;
  score: number;
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

interface KnowledgePointConfig {
  point: string;
  weight: number;
}

interface CustomRule {
  id?: string;
  name: string;
  description: string;
  subject: string;
  totalScore: number;
  duration: number;
  questionTypes: QuestionTypeConfig[];
  knowledgePoints: KnowledgePointConfig[];
  enableAI: boolean;
  aiPrompt?: string;
  isPublic: boolean;
}

interface CustomRuleEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (rule: CustomRule) => void;
  initialRule?: CustomRule;
  mode: 'create' | 'edit';
}

const CustomRuleEditor: React.FC<CustomRuleEditorProps> = ({
  visible,
  onClose,
  onSave,
  initialRule,
  mode
}) => {
  const [form] = Form.useForm();
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeConfig[]>([
    {
      type: 'SINGLE_CHOICE',
      count: 10,
      score: 2,
      difficulty: { easy: 30, medium: 50, hard: 20 }
    },
    {
      type: 'MULTIPLE_CHOICE',
      count: 5,
      score: 3,
      difficulty: { easy: 20, medium: 60, hard: 20 }
    },
    {
      type: 'FILL_BLANK',
      count: 5,
      score: 2,
      difficulty: { easy: 40, medium: 40, hard: 20 }
    }
  ]);

  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePointConfig[]>([
    { point: '基础概念', weight: 30 },
    { point: '应用实践', weight: 40 },
    { point: '综合应用', weight: 30 }
  ]);

  const [enableAI, setEnableAI] = useState(false);
  const [availableKnowledgePoints, setAvailableKnowledgePoints] = useState<any[]>([]);
  const [loadingKnowledgePoints, setLoadingKnowledgePoints] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState<{value: string; label: string}[]>([]);

  const questionTypeOptions = [
    { value: 'SINGLE_CHOICE', label: '单选题' },
    { value: 'MULTIPLE_CHOICE', label: '多选题' },
    { value: 'FILL_BLANK', label: '填空题' },
    { value: 'TRUE_FALSE', label: '判断题' },
    { value: 'SHORT_ANSWER', label: '简答题' }
  ];

  // 获取学科列表
  const fetchSubjects = async () => {
    try {
      const response = await subjectApi.getAllActiveSubjects();
      if (response.data.code === 200) {
        const subjects = response.data.object || [];
        setSubjectOptions(subjects.map((s: any) => ({
          value: s.name,
          label: s.name
        })));
      } else {
        console.error('获取学科列表失败:', response.data.message);
      }
    } catch (error) {
      console.error('获取学科列表失败:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchSubjects();
      
      if (initialRule) {
        form.setFieldsValue(initialRule);
        setQuestionTypes(initialRule.questionTypes || []);
        setKnowledgePoints(initialRule.knowledgePoints || []);
        setEnableAI(initialRule.enableAI || false);
      } else if (mode === 'create') {
        form.resetFields();
        setQuestionTypes([
          {
            type: 'SINGLE_CHOICE',
            count: 10,
            score: 2,
            difficulty: { easy: 30, medium: 50, hard: 20 }
          }
        ]);
        setKnowledgePoints([
          { point: '基础概念', weight: 30 }
        ]);
        setEnableAI(false);
      }
    }
  }, [visible, initialRule, mode, form]);

  // 加载知识点数据
  const loadKnowledgePoints = async (subject: string) => {
    if (!subject) {
      setAvailableKnowledgePoints([]);
      return;
    }

    try {
      setLoadingKnowledgePoints(true);
      console.log('正在加载知识点，学科:', subject);
      const response = await knowledgePointApi.getKnowledgePoints(subject);
      console.log('知识点API响应:', response);
      
      // 处理API响应数据结构
      let data = [];
      if (response && response.data) {
        if (typeof response.data === 'object' && response.data.data) {
          data = Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response.data)) {
          data = response.data;
        }
      }
      
      console.log('解析后的知识点数据:', data);
      setAvailableKnowledgePoints(data);
    } catch (error) {
      console.error('加载知识点失败:', error);
      message.error('加载知识点失败');
      setAvailableKnowledgePoints([]);
    } finally {
      setLoadingKnowledgePoints(false);
    }
  };

  // 监听学科变化
  const handleSubjectChange = (subject: string) => {
    loadKnowledgePoints(subject);
  };

  // 获取可用的知识点选项（排除已选择的）
  const getAvailableKnowledgePointOptions = (currentIndex: number) => {
    const selectedPoints = knowledgePoints
      .map((point, index) => index !== currentIndex ? point.point : null)
      .filter(point => point && point.trim() !== '');
    
    return availableKnowledgePoints
      .filter(kp => !selectedPoints.includes(kp.name))
      .map(kp => ({
        value: kp.name,
        label: kp.name
      }));
  };

  const addQuestionType = () => {
    const unused = questionTypeOptions.find(opt => !questionTypes.some(t => t.type === opt.value));
    if (!unused) {
      message.warning('可选题型已全部使用');
      return;
    }
    setQuestionTypes([...questionTypes, {
      type: unused.value,
      count: 5,
      score: 2,
      difficulty: { easy: 30, medium: 50, hard: 20 }
    }]);
  };

  const removeQuestionType = (index: number) => {
    if (questionTypes.length > 1) {
      setQuestionTypes(questionTypes.filter((_, i) => i !== index));
    }
  };

  const updateQuestionType = (index: number, field: string, value: any) => {
    const updated = [...questionTypes];
    if (field.startsWith('difficulty.')) {
      const diffField = field.split('.')[1];
      const currentDifficulty = updated[index].difficulty;
      const newDifficulty = { ...currentDifficulty, [diffField]: value };
      
      // 智能调整：如果总和超过100%，自动调整其他难度
      const total = newDifficulty.easy + newDifficulty.medium + newDifficulty.hard;
      if (total > 100) {
        const excess = total - 100;
        const otherFields = Object.keys(newDifficulty).filter(key => key !== diffField);
        
        // 按比例减少其他难度
        otherFields.forEach(key => {
          const currentValue = newDifficulty[key as keyof typeof newDifficulty];
          const reduction = Math.round((currentValue / (newDifficulty.easy + newDifficulty.medium + newDifficulty.hard - value)) * excess);
          newDifficulty[key as keyof typeof newDifficulty] = Math.max(0, currentValue - reduction);
        });
      }
      
      updated[index].difficulty = newDifficulty;
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setQuestionTypes(updated);
  };

  const getAvailableQuestionTypeOptions = (currentIndex: number) => {
    const selectedTypes = questionTypes
      .map((qt, i) => (i !== currentIndex ? qt.type : null))
      .filter(Boolean) as string[];
    return questionTypeOptions.map(opt => ({
      ...opt,
      disabled: selectedTypes.includes(opt.value)
    }));
  };

  const addKnowledgePoint = () => {
    // 获取已选择的知识点
    const selectedPoints = knowledgePoints.map(point => point.point).filter(point => point && point.trim() !== '');
    
    // 找到第一个未选择的知识点
    const availablePoint = availableKnowledgePoints.find(kp => !selectedPoints.includes(kp.name));
    const defaultPoint = availablePoint ? availablePoint.name : '';
    
    setKnowledgePoints([...knowledgePoints, { point: defaultPoint, weight: 10 }]);
  };

  const removeKnowledgePoint = (index: number) => {
    setKnowledgePoints(knowledgePoints.filter((_, i) => i !== index));
  };

  const updateKnowledgePoint = (index: number, field: string, value: any) => {
    const updated = [...knowledgePoints];
    updated[index] = { ...updated[index], [field]: value };
    setKnowledgePoints(updated);
  };

  const calculateTotalQuestions = () => {
    return questionTypes.reduce((total, type) => total + type.count, 0);
  };

  const calculateTotalScore = () => {
    return questionTypes.reduce((total, type) => total + (type.count * type.score), 0);
  };

  const validateDifficultyDistribution = (difficulty: { easy: number; medium: number; hard: number }) => {
    const total = difficulty.easy + difficulty.medium + difficulty.hard;
    return total <= 100;
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证题型配置
      for (const type of questionTypes) {
        if (!validateDifficultyDistribution(type.difficulty)) {
          message.error(`${getQuestionTypeLabel(type.type)}的难度分布总和不能超过100%`);
          return;
        }
      }

      // 验证题型不重复
      const typeValues = questionTypes.map(t => t.type).filter(Boolean);
      const uniqueTypeValues = Array.from(new Set(typeValues));
      if (uniqueTypeValues.length !== typeValues.length) {
        message.error('存在重复的题型，请检查并修改');
        return;
      }

      // 验证知识点重复
      const selectedPoints = knowledgePoints.map(point => point.point).filter(point => point && point.trim() !== '');
      const uniquePoints = [...new Set(selectedPoints)];
      
      if (selectedPoints.length !== uniquePoints.length) {
        message.error('存在重复的知识点，请检查并修改');
        return;
      }

      // 验证知识点权重
      const totalWeight = knowledgePoints.reduce((total, point) => total + point.weight, 0);
      if (totalWeight !== 100) {
        message.error('知识点权重总和必须等于100%');
        return;
      }

      const rule: CustomRule = {
        ...values,
        questionTypes,
        knowledgePoints,
        enableAI,
        id: mode === 'edit' ? initialRule?.id : undefined
      };

      onSave(rule);
      message.success(mode === 'create' ? '规则创建成功' : '规则更新成功');
    } catch (error) {
      console.error('保存规则失败:', error);
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    const option = questionTypeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          {mode === 'create' ? '创建自定义规则' : '编辑规则'}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          {mode === 'create' ? '创建规则' : '保存修改'}
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          subject: '计算机基础',
          totalScore: 100,
          duration: 120,
          isPublic: false
        }}
      >
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
              name="subject"
              label="学科"
              rules={[{ required: true, message: '请选择学科' }]}
            >
              <Select 
                placeholder="请选择学科"
                onChange={handleSubjectChange}
              >
                {subjectOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="规则描述"
          rules={[{ required: true, message: '请输入规则描述' }]}
        >
          <TextArea rows={3} placeholder="请输入规则描述" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="totalScore"
              label="总分"
              rules={[{ required: true, message: '请输入总分' }]}
            >
              <InputNumber min={1} max={1000} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="duration"
              label="考试时长(分钟)"
              rules={[{ required: true, message: '请输入考试时长' }]}
            >
              <InputNumber min={10} max={600} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="isPublic" label="公开规则" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Divider>题型配置</Divider>

        <Card size="small">
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                onClick={addQuestionType}
                disabled={questionTypes.length >= questionTypeOptions.length}
              >
                添加题型
              </Button>
              <Text type="secondary">
                总题数: {calculateTotalQuestions()} | 总分: {calculateTotalScore()}
              </Text>
            </Space>
          </div>

          {questionTypes.map((type, index) => (
            <Card key={index} size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16} align="middle">
                <Col span={4}>
                  <div>
                    <Text style={{ fontSize: 12, color: '#666' }}>题型</Text>
                    <Select
                      value={type.type}
                      onChange={(value) => updateQuestionType(index, 'type', value)}
                      style={{ width: '100%' }}
                    >
                      {getAvailableQuestionTypeOptions(index).map(option => (
                        <Option key={option.value} value={option.value} disabled={(option as any).disabled}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Col>
                <Col span={4}>
                  <div>
                    <Text style={{ fontSize: 12, color: '#666' }}>题数</Text>
                    <InputNumber
                      value={type.count}
                      onChange={(value) => updateQuestionType(index, 'count', value)}
                      min={1}
                      max={100}
                      style={{ width: '100%' }}
                      placeholder="题数"
                    />
                  </div>
                </Col>
                <Col span={4}>
                  <div>
                    <Text style={{ fontSize: 12, color: '#666' }}>分值</Text>
                    <InputNumber
                      value={type.score}
                      onChange={(value) => updateQuestionType(index, 'score', value)}
                      min={1}
                      max={20}
                      style={{ width: '100%' }}
                      placeholder="分值"
                    />
                  </div>
                </Col>
                <Col span={10}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12 }}>难度分布:</Text>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, minWidth: 30 }}>简单</Text>
                        <Slider
                          value={type.difficulty.easy}
                          onChange={(value) => updateQuestionType(index, 'difficulty.easy', value)}
                          min={0}
                          max={100}
                          style={{ flex: 1 }}
                        />
                        <Text style={{ fontSize: 12, minWidth: 30 }}>{type.difficulty.easy}%</Text>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, minWidth: 30 }}>中等</Text>
                        <Slider
                          value={type.difficulty.medium}
                          onChange={(value) => updateQuestionType(index, 'difficulty.medium', value)}
                          min={0}
                          max={100}
                          style={{ flex: 1 }}
                        />
                        <Text style={{ fontSize: 12, minWidth: 30 }}>{type.difficulty.medium}%</Text>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, minWidth: 30 }}>困难</Text>
                        <Slider
                          value={type.difficulty.hard}
                          onChange={(value) => updateQuestionType(index, 'difficulty.hard', value)}
                          min={0}
                          max={100}
                          style={{ flex: 1 }}
                        />
                        <Text style={{ fontSize: 12, minWidth: 30 }}>{type.difficulty.hard}%</Text>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Text 
                          style={{ 
                            fontSize: 11, 
                            color: (type.difficulty.easy + type.difficulty.medium + type.difficulty.hard) > 100 ? '#ff4d4f' : '#52c41a'
                          }}
                        >
                          总和: {type.difficulty.easy + type.difficulty.medium + type.difficulty.hard}%
                          {(type.difficulty.easy + type.difficulty.medium + type.difficulty.hard) > 100 && ' (超过100%)'}
                        </Text>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col span={2}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeQuestionType(index)}
                    disabled={questionTypes.length === 1}
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </Card>

        <Divider>知识点配置</Divider>

        <Card size="small">
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                onClick={addKnowledgePoint}
                disabled={availableKnowledgePoints.length === 0 || 
                         knowledgePoints.length >= availableKnowledgePoints.length}
              >
                添加知识点
              </Button>
              <Text type="secondary">
                权重总和: {knowledgePoints.reduce((total, point) => total + point.weight, 0)}%
              </Text>
              {availableKnowledgePoints.length === 0 && (
                <Text type="warning" style={{ fontSize: '12px' }}>
                  请先选择学科以加载知识点
                </Text>
              )}
              {availableKnowledgePoints.length > 0 && knowledgePoints.length >= availableKnowledgePoints.length && (
                <Text type="warning" style={{ fontSize: '12px' }}>
                  已选择所有可用知识点
                </Text>
              )}
            </Space>
          </div>

          {knowledgePoints.map((point, index) => (
            <Card key={index} size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16} align="middle">
                <Col span={16}>
                  <Select
                    value={point.point}
                    onChange={(value) => updateKnowledgePoint(index, 'point', value)}
                    placeholder="请选择知识点"
                    style={{ width: '100%' }}
                    loading={loadingKnowledgePoints}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={getAvailableKnowledgePointOptions(index)}
                  />
                </Col>
                <Col span={6}>
                  <InputNumber
                    value={point.weight}
                    onChange={(value) => updateKnowledgePoint(index, 'weight', value)}
                    min={1}
                    max={100}
                    style={{ width: '100%' }}
                    placeholder="权重"
                    addonAfter="%"
                  />
                </Col>
                <Col span={2}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeKnowledgePoint(index)}
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </Card>

        <Divider>AI增强配置</Divider>

        <Card size="small">
          <Row gutter={16} align="middle">
            <Col span={4}>
              <Switch
                checked={enableAI}
                onChange={setEnableAI}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </Col>
            <Col span={20}>
              <Space>
                <Text>启用AI智能生成题目</Text>
                <Tooltip title="开启后，系统将使用AI根据知识点和难度要求生成题目">
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                </Tooltip>
              </Space>
            </Col>
          </Row>

          {enableAI && (
            <div style={{ marginTop: 16 }}>
              <Form.Item
                name="aiPrompt"
                label="AI提示词"
                extra="自定义AI生成题目的提示词，留空使用默认提示词"
              >
                <TextArea
                  rows={4}
                  placeholder="例如：请生成关于数据结构的题目，要求题目具有实际应用背景，难度适中..."
                />
              </Form.Item>
            </div>
          )}
        </Card>
      </Form>
    </Modal>
  );
};

export default CustomRuleEditor;
