import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  message, 
  Modal, 
  Form, 
  Input, 
  InputNumber,
  Card,
  Tag,
  Popconfirm,
  Typography
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, EyeOutlined } from '@ant-design/icons';
import { examPaperService, ExamPaper } from '../services/examPaperService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SearchFilter, { SearchFilterConfig, SearchFilterValue } from '../components/SearchFilter';

const { Title } = Typography;
const { TextArea } = Input;

const SystemPaperManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPaper, setEditingPaper] = useState<ExamPaper | null>(null);
  const [form] = Form.useForm();
  const [searchFilterValue, setSearchFilterValue] = useState<SearchFilterValue>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 检查是否为管理员
  const isAdmin = user?.role === 'ADMIN';

  // 搜索筛选配置
  const searchFilterConfig: SearchFilterConfig = {
    searchPlaceholder: '搜索试卷标题或描述...',
    searchFields: ['title', 'description'],
    filters: [
      {
        key: 'subject',
        label: '学科',
        type: 'select',
        options: [
          { label: 'Java编程', value: 'Java编程' },
          { label: 'Python编程', value: 'Python编程' },
          { label: 'Web开发', value: 'Web开发' },
          { label: '数据库', value: '数据库' },
          { label: '算法', value: '算法' },
          { label: '编程基础', value: '编程基础' },
          { label: 'JavaScript', value: 'JavaScript' },
          { label: 'Linux系统', value: 'Linux系统' }
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
        key: 'durationRange',
        label: '考试时长(分钟)',
        type: 'numberrange'
      },
      {
        key: 'totalScoreRange',
        label: '总分范围',
        type: 'numberrange'
      }
    ]
  };

  // 获取系统试卷列表
  const fetchPapers = async () => {
    setLoading(true);
    try {
      const response = await examPaperService.getSystemPapers();
      setPapers(response);
      setFilteredPapers(response);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 搜索和筛选处理
  const handleSearch = (searchValue: SearchFilterValue) => {
    let filtered = [...papers];

    // 文本搜索
    if (searchValue.search) {
      const searchText = searchValue.search.toLowerCase();
      filtered = filtered.filter(paper =>
        paper.title.toLowerCase().includes(searchText) ||
        (paper.description && paper.description.toLowerCase().includes(searchText))
      );
    }

    // 基础筛选
    if (searchValue.filters) {
      Object.entries(searchValue.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          filtered = filtered.filter(paper => {
            if (key === 'subject') return paper.subject === value;
            return true;
          });
        }
      });
    }

    // 高级筛选
    if (searchValue.advancedFilters) {
      Object.entries(searchValue.advancedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          filtered = filtered.filter(paper => {
            if (key === 'createdDate' && Array.isArray(value) && value.length === 2) {
              const [start, end] = value;
              const paperDate = new Date(paper.createdAt || '');
              return paperDate >= start && paperDate <= end;
            }
            if (key === 'durationRange' && Array.isArray(value) && value.length === 2) {
              const [min, max] = value;
              return (paper.duration || 0) >= min && (paper.duration || 0) <= max;
            }
            if (key === 'totalScoreRange' && Array.isArray(value) && value.length === 2) {
              const [min, max] = value;
              return (paper.totalScore || 0) >= min && (paper.totalScore || 0) <= max;
            }
            return true;
          });
        }
      });
    }

    setFilteredPapers(filtered);
  };

  // 重置搜索
  const handleResetSearch = () => {
    setFilteredPapers(papers);
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  // 处理创建/编辑试卷
  const handleSubmit = async (values: any) => {
    try {
      if (editingPaper) {
        // 编辑试卷
        await examPaperService.updatePaper({ ...editingPaper, ...values });
        message.success('试卷更新成功');
      } else {
        // 创建系统试卷
        await examPaperService.createSystemPaper(values);
        message.success('系统试卷创建成功');
      }
      setModalVisible(false);
      setEditingPaper(null);
      form.resetFields();
      fetchPapers();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  // 处理删除试卷
  const handleDelete = async (id: number) => {
    try {
      await examPaperService.deletePaper(id);
      message.success('试卷删除成功');
      fetchPapers();
    } catch (error: any) {
      message.error(error.message);
    }
  };

  // 处理复制试卷
  const handleCopy = async (id: number) => {
    try {
      await examPaperService.copySystemPaper(id);
      message.success('试卷复制到个人题库成功');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  // 打开编辑模态框
  const openEditModal = (paper: ExamPaper) => {
    setEditingPaper(paper);
    form.setFieldsValue(paper);
    setModalVisible(true);
  };

  // 打开创建模态框
  const openCreateModal = () => {
    setEditingPaper(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    setEditingPaper(null);
    form.resetFields();
  };

  const columns = [
    {
      title: '试卷标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => (
        <div style={{ maxWidth: 300 }}>
          {text}
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <div style={{ maxWidth: 200 }}>
          {text || '-'}
        </div>
      ),
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 80,
      render: (score: number) => <Tag color="blue">{score}分</Tag>,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => `${duration}分钟`,
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: ExamPaper) => (
        <Space size="small" wrap>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/paper-detail/${record.id}`)}
            size="small"
            style={{ padding: '4px 8px' }}
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record.id!)}
            size="small"
            style={{ padding: '4px 8px' }}
          >
            复制
          </Button>
          {isAdmin && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
                size="small"
                style={{ padding: '4px 8px' }}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这个试卷吗？"
                onConfirm={() => handleDelete(record.id!)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  style={{ padding: '4px 8px' }}
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            系统试卷管理
          </Title>
          {isAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              创建系统试卷
            </Button>
          )}
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
          dataSource={filteredPapers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredPapers.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) {
                setPageSize(size);
                setCurrentPage(1); // 重置到第一页
              }
            },
            onShowSizeChange: (current, size) => {
              setPageSize(size);
              setCurrentPage(1); // 重置到第一页
            },
          }}
        />
      </Card>

      <Modal
        title={editingPaper ? '编辑试卷' : '创建系统试卷'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="试卷标题"
            rules={[{ required: true, message: '请输入试卷标题' }]}
          >
            <Input placeholder="请输入试卷标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="试卷描述"
          >
            <TextArea rows={3} placeholder="请输入试卷描述" />
          </Form.Item>

          <Form.Item
            name="totalScore"
            label="总分"
            rules={[{ required: true, message: '请输入总分' }]}
          >
            <InputNumber
              min={1}
              max={1000}
              placeholder="请输入总分"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="duration"
            label="考试时长（分钟）"
            rules={[{ required: true, message: '请输入考试时长' }]}
          >
            <InputNumber
              min={1}
              max={600}
              placeholder="请输入考试时长"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="subject"
            label="学科"
          >
            <Input placeholder="请输入学科" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeModal}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPaper ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemPaperManagement;
