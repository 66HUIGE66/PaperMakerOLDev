import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Typography,
  Select,
  Tabs,
  Switch,
  Tag,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  NodeIndexOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { subjectApi, knowledgePointApi } from '../services/api';
import { Subject, KnowledgePoint } from '../types';
import SearchFilter, { SearchFilterConfig, SearchFilterValue } from '../components/SearchFilter';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

const { Title } = Typography;
const { Option } = Select;

const SubjectKnowledgePointManagement: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const [form] = Form.useForm();
  const [subjectForm] = Form.useForm();
  
  // 根据URL路径判断是系统内容还是个人内容
  const isSystemModule = location.pathname.includes('system');
  
  // 学科相关状态
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectLoading, setSubjectLoading] = useState(false);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectSearchText, setSubjectSearchText] = useState<string>('');
  const [subjectStatusFilter, setSubjectStatusFilter] = useState<string | undefined>(undefined);
  
  // 知识点相关状态
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [knowledgePointLoading, setKnowledgePointLoading] = useState(false);
  const [knowledgePointModalVisible, setKnowledgePointModalVisible] = useState(false);
  const [editingKnowledgePoint, setEditingKnowledgePoint] = useState<KnowledgePoint | null>(null);
  const [searchFilterValue, setSearchFilterValue] = useState<SearchFilterValue>({});
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // 使用useMemo计算筛选后的学科
  const filteredSubjects = React.useMemo(() => {
    let filtered = subjects;

    // 按搜索关键词筛选（学科名称、代码、描述）
    if (subjectSearchText) {
      const searchLower = subjectSearchText.toLowerCase();
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchLower) ||
        subject.code.toLowerCase().includes(searchLower) ||
        (subject.description && subject.description.toLowerCase().includes(searchLower))
      );
    }

    // 按状态筛选
    if (subjectStatusFilter !== undefined) {
      if (subjectStatusFilter === 'active') {
        filtered = filtered.filter(subject => subject.isActive);
      } else if (subjectStatusFilter === 'inactive') {
        filtered = filtered.filter(subject => !subject.isActive);
      }
    }

    return filtered;
  }, [subjects, subjectSearchText, subjectStatusFilter]);

  // 使用useMemo计算筛选后的知识点
  const filteredKnowledgePoints = React.useMemo(() => {
    let filtered = knowledgePoints;

    // 按搜索关键词筛选
    if (searchFilterValue.search) {
      const searchLower = searchFilterValue.search.toLowerCase();
      filtered = filtered.filter(point =>
        point.name.toLowerCase().includes(searchLower) ||
        (point.description && point.description.toLowerCase().includes(searchLower))
      );
    }

    // 按学科筛选 - 从filters对象中获取subject
    const subjectFilter = searchFilterValue.filters?.subject;
    if (subjectFilter) {
      filtered = filtered.filter(point => point.subject === subjectFilter);
    }

    return filtered;
  }, [knowledgePoints, searchFilterValue]);
  
  // 当前激活的标签页
  const [activeTab, setActiveTab] = useState('subjects');

  // 搜索筛选配置
  const searchFilterConfig: SearchFilterConfig = {
    searchPlaceholder: '搜索知识点名称或描述...',
    filters: [
      {
        key: 'subject',
        label: '学科',
        type: 'select',
        options: [
          { value: '', label: '全部学科' },
          ...subjects.map(subject => ({
            value: subject.name,
            label: subject.name
          }))
        ]
      }
    ]
  };

  // 学科表格列配置
  const subjectColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '学科名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '学科代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 100,
      render: (isSystem: boolean) => (
        <Tag color={isSystem ? 'blue' : 'green'}>
          {isSystem ? '系统学科' : '个人学科'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Subject) => {
        const recordIsSystem = Boolean(record.isSystem);
        const showActions = isAdmin || !recordIsSystem;
        if (!showActions) return null;
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditSubject(record)}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这个学科吗？"
              onConfirm={() => handleDeleteSubject(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // 知识点表格列配置
  const knowledgePointColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '知识点名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 100,
      render: (isSystem: boolean) => (
        <Tag color={isSystem ? 'blue' : 'green'}>
          {isSystem ? '系统知识点' : '个人知识点'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: KnowledgePoint) => {
        const recordIsSystem = Boolean(record.isSystem);
        const showActions = isAdmin || !recordIsSystem;
        if (!showActions) return null;
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditKnowledgePoint(record)}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这个知识点吗？"
              onConfirm={() => handleDeleteKnowledgePoint(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // 加载学科数据
  const loadSubjects = async () => {
    try {
      setSubjectLoading(true);
      console.log('正在加载学科数据，模块类型:', isSystemModule ? '系统' : '我的');
      // 根据模块类型加载对应的学科数据
      const response = await subjectApi.getAllActiveSubjects(true, isSystemModule);
      console.log('学科API响应:', response);
      
      if (response.data && response.data.code === 200) {
        const subjectData = response.data.data || [];
        console.log('获取到的学科数据:', subjectData);
        console.log('学科数据类型统计:', {
          total: subjectData.length,
          system: subjectData.filter((s: any) => s.isSystem).length,
          personal: subjectData.filter((s: any) => !s.isSystem).length
        });
        setSubjects(subjectData);
      } else {
        console.error('API返回错误:', response.data);
        message.error(response.data?.message || '加载学科失败');
      }
    } catch (error) {
      console.error('加载学科失败:', error);
      message.error('加载学科失败: ' + error);
    } finally {
      setSubjectLoading(false);
    }
  };

  // 加载知识点数据
  const loadKnowledgePoints = async (subject?: string) => {
    try {
      setKnowledgePointLoading(true);
      console.log('加载知识点，学科:', subject, '模块:', isSystemModule ? '系统' : '个人');
      // 根据模块类型加载对应的知识点数据
      const response = await knowledgePointApi.getKnowledgePoints(subject, isSystemModule);
      console.log('API响应:', response);
      
      // 处理API响应数据结构
      let data = [];
      if (response && response.data) {
        // 如果response.data是对象，尝试获取data字段
        if (typeof response.data === 'object' && response.data.data) {
          data = Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response.data)) {
          data = response.data;
        }
      }
      
      console.log('知识点数据:', data);
      console.log('知识点类型统计:', {
        total: data.length,
        system: data.filter((kp: any) => kp.isSystem).length,
        personal: data.filter((kp: any) => !kp.isSystem).length
      });
      setKnowledgePoints(data);
    } catch (error) {
      console.error('加载知识点失败:', error);
      message.error('加载知识点失败');
    } finally {
      setKnowledgePointLoading(false);
    }
  };

  // 处理路由参数
  useEffect(() => {
    if (location.state && location.state.selectedSubject) {
      setSelectedSubject(location.state.selectedSubject);
      loadKnowledgePoints(location.state.selectedSubject);
    } else {
      loadKnowledgePoints();
    }
  }, [location.state]);

  // 初始化数据 - 当模块类型变化时重新加载
  useEffect(() => {
    loadSubjects();
    loadKnowledgePoints();
  }, [isSystemModule]); // 添加isSystemModule作为依赖，当路径变化时重新加载


  // 学科管理相关函数
  const handleAddSubject = () => {
    setEditingSubject(null);
    subjectForm.resetFields();
    setSubjectModalVisible(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    subjectForm.setFieldsValue(subject);
    setSubjectModalVisible(true);
  };

  const handleDeleteSubject = async (id: number) => {
    try {
      const response = await subjectApi.deleteSubject(id);
      if (response.data && response.data.code === 200) {
        message.success('删除成功');
        loadSubjects();
      } else {
        message.error(response.data?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除学科失败:', error);
      // 统一后端错误提示
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || '删除失败';
      message.error(errMsg);
    }
  };

  const handleSubjectModalOk = async () => {
    try {
      const values = await subjectForm.validateFields();
      const response = editingSubject 
        ? await subjectApi.updateSubject({ ...editingSubject, ...values })
        : await subjectApi.createSubject(values);
      
      if (response.data && response.data.code === 200) {
        message.success(editingSubject ? '更新成功' : '创建成功');
        setSubjectModalVisible(false);
        loadSubjects();
        // 刷新知识点数据以更新学科选项
        loadKnowledgePoints();
      } else {
        // 显示后端返回的具体错误信息
        message.error(response.data?.message || '操作失败');
      }
    } catch (error: any) {
      console.error('保存学科失败:', error);
      // 显示后端返回的错误信息
      const errorMessage = error?.response?.data?.message || error?.message || '保存失败';
      message.error(errorMessage);
    }
  };

  const handleSubjectModalCancel = () => {
    setSubjectModalVisible(false);
    subjectForm.resetFields();
  };

  // 知识点管理相关函数
  const handleSearch = (values: SearchFilterValue) => {
    setSearchFilterValue(values);
    setCurrentPage(1); // 重置到第一页
  };

  const handleResetSearch = () => {
    setSearchFilterValue({});
    setCurrentPage(1); // 重置到第一页
  };

  // 注意：此函数可能不再使用，知识点管理使用SearchFilter组件处理筛选
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    loadKnowledgePoints(subject || undefined);
  };

  const handleAddKnowledgePoint = () => {
    setEditingKnowledgePoint(null);
    form.resetFields();
    // 如果选择了学科，设置默认学科
    if (selectedSubject) {
      form.setFieldsValue({ subject: selectedSubject });
    }
    setKnowledgePointModalVisible(true);
  };

  const handleEditKnowledgePoint = (point: KnowledgePoint) => {
    setEditingKnowledgePoint(point);
    form.setFieldsValue(point);
    setKnowledgePointModalVisible(true);
  };

  const handleDeleteKnowledgePoint = async (id: number) => {
    try {
      const response = await knowledgePointApi.deleteKnowledgePoint(id);
      if (response.data && response.data.code === 200) {
        message.success('删除成功');
        loadKnowledgePoints(selectedSubject || undefined);
      } else {
        message.error(response.data?.message || '删除失败');
      }
    } catch (error) {
      console.error('删除知识点失败:', error);
      // 统一后端错误提示
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || '删除失败';
      message.error(errMsg);
    }
  };

  const handleKnowledgePointModalOk = async () => {
    try {
      const values = await form.validateFields();
      const response = editingKnowledgePoint 
        ? await knowledgePointApi.updateKnowledgePoint(editingKnowledgePoint.id, values)
        : await knowledgePointApi.createKnowledgePoint(values);
      
      if (response.data && response.data.code === 200) {
        message.success(editingKnowledgePoint ? '更新成功' : '创建成功');
        setKnowledgePointModalVisible(false);
        loadKnowledgePoints(selectedSubject || undefined);
      } else {
        // 显示后端返回的具体错误信息
        message.error(response.data?.message || '操作失败');
      }
    } catch (error: any) {
      console.error('保存知识点失败:', error);
      // 显示后端返回的错误信息
      const errorMessage = error?.response?.data?.message || error?.message || '保存失败';
      message.error(errorMessage);
    }
  };

  const handleKnowledgePointModalCancel = () => {
    setKnowledgePointModalVisible(false);
    form.resetFields();
  };

  // 刷新学科映射
  const handleRefreshMapping = async () => {
    try {
      const response = await subjectApi.refreshMapping();
      if (response.data && response.data.code === 200) {
        message.success('学科映射刷新成功');
      } else {
        message.error(response.data?.message || '刷新失败');
      }
    } catch (error) {
      console.error('刷新学科映射失败:', error);
      message.error('刷新失败');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            <BookOutlined style={{ marginRight: '8px' }} />
            {isSystemModule ? '系统学科/知识点管理' : '我的学科/知识点管理'}
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefreshMapping}
            title="刷新学科映射缓存"
          >
            刷新映射
          </Button>
        </div>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'subjects',
              label: <span><BookOutlined />学科管理</span>,
              children: (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <Row gutter={16} style={{ flex: 1, marginRight: 16 }}>
                        <Col span={8}>
                          <Input
                            placeholder="搜索学科名称、代码或描述"
                            prefix={<SearchOutlined />}
                            value={subjectSearchText}
                            onChange={(e) => setSubjectSearchText(e.target.value)}
                            allowClear
                            onPressEnter={() => {}}
                          />
                        </Col>
                        <Col span={6}>
                          <Select
                            placeholder="选择状态"
                            value={subjectStatusFilter}
                            onChange={setSubjectStatusFilter}
                            style={{ width: '100%' }}
                            allowClear
                          >
                            <Option value="active">启用</Option>
                            <Option value="inactive">禁用</Option>
                          </Select>
                        </Col>
                        <Col span={4}>
                          <Button
                            onClick={() => {
                              setSubjectSearchText('');
                              setSubjectStatusFilter(undefined);
                            }}
                          >
                            重置
                          </Button>
                        </Col>
                      </Row>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddSubject}
                      >
                        添加学科
                      </Button>
                    </div>
                  </div>

                  <Table
                    columns={subjectColumns}
                    dataSource={filteredSubjects}
                    rowKey="id"
                    loading={subjectLoading}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                      current: currentPage,
                      pageSize: pageSize,
                      total: filteredSubjects.length,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                      onChange: (page, size) => {
                        setCurrentPage(page);
                        if (size !== pageSize) {
                          setPageSize(size);
                          setCurrentPage(1);
                        }
                      },
                      onShowSizeChange: (_current, size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                      },
                    }}
                  />
                </>
              ),
            },
            {
              key: 'knowledge-points',
              label: <span><NodeIndexOutlined />知识点管理</span>,
              children: (
                <>
                  <Row gutter={16} align="top" wrap={false} style={{ marginBottom: '16px' }}>
                    <Col flex="1" style={{ minWidth: 0 }}>
                      <SearchFilter
                        config={searchFilterConfig}
                        value={searchFilterValue}
                        onSearch={handleSearch}
                        onReset={handleResetSearch}
                      />
                    </Col>
                    <Col flex="none" style={{ paddingTop: '8px' }}>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddKnowledgePoint}
                      >
                        添加知识点
                      </Button>
                    </Col>
                  </Row>

                  <Table
                    columns={knowledgePointColumns}
                    dataSource={filteredKnowledgePoints}
                    rowKey="id"
                    loading={knowledgePointLoading}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                      current: currentPage,
                      pageSize: pageSize,
                      total: filteredKnowledgePoints.length,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                      onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                      },
                      onShowSizeChange: (_current, size) => {
                        setCurrentPage(1);
                        setPageSize(size);
                      },
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* 学科编辑模态框 */}
      <Modal
        title={editingSubject ? '编辑学科' : '添加学科'}
        open={subjectModalVisible}
        onOk={handleSubjectModalOk}
        onCancel={handleSubjectModalCancel}
        width={600}
      >
        <Form
          form={subjectForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="学科名称"
            rules={[{ required: true, message: '请输入学科名称' }]}
          >
            <Input placeholder="请输入学科名称" />
          </Form.Item>

          <Form.Item
            name="code"
            label="学科代码"
            rules={[{ required: true, message: '请输入学科代码' }]}
          >
            <Input placeholder="请输入学科代码" />
          </Form.Item>

          <Form.Item
            name="description"
            label="学科描述"
          >
            <Input.TextArea 
              placeholder="请输入学科描述" 
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label="排序"
            rules={[{ required: true, message: '请输入排序' }]}
          >
            <InputNumber 
              placeholder="请输入排序" 
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="是否启用"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 知识点编辑模态框 */}
      <Modal
        title={editingKnowledgePoint ? '编辑知识点' : '添加知识点'}
        open={knowledgePointModalVisible}
        onOk={handleKnowledgePointModalOk}
        onCancel={handleKnowledgePointModalCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="知识点名称"
            rules={[{ required: true, message: '请输入知识点名称' }]}
          >
            <Input placeholder="请输入知识点名称" />
          </Form.Item>

          <Form.Item
            name="subject"
            label="所属学科"
            rules={[{ required: true, message: '请选择所属学科' }]}
          >
            <Select placeholder="请选择所属学科">
              {subjects.map(subject => (
                <Option key={subject.id} value={subject.name}>
                  {subject.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="知识点描述"
          >
            <Input.TextArea 
              placeholder="请输入知识点描述" 
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="weight"
            label="权重"
          >
            <InputNumber 
              placeholder="请输入权重（0-100）" 
              min={0}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="difficultyLevel"
            label="难度等级"
          >
            <Select placeholder="请选择难度等级">
              <Option value="EASY">简单</Option>
              <Option value="MEDIUM">中等</Option>
              <Option value="HARD">困难</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label="排序"
            rules={[{ required: true, message: '请输入排序' }]}
          >
            <InputNumber 
              placeholder="请输入排序" 
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue="ACTIVE"
          >
            <Select>
              <Option value="ACTIVE">启用</Option>
              <Option value="INACTIVE">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectKnowledgePointManagement;
