import React, { useState, useEffect, useRef } from 'react';
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
  Tree,
  Typography,
  Select,
  Tag
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  FileOutlined
} from '@ant-design/icons';
import { knowledgePointApi, subjectApi } from '../services/api';
import { KnowledgePoint } from '../types';
import SearchFilter, { SearchFilterConfig, SearchFilterValue } from '../components/SearchFilter';
import { learningAnalyticsService } from '../services/learningAnalyticsService';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

const { Title } = Typography;

const KnowledgePointManagement: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const [form] = Form.useForm();
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPoint, setEditingPoint] = useState<KnowledgePoint | null>(null);
  const [filteredPoints, setFilteredPoints] = useState<KnowledgePoint[]>([]);
  const [searchFilterValue, setSearchFilterValue] = useState<SearchFilterValue>({});
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 学科选项 - 从后端动态获取
  const [subjects, setSubjects] = useState([
    { value: '', label: '全部学科' }
  ]);

  // 加载学科列表
  const loadSubjects = async () => {
    try {
      console.log('加载学科列表');
      // 从数据库动态获取学科列表
      const subjectOptions = await learningAnalyticsService.getSubjects();
      
      // 添加"全部学科"选项
      const subjects = [
        { value: '', label: '全部学科' },
        ...subjectOptions
      ];
      
      setSubjects(subjects);
    } catch (error) {
      console.error('加载学科列表失败:', error);
      // 如果获取失败，使用空列表
      setSubjects([{ value: '', label: '全部学科' }]);
    }
  };

  // 搜索筛选配置
  const searchFilterConfig: SearchFilterConfig = {
    searchPlaceholder: '搜索知识点名称或描述...',
    searchFields: ['name', 'description'],
    filters: [
      {
        key: 'level',
        label: '层级',
        type: 'select',
        options: [
          { label: '一级', value: 1 },
          { label: '二级', value: 2 },
          { label: '三级', value: 3 },
          { label: '四级', value: 4 }
        ]
      },
      {
        key: 'status',
        label: '状态',
        type: 'select',
        options: [
          { label: '启用', value: 'ACTIVE' },
          { label: '禁用', value: 'INACTIVE' }
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
        key: 'levelRange',
        label: '层级范围',
        type: 'numberrange'
      }
    ]
  };

  useEffect(() => {
    loadSubjects();
    loadKnowledgePoints();
  }, []);

  const debounceRef = useRef<any>(null);
  const handleSearch = (searchValue: SearchFilterValue) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      let filtered = [...knowledgePoints];

    // 文本搜索
    if (searchValue.search) {
      const searchText = searchValue.search.toLowerCase();
      filtered = filtered.filter(point =>
        point.name.toLowerCase().includes(searchText) ||
        (point.description && point.description.toLowerCase().includes(searchText))
      );
    }

    // 基础筛选
    if (searchValue.filters) {
      Object.entries(searchValue.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          filtered = filtered.filter(point => {
            if (key === 'level') return point.level === value;
            if (key === 'status') return point.status === value;
            return true;
          });
        }
      });
    }

    // 高级筛选
    if (searchValue.advancedFilters) {
      Object.entries(searchValue.advancedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          filtered = filtered.filter(point => {
            if (key === 'createdDate' && Array.isArray(value) && value.length === 2) {
              const [start, end] = value;
              const pointDate = new Date(point.createdAt || '');
              return pointDate >= start && pointDate <= end;
            }
            if (key === 'levelRange' && Array.isArray(value) && value.length === 2) {
              const [min, max] = value;
              return point.level >= min && point.level <= max;
            }
            return true;
          });
        }
      });
    }

      setFilteredPoints(filtered);
      setCurrentPage(1);
    }, 300);
  };

  // 重置搜索
  const handleResetSearch = () => {
    setFilteredPoints(knowledgePoints);
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

  // 初始化筛选数据和分页数据
  React.useEffect(() => {
    setFilteredPoints(knowledgePoints);
  }, [knowledgePoints]);

  // 获取当前页的数据
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredPoints.slice(startIndex, endIndex);
  };

  // 获取分页后的总数据
  const getPagedData = () => {
    return getCurrentPageData();
  };

  const loadKnowledgePoints = async (subject?: string) => {
    try {
      setLoading(true);
      console.log('加载知识点，学科:', subject);
      const response = await knowledgePointApi.getKnowledgePoints(subject);
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
      setKnowledgePoints(data);
    } catch (error) {
      console.error('加载知识点失败:', error);
      message.error('加载知识点失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理学科选择变化
  const handleSubjectChange = (subject: string) => {
    console.log('学科选择变化:', subject);
    setSelectedSubject(subject);
    setCurrentPage(1); // 重置到第一页
    loadKnowledgePoints(subject || undefined);
  };

  const handleAdd = () => {
    setEditingPoint(null);
    form.resetFields();
    // 如果选择了学科，设置默认学科
    if (selectedSubject) {
      form.setFieldsValue({ subject: selectedSubject });
    }
    setModalVisible(true);
  };

  const handleEdit = (point: KnowledgePoint) => {
    setEditingPoint(point);
    form.setFieldsValue(point);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await knowledgePointApi.deleteKnowledgePoint(id);
      try { await subjectApi.refreshMapping(); } catch {}
      message.success('删除成功');
      loadKnowledgePoints();
    } catch (error) {
      console.error('删除失败:', error);
      // 统一后端错误提示
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || '删除失败';
      message.error(errMsg);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 如果是新增且没有设置学科，使用当前选择的学科
      if (!editingPoint && !values.subject && selectedSubject) {
        values.subject = selectedSubject;
      }
      
      if (editingPoint) {
        await knowledgePointApi.updateKnowledgePoint(editingPoint.id, values);
        try { await subjectApi.refreshMapping(); } catch {}
        message.success('更新成功');
      } else {
        await knowledgePointApi.createKnowledgePoint(values);
        try { await subjectApi.refreshMapping(); } catch {}
        message.success('添加成功');
      }
      
      setModalVisible(false);
      loadKnowledgePoints(selectedSubject || undefined);
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingPoint(null);
    form.resetFields();
  };

  // 构建树形数据
  const buildTreeData = (points: KnowledgePoint[]): any[] => {
    const map = new Map<number, any>();
    const roots: any[] = [];

    // 创建节点映射
    points.forEach(point => {
      map.set(point.id, {
        key: point.id,
        title: point.name,
        ...point,
        children: []
      });
    });

    // 构建树形结构
    points.forEach(point => {
      const node = map.get(point.id)!;
      if (point.parentId && map.has(point.parentId)) {
        map.get(point.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const columns = [
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
      render: (text: string, record: KnowledgePoint) => (
        <Space>
          {record.level === 0 ? <FolderOutlined /> : <FileOutlined />}
          {text}
        </Space>
      ),
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 120,
      render: (text: string) => (
        <Tag color="blue">{text || '未设置'}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      width: 80,
      render: (weight: any) => `${weight || 0}%`,
    },
    {
      title: '难度',
      dataIndex: 'difficultyLevel',
      key: 'difficultyLevel',
      width: 80,
      render: (level: string) => {
        const colorMap = {
          'EASY': 'green',
          'MEDIUM': 'orange',
          'HARD': 'red'
        };
        return <Tag color={colorMap[level as keyof typeof colorMap] || 'default'}>{level || '未知'}</Tag>;
      },
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
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
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            >
              编辑
            </Button>
            <Popconfirm
              title="确定要删除这个知识点吗？"
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
        );
      },
    },
  ];

  return (
    <div className="fade-in">
      <Card className="page-card">
        <div className="page-card-header">
          <div className="page-card-title">知识点管理</div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加知识点
          </Button>
        </div>
        <div className="page-card-content">
          {/* 学科选择器 */}
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span>选择学科：</span>
              <Select
                value={selectedSubject}
                onChange={handleSubjectChange}
                style={{ width: 200 }}
                placeholder="选择学科"
              >
                {subjects.map(subject => (
                  <Select.Option key={subject.value} value={subject.value}>
                    {subject.label}
                  </Select.Option>
                ))}
              </Select>
              <Button
                onClick={() => loadKnowledgePoints(selectedSubject || undefined)}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </div>

          {/* 搜索和筛选组件 */}
          <SearchFilter
            config={searchFilterConfig}
            value={searchFilterValue}
            onChange={setSearchFilterValue}
            onSearch={handleSearch}
            onReset={handleResetSearch}
            loading={loading}
          />

          <Table
            columns={columns}
            dataSource={getPagedData()}
            rowKey="id"
            loading={loading}
            scroll={{ x: 'max-content', y: 600 }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: filteredPoints.length,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (page, size) => {
                console.log('分页变化:', { page, size, currentPage, pageSize });
                setCurrentPage(page);
                if (size !== pageSize) {
                  setPageSize(size);
                  setCurrentPage(1); // 重置到第一页
                }
              },
              onShowSizeChange: (current, size) => {
                console.log('页面大小变化:', { current, size });
                setPageSize(size);
                setCurrentPage(1); // 重置到第一页
              },
            }}
          />
        </div>
      </Card>

      <Modal
        title={editingPoint ? '编辑知识点' : '添加知识点'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
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
            name="parentId"
            label="父知识点"
          >
            <InputNumber 
              placeholder="请输入父知识点ID（可选）" 
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="level"
            label="层级"
            rules={[{ required: true, message: '请输入层级' }]}
          >
            <InputNumber 
              placeholder="请输入层级" 
              min={0}
              style={{ width: '100%' }}
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
            name="description"
            label="描述"
          >
            <Input.TextArea 
              placeholder="请输入知识点描述" 
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgePointManagement;




