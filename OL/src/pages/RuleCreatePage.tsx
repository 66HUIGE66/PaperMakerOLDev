import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  message,
  Row,
  Col,
  Typography,
  Select,
  Tag,
  Alert,
  Progress,
  Badge,
  Statistic,
  Collapse,
  Tooltip,
  Modal
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CalculatorOutlined,
  BookOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { knowledgePointApi, questionApi, subjectApi } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

interface QuestionTypeConfig {
  type: string;
  count: number;
  score: number;
}

interface KnowledgePointConfig {
  point: string;
  weight: number;
}

interface RuleCreatePageProps {
  mode?: 'create' | 'edit';
  initialData?: any;
}

const RuleCreatePage: React.FC<RuleCreatePageProps> = ({ mode = 'create', initialData }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeConfig[]>([
    { type: 'SINGLE_CHOICE', count: 20, score: 2 }
  ]);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePointConfig[]>([]);
  const [availableKnowledgePoints, setAvailableKnowledgePoints] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<string[]>(['basic', 'questions', 'knowledge']);
  
  //  题目统计（用于限制题型数量）
  const [questionStatistics, setQuestionStatistics] = useState<Record<string, number>>({});

  // 题目类型选项
  const questionTypeOptions = [
    { value: 'SINGLE_CHOICE', label: '单选题', color: 'blue' },
    { value: 'MULTIPLE_CHOICE', label: '多选题', color: 'green' },
    { value: 'FILL_BLANK', label: '填空题', color: 'orange' },
    { value: 'SHORT_ANSWER', label: '简答题', color: 'purple' },
    { value: 'TRUE_FALSE', label: '判断题', color: 'cyan' }
  ];

  //  学科名-Id（从数据库加载）
  const [subjectIds , setSubjectIds] = useState(Array<{key: string , value: string}>([]));

  //  学科选项（从数据库加载）
  const [subjectOptions, setSubjectOptions] = useState<Array<{value: string, label: string}>>([]);
  
  //  学科对应的知识点（从数据库加载）
  const [subjectKnowledgePoints, setSubjectKnowledgePoints] = useState<Record<string, string[]>>({});

  //  从数据库加载学科列表
  useEffect(() => {
    loadSubjects();
  }, []);

  //  如果是编辑模式，加载初始数据
  useEffect(() => {
    const loadEditData = async () => {
      if (mode === 'edit' && initialData) {
        // 加载规则数据到表单
        form.setFieldsValue({
          name: initialData.name,
          description: initialData.description,
          subject: initialData.subject,
          duration: initialData.duration,
          difficulty: initialData.difficulty
        });
        
        //  如果初始数据有学科，先加载该学科的知识点（编辑模式下不清空已有知识点）
        if (initialData.subject) {
          // 先加载学科知识点，然后再解析规则配置（确保subjectKnowledgePoints已加载）
          await updateAvailableKnowledgePoints(initialData.subject, false);
          
          // 等待一下，确保subjectKnowledgePoints已更新
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // 解析题型配置
        if (initialData.ruleConfig) {
          try {
            const config = JSON.parse(initialData.ruleConfig);
            if (config.questionTypeDistribution) {
              const types = Object.entries(config.questionTypeDistribution).map(([type, count]) => ({
                type,
                count: count as number,
                score: (config.scoreDistribution || {})[type] || 1
              }));
              setQuestionTypes(types);
            }
            
            //  解析知识点配置（注意数据类型）
            if (config.knowledgePoints) {
              const kps = Array.isArray(config.knowledgePoints) 
                ? config.knowledgePoints.map((kp: any) => ({
                    point: kp.point || kp.name || '',
                    weight: (kp.weight || 0)
                  }))
                : Object.entries(config.knowledgePoints).map(([point, weight]) => ({
                    point,
                    weight: (weight as number) * 100
                  }));
              
              //  过滤掉不属于当前学科的知识点
              const selectedSubject = initialData.subject;
              if (selectedSubject && subjectKnowledgePoints[selectedSubject]) {
                const validKPs = kps.filter((kp: KnowledgePointConfig) => {
                  const isValid = subjectKnowledgePoints[selectedSubject].includes(kp.point);
                  if (!isValid) {
                    console.warn(`知识点"${kp.point}"不属于学科"${selectedSubject}"，已过滤`);
                  }
                  return isValid;
                });
                setKnowledgePoints(validKPs);
                
                if (validKPs.length < kps.length) {
                  message.warning(`已过滤掉${kps.length - validKPs.length}个不属于当前学科的知识点`);
                }
              } else {
                setKnowledgePoints(kps);
              }
            }
          } catch (e) {
            console.error('解析规则配置失败:', e);
          }
        }
      }
    };
    
    loadEditData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialData, form]);

  const loadSubjects = async () => {
    try {
      const response = await subjectApi.getAllActiveSubjects(false);
      const subjects = response.data?.data || response.data || [];
      const subjectList = subjects.map((s: any) => ({
        value: s.name,
        label: s.name
      }));
      const subjectIdList = subjects.map((s: any) => ({
        key: s.name,
        value: s.id
      }))
      console.log("2222222222subject:" , subjectList)
      setSubjectIds(subjectIdList);
      setSubjectOptions(subjectList);
      console.log("123subjectIds:",subjectIds)

      // 加载每个学科的知识点
      for (const subject of subjects) {
        await loadKnowledgePointsForSubject(subject.name);
      }
    } catch (error) {
      console.error('加载学科列表失败:', error);
      message.error('加载学科列表失败');
    }
  };

  //  从数据库加载指定学科的知识点
  const loadKnowledgePointsForSubject = async (subjectName: string) => {
    try {
      const response = await knowledgePointApi.getKnowledgePoints(subjectName);
      if (response.data.code === 200) {
        const kpList = response.data.data || [];
        const kpNames = kpList.map((kp: any) => kp.name || kp.point);
        setSubjectKnowledgePoints(prev => ({
          ...prev,
          [subjectName]: kpNames
        }));
      }
    } catch (error) {
      console.error(`加载学科 ${subjectName} 的知识点失败:`, error);
    }
  };

  // 难度选项
  const difficultyOptions = [
    { value: 'EASY', label: '简单', color: 'green' },
    { value: 'MEDIUM', label: '中等', color: 'orange' },
    { value: 'HARD', label: '困难', color: 'red' }
  ];

  //  根据学科更新可用知识点（从数据库加载）
  const updateAvailableKnowledgePoints = async (subject: string, clearExisting: boolean = true) => {
    // 如果缓存中没有该学科的知识点，从数据库加载
    if (!subjectKnowledgePoints[subject]) {
      await loadKnowledgePointsForSubject(subject);
    }
    
    const points = subjectKnowledgePoints[subject] || [];
    setAvailableKnowledgePoints(points);
    
    //  加载题目统计信息
    await loadQuestionStatistics(subject);
    
    // 只有在非编辑模式下或明确指定时才清空当前知识点配置
    if (clearExisting && mode !== 'edit') {
      setKnowledgePoints([]);
    }
  };

  //  加载指定学科的题目统计
  const loadQuestionStatistics = async (subject: string) => {
    try {
      let i = 0;
      for (; i < subjectIds.length; i++) {
        if (subjectIds[i].key == subject){
          break;
        }

      }
      if (!subjectIds[i].value){
        console.error(`找不到${subject}学科id`)
      }
      const response = await questionApi.getQuestionStatistics(subjectIds[i].value);
      console.log("res" , response.data.object)
      if (response.data.code === 200) {
        const stats = response.data.object.statistics || {};
        setQuestionStatistics(stats);
        console.log('题目统计:', stats);
      }
    } catch (error) {
      console.error('加载题目统计失败:', error);
    }
  };

  // 添加题目类型
  const addQuestionType = () => {
    setQuestionTypes([...questionTypes, { type: 'SINGLE_CHOICE', count: 1, score: 1 }]);
  };

  // 删除题目类型
  const removeQuestionType = (index: number) => {
    if (questionTypes.length > 1) {
      setQuestionTypes(questionTypes.filter((_, i) => i !== index));
    }
  };

  // 更新题目类型
  const updateQuestionType = (index: number, field: keyof QuestionTypeConfig, value: any) => {
    const updated = [...questionTypes];
    updated[index] = { ...updated[index], [field]: value };
    setQuestionTypes(updated);
  };

  // 添加知识点
  const addKnowledgePoint = () => {
    //  检查是否已选择学科
    const selectedSubject = form.getFieldValue('subject');
    if (!selectedSubject) {
      message.warning('请先选择学科，然后才能添加知识点');
      return;
    }
    
    //  检查是否有可用知识点
    if (availableKnowledgePoints.length === 0) {
      message.warning('该学科暂无知识点，请先为该学科添加知识点');
      return;
    }
    
    // 找到第一个未使用的知识点
    const usedPoints = knowledgePoints.map(kp => kp.point);
    const availablePoint = availableKnowledgePoints.find(kp => !usedPoints.includes(kp));
    
    if (availablePoint) {
      setKnowledgePoints([...knowledgePoints, { point: availablePoint, weight: 0 }]);
    } else {
      message.warning('该学科的所有知识点都已添加完毕');
    }
  };

  // 删除知识点
  const removeKnowledgePoint = (index: number) => {
    setKnowledgePoints(knowledgePoints.filter((_, i) => i !== index));
  };

  // 更新知识点
  const updateKnowledgePoint = (index: number, field: keyof KnowledgePointConfig, value: any) => {
    //  如果是更新知识点名称，验证该知识点是否属于当前学科
    if (field === 'point') {
      const selectedSubject = form.getFieldValue('subject');
      if (!selectedSubject) {
        message.warning('请先选择学科');
        return;
      }
      
      // 验证知识点是否属于当前学科
      const currentSubjectKPs = subjectKnowledgePoints[selectedSubject] || [];
      if (!currentSubjectKPs.includes(value)) {
        message.error(`知识点"${value}"不属于学科"${selectedSubject}"，请选择该学科下的知识点`);
        return;
      }
    }
    
    const updated = [...knowledgePoints];
    updated[index] = { ...updated[index], [field]: value };
    setKnowledgePoints(updated);
  };

  // 计算总分
  const calculateTotalScore = () => {
    return questionTypes.reduce((total, type) => total + (type.count * type.score), 0);
  };

  // 计算总题数
  const calculateTotalQuestions = () => {
    return questionTypes.reduce((total, type) => total + type.count, 0);
  };

  //  计算知识点权重总和（处理 NaN 和 undefined）
  const calculateWeightSum = () => {
    if (knowledgePoints.length === 0) return 0;
    
    const sum = knowledgePoints.reduce((total, point) => {
      const weight = point.weight || 0;
      return total + (isNaN(weight) ? 0 : weight);
    }, 0);
    
    return isNaN(sum) ? 0 : sum;
  };

  // 验证配置
  const validateConfiguration = () => {
    const errors: string[] = [];
    
    if (questionTypes.length === 0) {
      errors.push('请至少配置一种题目类型');
    }
    
    if (knowledgePoints.length === 0) {
      errors.push('请至少配置一个知识点');
    }
    
    const weightSum = calculateWeightSum();
    if (Math.abs(weightSum - 100) > 0.01) {
      errors.push('知识点权重总和必须等于100%');
    }
    
    // 检查是否有重复的题目类型
    const typeCounts = questionTypes.reduce((acc, type) => {
      acc[type.type] = (acc[type.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > 1) {
        const typeLabel = questionTypeOptions.find(opt => opt.value === type)?.label;
        errors.push(`题目类型"${typeLabel}"重复配置`);
      }
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // 实时验证
  useEffect(() => {
    validateConfiguration();
  }, [questionTypes, knowledgePoints]);

  // 提交表单
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 验证配置
      if (!validateConfiguration()) {
        message.error('请修正配置错误后再提交');
        return;
      }

      // 构建规则配置
      const ruleConfig = {
        questionTypes,
        knowledgePoints,
        difficultyDistribution: {
          EASY: 0.3,
          MEDIUM: 0.5,
          HARD: 0.2
        }
      };

      // 构建请求数据
      const requestData = {
        name: values.name,
        description: values.description,
        totalQuestions: calculateTotalQuestions(),
        totalScore: calculateTotalScore(),
        duration: values.duration,
        ruleConfig: JSON.stringify(ruleConfig),
        subject: values.subject,
        difficulty: values.difficulty
      };

      const token = authService.getToken();
      if (!token) {
        message.error('用户未登录，请先登录');
        return;
      }

      // 根据用户角色选择不同的API端点
      // 注意：普通用户使用 /api/rules/user 端点，无论选择什么学科（包括系统提供的学科），
      // 创建的规则都是用户自己的规则（isSystem=false）
      const isAdmin = user?.role === 'ADMIN';
      const apiEndpoint = isAdmin ? '/api/rules' : '/api/rules/user';
      
      console.log('用户角色:', user?.role, 'API端点:', apiEndpoint);
      console.log('普通用户可以创建使用系统学科的规则，但规则属于用户自己');

      const response = await fetch(`${API_CONFIG.BASE_URL}${apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.code === 200) {
        message.success('规则创建成功');
        navigate('/rules');
      } else {
        message.error(result.message || '创建规则失败');
      }
    } catch (error) {
      message.error('创建规则失败');
      console.error('Error creating rule:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/rules')}
            size="large"
          >
            返回
          </Button>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            <SettingOutlined style={{ marginRight: '8px' }} />
            {mode === 'edit' ? '编辑组卷规则' : '创建组卷规则'}
          </Title>
        </Space>
        <Paragraph style={{ marginTop: '8px', color: '#666' }}>
          配置智能组卷规则，包括题目类型、知识点分布和AI辅助设置
        </Paragraph>
      </div>

      {/* 验证错误提示 */}
      {validationErrors.length > 0 && (
        <Alert
          message="配置验证失败"
          description={
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          }
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          duration: 120
        }}
      >
        {/* 统计信息面板 */}
        <Card 
          title={
            <Space>
              <CalculatorOutlined />
              配置统计
              <Badge 
                count={validationErrors.length} 
                style={{ backgroundColor: validationErrors.length > 0 ? '#ff4d4f' : '#52c41a' }}
              />
            </Space>
          } 
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={24}>
            <Col span={6}>
              <Statistic
                title="总题数"
                value={calculateTotalQuestions()}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总分"
                value={calculateTotalScore()}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="题目类型"
                value={questionTypes.length}
                prefix={<SettingOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="知识点权重"
                value={calculateWeightSum()}
                suffix="%"
                prefix={Math.abs(calculateWeightSum() - 100) <= 0.01 ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                valueStyle={{ color: Math.abs(calculateWeightSum() - 100) <= 0.01 ? '#52c41a' : '#ff4d4f' }}
              />
            </Col>
          </Row>
          
          {/* 权重进度条 */}
          <div style={{ marginTop: '16px' }}>
            <Text strong>知识点权重分布：</Text>
            <Progress 
              percent={calculateWeightSum()} 
              status={Math.abs(calculateWeightSum() - 100) <= 0.01 ? 'success' : 'exception'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            {Math.abs(calculateWeightSum() - 100) > 0.01 && (
              <Text type="danger" style={{ fontSize: '12px' }}>
                权重总和必须等于100%
              </Text>
            )}
          </div>
        </Card>

        {/* 折叠面板 */}
        <Collapse 
          activeKey={activePanel} 
          onChange={setActivePanel}
          style={{ marginBottom: '24px' }}
        >
          {/* 基本信息 */}
          <Panel 
            header={
              <Space>
                <SettingOutlined />
                基本信息
                <Badge 
                  count={form.getFieldsError().some(field => field.errors.length > 0) ? 1 : 0} 
                  style={{ backgroundColor: '#ff4d4f' }}
                />
              </Space>
            } 
            key="basic"
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="规则名称"
                  rules={[{ required: true, message: '请输入规则名称' }]}
                >
                  <Input placeholder="请输入规则名称" size="large" />
                </Form.Item>

                <Form.Item
                  name="description"
                  label="规则描述"
                >
                  <TextArea
                    rows={3}
                    placeholder="请输入规则描述"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="subject"
                      label="学科"
                      rules={[{ required: true, message: '请选择学科' }]}
                    >
                      <Select 
                        placeholder="请选择学科" 
                        size="large"
                        onChange={async (value: string) => {
                          //  保存当前学科值
                          const currentSubject = form.getFieldValue('subject');
                          
                          //  加载新学科的知识点
                          await updateAvailableKnowledgePoints(value);
                          
                          //  检查已有知识点是否属于新学科，如果不属于则清空
                          if (knowledgePoints.length > 0) {
                            const newSubjectKPs = subjectKnowledgePoints[value] || [];
                            const invalidKPs = knowledgePoints.filter(
                              kp => !newSubjectKPs.includes(kp.point)
                            );
                            
                            if (invalidKPs.length > 0) {
                              Modal.confirm({
                                title: '切换学科提示',
                                content: `切换学科将清空${invalidKPs.length}个不属于新学科的知识点，是否继续？`,
                                onOk: async () => {
                                  //  只保留属于新学科的知识点
                                  const validKPs = knowledgePoints.filter(
                                    kp => newSubjectKPs.includes(kp.point)
                                  );
                                  setKnowledgePoints(validKPs);
                                  form.setFieldsValue({ subject: value });
                                },
                                onCancel: () => {
                                  // 取消切换，恢复原学科
                                  form.setFieldsValue({ subject: currentSubject });
                                  // 恢复原学科的知识点
                                  if (currentSubject) {
                                    updateAvailableKnowledgePoints(currentSubject, false);
                                  }
                                  // 强制更新Select组件显示
                                  form.validateFields(['subject']);
                                }
                              });
                            } else {
                              // 所有知识点都属于新学科，直接切换
                              form.setFieldsValue({ subject: value });
                            }
                          } else {
                            //  没有知识点时直接加载
                            form.setFieldsValue({ subject: value });
                          }
                        }}
                        notFoundContent={subjectOptions.length === 0 ? '正在加载学科...' : '暂无学科'}
                        loading={subjectOptions.length === 0}
                      >
                        {subjectOptions.map(subject => (
                          <Option key={subject.value} value={subject.value}>
                            {subject.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="duration"
                      label="考试时长(分钟)"
                      rules={[{ required: true, message: '请输入考试时长' }]}
                    >
                      <InputNumber
                        min={1}
                        max={600}
                        style={{ width: '100%' }}
                        placeholder="请输入考试时长"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="difficulty"
                      label="整体难度"
                    >
                      <Select placeholder="请选择整体难度" size="large">
                        {difficultyOptions.map(diff => (
                          <Option key={diff.value} value={diff.value}>
                            <Tag color={diff.color}>{diff.label}</Tag>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Panel>

          {/* 题目类型配置 */}
          <Panel 
            header={
              <Space>
                <BookOutlined />
                题目类型配置
                <Badge count={questionTypes.length} style={{ backgroundColor: '#1890ff' }} />
              </Space>
            } 
            key="questions"
          >
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary">
                <InfoCircleOutlined style={{ marginRight: '4px' }} />
                配置不同题型的数量和分值，系统将根据配置自动生成试卷
              </Text>
            </div>
            
            {questionTypes.map((type, index) => (
              <Card 
                key={index} 
                size="small" 
                style={{ marginBottom: '12px', border: '1px solid #d9d9d9' }}
                bodyStyle={{ padding: '12px' }}
              >
                <Row gutter={16} align="middle">
                  <Col span={6}>
                    <Text strong style={{ display: 'block', marginBottom: '4px' }}>题目类型</Text>
                    <Select
                      value={type.type}
                      onChange={(value) => updateQuestionType(index, 'type', value)}
                      style={{ width: '100%' }}
                      size="large"
                    >
                      {questionTypeOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          <Tag color={option.color}>{option.label}</Tag>
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={4}>
                    <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                      题数
                      {questionStatistics[type.type] !== undefined && (
                        <Tooltip title={`题库中有${questionStatistics[type.type]}道此类型题目`}>
                          <InfoCircleOutlined style={{ marginLeft: '4px', color: '#1890ff' }} />
                        </Tooltip>
                      )}
                    </Text>
                    <InputNumber
                      value={type.count}
                      onChange={(value) => {
                        const available = questionStatistics[type.type] || 0;
                        if (value && value > available) {
                          message.warning(
                            `该题型在题库中只有${available}道题，建议调整为${available}道或更少`
                          );
                        }
                        updateQuestionType(index, 'count', value || 1);
                      }}
                      min={1}
                      max={questionStatistics[type.type] || 100}
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Col>
                  <Col span={4}>
                    <Text strong style={{ display: 'block', marginBottom: '4px' }}>分值</Text>
                    <InputNumber
                      value={type.score}
                      onChange={(value) => updateQuestionType(index, 'score', value || 1)}
                      min={0.5}
                      max={100}
                      step={0.5}
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ display: 'block', marginBottom: '4px' }}>小计</Text>
                      <Tag color="blue" style={{ fontSize: '16px', padding: '4px 8px' }}>
                        {type.count * type.score}分
                      </Tag>
                    </div>
                  </Col>
                  <Col span={4}>
                    <div style={{ textAlign: 'center' }}>
                      {questionTypes.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeQuestionType(index)}
                          size="large"
                        />
                      )}
                    </div>
                  </Col>
                </Row>
              </Card>
            ))}
            
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addQuestionType}
              style={{ width: '100%', height: '48px' }}
              size="large"
            >
              添加题目类型
            </Button>
          </Panel>

          {/* 知识点配置 */}
          <Panel 
            header={
              <Space>
                <BookOutlined />
                知识点配置
                <Badge count={knowledgePoints.length} style={{ backgroundColor: '#52c41a' }} />
                {Math.abs(calculateWeightSum() - 100) <= 0.01 && (
                  <Tag color="success">权重已平衡</Tag>
                )}
              </Space>
            } 
            key="knowledge"
          >
            <div style={{ marginBottom: '16px' }}>
              <Alert
                message="知识点配置说明"
                description={
                  <div>
                    <div>1. 请先选择学科，系统将自动加载该学科的知识点</div>
                    <div>2. 只能添加所选学科关联的知识点</div>
                    <div>3. 知识点权重总和必须等于100%</div>
                    {form.getFieldValue('subject') && (
                      <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#1890ff' }}>
                        当前学科：{form.getFieldValue('subject')}，可用知识点：{availableKnowledgePoints.length} 个
                      </div>
                    )}
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: '12px' }}
              />
            </div>
            
            {knowledgePoints.map((point, index) => (
              <Card 
                key={index} 
                size="small" 
                style={{ marginBottom: '12px', border: '1px solid #d9d9d9' }}
                bodyStyle={{ padding: '12px' }}
              >
                <Row gutter={16} align="middle">
                  <Col span={12}>
                    <Text strong style={{ display: 'block', marginBottom: '4px' }}>知识点名称</Text>
                    <Select
                      value={point.point}
                      onChange={(value) => updateKnowledgePoint(index, 'point', value)}
                      placeholder="请选择知识点"
                      size="large"
                      style={{ width: '100%' }}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      notFoundContent={
                        availableKnowledgePoints.length === 0 
                          ? '请先选择学科，然后等待知识点加载' 
                          : '暂无可用知识点'
                      }
                      options={availableKnowledgePoints
                        .filter(kp => !knowledgePoints.some((kp2, i) => i !== index && kp2.point === kp))
                        .map(kp => ({ value: kp, label: kp }))
                      }
                    />
                  </Col>
                  <Col span={6}>
                    <Text strong style={{ display: 'block', marginBottom: '4px' }}>权重(%)</Text>
                    <InputNumber
                      value={point.weight}
                      onChange={(value) => updateKnowledgePoint(index, 'weight', value || 0)}
                      min={0}
                      max={100}
                      style={{ width: '100%' }}
                      size="large"
                    />
                  </Col>
                  <Col span={4}>
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ display: 'block', marginBottom: '4px' }}>显示</Text>
                      <Tag color="green" style={{ fontSize: '16px', padding: '4px 8px' }}>
                        {((point.weight || 0) === 0 || isNaN(point.weight)) ? '0%' : `${point.weight}%`}
                      </Tag>
                    </div>
                  </Col>
                  <Col span={2}>
                    <div style={{ textAlign: 'center' }}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeKnowledgePoint(index)}
                        size="large"
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            ))}
            
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addKnowledgePoint}
              style={{ width: '100%', height: '48px' }}
              size="large"
              disabled={availableKnowledgePoints.length === 0 || 
                       knowledgePoints.length >= availableKnowledgePoints.length}
            >
              {availableKnowledgePoints.length === 0 
                ? '请先选择学科' 
                : knowledgePoints.length >= availableKnowledgePoints.length
                  ? '所有知识点已添加'
                  : '添加知识点'
              }
            </Button>
          </Panel>

        </Collapse>

        {/* 操作按钮 */}
        <Card style={{ marginTop: '24px' }}>
          <Row justify="center">
            <Col>
              <Space size="large">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  size="large"
                  disabled={validationErrors.length > 0}
                  style={{ 
                    height: '48px', 
                    paddingLeft: '32px', 
                    paddingRight: '32px',
                    fontSize: '16px'
                  }}
                >
                  {mode === 'edit' ? '保存修改' : '创建规则'}
                </Button>
                <Button 
                  onClick={() => navigate('/rules')}
                  size="large"
                  style={{ 
                    height: '48px', 
                    paddingLeft: '32px', 
                    paddingRight: '32px',
                    fontSize: '16px'
                  }}
                >
                  取消
                </Button>
              </Space>
            </Col>
          </Row>
          
          {validationErrors.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Text type="danger">
                <ExclamationCircleOutlined style={{ marginRight: '4px' }} />
                请修正配置错误后再提交
              </Text>
            </div>
          )}
        </Card>
      </Form>
    </div>
  );
};

export default RuleCreatePage;
