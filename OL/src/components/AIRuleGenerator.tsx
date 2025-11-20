import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  Input,
  Button,
  Space,
  Typography,
  message,
  Modal,
  Tag,
  Divider,
  Row,
  Col,
  Tabs,
  Alert,
  InputNumber,
  Slider,
  Switch,
  Collapse
} from 'antd';
import {
  RobotOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  BulbOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { intelligentPaperApi, examRuleApi } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface AIRuleGeneratorProps {
  visible: boolean;
  onClose: () => void;
  onRuleGenerated?: (rule: any) => void;
}

const AIRuleGenerator: React.FC<AIRuleGeneratorProps> = ({
  visible,
  onClose,
  onRuleGenerated
}) => {
  const [form] = Form.useForm();
  const [optimizeForm] = Form.useForm();
  const [ruleEditForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [generatedRule, setGeneratedRule] = useState<string>('');
  const [ruleObject, setRuleObject] = useState<any>(null);
  const [testingAI, setTestingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [editingMode, setEditingMode] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [showValidationModal, setShowValidationModal] = useState(false);

  // 从数据库加载学科和知识点信息
  const loadDatabaseInfo = async () => {
    try {
      const response = await intelligentPaperApi.getDatabaseInfo();
      if (response.data.code === 200) {
        const data = response.data.data;
        setDatabaseInfo(data);
        
        // 提取学科列表
        const subjectsList = Object.keys(data.subjects || {}).map(subjectName => ({
          value: subjectName,
          label: subjectName,
          knowledgePoints: data.subjects[subjectName].knowledgePoints || []
        }));
        
        setSubjects(subjectsList);
        console.log('从数据库加载的学科信息:', subjectsList);
      } else {
        console.error('加载数据库信息失败:', response.data.message);
        // 使用默认学科列表
        setSubjects([
          { value: '计算机科学', label: '计算机科学' },
          { value: '数学', label: '数学' },
          { value: '物理', label: '物理' },
          { value: '化学', label: '化学' },
          { value: '英语', label: '英语' },
          { value: '语文', label: '语文' },
          { value: '历史', label: '历史' },
          { value: '地理', label: '地理' }
        ]);
      }
    } catch (error) {
      console.error('加载数据库信息失败:', error);
      // 使用默认学科列表
      setSubjects([
    { value: '计算机科学', label: '计算机科学' },
    { value: '数学', label: '数学' },
    { value: '物理', label: '物理' },
    { value: '化学', label: '化学' },
    { value: '英语', label: '英语' },
    { value: '语文', label: '语文' },
    { value: '历史', label: '历史' },
    { value: '地理', label: '地理' }
      ]);
    }
  };

  // 组件挂载时加载数据库信息
  useEffect(() => {
    if (visible) {
      loadDatabaseInfo();
    } else {
      //  弹窗关闭时重置编辑器状态
      setRuleObject(null);
      setGeneratedRule('');
      setEditingMode(false);
      ruleEditForm.resetFields();
      form.resetFields();
    }
  }, [visible]);

  const examTypes = [
    { value: '期中考试', label: '期中考试' },
    { value: '单元测试', label: '单元测试' },
    { value: '模拟考试', label: '模拟考试' },
    { value: '入学考试', label: '入学考试' },
    { value: '资格认证', label: '资格认证' },
    { value: '技能测试', label: '技能测试' }
  ];

  const checkAIStatus = async () => {
    try {
      setTestingAI(true);
      const response = await intelligentPaperApi.getAIStatus();
      setAiStatus(response.data.data);
      if (response.data) {
        message.success('AI服务连接正常');
      } else {
        message.warning('AI服务不可用');
      }
    } catch (error) {
      console.error('检查AI状态失败:', error);
      message.error('检查AI状态失败');
    } finally {
      setTestingAI(false);
    }
  };

  const testAIConnection = async () => {
    try {
      setTestingAI(true);
      const response = await intelligentPaperApi.testAI();
      message.success('AI服务测试成功');
      console.log('AI测试响应:', response.data);
    } catch (error) {
      console.error('AI服务测试失败:', error);
      message.error('AI服务测试失败');
    } finally {
      setTestingAI(false);
    }
  };

  const handleGenerateRule = async (values: any) => {
    try {
      setLoading(true);
      
      //  重置可视化规则编辑器状态
      setRuleObject(null);
      setGeneratedRule('');
      setEditingMode(false);
      ruleEditForm.resetFields();
      
      // 直接调用后端，后端 SubjectsTool 会检查：
      // 1. 学科是否存在
      // 2. 学科下是否有知识点
      // 3. 指定知识点是否存在
      const response = await intelligentPaperApi.generateRule({
        userInput: values.userInput,
        subject: values.subject,
        examType: values.examType,
        requirements: values.requirements
      });
      console.log("response:" , response)
      
      //  检查后端返回的错误响应（code: 400 表示生成失败）
      if (response.data.code === 400) {
        // 后端返回的是 AI 生成的错误信息
        const errorMessage = response.data.message;
        
        // 显示后端返回的具体错误信息
        setValidationError(errorMessage || '生成规则失败，请检查输入的学科和知识点是否正确');
        setShowValidationModal(true);
        return;
      }

      if (response.data.code === 500100) {
        const errorMessage = response.data.message || '生成规则失败，请重试';
        message.error(errorMessage);
        return;
      }

      //  检查后端返回的错误响应（code: 500 表示服务器内部错误）
      if (response.data.code === 500) {
        const errorMessage = response.data.message || '生成规则失败，请重试';
        message.error(errorMessage);
        return;
      }
      
      // 正常处理AI生成的规则
      const rule = JSON.parse(response.data.data);
      console.log("rule:" , rule)
      
      // 保存规则对象和格式化字符串
      setRuleObject(rule);
      setGeneratedRule(JSON.stringify(rule, null, 2));
      
      // 将规则参数直接填充到可视化编辑器中
      populateRuleToEditor(rule);
      
      message.success('组卷规则生成成功！已自动填充到编辑器中');
    } catch (error: any) {
      console.error('生成组卷规则失败:', error);
      // 如果是解析JSON失败，可能是后端返回了错误信息
      if (error.message && error.message.includes('JSON')) {
        message.error('生成规则失败，请检查输入的学科和知识点是否正确');
      } else {
        message.error('生成组卷规则失败：' + (error.message || '请重试'));
      }
    } finally {
      setLoading(false);
    }
  };

  // 注意：学科和知识点的存在性检查已移至后端 SubjectsTool 统一处理
  // 这样可以确保数据一致性，避免前端缓存问题

  const handleOptimizeRule = async (values: any) => {
    try {
      setLoading(true);
      const response = await intelligentPaperApi.optimizeRule({
        currentRule: values.currentRule,
        optimizationRequirements: values.optimizationRequirements
      });
      
      const optimizedRule = response.data;
      // 确保将对象转换为字符串用于显示
      const ruleString = typeof optimizedRule === 'string' 
        ? optimizedRule 
        : JSON.stringify(optimizedRule, null, 2);
      setGeneratedRule(ruleString);
      message.success('规则优化成功！');
    } catch (error) {
      console.error('优化规则失败:', error);
      message.error('优化规则失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUseRule = async () => {
    if (!ruleObject) {
      message.error('没有可用的规则');
      return;
    }

    try {
      // 将规则保存到数据库
      await saveRuleToDatabase(ruleObject);
      
      // 调用回调函数
      onRuleGenerated?.(ruleObject);
        onClose();
      } catch (error) {
      console.error('保存规则失败:', error);
      message.error('保存规则失败，请重试');
    }
  };

  // 保存规则到数据库
  const saveRuleToDatabase = async (rule: any) => {
    try {
      // 计算总题目数
      const questionTypeDistribution = rule.questionTypeDistribution || {};
      const totalQuestions = Object.values(questionTypeDistribution).reduce((sum: number, count: any) => sum + (count || 0), 0);
      
      // 构建规则实体
      const ruleEntity = {
        name: rule.title || 'AI生成的规则',
        description: rule.description || '由AI智能生成的组卷规则',
        totalQuestions: totalQuestions,
        totalScore: rule.totalScore || 100,
        duration: rule.duration || 60,
        ruleConfig: JSON.stringify({
          title: rule.title,
          description: rule.description,
          subject: rule.subject,
          totalScore: rule.totalScore,
          duration: rule.duration,
          questionTypeDistribution: rule.questionTypeDistribution,
          difficultyDistribution: rule.difficultyDistribution,
          knowledgePoints: rule.knowledgePoints || [],
          specialRequirements: rule.specialRequirements || ''
        }),
        isSystem: false, // 用户创建的规则
        status: 'ACTIVE'
      };

      console.log('准备保存规则到数据库:', ruleEntity);

      // 调用后端API保存规则
      const response = await examRuleApi.createRule(ruleEntity);
      
      if (response.data.code === 200) {
        message.success('规则已成功保存到数据库！');
        console.log('规则保存成功:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || '保存规则失败');
      }
    } catch (error: any) {
      console.error('保存规则到数据库失败:', error);
      throw error;
    }
  };

  const handleEditRule = () => {
    setEditingMode(true);
  };

  const handleSaveEdit = () => {
    ruleEditForm.validateFields().then((values) => {
      // 处理难度分布：将百分比转换回小数
      const processedValues = { ...values };
      if (processedValues.difficultyDistribution) {
        const difficulty = processedValues.difficultyDistribution;
        processedValues.difficultyDistribution = {
          EASY: (difficulty.EASY || 0) / 100,
          MEDIUM: (difficulty.MEDIUM || 0) / 100,
          HARD: (difficulty.HARD || 0) / 100
        };
      }

      setRuleObject(processedValues);
      setGeneratedRule(JSON.stringify(processedValues, null, 2));
      setEditingMode(false);
      message.success('规则修改成功！');
    }).catch((error) => {
      console.error('规则验证失败:', error);
      message.error('请检查输入的数据格式，确保所有校验规则都通过');
    });
  };

  const handleCancelEdit = () => {
    setEditingMode(false);
    // 恢复原始数据
    if (ruleObject) {
      ruleEditForm.setFieldsValue(ruleObject);
    }
  };

  const addKnowledgePoint = () => {
    const currentPoints = ruleEditForm.getFieldValue('knowledgePoints') || [];
    ruleEditForm.setFieldsValue({
      knowledgePoints: [...currentPoints, { name: '', weight: 10 }]
    });
  };

  const removeKnowledgePoint = (index: number) => {
    const currentPoints = ruleEditForm.getFieldValue('knowledgePoints') || [];
    const newPoints = currentPoints.filter((_: any, i: number) => i !== index);
    ruleEditForm.setFieldsValue({
      knowledgePoints: newPoints
    });
  };

  // 将AI生成的规则参数填充到可视化编辑器中
  const populateRuleToEditor = (rule: any) => {
    try {
      // 处理难度分布：将小数转换为百分比
      const processedRule = { ...rule };
      if (processedRule.difficultyDistribution) {
        const difficulty = processedRule.difficultyDistribution;
        processedRule.difficultyDistribution = {
          EASY: Math.round((difficulty.EASY || 0) * 100),
          MEDIUM: Math.round((difficulty.MEDIUM || 0) * 100),
          HARD: Math.round((difficulty.HARD || 0) * 100)
        };
      }

      // 确保知识点数组格式正确
      if (!processedRule.knowledgePoints || !Array.isArray(processedRule.knowledgePoints)) {
        processedRule.knowledgePoints = [];
      }

      // 填充表单数据
      ruleEditForm.setFieldsValue(processedRule);
      
      // 自动进入编辑模式
      setEditingMode(true);
      
      console.log('规则参数已填充到编辑器:', processedRule);
    } catch (error) {
      console.error('填充规则参数失败:', error);
      message.error('填充规则参数失败');
    }
  };

  // 校验难度分布总和
  const validateDifficultyDistribution = (_: any, value: number) => {
    const easy = ruleEditForm.getFieldValue(['difficultyDistribution', 'EASY']) || 0;
    const medium = ruleEditForm.getFieldValue(['difficultyDistribution', 'MEDIUM']) || 0;
    const hard = ruleEditForm.getFieldValue(['difficultyDistribution', 'HARD']) || 0;
    const total = easy + medium + hard;
    
    if (total > 100) {
      return Promise.reject(new Error(`难度分布总和不能超过100%，当前为${total}%`));
    }
    return Promise.resolve();
  };

  // 校验题型数量总和
  const validateQuestionTypeDistribution = (_: any, value: number) => {
    const singleChoice = ruleEditForm.getFieldValue(['questionTypeDistribution', 'SINGLE_CHOICE']) || 0;
    const multipleChoice = ruleEditForm.getFieldValue(['questionTypeDistribution', 'MULTIPLE_CHOICE']) || 0;
    const trueFalse = ruleEditForm.getFieldValue(['questionTypeDistribution', 'TRUE_FALSE']) || 0;
    const fillBlank = ruleEditForm.getFieldValue(['questionTypeDistribution', 'FILL_BLANK']) || 0;
    const shortAnswer = ruleEditForm.getFieldValue(['questionTypeDistribution', 'SHORT_ANSWER']) || 0;
    const total = singleChoice + multipleChoice + trueFalse + fillBlank + shortAnswer;
    
    if (total === 0) {
      return Promise.reject(new Error('至少需要设置一种题型的数量'));
    }
    if (total > 200) {
      return Promise.reject(new Error(`题型总数不能超过200题，当前为${total}题`));
    }
    return Promise.resolve();
  };

  // 校验知识点权重总和
  const validateKnowledgePointsWeight = (_: any, value: number) => {
    const knowledgePoints = ruleEditForm.getFieldValue('knowledgePoints') || [];
    const totalWeight = knowledgePoints.reduce((sum: number, point: any) => sum + (point.weight || 0), 0);
    
    if (totalWeight > 100) {
      return Promise.reject(new Error(`知识点权重总和不能超过100，当前为${totalWeight}`));
    }
    return Promise.resolve();
  };

  const renderAIStatus = () => {
    if (!aiStatus) return null;

    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Tag color={aiStatus.available ? 'green' : 'red'}>
            {aiStatus.available ? 'AI服务正常' : 'AI服务异常'}
          </Tag>
          <Text type="secondary">模型: {aiStatus.model}</Text>
          <Text type="secondary">提供商: {aiStatus.provider}</Text>
        </Space>
      </Card>
    );
  };

  const renderRuleEditor = () => {
    if (!ruleObject) return null;

    return (
      <Card 
        title="可视化规则编辑器" 
        extra={
          <Space>
            {editingMode ? (
              <>
                <Button onClick={handleCancelEdit}>取消</Button>
                <Button type="primary" onClick={handleSaveEdit}>保存</Button>
              </>
            ) : (
              <>
                <Button icon={<EditOutlined />} onClick={handleEditRule}>编辑规则</Button>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={handleUseRule}
          >
            使用此规则
          </Button>
              </>
            )}
          </Space>
        }
      >
        <Alert
          message="AI生成的规则"
          description="以下是AI根据您的需求生成的组卷规则，您可以可视化编辑后使用。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        {/*  显示可用的学科和知识点信息 */}
        {databaseInfo && (
          <Alert
            message="数据库中的学科和知识点"
            description={
              <div>
                <div style={{ marginBottom: 8 }}>
                  <strong>可用学科：</strong>
                  {Object.keys(databaseInfo.subjects || {}).join('、')}
                </div>
                <div>
                  <strong>总知识点数：</strong>
                  {Object.values(databaseInfo.subjects || {}).reduce((total: number, subject: any) => 
                    total + (subject.knowledgePoints?.length || 0), 0
                  )}
                </div>
              </div>
            }
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        {editingMode ? (
          <Form form={ruleEditForm} layout="vertical">
            <Collapse defaultActiveKey={['basic', 'distribution', 'knowledge']}>
              <Panel header="基本信息" key="basic">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="title" label="试卷标题" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="subject" label="学科" rules={[{ required: true }]}>
                      <Select>
                        {subjects.map(subject => (
                          <Option key={subject.value} value={subject.value}>
                            {subject.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="description" label="试卷描述">
                  <TextArea rows={3} />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="totalScore" label="总分" rules={[{ required: true }]}>
                      <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="duration" label="考试时长(分钟)" rules={[{ required: true }]}>
                      <InputNumber min={1} max={600} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>
              
              <Panel header="题型分布" key="distribution">
                <Title level={5}>题型分布</Title>
                <Form.Item 
                  name={['questionTypeDistribution', 'SINGLE_CHOICE']} 
                  label="单选题数量"
                  rules={[{ validator: validateQuestionTypeDistribution }]}
                >
                  <InputNumber 
                    min={0} 
                    max={100} 
                    style={{ width: '100%' }} 
                    onChange={() => {
                      // 触发其他题型的校验
                      ruleEditForm.validateFields([
                        ['questionTypeDistribution', 'MULTIPLE_CHOICE'],
                        ['questionTypeDistribution', 'TRUE_FALSE'],
                        ['questionTypeDistribution', 'FILL_BLANK'],
                        ['questionTypeDistribution', 'SHORT_ANSWER']
                      ]);
                    }}
                  />
                </Form.Item>
                <Form.Item 
                  name={['questionTypeDistribution', 'MULTIPLE_CHOICE']} 
                  label="多选题数量"
                  rules={[{ validator: validateQuestionTypeDistribution }]}
                >
                  <InputNumber 
                    min={0} 
                    max={100} 
                    style={{ width: '100%' }} 
                    onChange={() => {
                      ruleEditForm.validateFields([
                        ['questionTypeDistribution', 'SINGLE_CHOICE'],
                        ['questionTypeDistribution', 'TRUE_FALSE'],
                        ['questionTypeDistribution', 'FILL_BLANK'],
                        ['questionTypeDistribution', 'SHORT_ANSWER']
                      ]);
                    }}
                  />
                </Form.Item>
                <Form.Item 
                  name={['questionTypeDistribution', 'TRUE_FALSE']} 
                  label="判断题数量"
                  rules={[{ validator: validateQuestionTypeDistribution }]}
                >
                  <InputNumber 
                    min={0} 
                    max={100} 
                    style={{ width: '100%' }} 
                    onChange={() => {
                      ruleEditForm.validateFields([
                        ['questionTypeDistribution', 'SINGLE_CHOICE'],
                        ['questionTypeDistribution', 'MULTIPLE_CHOICE'],
                        ['questionTypeDistribution', 'FILL_BLANK'],
                        ['questionTypeDistribution', 'SHORT_ANSWER']
                      ]);
                    }}
                  />
                </Form.Item>
                <Form.Item 
                  name={['questionTypeDistribution', 'FILL_BLANK']} 
                  label="填空题数量"
                  rules={[{ validator: validateQuestionTypeDistribution }]}
                >
                  <InputNumber 
                    min={0} 
                    max={100} 
                    style={{ width: '100%' }} 
                    onChange={() => {
                      ruleEditForm.validateFields([
                        ['questionTypeDistribution', 'SINGLE_CHOICE'],
                        ['questionTypeDistribution', 'MULTIPLE_CHOICE'],
                        ['questionTypeDistribution', 'TRUE_FALSE'],
                        ['questionTypeDistribution', 'SHORT_ANSWER']
                      ]);
                    }}
                  />
                </Form.Item>
                <Form.Item 
                  name={['questionTypeDistribution', 'SHORT_ANSWER']} 
                  label="简答题数量"
                  rules={[{ validator: validateQuestionTypeDistribution }]}
                >
                  <InputNumber 
                    min={0} 
                    max={100} 
                    style={{ width: '100%' }} 
                    onChange={() => {
                      ruleEditForm.validateFields([
                        ['questionTypeDistribution', 'SINGLE_CHOICE'],
                        ['questionTypeDistribution', 'MULTIPLE_CHOICE'],
                        ['questionTypeDistribution', 'TRUE_FALSE'],
                        ['questionTypeDistribution', 'FILL_BLANK']
                      ]);
                    }}
                  />
                </Form.Item>
                
                <Title level={5}>难度分布</Title>
                <Alert
                  message="难度分布总和不能超过100%"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Form.Item 
                  name={['difficultyDistribution', 'EASY']} 
                  label="简单题比例(%)"
                  rules={[{ validator: validateDifficultyDistribution }]}
                >
                  <Slider 
                    min={0} 
                    max={100} 
                    onChange={() => {
                      // 触发其他难度级别的校验
                      ruleEditForm.validateFields([
                        ['difficultyDistribution', 'MEDIUM'],
                        ['difficultyDistribution', 'HARD']
                      ]);
                    }}
                  />
                </Form.Item>
                <Form.Item 
                  name={['difficultyDistribution', 'MEDIUM']} 
                  label="中等题比例(%)"
                  rules={[{ validator: validateDifficultyDistribution }]}
                >
                  <Slider 
                    min={0} 
                    max={100} 
                    onChange={() => {
                      ruleEditForm.validateFields([
                        ['difficultyDistribution', 'EASY'],
                        ['difficultyDistribution', 'HARD']
                      ]);
                    }}
                  />
                </Form.Item>
                <Form.Item 
                  name={['difficultyDistribution', 'HARD']} 
                  label="困难题比例(%)"
                  rules={[{ validator: validateDifficultyDistribution }]}
                >
                  <Slider 
                    min={0} 
                    max={100} 
                    onChange={() => {
                      ruleEditForm.validateFields([
                        ['difficultyDistribution', 'EASY'],
                        ['difficultyDistribution', 'MEDIUM']
                      ]);
                    }}
                  />
                </Form.Item>
              </Panel>
              
              <Panel header="知识点配置" key="knowledge">
                <Alert
                  message="知识点权重总和不能超过100"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <div style={{ marginBottom: 16 }}>
                  <Button 
                    type="dashed" 
                    icon={<PlusOutlined />} 
                    onClick={addKnowledgePoint}
                    block
                  >
                    添加知识点
                  </Button>
                </div>
                <Form.List name="knowledgePoints">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, index) => (
                        <Card key={field.key} size="small" style={{ marginBottom: 8 }}>
                          <Row gutter={8} align="middle">
                            <Col span={10}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'name']}
                                rules={[{ required: true, message: '请输入知识点名称' }]}
                              >
                                <Input placeholder="知识点名称" />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'weight']}
                                rules={[
                                  { required: true, message: '请输入权重' },
                                  { validator: validateKnowledgePointsWeight }
                                ]}
                              >
                                <InputNumber 
                                  min={1} 
                                  max={100} 
                                  placeholder="权重" 
                                  style={{ width: '100%' }} 
                                  onChange={() => {
                                    // 触发所有知识点权重的校验
                                    const knowledgePoints = ruleEditForm.getFieldValue('knowledgePoints') || [];
                                    knowledgePoints.forEach((_: any, i: number) => {
                                      ruleEditForm.validateFields([['knowledgePoints', i, 'weight']]);
                                    });
                                  }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Button 
                                danger 
                                icon={<DeleteOutlined />} 
                                onClick={() => {
                                  removeKnowledgePoint(index);
                                  // 删除后重新校验权重
                                  setTimeout(() => {
                                    const knowledgePoints = ruleEditForm.getFieldValue('knowledgePoints') || [];
                                    knowledgePoints.forEach((_: any, i: number) => {
                                      ruleEditForm.validateFields([['knowledgePoints', i, 'weight']]);
                                    });
                                  }, 100);
                                }}
                              >
                                删除
                              </Button>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                    </>
                  )}
                </Form.List>
              </Panel>
            </Collapse>
            
            <Form.Item name="specialRequirements" label="特殊要求">
              <TextArea rows={3} placeholder="例如：重点考察设计能力，包含编程题..." />
            </Form.Item>
          </Form>
        ) : (
        <div style={{ 
          background: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '6px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {generatedRule}
        </div>
        )}
      </Card>
    );
  };

  const renderGenerateTab = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleGenerateRule}
    >
      <Form.Item
        name="userInput"
        label="描述您的组卷需求"
        rules={[{ required: true, message: '请描述您的组卷需求' }]}
      >
        <TextArea
          rows={6}
          placeholder="例如：我需要一份计算机科学期末考试试卷，包含学科应用、数据结构、编程基础等内容，难度适中，适合大三学生，总分100分，考试时长120分钟..."
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          icon={<RobotOutlined />}
          block
        >
          {loading ? 'AI正在生成规则...' : '开始生成组卷规则'}
        </Button>
      </Form.Item>
    </Form>
  );

  const renderOptimizeTab = () => (
    <Form
      form={optimizeForm}
      layout="vertical"
      onFinish={handleOptimizeRule}
    >
      <Form.Item
        name="currentRule"
        label="现有规则"
        rules={[{ required: true, message: '请输入现有规则' }]}
      >
        <TextArea
          rows={6}
          placeholder="请粘贴现有的组卷规则JSON或描述..."
        />
      </Form.Item>

      <Form.Item
        name="optimizationRequirements"
        label="优化要求"
        rules={[{ required: true, message: '请描述优化要求' }]}
      >
        <TextArea
          rows={4}
          placeholder="例如：增加编程题比例，减少选择题数量，提高难度等级..."
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          icon={<SettingOutlined />}
          block
        >
          {loading ? 'AI正在优化规则...' : '开始优化规则'}
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <>
    <Modal
      title={
        <Space>
          <RobotOutlined />
          <span>AI智能组卷规则生成</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnHidden
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* AI服务状态 */}
        <div>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={checkAIStatus}
              loading={testingAI}
            >
              检查AI状态
            </Button>
            <Button 
              icon={<ThunderboltOutlined />} 
              onClick={testAIConnection}
              loading={testingAI}
            >
              测试AI连接
            </Button>
          </Space>
          {renderAIStatus()}
        </div>

        <Divider />

        {/* 功能标签页 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><BulbOutlined />生成规则</span>} key="generate">
            {renderGenerateTab()}
          </TabPane>
          <TabPane tab={<span><SettingOutlined />优化规则</span>} key="optimize">
            {renderOptimizeTab()}
          </TabPane>
        </Tabs>

        {/* 生成结果 */}
        {renderRuleEditor()}
      </Space>
    </Modal>
    
    {/*  数据验证错误提示Modal */}
    <Modal
      title="数据验证错误"
      open={showValidationModal}
      onOk={() => setShowValidationModal(false)}
      onCancel={() => setShowValidationModal(false)}
      width={600}
      okText="我知道了"
      cancelText="关闭"
    >
      <div style={{ marginBottom: 16 }}>
        <Alert
          message="检测到无关话题或不存在的学科或知识点"
          description="您输入的需求中包含了与组卷无关的内容或数据库中不存在的学科或知识点，请查看详细信息并修改您的需求。"
          type="warning"
          showIcon
        />
      </div>
      
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: 16, 
        borderRadius: 6,
        fontFamily: 'monospace',
        whiteSpace: 'pre-line',
        fontSize: 14,
        lineHeight: 1.6
      }}>
        {validationError}
      </div>
      
      {databaseInfo && (
        <div style={{ marginTop: 16 }}>
          <Alert
            message="数据库中的可用数据"
            description={
              <div>
                <div style={{ marginBottom: 8 }}>
                  <strong>可用学科：</strong>
                  {Object.keys(databaseInfo.subjects || {}).join('、')}
                </div>
                <div>
                  <strong>各学科知识点数量：</strong>
                  {Object.entries(databaseInfo.subjects || {}).map(([subjectName, subjectData]: [string, any]) => (
                    <div key={subjectName} style={{ marginLeft: 16, fontSize: 12 }}>
                      • {subjectName}: {subjectData.knowledgePoints?.length || 0} 个知识点
                    </div>
                  ))}
                </div>
              </div>
            }
            type="info"
            showIcon
          />
        </div>
      )}
    </Modal>
    </>
  );
};

export default AIRuleGenerator;
