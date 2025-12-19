import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Form,
  Select,
  Input,
  Space,
  Typography,
  message,
  Modal,
  Progress,
  Tag,
  Divider,
  Row,
  Col
} from 'antd';
import {
  ThunderboltOutlined,
  SettingOutlined,
  EditOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  BookOutlined,
  BulbOutlined,
  RocketOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { intelligentPaperApi, paperGenerationApi, examPaperApi, examRuleApi } from '../services/api';
import { ExamRule, ExamPaper } from '../types';
import MockVisualEditor from './MockVisualEditor';
import AIRuleGenerator from './AIRuleGenerator';
import KnowledgePointConfig from './KnowledgePointConfig';
import './PaperGeneration.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface PaperGenerationProps {
  onPaperGenerated?: (paper: ExamPaper) => void;
}

const PaperGeneration: React.FC<PaperGenerationProps> = ({ onPaperGenerated }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [rules, setRules] = useState<ExamRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState<ExamPaper | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [showAIRuleGenerator, setShowAIRuleGenerator] = useState(false);
  const [showKnowledgePointConfig, setShowKnowledgePointConfig] = useState(false);
  const [adjustForm] = Form.useForm();

  useEffect(() => {
    loadExamRules();
  }, []);

  const loadExamRules = async () => {
    try {
      setLoading(true);
      const response = await examRuleApi.getActiveRules();
      const rulesData = response.data;

      if (rulesData.code === 200 && rulesData.data) {
        const allRules = rulesData.data.map((rule: any) => {
          let ruleConfig = {};
          try {
            ruleConfig = JSON.parse(rule.ruleConfig || '{}');
          } catch (e) {
            ruleConfig = {};
          }

          const questionTypeDistribution = (ruleConfig as any).questionTypeDistribution || {};
          const totalQuestions = Object.values(questionTypeDistribution).reduce((sum: number, count: any) => sum + (count || 0), 0);

          return {
            id: rule.id,
            name: rule.name,
            description: rule.description || `智能组卷规则: ${rule.name}`,
            totalQuestions: totalQuestions || rule.totalQuestions || 20,
            totalScore: rule.totalScore || 100,
            duration: rule.duration || 60,
            ruleConfig: rule.ruleConfig,
            creatorId: rule.creatorId,
            isSystem: rule.isSystem || false,
            status: rule.status || 'ACTIVE',
            createdAt: rule.createdAt,
            updatedAt: rule.updatedAt
          };
        });
        setRules(allRules);
      }
    } catch (error) {
      console.error('加载组卷规则失败:', error);
      message.error('加载规则失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePaper = async (values: any) => {
    try {
      setGenerating(true);
      const selectedRule = rules.find(rule => rule.id === values.ruleId);
      if (!selectedRule) {
        message.error('请选择有效的规则');
        return;
      }

      const ruleConfig = JSON.parse(selectedRule.ruleConfig || '{}');
      const response = await intelligentPaperApi.generatePaper({
        ...ruleConfig,
        saveToDatabase: false
      });
      const paper = response.data?.data || response.data || response;

      const questionCount = typeof paper.questionIds === 'string'
        ? paper.questionIds.split(',').filter((id: string) => id.trim()).length
        : (Array.isArray(paper.questionIds) ? paper.questionIds.length : 0);

      if (!paper || questionCount === 0) {
        message.error('生成失败：题库中可能缺少符合要求的题目');
        return;
      }

      const paperWithStatus = {
        ...paper,
        status: 'DRAFT',
        title: selectedRule.name ? selectedRule.name.replace(/规则$/, '').trim() : '智能生成试卷',
        isSaved: false
      };

      setGeneratedPaper(paperWithStatus);
      message.success('试卷生成成功！');
      onPaperGenerated?.(paperWithStatus);
    } catch (error: any) {
      console.error('生成失败:', error);
      message.error('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleAdjustPaper = async (values: any) => {
    if (!generatedPaper) return;
    try {
      const response = await paperGenerationApi.adjustPaperManually(
        typeof generatedPaper.id === 'string' ? parseInt(generatedPaper.id) : generatedPaper.id,
        { type: values.operationType, parameters: values.parameters }
      );
      setGeneratedPaper(response.data);
      setShowAdjustModal(false);
      message.success('调整成功');
    } catch {
      message.error('调整失败');
    }
  };

  const handleSavePaper = async () => {
    if (!generatedPaper) return;
    if (generatedPaper.isSaved) {
      message.info('已保存');
      return;
    }

    try {
      const paperData: any = {
        title: generatedPaper.title,
        description: generatedPaper.description || '智能生成',
        totalScore: generatedPaper.totalScore,
        duration: generatedPaper.duration,
        subject: generatedPaper.subject,
        ruleId: generatedPaper.ruleId,
        isSystem: generatedPaper.isSystem || false,
        type: 'AUTO',
        generationType: 'AUTO',
        status: 'PUBLISHED',
        questionIds: Array.isArray(generatedPaper.questionIds)
          ? generatedPaper.questionIds.join(',')
          : generatedPaper.questionIds
      };

      if (!generatedPaper.id) {
        const response = await examPaperApi.createExamPaper(paperData);
        setGeneratedPaper({ ...response.data?.object || response.data, isSaved: true });
      } else {
        await examPaperApi.updateExamPaper(generatedPaper.id.toString(), paperData);
        setGeneratedPaper({ ...generatedPaper, isSaved: true });
      }
      message.success('保存成功！');
    } catch {
      message.error('保存失败');
    }
  };

  const renderRuleOption = (rule: ExamRule) => {
    let ruleConfig = {};
    try { ruleConfig = JSON.parse(rule.ruleConfig || '{}'); } catch { }
    const subject = (ruleConfig as any).subject || '未知';
    const difficulty = (ruleConfig as any).difficulty || 'MEDIUM';

    return (
      <div className="rule-option-content">
        <div className="rule-option-header">
          <span className="rule-name">{rule.name}</span>
          <Tag color="cyan">{subject}</Tag>
        </div>
        <div className="rule-tags">
          <Tag bordered={false} icon={<FileTextOutlined />}>{rule.totalQuestions}题</Tag>
          <Tag bordered={false} icon={<RocketOutlined />}>{rule.totalScore}分</Tag>
          <Tag bordered={false} icon={<ClockCircleOutlined />}>{rule.duration}分</Tag>
          <Tag bordered={false} color={difficulty === 'EASY' ? 'green' : difficulty === 'MEDIUM' ? 'orange' : 'red'}>
            {difficulty === 'EASY' ? '简单' : difficulty === 'MEDIUM' ? '中等' : '困难'}
          </Tag>
        </div>
      </div>
    );
  };

  return (
    <div className="paper-generation-container">
      <div className="pg-glass-card">

        {/* Header */}
        <div className="pg-header">
          <div className="pg-title">
            <ThunderboltOutlined style={{ color: '#faad14' }} />
            <span>智能组卷引擎</span>
          </div>
          <Paragraph className="pg-subtitle">
            利用自适应算法，一键生成符合教学大纲的标准化试卷。
            支持多维规则配置与即时质量评估。
          </Paragraph>
        </div>

        {/* Features Icons */}
        <div className="pg-features">
          <div className="pg-feature-item">
            <div className="pg-feature-icon"><SafetyCertificateOutlined /></div>
            <span>知识点覆盖</span>
          </div>
          <div className="pg-feature-item">
            <div className="pg-feature-icon"><BulbOutlined /></div>
            <span>难度自适应</span>
          </div>
          <div className="pg-feature-item">
            <div className="pg-feature-icon"><RocketOutlined /></div>
            <span>秒级生成</span>
          </div>
        </div>

        {/* Generation Form */}
        {!generatedPaper && !generating && (
          <div className="pg-form-area">
            <Form form={form} layout="vertical" onFinish={handleGeneratePaper}>
              <Form.Item
                name="ruleId"
                rules={[{ required: true, message: '请选择组卷规则' }]}
              >
                <Select
                  placeholder="请选择一个组卷规则模板..."
                  loading={loading}
                  size="large"
                  showSearch
                  optionFilterProp="children"
                  listHeight={400}
                  dropdownStyle={{ padding: 8 }}
                >
                  {rules.map(rule => (
                    <Option key={rule.id} value={rule.id} label={rule.name}>
                      {renderRuleOption(rule)}
                      <Divider style={{ margin: '8px 0' }} />
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                style={{ height: 48, fontSize: 16, marginTop: 16 }}
                icon={<ThunderboltOutlined />}
              >
                立即生成试卷
              </Button>
              {/* 底部操作区 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '48px' }}>
                <Button type="text" icon={<PlusOutlined />} onClick={() => navigate('/rules/create')}>
                  新建规则
                </Button>
                <Button type="text" icon={<SettingOutlined />} onClick={() => setShowAIRuleGenerator(true)}>
                  AI创建规则
                </Button>
                <Button type="text" icon={<BookOutlined />} onClick={() => navigate('/my-rules')}>
                  规则管理
                </Button>
              </div>
            </Form>
          </div>
        )}

        {/* Loading State */}
        {generating && (
          <div className="pg-loading-container">
            <Progress type="circle" percent={72} status="active" strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
            <div className="pg-loading-text">正在分析题库并组合最优试卷...</div>
          </div>
        )}

        {/* Result Display */}
        {generatedPaper && (
          <div className="pg-result-card">
            <div className="pg-result-header">
              <div className="pg-result-title">
                <CheckCircleOutlined /> 试卷生成成功
              </div>
              <Space>
                <Button onClick={() => setGeneratedPaper(null)}>重新生成</Button>
                <Button type="primary" onClick={handleSavePaper} icon={<CheckCircleOutlined />}>
                  {generatedPaper.isSaved ? '已保存' : '保存试卷'}
                </Button>
              </Space>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={3} style={{ margin: 0 }}>{generatedPaper.title}</Title>
              <Text type="secondary">{generatedPaper.description}</Text>
            </div>

            <div className="pg-stats-grid">
              <div className="pg-stat-item">
                <div className="pg-stat-label">题目总数</div>
                <div className="pg-stat-value">{String(generatedPaper.questionIds).split(',').length}</div>
              </div>
              <div className="pg-stat-item">
                <div className="pg-stat-label">总分</div>
                <div className="pg-stat-value" style={{ color: '#52c41a' }}>{generatedPaper.totalScore}</div>
              </div>
              <div className="pg-stat-item">
                <div className="pg-stat-label">时长(分钟)</div>
                <div className="pg-stat-value" style={{ color: '#faad14' }}>{generatedPaper.duration}</div>
              </div>
              <div className="pg-stat-item">
                <div className="pg-stat-label">难度系数</div>
                <div className="pg-stat-value" style={{ color: '#722ed1' }}>
                  {generatedPaper.difficultyScore ? (generatedPaper.difficultyScore * 100).toFixed(0) + '%' : '-'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <Button icon={<EditOutlined />} onClick={() => setShowAdjustModal(true)}>微调内容</Button>
              <Button icon={<SettingOutlined />} onClick={() => setShowVisualEditor(true)}>可视化编辑</Button>
              <Button icon={<RocketOutlined />} onClick={() => setShowAIRuleGenerator(true)}>AI优化规则</Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        title="调整试卷"
        open={showAdjustModal}
        onCancel={() => setShowAdjustModal(false)}
        footer={null}
      >
        <Form form={adjustForm} onFinish={handleAdjustPaper} layout="vertical">
          <Form.Item name="operationType" label="操作类型" initialValue="REPLACE_QUESTION">
            <Select>
              <Option value="REPLACE_QUESTION">替换题目</Option>
              <Option value="ADD_QUESTION">添加题目</Option>
              <Option value="REMOVE_QUESTION">删除题目</Option>
            </Select>
          </Form.Item>
          <Form.Item name="parameters" label="参数 (JSON)">
            <TextArea rows={4} placeholder='{"questionIndex": 1}' />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>执行调整</Button>
        </Form>
      </Modal>

      <MockVisualEditor
        paper={generatedPaper}
        visible={showVisualEditor}
        onClose={() => setShowVisualEditor(false)}
        onSave={(p) => { setGeneratedPaper(p); setShowVisualEditor(false); }}
      />

      <AIRuleGenerator
        visible={showAIRuleGenerator}
        onClose={() => setShowAIRuleGenerator(false)}
        onRuleGenerated={() => { }}
      />

      <KnowledgePointConfig
        visible={showKnowledgePointConfig}
        onClose={() => setShowKnowledgePointConfig(false)}
        subject=""
      />
    </div>
  );
};

export default PaperGeneration;
