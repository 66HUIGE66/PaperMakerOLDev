import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Form, 
  Select, 
  Input, 
  Space, 
  Typography, 
  message, 
  Modal,
  Progress,
  Tag
} from 'antd';
import { 
  ThunderboltOutlined, 
  SettingOutlined, 
  EditOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  BookOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { intelligentPaperApi, paperGenerationApi, examPaperApi, examRuleApi } from '../services/api';
import { ExamRule, ExamPaper } from '../types';
import MockVisualEditor from './MockVisualEditor';
import AIRuleGenerator from './AIRuleGenerator';
import KnowledgePointConfig from './KnowledgePointConfig';

const { Title, Text } = Typography;
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
  const [selectedSubject] = useState<string>('');
  const [adjustForm] = Form.useForm();

  useEffect(() => {
    loadExamRules();
  }, []);

  const loadExamRules = async () => {
    try {
      setLoading(true);
      //  从数据库获取真实的规则数据
      const response = await examRuleApi.getActiveRules();
      const rulesData = response.data;
      
      if (rulesData.code === 200 && rulesData.data) {
        // 处理从数据库获取的规则数据
        const allRules = rulesData.data.map((rule: any) => {
          // 解析规则配置
          let ruleConfig = {};
          try {
            ruleConfig = JSON.parse(rule.ruleConfig || '{}');
          } catch (e) {
            ruleConfig = {};
          }
          
          // 计算题目总数
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
        console.log('从数据库加载的规则:', allRules);
      } else {
        console.error('获取规则数据失败:', rulesData.message);
        message.error('获取组卷规则失败: ' + (rulesData.message || '未知错误'));
        setRules([]);
      }
    } catch (error) {
      console.error('加载组卷规则失败:', error);
      message.error('加载组卷规则失败，请检查网络连接');
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePaper = async (values: any) => {
    try {
      setGenerating(true);
      // 根据选择的规则ID找到对应的规则模板
      const selectedRule = rules.find(rule => rule.id === values.ruleId);
      if (!selectedRule) {
        message.error('未找到选择的规则');
        return;
      }
      
      // 解析规则配置
      const ruleConfig = JSON.parse(selectedRule.ruleConfig || '{}');
      const expectedTotal = Object.values(ruleConfig.questionTypeDistribution || {}).reduce((sum: number, count: any) => sum + (count || 0), 0);

      // 调用智能组卷API（仅生成题目，不保存到数据库）
      const response = await intelligentPaperApi.generatePaper({
        ...ruleConfig,
        saveToDatabase: false // 告诉后端不要保存到数据库
      });
      const paper = response.data?.data || response.data || response;
      
      // 获取题目ID数量（兼容字符串和数组格式）
      const questionCount = typeof paper.questionIds === 'string' 
        ? paper.questionIds.split(',').filter((id: string) => id.trim()).length
        : (Array.isArray(paper.questionIds) ? paper.questionIds.length : 0);
      
      // 检查是否成功生成试卷
      if (!paper || questionCount === 0) {
        message.error('无法生成满足要求的试卷，可能的原因：\n1. 题库中该学科的题目数量不足\n2. 某些题型的题目数量不足\n3. 知识点相关的题目不足\n请调整规则要求或添加更多题目。');
        return;
      }
      
      // 检查题目数量是否符合预期
      if (questionCount < expectedTotal) {
        message.warning(`注意：由于题库中题目数量不足，实际生成了${questionCount}道题目，少于规则要求的${expectedTotal}道题目。`);
      }
      
      // 设置试卷状态和标题
      const paperTitle = selectedRule.name ? selectedRule.name.replace(/规则$/, '').trim() : '';
      const paperWithStatus = {
        ...paper,
        status: 'DRAFT',  // 设置为草稿状态
        title: paperTitle || `${(ruleConfig as any).subject || ''}练习试卷` || '自动生成的试卷',
        isSaved: false // 标记为未保存状态
      };
      console.log("pa1:" , paperWithStatus)
      setGeneratedPaper(paperWithStatus);
      message.success('试卷生成成功！请检查试卷内容，满意后点击"保存试卷"按钮进行保存。');
      onPaperGenerated?.(paperWithStatus);
    } catch (error: any) {
      console.error('生成试卷失败:', error);
      
      //  检查是否有详细的错误信息
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        // 显示详细的错误信息，支持换行
        Modal.error({
          title: '试卷生成失败',
          content: errorMessage.split('\n').map((line: string, index: number) => (
            <p key={index} style={{ margin: '4px 0' }}>{line}</p>
          )),
          okText: '确定',
          width: 520
        });
      } else {
        message.error('生成试卷失败，请重试');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleAdjustPaper = async (values: any) => {
    if (!generatedPaper) return;

    try {
      const operation = {
        type: values.operationType,
        parameters: values.parameters
      };
      
      const response = await paperGenerationApi.adjustPaperManually(
        typeof generatedPaper.id === 'string' ? parseInt(generatedPaper.id) : generatedPaper.id, 
        operation
      );
      
      const adjustedPaper = response.data;
      setGeneratedPaper(adjustedPaper);
      setShowAdjustModal(false);
      message.success('试卷调整成功！');
    } catch (error) {
      console.error('调整试卷失败:', error);
      message.error('调整试卷失败，请重试');
    }
  };

  const handleVisualEdit = () => {
    setShowVisualEditor(true);
  };

  const handleSaveVisualPaper = async (updatedPaper: ExamPaper) => {
    try {
      //  构建保存数据，确保questionIds格式正确
      const paperData: any = {
        title: updatedPaper.title,
        description: updatedPaper.description || '根据规则自动生成的试卷',
        totalScore: updatedPaper.totalScore || generatedPaper?.totalScore || 100,
        duration: updatedPaper.duration || generatedPaper?.duration,
        subject: updatedPaper.subject || generatedPaper?.subject,
        ruleId: updatedPaper.ruleId || generatedPaper?.ruleId,
        isSystem: updatedPaper.isSystem || generatedPaper?.isSystem || false,
        status: updatedPaper.status || 'PUBLISHED'
      };
      
      //  处理questionIds
      let questionIds: string = '';
      if (updatedPaper.questionIds) {
        if (typeof updatedPaper.questionIds === 'string') {
          questionIds = updatedPaper.questionIds;
        } else if (Array.isArray(updatedPaper.questionIds)) {
          questionIds = updatedPaper.questionIds.join(',');
        }
      } else if (generatedPaper?.questionIds) {
        if (typeof generatedPaper.questionIds === 'string') {
          questionIds = generatedPaper.questionIds;
        } else if (Array.isArray(generatedPaper.questionIds)) {
          questionIds = generatedPaper.questionIds.join(',');
        }
      }
      
      if (questionIds) {
        paperData.questionIds = questionIds;
      }
      
      console.log('可视化编辑器保存试卷:', paperData);
      console.log('questionIds:', questionIds);
      
      //  如果试卷已有ID，使用更新接口；否则使用创建接口
      if (updatedPaper.id && updatedPaper.isSaved) {
        const response = await examPaperApi.updateExamPaper(updatedPaper.id.toString(), paperData);
        const savedPaper = response.data?.object || response.data;
        setGeneratedPaper({
          ...savedPaper,
          isSaved: true
        });
      } else {
        const response = await examPaperApi.createExamPaper(paperData);
        const savedPaper = response.data?.object || response.data;
        setGeneratedPaper({
          ...savedPaper,
          isSaved: true
        });
      }
      
      setShowVisualEditor(false);
      message.success('试卷保存成功！');
    } catch (error) {
      console.error('保存试卷失败:', error);
      message.error('保存试卷失败，请重试');
    }
  };

  const handleCreateCustomRule = () => {
    // 直接跳转到规则管理页面的创建页面
    navigate('/rules/create');
  };

  const handleManageRules = () => {
    // 跳转到“我的规则”页面
    navigate('/my-rules');
  };



  const handleOpenAIRuleGenerator = () => {
    setShowAIRuleGenerator(true);
  };

  const handleOpenKnowledgePointConfig = () => {
    // 从表单中获取当前选择的学科
    const formValues = form.getFieldsValue();
    const currentSubject = formValues.subject || '计算机科学';
    console.log('打开知识点配置，当前学科:', currentSubject);
    console.log('表单值:', formValues);
    
    // 跳转到知识点管理页面，并传递学科参数
    navigate('/knowledge', { 
      state: { selectedSubject: currentSubject } 
    });
  };

  const handleAIRuleGenerated = (rule: any) => {
    message.success('AI规则已生成并保存到数据库！');
    console.log('AI生成的规则:', rule);
    // 跳转到规则管理页面，让用户在那里查看和管理生成的规则
    setTimeout(() => {
      navigate('/my-rules');
    }, 1500);
  };


  const handleSavePaper = async () => {
    if (!generatedPaper) {
      message.error('没有可保存的试卷');
      return;
    }

    if (generatedPaper.isSaved) {
      message.info('试卷已经保存过了');
      return;
    }

    try {
      // 如果是新生成的试卷，使用创建接口
      if (!generatedPaper.id) {
        //  确保questionIds以正确的格式传递
        const paperData: any = {
          title: generatedPaper.title,
          description: generatedPaper.description || '根据规则自动生成的试卷',
          totalScore: generatedPaper.totalScore,
          duration: generatedPaper.duration,
          subject: generatedPaper.subject,
          ruleId: generatedPaper.ruleId,
          isSystem: generatedPaper.isSystem || false,
          status: 'PUBLISHED'
        };
        
        //  确保questionIds以字符串格式传递（逗号分隔）
        if (generatedPaper.questionIds) {
          if (typeof generatedPaper.questionIds === 'string') {
            paperData.questionIds = generatedPaper.questionIds;
          } else if (Array.isArray(generatedPaper.questionIds)) {
            paperData.questionIds = generatedPaper.questionIds.join(',');
          }
        }
        
        console.log('保存试卷数据:', paperData); // 调试信息
        console.log('questionIds:', paperData.questionIds); // 调试信息
        
        const response = await examPaperApi.createExamPaper(paperData);
        
        //  处理后端RespBean数据结构
        const savedPaper = response.data?.object || response.data;
        setGeneratedPaper({
          ...savedPaper,
          isSaved: true
        });
      } else {
        // 如果是已有的试卷，使用更新接口
        await examPaperApi.updateExamPaper(generatedPaper.id.toString(), {
          ...generatedPaper,
          status: 'PUBLISHED'
        });
        setGeneratedPaper({
          ...generatedPaper,
          isSaved: true
        });
      }
      message.success('试卷保存成功！');
    } catch (error) {
      console.error('保存试卷失败:', error);
      message.error('保存试卷失败，请重试');
    }
  };

  const renderRuleInfo = (rule: ExamRule) => {
    // 解析规则配置以获取更详细的信息
    let ruleConfig = {};
    try {
      ruleConfig = JSON.parse(rule.ruleConfig || '{}');
    } catch (e) {
      ruleConfig = {};
    }

    const subject = (ruleConfig as any).subject || '物理';
    const difficulty = (ruleConfig as any).difficulty || 'MEDIUM';
    const knowledgePoints = (ruleConfig as any).knowledgePoints || {};

    return (
      <div style={{ marginBottom: '16px' }}>
        <Text strong>{rule.name}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {rule.description}
        </Text>
        <br />
        <Space size="small" style={{ marginTop: '8px' }}>
          <Tag color="blue">题目数: {rule.totalQuestions}</Tag>
          <Tag color="green">总分: {rule.totalScore}</Tag>
          <Tag color="orange">时长: {rule.duration}分钟</Tag>
          <Tag color="purple">学科: {subject}</Tag>
          <Tag color={difficulty === 'EASY' ? 'green' : difficulty === 'MEDIUM' ? 'orange' : 'red'}>
            难度: {difficulty === 'EASY' ? '简单' : difficulty === 'MEDIUM' ? '中等' : '困难'}
          </Tag>
        </Space>
        {Object.keys(knowledgePoints).length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              知识点: {Object.keys(knowledgePoints).slice(0, 3).join('、')}
              {Object.keys(knowledgePoints).length > 3 && '...'}
            </Text>
          </div>
        )}
      </div>
    );
  };

  const renderGeneratedPaper = () => {
    if (!generatedPaper) return null;

    return (
      <Card 
        title="生成的试卷" 
        extra={
          <Space>
            <Button 
              icon={<EditOutlined />} 
              onClick={() => setShowAdjustModal(true)}
            >
              调整试卷
            </Button>
            <Button 
              icon={<SettingOutlined />} 
              onClick={handleVisualEdit}
              type="default"
            >
              可视化编辑
            </Button>
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={handleSavePaper}
            >
              保存试卷
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Title level={4}>{generatedPaper.title}</Title>
            <Text type="secondary">{generatedPaper.description}</Text>
          </div>

          <div>
            <Space size="large">
              <div>
                <Text strong>题目数量: </Text>
                <Tag color="blue">{generatedPaper.questionIds ? generatedPaper.questionIds.split(",").length : 0}</Tag>
              </div>
              <div>
                <Text strong>总分: </Text>
                <Tag color="green">{generatedPaper.totalScore}</Tag>
              </div>
              <div>
                <Text strong>考试时长: </Text>
                <Tag color="orange">{generatedPaper.duration}分钟</Tag>
              </div>
              <div>
                <Text strong>难度系数: </Text>
                <Tag color="purple">
                  {generatedPaper.difficultyScore ? 
                    (generatedPaper.difficultyScore * 100).toFixed(1) + '%' : 
                    '未计算'
                  }
                </Tag>
              </div>
            </Space>
          </div>

          <div>
            <Text strong>生成类型: </Text>
            <Tag color={generatedPaper.generationType === 'AUTO' ? 'green' : 'blue'}>
              {generatedPaper.generationType === 'AUTO' ? '自动生成' : '手动创建'}
            </Tag>
            <Text strong style={{ marginLeft: '16px' }}>状态: </Text>
            <Tag color={
              generatedPaper.status === 'PUBLISHED' ? 'green' : 
              generatedPaper.status === 'DRAFT' ? 'orange' : 'gray'
            }>
              {generatedPaper.status === 'PUBLISHED' ? '已发布' : 
               generatedPaper.status === 'DRAFT' ? '草稿' : '已归档'}
            </Tag>
          </div>

          {generatedPaper.knowledgeCoverage && (
            <div>
              <Text strong>知识点覆盖: </Text>
              <Text type="secondary">
                覆盖率: {generatedPaper.knowledgeCoverage.coverage_rate ? 
                  (generatedPaper.knowledgeCoverage.coverage_rate * 100).toFixed(1) + '%' : 
                  '未计算'
                }
              </Text>
            </div>
          )}
        </Space>
      </Card>
    );
  };

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3}>
              <ThunderboltOutlined /> 智能组卷
            </Title>
            <Text type="secondary">
              基于智能算法，自动生成符合要求的学科试卷
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleGeneratePaper}
          >
            <Form.Item
              name="ruleId"
              label={
                <Space>
                  <span>选择组卷规则</span>
                  <Text type="secondary" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                    (支持搜索描述、题目数、总分、时长、学科、难度)
                  </Text>
                </Space>
              }
              rules={[{ required: true, message: '请选择组卷规则' }]}
            >
              <Select
                placeholder="请选择组卷规则"
                loading={loading}
                size="large"
                showSearch
                filterOption={(input, option) => {
                  if (!option || !option.children) return false;
                  
                  // 如果是自定义规则选项，不参与搜索
                  if (option.value === 'custom_rule') return false;
                  
                  // 获取对应的规则对象
                  const rule = rules.find(r => r.id === option.value);
                  if (!rule) return false;
                  
                  // 搜索规则名称、描述和标签信息
                  const searchText = input.toLowerCase().trim();
                  if (!searchText) return true;
                  
                  const ruleName = rule.name.toLowerCase();
                  const ruleDescription = (rule.description || '').toLowerCase();
                  
                  // 检查名称和描述
                  if (ruleName.includes(searchText) || ruleDescription.includes(searchText)) {
                    return true;
                  }
                  
                  // 检查规则配置中的学科和难度
                  try {
                    const ruleConfig = JSON.parse(rule.ruleConfig || '{}');
                    const configSubject = ruleConfig.subject || '';
                    const configDifficulty = ruleConfig.difficulty || '';
                    
                    if (configSubject.toLowerCase().includes(searchText) || 
                        configDifficulty.toLowerCase().includes(searchText)) {
                      return true;
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                  
                  // 检查数字匹配
                  const numbers = searchText.match(/\d+/g);
                  if (numbers) {
                    for (const num of numbers) {
                      if (rule.totalQuestions.toString().includes(num) ||
                          rule.totalScore.toString().includes(num) ||
                          rule.duration.toString().includes(num)) {
                        return true;
                      }
                    }
                  }
                  
                  // 检查关键词匹配
                  const keywords = {
                    '题目': rule.totalQuestions,
                    '题数': rule.totalQuestions,
                    '总分': rule.totalScore,
                    '分数': rule.totalScore,
                    '时长': rule.duration,
                    '时间': rule.duration,
                    '分钟': rule.duration,
                    '物理': '物理',
                    '简单': 'EASY',
                    '中等': 'MEDIUM',
                    '困难': 'HARD',
                    '基础': 'EASY',
                    '高级': 'HARD'
                  };
                  
                  for (const [keyword, value] of Object.entries(keywords)) {
                    if (searchText.includes(keyword) && value.toString().includes(searchText.replace(keyword, '').trim())) {
                      return true;
                    }
                  }
                  
                  return false;
                }}
                optionFilterProp="children"
              >
                <Option value="custom_rule" disabled>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BookOutlined />
                    <Text strong>自定义规则</Text>
                  </div>
                </Option>
                {rules.map(rule => (
                  <Option key={rule.id} value={rule.id}>
                    {renderRuleInfo(rule)}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ marginBottom: 16 }}>
              <Space>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleCreateCustomRule}
                >
                  创建自定义规则
                </Button>
                <Button
                  icon={<BookOutlined />}
                  onClick={handleManageRules}
                >
                  管理规则
                </Button>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={handleOpenAIRuleGenerator}
                >
                  AI智能生成规则
                </Button>
                <Button
                  icon={<BulbOutlined />}
                  onClick={handleOpenKnowledgePointConfig}
                >
                  知识点配置
                </Button>
              </Space>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={generating}
                icon={<ThunderboltOutlined />}
                block
              >
                {generating ? '正在生成试卷...' : '开始生成试卷'}
              </Button>
            </Form.Item>
          </Form>

          {generating && (
            <Card>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Text>正在使用智能算法优化题目选择...</Text>
                <Progress percent={75} status="active" />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  系统正在根据规则要求，从题库中选择最优的题目组合
                </Text>
              </Space>
            </Card>
          )}
        </Space>
      </Card>

      {renderGeneratedPaper()}

      <Modal
        title="调整试卷"
        open={showAdjustModal}
        onCancel={() => setShowAdjustModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={adjustForm}
          layout="vertical"
          onFinish={handleAdjustPaper}
        >
          <Form.Item
            name="operationType"
            label="调整操作"
            rules={[{ required: true, message: '请选择调整操作' }]}
          >
            <Select placeholder="请选择调整操作">
              <Option value="REPLACE_QUESTION">替换题目</Option>
              <Option value="ADD_QUESTION">添加题目</Option>
              <Option value="REMOVE_QUESTION">删除题目</Option>
              <Option value="REORDER_QUESTIONS">重新排序</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="parameters"
            label="调整参数"
            rules={[{ required: true, message: '请输入调整参数' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入调整参数（JSON格式）"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setShowAdjustModal(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确认调整
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 可视化编辑器 */}
      <MockVisualEditor
        paper={generatedPaper}
        visible={showVisualEditor}
        onClose={() => setShowVisualEditor(false)}
        onSave={handleSaveVisualPaper}
      />



      {/* AI规则生成器 */}
      <AIRuleGenerator
        visible={showAIRuleGenerator}
        onClose={() => setShowAIRuleGenerator(false)}
        onRuleGenerated={handleAIRuleGenerated}
      />

      {/* 知识点配置 */}
      <KnowledgePointConfig
        visible={showKnowledgePointConfig}
        onClose={() => setShowKnowledgePointConfig(false)}
        subject={selectedSubject}
      />

    </div>
  );
};

export default PaperGeneration;





