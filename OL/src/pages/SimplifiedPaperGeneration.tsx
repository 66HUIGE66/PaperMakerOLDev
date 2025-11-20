import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  Row, 
  Col, 
  Table, 
  Tag, 
  Space, 
  Typography, 
  Divider,
  Modal,
  message,
  Steps,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  SettingOutlined, 
  FileTextOutlined,
  CheckCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { learningAnalyticsService } from '../services/learningAnalyticsService';
import { subjectApi } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ExamRule {
  id: number;
  name: string;
  subject: string;
  totalQuestions: number;
  totalScore: number;
  duration: number;
  isActive: boolean;
}

interface Question {
  id: number;
  title: string;
  type: string;
  difficulty: string;
  subject: string;
  knowledgePoint: string;
}

interface PaperPreview {
  totalQuestions: number;
  totalScore: number;
  duration: number;
  typeDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  questions: Question[];
}

const SimplifiedPaperGeneration: React.FC = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [examRules, setExamRules] = useState<ExamRule[]>([]);
  const [paperPreview, setPaperPreview] = useState<PaperPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<{label: string, value: string}[]>([]);

  useEffect(() => {
    // 加载组卷规则
    loadExamRules();
    
    // 加载学科列表
    loadSubjects();
  }, []);

  const loadExamRules = async () => {
    try {
      // 这里应该调用实际的API获取规则数据
      // 暂时使用模拟数据，但不包含硬编码的学科
      const mockRules = [
        { id: 1, name: '基础测试规则', subject: '', totalQuestions: 20, totalScore: 100, duration: 60, isActive: true },
        { id: 2, name: '进阶规则', subject: '', totalQuestions: 15, totalScore: 100, duration: 45, isActive: true },
        { id: 3, name: '综合规则', subject: '', totalQuestions: 25, totalScore: 100, duration: 90, isActive: true }
      ];
      setExamRules(mockRules);
    } catch (error) {
      console.error('加载规则失败:', error);
      message.error('加载规则失败');
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await subjectApi.getAllActiveSubjects(false, undefined);
      const subjectsData = response.data?.object || response.data?.data || response.data || [];
      if (Array.isArray(subjectsData)) {
        const subjects = subjectsData.map((s: any) => ({
          label: s.name,
          value: s.name
        }));
        setAvailableSubjects(subjects);
      }
    } catch (error) {
      console.error('加载学科失败:', error);
      message.error('加载学科失败');
    }
  };

  const steps = [
    {
      title: '选择规则',
      description: '选择组卷规则或自定义参数'
    },
    {
      title: '预览试卷',
      description: '预览生成的试卷内容'
    },
    {
      title: '确认生成',
      description: '确认并生成最终试卷'
    }
  ];

  const questionColumns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          'SINGLE_CHOICE': 'blue',
          'MULTIPLE_CHOICE': 'green',
          'TRUE_FALSE': 'orange',
          'FILL_BLANK': 'purple',
          'SHORT_ANSWER': 'red'
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      }
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: string) => {
        const colorMap: Record<string, string> = {
          'EASY': 'green',
          'MEDIUM': 'orange',
          'HARD': 'red'
        };
        return <Tag color={colorMap[difficulty] || 'default'}>{difficulty}</Tag>;
      }
    },
    {
      title: '知识点',
      dataIndex: 'knowledgePoint',
      key: 'knowledgePoint',
      width: 120
    }
  ];

  const handleRuleSelect = (ruleId: number) => {
    const rule = examRules.find(r => r.id === ruleId);
    if (rule) {
      form.setFieldsValue({
        title: `${rule.name} - 自动生成试卷`,
        subject: rule.subject,
        totalQuestions: rule.totalQuestions,
        totalScore: rule.totalScore,
        duration: rule.duration ,

      });
    }
  };

  const handlePreview = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // 模拟预览生成
      setTimeout(() => {
        const mockPreview: PaperPreview = {
          totalQuestions: values.totalQuestions,
          totalScore: values.totalScore,
          duration: values.duration,
          typeDistribution: {
            'SINGLE_CHOICE': Math.floor(values.totalQuestions * 0.4),
            'MULTIPLE_CHOICE': Math.floor(values.totalQuestions * 0.2),
            'TRUE_FALSE': Math.floor(values.totalQuestions * 0.2),
            'FILL_BLANK': Math.floor(values.totalQuestions * 0.1),
            'SHORT_ANSWER': Math.floor(values.totalQuestions * 0.1)
          },
          difficultyDistribution: {
            'EASY': Math.floor(values.totalQuestions * 0.3),
            'MEDIUM': Math.floor(values.totalQuestions * 0.5),
            'HARD': Math.floor(values.totalQuestions * 0.2)
          },
          questions: Array.from({ length: values.totalQuestions }, (_, i) => ({
            id: i + 1,
            title: `这是第${i + 1}道题目，请选择正确答案...`,
            type: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER'][i % 5],
            difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3],
            subject: values.subject,
            knowledgePoint: '知识点' + (i % 3 + 1)
          }))
        };
        
        setPaperPreview(mockPreview);
        setPreviewVisible(true);
        setCurrentStep(1);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('预览失败:', error);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      
      // 模拟生成试卷
      setTimeout(() => {
        message.success('试卷生成成功！');
        setCurrentStep(2);
        setLoading(false);
        setPreviewVisible(false);
      }, 1500);
    } catch (error) {
      message.error('试卷生成失败！');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>智能组卷</Title>
      <Text type="secondary">基于规则的智能组卷系统，自动生成符合要求的试卷</Text>
      
      <Divider />
      
      <Card>
        <Steps current={currentStep} items={steps} style={{ marginBottom: '24px' }} />
        
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            generationType: 'auto',
            totalScore: 100,
            duration: 120
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="基本设置" size="small">
                <Form.Item
                  label="生成方式"
                  name="generationType"
                  rules={[{ required: true, message: '请选择生成方式' }]}
                >
                  <Select>
                    <Option value="auto">基于规则自动生成</Option>
                    <Option value="custom">自定义参数生成</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="组卷规则"
                  name="ruleId"
                  rules={[{ required: true, message: '请选择组卷规则' }]}
                >
                  <Select 
                    placeholder="选择组卷规则"
                    onChange={handleRuleSelect}
                  >
                    {examRules.map(rule => (
                      <Option key={rule.id} value={rule.id}>
                        {rule.name} ({rule.subject})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="试卷标题"
                  name="title"
                  rules={[{ required: true, message: '请输入试卷标题' }]}
                >
                  <Input placeholder="请输入试卷标题" />
                </Form.Item>

                <Form.Item
                  label="试卷描述"
                  name="description"
                >
                  <TextArea rows={3} placeholder="请输入试卷描述" />
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="试卷参数" size="small">
                <Form.Item
                  label="学科"
                  name="subject"
                  rules={[{ required: true, message: '请选择学科' }]}
                >
                  <Select placeholder="选择学科">
                    {availableSubjects.map(subject => (
                      <Option key={subject.value} value={subject.value}>
                        {subject.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="题目总数"
                  name="totalQuestions"
                  rules={[{ required: true, message: '请输入题目总数' }]}
                >
                  <Input type="number" min={1} max={100} />
                </Form.Item>

                <Form.Item
                  label="总分"
                  name="totalScore"
                  rules={[{ required: true, message: '请输入总分' }]}
                >
                  <Input type="number" min={1} max={200} />
                </Form.Item>

                <Form.Item
                  label="考试时长（分钟）"
                  name="duration"
                  rules={[{ required: true, message: '请输入考试时长' }]}
                >
                  <Input type="number" min={10} max={300} />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Space>
            <Button 
              type="primary" 
              icon={<EyeOutlined />}
              onClick={handlePreview}
              loading={loading}
            >
              预览试卷
            </Button>
            
            <Button 
              icon={<FileTextOutlined />}
              onClick={() => setCurrentStep(0)}
            >
              重新配置
            </Button>
          </Space>
        </Form>
      </Card>

      {/* 预览模态框 */}
      <Modal
        title="试卷预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={1000}
        footer={[
          <Button key="cancel" onClick={() => setPreviewVisible(false)}>
            取消
          </Button>,
          <Button 
            key="generate" 
            type="primary" 
            icon={<CheckCircleOutlined />}
            onClick={handleGenerate}
            loading={loading}
          >
            确认生成
          </Button>
        ]}
      >
        {paperPreview && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col span={8}>
                <Statistic title="题目总数" value={paperPreview.totalQuestions} />
              </Col>
              <Col span={8}>
                <Statistic title="总分" value={paperPreview.totalScore} />
              </Col>
              <Col span={8}>
                <Statistic title="时长" value={paperPreview.duration} suffix="分钟" />
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Card title="题型分布" size="small">
                  {Object.entries(paperPreview.typeDistribution).map(([type, count]) => (
                    <div key={type} style={{ marginBottom: '8px' }}>
                      <Text>{type}: </Text>
                      <Tag color="blue">{count}题</Tag>
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="难度分布" size="small">
                  {Object.entries(paperPreview.difficultyDistribution).map(([difficulty, count]) => (
                    <div key={difficulty} style={{ marginBottom: '8px' }}>
                      <Text>{difficulty}: </Text>
                      <Tag color="green">{count}题</Tag>
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>

            <Card title="题目列表" size="small">
              <Table
                columns={questionColumns}
                dataSource={paperPreview.questions}
                pagination={false}
                size="small"
                scroll={{ y: 300 }}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SimplifiedPaperGeneration;

