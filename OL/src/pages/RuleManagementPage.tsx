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
  Badge,
  Statistic,
  Tabs,
  Form,
  Switch,
  Divider
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
  StarFilled,
  ReloadOutlined,
  FilterOutlined,
  ExportOutlined,
  ImportOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

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
  isFavorite?: boolean;
  subject?: string;
  examType?: string;
  difficulty?: string;
  tags?: string;
}

interface RuleStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  systemCount: number;
  userCount: number;
  todayCreated: number;
  thisWeekCreated: number;
  thisMonthCreated: number;
}

const RuleManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 检查是否为管理员
  const isAdmin = user?.role === 'ADMIN';
  
  const [rules, setRules] = useState<ExamRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [statistics, setStatistics] = useState<RuleStatistics>({
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0,
    systemCount: 0,
    userCount: 0,
    todayCreated: 0,
    thisWeekCreated: 0,
    thisMonthCreated: 0
  });

  // 加载规则列表
  const loadRules = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString()
      });
      
      if (searchText) params.append('name', searchText);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (filterType !== 'ALL') params.append('isSystem', filterType === 'SYSTEM' ? 'true' : 'false');
      
      const url = `${API_CONFIG.BASE_URL}/api/rules/list?${params}`;
      console.log('请求URL:', url);
      
      // 获取认证token
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
      
      console.log('响应状态:', response.status);
      console.log('响应头:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('非JSON响应:', text.substring(0, 200));
        throw new Error('服务器返回了非JSON格式的响应');
      }
      
      const result = await response.json();
      console.log('API响应:', result);
      
      if (result.code === 200) {
        setRules(result.data.records || []);
        setPagination({
          current: result.data.current,
          pageSize: result.data.size,
          total: result.data.total
        });
      } else {
        message.error(result.message || '加载规则列表失败');
      }
    } catch (error) {
      console.error('Error loading rules:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          message.error('无法连接到后端服务，请检查服务是否启动');
        } else if (error.message.includes('非JSON格式')) {
          message.error('后端服务返回了错误页面，请检查服务状态');
        } else {
          message.error(`加载规则列表失败: ${error.message}`);
        }
      } else {
        message.error('加载规则列表失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStatistics = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        console.warn('用户未登录，无法获取统计信息');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rules/statistics`, {
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
      if (result.code === 200 && result.data) {
        setStatistics({
          totalCount: result.data.totalCount || 0,
          activeCount: result.data.activeCount || 0,
          inactiveCount: result.data.inactiveCount || 0,
          systemCount: result.data.systemCount || 0,
          userCount: result.data.userCount || 0,
          todayCreated: result.data.todayCreated || 0,
          thisWeekCreated: result.data.thisWeekCreated || 0,
          thisMonthCreated: result.data.thisMonthCreated || 0
        });
      } else {
        throw new Error(result.message || '获取统计信息失败');
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      // 如果API调用失败，使用默认值
      setStatistics({
        totalCount: 0,
        activeCount: 0,
        inactiveCount: 0,
        systemCount: 0,
        userCount: 0,
        todayCreated: 0,
        thisWeekCreated: 0,
        thisMonthCreated: 0
      });
    }
  };

  useEffect(() => {
    // 先测试连接，再加载数据
    testConnection().then(() => {
      loadRules();
      loadStatistics();
    });
  }, []);

  // 检查用户是否有权限操作规则
  const hasPermission = (rule: ExamRule) => {
    if (!user) return false;
    
    // 管理员可以操作所有规则
    if (isAdmin) return true;
    
    // 普通用户只能操作自己创建的规则
    return user.id === rule.creatorId;
  };

  // 测试后端连接
  const testConnection = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/test/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('后端连接测试成功:', result);
        return true;
      } else {
        console.error('后端连接测试失败:', response.status);
        message.error('无法连接到后端服务，请检查服务是否启动');
        return false;
      }
    } catch (error) {
      console.error('后端连接测试异常:', error);
      message.error('无法连接到后端服务，请检查服务是否启动');
      return false;
    }
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
    setFilterType('ALL');
    setPagination(prev => ({ ...prev, current: 1 }));
    loadRules(1, pagination.pageSize);
  };

  // 创建规则
  const handleCreateRule = () => {
    navigate('/rules/create');
  };

  // 编辑规则
  const handleEditRule = (rule: ExamRule) => {
    navigate(`/rules/edit/${rule.id}`);
  };

  // 查看规则详情
  const handleViewRule = (rule: ExamRule) => {
    navigate(`/rules/view/${rule.id}`);
  };

  // 删除规则
  const handleDeleteRule = async (ruleId: number) => {
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

  // 复制规则
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
        message.success('规则复制成功');
        loadRules(pagination.current, pagination.pageSize);
      } else {
        message.error(result.message || '复制规则失败');
      }
    } catch (error) {
      message.error('复制规则失败');
      console.error('Error copying rule:', error);
    }
  };

  // 更新规则状态
  const handleUpdateStatus = async (ruleId: number, status: string) => {
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

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的规则');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个规则吗？`,
      onOk: async () => {
        try {
          const token = authService.getToken();
          if (!token) {
            message.error('用户未登录，请先登录');
            return;
          }

          const response = await fetch(`${API_CONFIG.BASE_URL}/api/rules/batch`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(selectedRowKeys)
          });
          const result = await response.json();
          
          if (result.code === 200) {
            message.success('批量删除成功');
            setSelectedRowKeys([]);
            loadRules(pagination.current, pagination.pageSize);
          } else {
            message.error(result.message || '批量删除失败');
          }
        } catch (error) {
          message.error('批量删除失败');
          console.error('Error batch deleting:', error);
        }
      }
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: ExamRule) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.isSystem && <Tag color="blue" size="small">系统</Tag>}
          {record.isFavorite && <StarFilled style={{ color: '#faad14', marginLeft: 4 }} />}
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
      render: (_, record: ExamRule) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewRule(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditRule(record)}
              disabled={!hasPermission(record)}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopyRule(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'ACTIVE' ? '禁用' : '启用'}>
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => handleUpdateStatus(record.id, record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
              disabled={!hasPermission(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个规则吗？"
            onConfirm={() => handleDeleteRule(record.id)}
            disabled={!hasPermission(record)}
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={!hasPermission(record)}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(selectedRowKeys);
    },
    getCheckboxProps: (record: ExamRule) => ({
      disabled: !hasPermission(record)
    })
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>规则管理</Title>
        <Text type="secondary">管理组卷规则，包括创建、编辑、删除和状态控制</Text>
      </div>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总规则数"
              value={statistics.totalCount}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="启用规则"
              value={statistics.activeCount}
              valueStyle={{ color: '#3f8600' }}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="系统规则"
              value={statistics.systemCount}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="用户规则"
              value={statistics.userCount}
              prefix={<StarOutlined />}
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
              <Select
                value={filterType}
                onChange={setFilterType}
                style={{ width: 120 }}
              >
                <Option value="ALL">全部类型</Option>
                <Option value="SYSTEM">系统规则</Option>
                <Option value="USER">用户规则</Option>
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
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateRule}
              >
                创建规则
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
                disabled={selectedRowKeys.length === 0}
              >
                批量删除
              </Button>
              {/*<Button icon={<ExportOutlined />}>*/}
              {/*  导出*/}
              {/*</Button>*/}
              {/*<Button icon={<ImportOutlined />}>*/}
              {/*  导入*/}
              {/*</Button>*/}
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

export default RuleManagementPage;
