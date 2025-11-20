import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Popconfirm,
  Input,
  Select,
  Row,
  Col,
  Typography,
  Tooltip,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  SettingOutlined,
  CopyOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons';
import CustomRuleEditor from './CustomRuleEditor';

const { Title, Text } = Typography;
const { Option } = Select;

interface CustomRule {
  id: string;
  name: string;
  description: string;
  subject: string;
  totalScore: number;
  duration: number;
  questionTypes: any[];
  knowledgePoints: any[];
  enableAI: boolean;
  aiPrompt?: string;
  isPublic: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

interface RuleManagementProps {
  visible: boolean;
  onClose: () => void;
  onSelectRule: (rule: CustomRule) => void;
}

const RuleManagement: React.FC<RuleManagementProps> = ({
  visible,
  onClose,
  onSelectRule
}) => {
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<CustomRule | undefined>();
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');

  // 模拟数据
  const mockRules: CustomRule[] = [
    {
      id: '1',
      name: '计算机基础综合测试',
      description: '涵盖计算机基础知识的综合测试规则',
      subject: '计算机基础',
      totalScore: 100,
      duration: 120,
      questionTypes: [
        { type: 'SINGLE_CHOICE', count: 20, score: 2 },
        { type: 'MULTIPLE_CHOICE', count: 10, score: 3 },
        { type: 'FILL_BLANK', count: 5, score: 2 }
      ],
      knowledgePoints: [
        { point: '计算机组成原理', weight: 30 },
        { point: '操作系统', weight: 25 },
        { point: '网络基础', weight: 25 },
        { point: '数据库基础', weight: 20 }
      ],
      enableAI: true,
      isPublic: true,
      isFavorite: true,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      usageCount: 15
    },
    {
      id: '2',
      name: '数据结构算法测试',
      description: '重点测试数据结构和算法设计能力',
      subject: '数据结构',
      totalScore: 120,
      duration: 150,
      questionTypes: [
        { type: 'SINGLE_CHOICE', count: 15, score: 2 },
        { type: 'SHORT_ANSWER', count: 8, score: 5 },
        { type: 'FILL_BLANK', count: 7, score: 2 }
      ],
      knowledgePoints: [
        { point: '线性表', weight: 25 },
        { point: '树和二叉树', weight: 30 },
        { point: '图', weight: 25 },
        { point: '排序算法', weight: 20 }
      ],
      enableAI: false,
      isPublic: false,
      isFavorite: false,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
      usageCount: 8
    },
    {
      id: '3',
      name: '数据库系统测试',
      description: '数据库原理和SQL操作测试',
      subject: '数据库',
      totalScore: 100,
      duration: 90,
      questionTypes: [
        { type: 'SINGLE_CHOICE', count: 25, score: 2 },
        { type: 'MULTIPLE_CHOICE', count: 10, score: 3 },
        { type: 'TRUE_FALSE', count: 10, score: 1 }
      ],
      knowledgePoints: [
        { point: '关系模型', weight: 30 },
        { point: 'SQL语言', weight: 40 },
        { point: '数据库设计', weight: 30 }
      ],
      enableAI: true,
      isPublic: true,
      isFavorite: false,
      createdAt: '2024-01-12',
      updatedAt: '2024-01-19',
      usageCount: 12
    }
  ];

  useEffect(() => {
    if (visible) {
      loadRules();
    }
  }, [visible]);

  const loadRules = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      setRules(mockRules);
    } catch (error) {
      message.error('加载规则失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setEditingRule(undefined);
    setEditorMode('create');
    setShowRuleEditor(true);
  };

  const handleEditRule = (rule: CustomRule) => {
    setEditingRule(rule);
    setEditorMode('edit');
    setShowRuleEditor(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      setRules(rules.filter(rule => rule.id !== ruleId));
      message.success('规则删除成功');
    } catch (error) {
      message.error('删除规则失败');
    }
  };

  const handleSaveRule = async (rule: CustomRule) => {
    try {
      if (editorMode === 'create') {
        // 创建新规则
        const newRule = {
          ...rule,
          id: Date.now().toString(),
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
          usageCount: 0,
          isFavorite: false
        };
        setRules([newRule, ...rules]);
        message.success('规则创建成功');
      } else {
        // 更新规则
        const updatedRule = {
          ...rule,
          updatedAt: new Date().toISOString().split('T')[0]
        };
        setRules(rules.map(r => r.id === rule.id ? updatedRule : r));
        message.success('规则更新成功');
      }
      setShowRuleEditor(false);
    } catch (error) {
      message.error('保存规则失败');
    }
  };

  const handleCopyRule = (rule: CustomRule) => {
    const copiedRule = {
      ...rule,
      id: Date.now().toString(),
      name: `${rule.name} (副本)`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      usageCount: 0,
      isFavorite: false
    };
    setRules([copiedRule, ...rules]);
    message.success('规则复制成功');
  };

  const handleToggleFavorite = (ruleId: string) => {
    setRules(rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, isFavorite: !rule.isFavorite }
        : rule
    ));
  };

  const handleSelectRule = (rule: CustomRule) => {
    onSelectRule(rule);
    onClose();
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesSubject = filterSubject === 'ALL' || rule.subject === filterSubject;
    const matchesType = filterType === 'ALL' || 
                       (filterType === 'PUBLIC' && rule.isPublic) ||
                       (filterType === 'PRIVATE' && !rule.isPublic) ||
                       (filterType === 'FAVORITE' && rule.isFavorite);
    
    return matchesSearch && matchesSubject && matchesType;
  });

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CustomRule) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong>{text}</Text>
            {record.isFavorite && <StarFilled style={{ color: '#faad14' }} />}
            {record.isPublic && <Tag color="blue">公开</Tag>}
            {record.enableAI && <Tag color="green">AI增强</Tag>}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description}
          </Text>
        </div>
      )
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 100
    },
    {
      title: '配置',
      key: 'config',
      width: 120,
      render: (record: CustomRule) => (
        <div>
          <div>总分: {record.totalScore}</div>
          <div>时长: {record.duration}分钟</div>
          <div>题型: {record.questionTypes.length}种</div>
        </div>
      )
    },
    {
      title: '使用统计',
      key: 'stats',
      width: 100,
      render: (record: CustomRule) => (
        <div>
          <div>使用次数: {record.usageCount}</div>
          <div>更新时间: {record.updatedAt}</div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: CustomRule) => (
        <Space>
          <Tooltip title="使用此规则">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleSelectRule(record)}
            >
              使用
            </Button>
          </Tooltip>
          <Tooltip title="编辑规则">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditRule(record)}
            />
          </Tooltip>
          <Tooltip title="复制规则">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyRule(record)}
            />
          </Tooltip>
          <Tooltip title={record.isFavorite ? '取消收藏' : '添加收藏'}>
            <Button
              size="small"
              icon={record.isFavorite ? <StarFilled /> : <StarOutlined />}
              onClick={() => handleToggleFavorite(record.id)}
              style={{ color: record.isFavorite ? '#faad14' : undefined }}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个规则吗？"
            onConfirm={() => handleDeleteRule(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除规则">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            <SettingOutlined />
            规则管理
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={1200}
        footer={[
          <Button key="close" onClick={onClose}>
            关闭
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Input
                placeholder="搜索规则名称或描述"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="选择学科"
                value={filterSubject}
                onChange={setFilterSubject}
                style={{ width: '100%' }}
              >
                <Option value="ALL">全部学科</Option>
                <Option value="计算机基础">计算机基础</Option>
                <Option value="数据结构">数据结构</Option>
                <Option value="数据库">数据库</Option>
                <Option value="网络技术">网络技术</Option>
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="选择类型"
                value={filterType}
                onChange={setFilterType}
                style={{ width: '100%' }}
              >
                <Option value="ALL">全部类型</Option>
                <Option value="PUBLIC">公开规则</Option>
                <Option value="PRIVATE">私有规则</Option>
                <Option value="FAVORITE">收藏规则</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateRule}
                style={{ width: '100%' }}
              >
                创建规则
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredRules}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Modal>

      <CustomRuleEditor
        visible={showRuleEditor}
        onClose={() => setShowRuleEditor(false)}
        onSave={handleSaveRule}
        initialRule={editingRule}
        mode={editorMode}
      />
    </>
  );
};

export default RuleManagement;
















