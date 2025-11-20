import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Input,
  message,
  Tag,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tabs
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/index';
import { ExamRule, QuestionType, DifficultyLevel, GenerateResult } from '../types/index';
import { generateId, generateExamPaper } from '../utils';
import RuleForm from '../components/RuleForm';
import SearchFilter, { SearchFilterConfig, SearchFilterValue } from '../components/SearchFilter';
import { examRuleApi, subjectApi } from '../services/api';
import { useEffect } from 'react';



const RuleManagement: React.FC = () => {
  const {
    examRules,
    addExamRule,
    updateExamRule,
    deleteExamRule,
    addExamPaper,
    questions,
    setExamRules
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<ExamRule | null>(null);
  const [searchText, setSearchText] = useState('');
  const [generateLoading, setGenerateLoading] = useState<string | null>(null);
  const [filteredRules, setFilteredRules] = useState<ExamRule[]>([]);
  const [searchFilterValue, setSearchFilterValue] = useState<SearchFilterValue>({});
  const [subjects, setSubjects] = useState<Array<{id: number, name: string}>>([]);

  // 加载学科列表
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await subjectApi.getAllActiveSubjects(false, undefined);
        const subjectsData = response.data?.object || response.data?.data || response.data || [];
        if (Array.isArray(subjectsData)) {
          setSubjects(subjectsData.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch (error) {
        console.error('加载学科列表失败:', error);
      }
    };
    loadSubjects();
  }, []);

  // 从数据库加载规则
  const loadRulesFromDatabase = async () => {
    try {
      setLoading(true);
      const response = await examRuleApi.getRules({ page: 1, size: 100 });
      
      if (response.data.code === 200) {
        const rules = response.data.data.records || [];
        console.log('从数据库加载的规则:', rules);
        
        // 转换数据库格式到前端格式
        const convertedRules: ExamRule[] = rules.map((rule: any) => ({
          id: rule.id.toString(),
          name: rule.name,
          description: rule.description,
          totalQuestions: rule.totalQuestions,
          totalScore: rule.totalScore,
          duration: rule.duration,
          subject: rule.subject || '综合',
          questionTypes: parseQuestionTypes(rule.ruleConfig),
          knowledgePoints: parseKnowledgePoints(rule.ruleConfig),
          difficultyDistribution: parseDifficultyDistribution(rule.ruleConfig),
          typeDistribution: parseTypeDistribution(rule.ruleConfig),
          isSystem: rule.isSystem || false,
          status: rule.status || 'ACTIVE',
          createdAt: rule.createdAt,
          usageCount: rule.usageCount || 0
        }));
        
        setExamRules(convertedRules);
        setFilteredRules(convertedRules);
        message.success(`成功加载 ${convertedRules.length} 条规则`);
      } else {
        message.error('加载规则失败: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('加载规则失败:', error);
      message.error('加载规则失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 解析题型分布
  const parseQuestionTypes = (ruleConfig: string) => {
    try {
      const config = JSON.parse(ruleConfig);
      const questionTypeDistribution = config.questionTypeDistribution || {};
      return Object.entries(questionTypeDistribution).map(([type, count]) => ({
        type: type as QuestionType,
        count: count as number
      }));
    } catch (error) {
      console.error('解析题型分布失败:', error);
      return [];
    }
  };

  // 解析知识点
  const parseKnowledgePoints = (ruleConfig: string) => {
    try {
      const config = JSON.parse(ruleConfig);
      return config.knowledgePoints || [];
    } catch (error) {
      console.error('解析知识点失败:', error);
      return [];
    }
  };

  // 解析难度分布
  const parseDifficultyDistribution = (ruleConfig: string) => {
    try {
      const config = JSON.parse(ruleConfig);
      return config.difficultyDistribution || {};
    } catch (error) {
      console.error('解析难度分布失败:', error);
      return {};
    }
  };

  // 解析题型分布
  const parseTypeDistribution = (ruleConfig: string) => {
    try {
      const config = JSON.parse(ruleConfig);
      return config.questionTypeDistribution || {};
    } catch (error) {
      console.error('解析题型分布失败:', error);
      return {};
    }
  };

  // 组件挂载时加载规则
  useEffect(() => {
    loadRulesFromDatabase();
  }, []);

  // 搜索筛选配置
  const searchFilterConfig: SearchFilterConfig = {
    searchPlaceholder: '搜索规则名称或描述...',
    searchFields: ['name', 'description'],
    filters: [
      {
        key: 'subject',
        label: '学科',
        type: 'select',
        options: [
          { label: '全部学科', value: '' },
          ...subjects.map(s => ({ label: s.name, value: s.name }))
        ]
      },
      {
        key: 'questionCount',
        label: '题目数量',
        type: 'select',
        options: [
          { label: '10题', value: 10 },
          { label: '20题', value: 20 },
          { label: '30题', value: 30 },
          { label: '50题', value: 50 },
          { label: '100题', value: 100 }
        ]
      },
      {
        key: 'timeLimit',
        label: '时间限制',
        type: 'select',
        options: [
          { label: '30分钟', value: 30 },
          { label: '60分钟', value: 60 },
          { label: '90分钟', value: 90 },
          { label: '120分钟', value: 120 },
          { label: '180分钟', value: 180 }
        ]
      }
    ],
    showAdvanced: true,
    advancedFilters: [
      {
        key: 'createdDate',
        label: '创建时间',
        type: 'daterange'
      },
      {
        key: 'questionCountRange',
        label: '题目数量范围',
        type: 'numberrange'
      },
      {
        key: 'timeLimitRange',
        label: '时间限制范围(分钟)',
        type: 'numberrange'
      }
    ]
  };

  // 统计数据
  const totalRules = examRules.length;
  const activeRules = examRules.filter(rule => (rule.totalQuestions || 0) > 0).length;

  // 搜索和筛选处理
  const handleSearch = (searchValue: SearchFilterValue) => {
    let filtered = [...examRules];

    // 文本搜索
    if (searchValue.search) {
      const searchText = searchValue.search.toLowerCase();
      filtered = filtered.filter(rule =>
        rule.name.toLowerCase().includes(searchText) ||
        (rule.description && rule.description.toLowerCase().includes(searchText))
      );
    }

    // 基础筛选
    if (searchValue.filters) {
      Object.entries(searchValue.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          filtered = filtered.filter(rule => {
            if (key === 'subject') {
              // 支持通过学科名称匹配
              return rule.subject === value || (rule.subject && String(rule.subject).includes(String(value)));
            }
            if (key === 'questionCount') return (rule.totalQuestions || 0) === value;
            if (key === 'timeLimit') return (rule.duration || 0) === value;
            return true;
          });
        }
      });
    }

    // 高级筛选
    if (searchValue.advancedFilters) {
      Object.entries(searchValue.advancedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          filtered = filtered.filter(rule => {
            if (key === 'createdDate' && Array.isArray(value) && value.length === 2) {
              const [start, end] = value;
              const ruleDate = new Date(rule.createTime || '');
              return ruleDate >= start && ruleDate <= end;
            }
            if (key === 'questionCountRange' && Array.isArray(value) && value.length === 2) {
              const [min, max] = value;
              const questionCount = rule.totalQuestions || 0;
              return questionCount >= min && questionCount <= max;
            }
            if (key === 'timeLimitRange' && Array.isArray(value) && value.length === 2) {
              const [min, max] = value;
              const duration = rule.duration || 0;
              return duration >= min && duration <= max;
            }
            return true;
          });
        }
      });
    }

    setFilteredRules(filtered);
  };

  // 重置搜索
  const handleResetSearch = () => {
    setFilteredRules(examRules);
  };

  // 初始化筛选数据
  React.useEffect(() => {
    setFilteredRules(examRules);
  }, [examRules]);

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string, record: ExamRule) => (
        <div>
          <div style={{ marginBottom: 4, fontWeight: 500 }} title={text}>
            {text}
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }} title={record.description || ''}>
            {record.description && record.description.length > 50 
              ? `${record.description.substring(0, 50)}...` 
              : record.description}
          </div>
        </div>
      ),
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 120,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '题目数量',
      dataIndex: 'totalQuestions',
      key: 'totalQuestions',
      width: 100,
      render: (count: number) => (
        <Tag color="blue">{count || 0}题</Tag>
      ),
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 80,
      render: (score: number) => (
        <Tag color="green">{score || 0}分</Tag>
      ),
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (minutes: number) => (
        <Tag color="orange">{minutes || 0}分钟</Tag>
      ),
    },
    {
      title: '难度分布',
      dataIndex: 'difficultyDistribution',
      key: 'difficultyDistribution',
      width: 180,
      render: (distribution: Record<DifficultyLevel, number>) => (
        <div>
            {Object.entries(distribution).map(([level, count]) => (
              <Tag key={level} style={{ marginBottom: 2 }}>
                {level === DifficultyLevel.EASY as unknown as string && '简单'}
                {level === DifficultyLevel.MEDIUM as unknown as string && '中等'}
                {level === DifficultyLevel.HARD as unknown as string && '困难'}
                {level === DifficultyLevel.EXPERT as unknown as string && '专家'}
                : {count}
              </Tag>
            ))}
          </div>
      ),
    },
    {
      title: '题型分布',
      dataIndex: 'typeDistribution',
      key: 'typeDistribution',
      width: 180,
      render: (distribution: Record<QuestionType, number>) => (
        <div>
                {Object.entries(distribution).map(([type, count]) => (
                  count > 0 && (
                    <Tag key={type} style={{ marginBottom: 2 }}>
                      {type === QuestionType.SINGLE_CHOICE && '单选'}
                      {type === QuestionType.MULTIPLE_CHOICE && '多选'}
                      {type === QuestionType.FILL_BLANK && '填空'}
                      {type === QuestionType.TRUE_FALSE && '判断'}
                      {type === QuestionType.SHORT_ANSWER && '简答'}
                      : {count}
                    </Tag>
                  )
                ))}
          </div>
      ),
    },
    {
      title: '知识点',
      dataIndex: 'knowledgePoints',
      key: 'knowledgePoints',
      width: 150,
      ellipsis: true,
      render: (points: string[]) => (
        <div>
          {points.slice(0, 2).map(point => (
            <Tag key={point} style={{ marginBottom: 2 }}>
              {point}
            </Tag>
          ))}
          {points.length > 2 && <Tag color="default">+{points.length - 2}</Tag>}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: ExamRule) => (
        <Space size="small">
          <Button
            type="link"
            icon={<PlayCircleOutlined />}
            onClick={() => handleGenerate(record)}
            loading={generateLoading === record.id}
            size="small"
          >
            生成试卷
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Button
            type="link"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record)}
            size="small"
          >
            复制
          </Button>
          <Popconfirm
            title="确定要删除这个规则吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingRule(null);
    setModalVisible(true);
  };

  const handleEdit = (rule: ExamRule) => {
    setEditingRule(rule);
    setModalVisible(true);
  };

  const handleCopy = (rule: ExamRule) => {
    const newRule: ExamRule = {
      ...rule,
      id: generateId(),
      name: `${rule.name} - 副本`,
    };
    addExamRule(newRule);
    message.success('复制成功');
  };

  const handleDelete = (id: string) => {
    deleteExamRule(id);
    message.success('删除成功');
  };

  const handleGenerate = async (rule: ExamRule) => {
    setGenerateLoading(rule.id);
    try {
      const result: GenerateResult = generateExamPaper(questions, rule);
      
      if (result.success && result.examPaper) {
        addExamPaper(result.examPaper);
        message.success(result.message);
        
        if (result.suggestions && result.suggestions.length > 0) {
          message.warning(result.suggestions.join('; '));
        }
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('生成试卷时发生错误');
    } finally {
      setGenerateLoading(null);
    }
  };

  const handleModalOk = async (rule: ExamRule) => {
    try {
      if (editingRule) {
        // 更新规则
        await updateRuleInDatabase(editingRule.id, rule);
        message.success('更新成功');
      } else {
        // 创建新规则
        await createRuleInDatabase(rule);
        message.success('添加成功');
      }
      
      // 重新加载规则列表
      await loadRulesFromDatabase();
      
      setModalVisible(false);
      setEditingRule(null);
    } catch (error: any) {
      console.error('保存规则失败:', error);
      message.error('保存规则失败: ' + error.message);
    }
  };

  // 创建规则到数据库
  const createRuleInDatabase = async (rule: ExamRule) => {
    try {
      const ruleEntity = {
        name: rule.name,
        description: rule.description,
        totalQuestions: rule.totalQuestions,
        totalScore: rule.totalScore,
        duration: rule.duration,
        ruleConfig: JSON.stringify({
          title: rule.name,
          description: rule.description,
          subject: rule.subject,
          totalScore: rule.totalScore,
          duration: rule.duration,
          questionTypeDistribution: rule.typeDistribution,
          difficultyDistribution: rule.difficultyDistribution,
          knowledgePoints: rule.knowledgePoints || [],
          specialRequirements: ''
        }),
        isSystem: false,
        status: 'ACTIVE'
      };

      const response = await examRuleApi.createRule(ruleEntity);
      
      if (response.data.code !== 200) {
        throw new Error(response.data.message || '创建规则失败');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('创建规则到数据库失败:', error);
      throw error;
    }
  };

  // 更新规则到数据库
  const updateRuleInDatabase = async (id: string, rule: ExamRule) => {
    try {
      const ruleEntity = {
        name: rule.name,
        description: rule.description,
        totalQuestions: rule.totalQuestions,
        totalScore: rule.totalScore,
        duration: rule.duration,
        ruleConfig: JSON.stringify({
          title: rule.name,
          description: rule.description,
          subject: rule.subject,
          totalScore: rule.totalScore,
          duration: rule.duration,
          questionTypeDistribution: rule.typeDistribution,
          difficultyDistribution: rule.difficultyDistribution,
          knowledgePoints: rule.knowledgePoints || [],
          specialRequirements: ''
        }),
        isSystem: false,
        status: 'ACTIVE'
      };

      const response = await examRuleApi.updateRule(parseInt(id), ruleEntity);
      
      if (response.data.code !== 200) {
        throw new Error(response.data.message || '更新规则失败');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('更新规则到数据库失败:', error);
      throw error;
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingRule(null);
  };

  return (
    <div className="fade-in">
      <Card className="page-card">
        <div className="page-card-header">
          <div className="page-card-title">组卷规则管理</div>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              创建规则
            </Button>
          </Space>
        </div>
        <div className="page-card-content">
          <Tabs 
            defaultActiveKey="list" 
            items={[
              {
                key: 'list',
                label: '规则列表',
                children: (
                  <>
                    {/* 统计信息 */}
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                      <Col span={6}>
                        <Statistic title="总规则数" value={totalRules} />
                      </Col>
                      <Col span={6}>
                        <Statistic title="活跃规则" value={activeRules} />
                      </Col>
                      <Col span={6}>
                        <Statistic title="可用题目" value={questions.length} />
                      </Col>
                      <Col span={6}>
                        <Statistic title="知识点数" value={new Set(questions.flatMap(q => q.knowledgePoints)).size} />
                      </Col>
                    </Row>

                    {/* 搜索和筛选组件 */}
                    <SearchFilter
                      config={searchFilterConfig}
                      value={searchFilterValue}
                      onChange={setSearchFilterValue}
                      onSearch={handleSearch}
                      onReset={handleResetSearch}
                      loading={loading}
                    />

                    {/* 规则表格 */}
                    <div style={{ overflowX: 'auto', width: '100%' }}>
                      <Table
                        columns={columns}
                        dataSource={filteredRules}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                          total: filteredRules.length,
                          pageSize: 10,
                          showSizeChanger: true,
                          showQuickJumper: true,
                          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                        }}
                        scroll={{ x: 'max-content' }}
                      />
                    </div>
                  </>
                )
              },
              {
                key: 'stats',
                label: '规则统计',
                children: (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card title="规则概览" size="small">
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ marginBottom: 8 }}>
                            <span style={{ marginRight: 8 }}>总规则数:</span>
                            <span style={{ color: '#1890ff', fontWeight: 600 }}>{totalRules}</span>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <span style={{ marginRight: 8 }}>活跃规则:</span>
                            <span style={{ color: '#52c41a', fontWeight: 600 }}>{activeRules}</span>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <span style={{ marginRight: 8 }}>可用题目:</span>
                            <span style={{ color: '#1890ff', fontWeight: 600 }}>{questions.length}</span>
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="知识点分布" size="small">
                        {(() => {
                          const knowledgePointCount = questions.reduce((acc, q) => {
                            q.knowledgePoints.forEach(kp => {
                              acc[kp] = (acc[kp] || 0) + 1;
                            });
                            return acc;
                          }, {} as Record<string, number>);
                           
                          const sortedPoints = Object.entries(knowledgePointCount)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 10);
                           
                          return sortedPoints.map(([point, count]) => (
                            <div key={point} style={{ marginBottom: 8 }}>
                              <span style={{ marginRight: 8 }}>{point}</span>
                              <span style={{ float: 'right', color: '#1890ff' }}>{count}</span>
                            </div>
                          ));
                        })()}
                      </Card>
                    </Col>
                  </Row>
                )
              }
            ]}
          />
        </div>
      </Card>

      {/* 规则编辑模态框 */}
      <Modal
        title={editingRule ? '编辑规则' : '创建规则'}
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <RuleForm
          rule={editingRule}
          onSave={handleModalOk}
          onCancel={handleModalCancel}
        />
      </Modal>
    </div>
  );
};

export default RuleManagement;
