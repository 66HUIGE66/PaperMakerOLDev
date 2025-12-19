import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Popconfirm,
  Input,
  Select,
  Row,
  Col,
  Typography,
  Tooltip,
  Statistic,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  SettingOutlined,
  CopyOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

interface ExamRule {
  id: number;
  name: string;
  description: string;
  totalQuestions: number;
  totalScore: number;
  duration: number;
  ruleConfig: string;
  creatorId: number;
  creatorName?: string;
  isSystem: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
  subject?: string;
  difficulty?: string;
}

const SystemRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 检查是否为管理员
  const isAdmin = user?.role === 'ADMIN';

  const [rules, setRules] = useState<ExamRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 加载系统规则列表（只加载系统规则，isSystem=true）
  const loadRules = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString(),
        isSystem: 'true' // 只加载系统规则
      });

      if (searchText) params.append('name', searchText);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);

      const url = `${API_CONFIG.BASE_URL}/api/rules/list?${params}`;

      const token = authService.getToken();
      if (!token) {
        throw new Error('用户未登录，请先登录');
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.code === 200) {
        // 后端已经根据isSystem=true进行了过滤
        const systemRules = result.data.records || [];
        setRules(systemRules);
        setPagination({
          current: result.data.current,
          pageSize: result.data.size,
          total: result.data.total || systemRules.length
        });
      } else {
        message.error(result.message || '加载规则列表失败');
      }
    } catch (error) {
      console.error('Error loading rules:', error);
      if (error instanceof Error) {
        message.error(`加载规则列表失败: ${error.message}`);
      } else {
        message.error('加载规则列表失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  // 检查用户是否有权限操作规则
  const hasPermission = (_rule: ExamRule) => {
    // 只有管理员可以操作系统规则
    return isAdmin;
  };

  // 搜索处理
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadRules(1, pagination.pageSize);
  };

  // 重置搜索
  const handleReset = () => {
    setSearchText('');
    setFilterStatus('ALL');
    setPagination(prev => ({ ...prev, current: 1 }));
    loadRules(1, pagination.pageSize);
  };

  // 创建系统规则（仅管理员）
  const handleCreateRule = () => {
    if (!isAdmin) {
      message.warning('只有管理员可以创建系统规则');
      return;
    }
    navigate('/rules/create');
  };

  // 编辑规则（仅管理员）
  const handleEditRule = (rule: ExamRule) => {
    if (!hasPermission(rule)) {
      message.warning('只有管理员可以编辑系统规则');
      return;
    }
    navigate(`/rules/edit/${rule.id}`);
  };

  // 查看规则详情（所有用户都可以查看）
  const handleViewRule = (rule: ExamRule) => {
    navigate(`/rules/view/${rule.id}`);
  };

  // 删除规则（仅管理员）
  const handleDeleteRule = async (ruleId: number) => {
    if (!isAdmin) {
      message.warning('只有管理员可以删除系统规则');
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        message.error('用户未登录，请先登录');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const result = await response.json();

      if (result.code === 200) {
        message.success('规则删除成功');
        loadRules(pagination.current, pagination.pageSize);
      } else {
        message.error(result.message || '删除规则失败');
      }
    } catch (error) {
      message.error('删除规则失败');
      console.error('Error deleting rule:', error);
    }
  };

  // 复制规则（所有用户都可以复制系统规则到自己名下）
  const handleCopyRule = async (rule: ExamRule) => {
    try {
      const token = authService.getToken();
      if (!token) {
        message.error('用户未登录，请先登录');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rules/${rule.id}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const result = await response.json();

      if (result.code === 200) {
        message.success('规则复制成功，已添加到我的规则');
        // 提示用户去查看我的规则
        setTimeout(() => {
          if (window.confirm('是否前往查看我的规则？')) {
            navigate('/my-rules');
          }
        }, 1000);
      } else {
        message.error(result.message || '复制规则失败');
      }
    } catch (error) {
      message.error('复制规则失败');
      console.error('Error copying rule:', error);
    }
  };

  // 更新规则状态（仅管理员）
  const handleUpdateStatus = async (ruleId: number, status: string) => {
    if (!isAdmin) {
      message.warning('只有管理员可以修改系统规则状态');
      return;
    }

    try {
      const token = authService.getToken();
      if (!token) {
        message.error('用户未登录，请先登录');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rules/${ruleId}/status?status=${status}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const result = await response.json();

      if (result.code === 200) {
        message.success('状态更新成功');
        loadRules(pagination.current, pagination.pageSize);
      } else {
        message.error(result.message || '状态更新失败');
      }
    } catch (error) {
      message.error('状态更新失败');
      console.error('Error updating status:', error);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, _record: ExamRule) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <Tag color="blue">系统</Tag>
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true
    },
    {
      title: '题目数',
      dataIndex: 'totalQuestions',
      key: 'totalQuestions',
      width: 80,
      align: 'center' as const
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 80,
      align: 'center' as const
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      align: 'center' as const
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          'ACTIVE': { color: 'green', text: '启用' },
          'INACTIVE': { color: 'red', text: '禁用' },
          'DELETED': { color: 'gray', text: '已删除' }
        };
        const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
      align: 'center' as const,
      render: (count: number) => count || 0
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ExamRule) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewRule(record)}
            />
          </Tooltip>
          {isAdmin && (
            <>
              <Tooltip title="编辑">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditRule(record)}
                />
              </Tooltip>
              <Tooltip title={record.status === 'ACTIVE' ? '禁用' : '启用'}>
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => handleUpdateStatus(record.id, record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                />
              </Tooltip>
              <Popconfirm
                title="确定要删除这个系统规则吗？"
                onConfirm={() => handleDeleteRule(record.id)}
              >
                <Tooltip title="删除">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
          <Tooltip title="复制到我的规则">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopyRule(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 行选择配置（仅管理员可以选择）
  const rowSelection = isAdmin ? {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(selectedRowKeys);
    }
  } : undefined;

  return (
    <div className="page-container">
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>系统规则</Title>
        <Text type="secondary">查看系统提供的组卷规则，所有用户都可以使用这些规则生成试卷</Text>
      </div>

      {/* 权限提示 */}
      {!isAdmin && (
        <Alert
          message="提示"
          description="系统规则由管理员创建和维护，普通用户只能查看和复制系统规则。复制后的规则会添加到'我的规则'中，您可以自由编辑。"
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="系统规则总数"
              value={pagination.total}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="启用规则"
              value={rules.filter(r => r.status === 'ACTIVE').length}
              valueStyle={{ color: '#3f8600' }}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="禁用规则"
              value={rules.filter(r => r.status === 'INACTIVE').length}
              valueStyle={{ color: '#cf1322' }}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和操作区域 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space wrap>
              <Input
                placeholder="搜索规则名称或描述"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
              />
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: 120 }}
              >
                <Option value="ALL">全部状态</Option>
                <Option value="ACTIVE">启用</Option>
                <Option value="INACTIVE">禁用</Option>
              </Select>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              {isAdmin && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateRule}
                >
                  创建系统规则
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 规则列表 */}
      <Card>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <Table
            columns={columns}
            dataSource={rules}
            rowKey="id"
            loading={loading}
            rowSelection={rowSelection}
            scroll={{ x: 'max-content' }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              onChange: (page, pageSize) => {
                loadRules(page, pageSize || 10);
              }
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default SystemRulesPage;

