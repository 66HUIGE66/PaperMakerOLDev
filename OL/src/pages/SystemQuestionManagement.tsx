import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  message, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Card,
  Tag,
  Popconfirm,
  Typography
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, UploadOutlined } from '@ant-design/icons';
import { questionService, Question } from '../services/questionService';
import { useAuth } from '../contexts/AuthContext';
import QuestionOptions from '../components/QuestionOptions';
import AnswerInput from '../components/AnswerInput';
import SearchFilter, { SearchFilterConfig, SearchFilterValue } from '../components/SearchFilter';
import DocumentImport from '../components/DocumentImport';
import { subjectApi, knowledgePointApi } from '../services/api';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SystemQuestionManagement: React.FC = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [form] = Form.useForm();
  const [questionType, setQuestionType] = useState<string>('SINGLE_CHOICE');
  const [questionOptions, setQuestionOptions] = useState<string[]>(['', '']);
  const [searchFilterValue, setSearchFilterValue] = useState<SearchFilterValue>({});
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [subjects, setSubjects] = useState<Array<{ label: string; value: number }>>([]);
  const [knowledgePointOptions, setKnowledgePointOptions] = useState<Array<{ label: string; value: number }>>([]);

  // 检查是否为管理员
  const isAdmin = user?.role === 'ADMIN';

  // 加载学科列表
  const loadSubjects = async () => {
    try {
      const response = await subjectApi.getAllActiveSubjects(false, true);
      const subjectsData: any[] = response.data?.data || response.data || [];
      const subjectOptions = subjectsData.map((s: any) => ({
        label: s.name,
        value: s.id
      }));
      setSubjects(subjectOptions);
    } catch (error: any) {
      console.error('加载学科列表失败:', error);
      message.error('加载学科列表失败');
    }
  };

  // 搜索筛选配置（动态生成学科选项）
  const searchFilterConfig: SearchFilterConfig = {
    searchPlaceholder: '搜索题目内容...',
    searchFields: ['title', 'explanation'],
    filters: [
      {
        key: 'type',
        label: '题目类型',
        type: 'select',
        options: [
          { label: '单选题', value: 'SINGLE_CHOICE' },
          { label: '多选题', value: 'MULTIPLE_CHOICE' },
          { label: '判断题', value: 'TRUE_FALSE' },
          { label: '填空题', value: 'FILL_BLANK' },
          { label: '简答题', value: 'SHORT_ANSWER' }
        ]
      },
      {
        key: 'difficulty',
        label: '难度',
        type: 'select',
        options: [
          { label: '简单', value: 'EASY' },
          { label: '中等', value: 'MEDIUM' },
          { label: '困难', value: 'HARD' }
        ]
      },
      {
        key: 'subjectId',
        label: '学科',
        type: 'select',
        options: subjects
      },
      {
        key: 'createdDate',
        label: '创建时间',
        type: 'daterange'
      }
    ],
    showAdvanced: false
  };

  // 获取系统题目列表
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // 获取所有题目（设置一个较大的size）
      const response = await questionService.getSystemQuestions(1, 1000);
      console.log('获取到的题目数据:', {
        total: response.total,
        size: response.size,
        current: response.current,
        records: response.records.length
      });
      setQuestions(response.records);
      setFilteredQuestions(response.records);
    } catch (error: any) {
      console.error('获取题目失败:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 搜索和筛选处理
  const handleSearch = (searchValue: SearchFilterValue) => {
    let filtered = [...questions];

    // 文本搜索
    if (searchValue.search) {
      const searchText = searchValue.search.toLowerCase();
      filtered = filtered.filter(question =>
        question.title.toLowerCase().includes(searchText) ||
        (question.explanation && question.explanation.toLowerCase().includes(searchText))
      );
    }

    // 基础筛选
    if (searchValue.filters) {
      Object.entries(searchValue.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          filtered = filtered.filter(question => {
            if (key === 'type') return question.type === value;
            if (key === 'difficulty') return question.difficulty === value;
            if (key === 'subjectId') {
              // 题目可能返回的是subjectId（数字）或subject字段（名称），需要兼容处理
              const questionSubjectId = (question as any).subjectId;
              return questionSubjectId && String(questionSubjectId) === String(value);
            }
            return true;
          });
        }
      });
    }

    // 处理创建时间筛选
    if (searchValue.filters?.createdDate && Array.isArray(searchValue.filters.createdDate) && searchValue.filters.createdDate.length === 2) {
      const [start, end] = searchValue.filters.createdDate;
      filtered = filtered.filter(question => {
        // 兼容多种日期字段名
        const dateStr = (question as any).createTime || (question as any).createdAt || (question as any).create_time;
        if (!dateStr) return false;
        try {
          const questionDate = new Date(dateStr);
          if (isNaN(questionDate.getTime())) return false;
          return questionDate >= start && questionDate <= end;
        } catch (error) {
          return false;
        }
      });
    }

    setFilteredQuestions(filtered);
  };

  // 重置搜索
  const handleResetSearch = () => {
    setFilteredQuestions(questions);
  };

  // 处理导入成功
  const handleImportSuccess = () => {
    setImportModalVisible(false);
    fetchQuestions();
  };

  useEffect(() => {
    loadSubjects();
    fetchQuestions();
  }, []);

  // 处理创建/编辑题目
  const handleSubmit = async (values: any) => {
    try {
      // 处理选项数据
      let optionsData = null;
      if (questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') {
        const validOptions = questionOptions.filter(opt => opt.trim() !== '');
        if (validOptions.length === 0) {
          message.error('选择题必须提供选项');
          return;
        }
        optionsData = JSON.stringify(validOptions);
      }
      // 对于非选择题（填空题、判断题、简答题），optionsData 保持为 null

      const questionData: any = {
        title: values.title,
        type: values.type,
        difficulty: values.difficulty,
        correctAnswer: values.correctAnswer,
        explanation: values.explanation || '',
        subjectId: values.subjectId,
        knowledgePointIdsList: values.knowledgePointIdsList
      };
      
      // 只有当optionsData不为null时才添加到数据中
      if (optionsData !== null) {
        questionData.options = optionsData;
      }
      
      console.log('发送的题目数据:', questionData);
      
  if (editingQuestion) {
    // 编辑题目
    await questionService.updateQuestion(editingQuestion.id!, questionData);
    try { await subjectApi.refreshMapping(); } catch {}
    message.success('题目更新成功');
  } else {
    // 创建系统题目
    await questionService.createSystemQuestion(questionData);
    try { await subjectApi.refreshMapping(); } catch {}
    message.success('系统题目创建成功');
  }
      setModalVisible(false);
      setEditingQuestion(null);
      form.resetFields();
      setQuestionType('SINGLE_CHOICE');
      setQuestionOptions(['', '']);
      fetchQuestions();
    } catch (error: any) {
      const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || '创建题目失败';
      message.error(errMsg);
    }
  };

  // 处理删除题目
  const handleDelete = async (id: number) => {
    try {
      await questionService.deleteQuestion(id);
      try { await subjectApi.refreshMapping(); } catch {}
      message.success('题目删除成功');
      fetchQuestions();
    } catch (error: any) {
      const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || '删除失败';
      message.error(errMsg);
    }
  };

  // 处理复制题目
  const handleCopy = async (id: number) => {
    try {
      await questionService.copySystemQuestion(id);
      try { await subjectApi.refreshMapping(); } catch {}
      message.success('题目复制到个人题库成功');
    } catch (error: any) {
      const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || '复制失败';
      message.error(errMsg);
    }
  };

  // 打开编辑模态框
  const openEditModal = (question: Question) => {
    console.log('编辑题目数据:', question);
    setEditingQuestion(question);
    setQuestionType(question.type || 'SINGLE_CHOICE');
    
    // 处理选项数据
    const questionOptions = question.optionsList || question.options || ['', ''];
    setQuestionOptions(questionOptions);
    
    // 设置表单值，包括选项和答案
    form.setFieldsValue({
      title: question.title,
      type: question.type,
      difficulty: question.difficulty,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      subjectId: (question as any).subjectId,
      knowledgePointIdsList: (question as any).knowledgePointIdsList || []
    });
    const sid = (question as any).subjectId;
    if (sid) {
      onSubjectChange(sid);
    }
    
    setModalVisible(true);
  };

  // 打开创建模态框
  const openCreateModal = () => {
    setEditingQuestion(null);
    form.resetFields();
    setQuestionType('SINGLE_CHOICE');
    setQuestionOptions(['', '']);
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    setEditingQuestion(null);
    form.resetFields();
    setQuestionType('SINGLE_CHOICE');
    setQuestionOptions(['', '']);
  };

  const onSubjectChange = async (subjectId: number) => {
    form.setFieldsValue({ knowledgePointIdsList: [] });
    const subject = subjects.find(s => s.value === subjectId);
    if (!subject) {
      setKnowledgePointOptions([]);
      return;
    }
    try {
      const res = await knowledgePointApi.getKnowledgePoints(subject.label);
      const list: any[] = res.data?.data || res.data || [];
      const options = list.filter((kp: any) => kp && kp.id && kp.name).map((kp: any) => ({ label: kp.name, value: kp.id }));
      setKnowledgePointOptions(options);
    } catch (e) {
      setKnowledgePointOptions([]);
    }
  };

  const columns = [
    {
      title: '题目标题',
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
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap: { [key: string]: string } = {
          'SINGLE_CHOICE': '单选题',
          'MULTIPLE_CHOICE': '多选题',
          'FILL_BLANK': '填空题',
          'TRUE_FALSE': '判断题',
          'SHORT_ANSWER': '简答题'
        };
        return <Tag color="blue">{typeMap[type] || type}</Tag>;
      },
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: string) => {
        const colorMap: { [key: string]: string } = {
          'EASY': 'green',
          'MEDIUM': 'orange',
          'HARD': 'red'
        };
        const textMap: { [key: string]: string } = {
          'EASY': '简单',
          'MEDIUM': '中等',
          'HARD': '困难'
        };
        return <Tag color={colorMap[difficulty]}>{textMap[difficulty]}</Tag>;
      },
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createdAt',
      width: 150,
      render: (date: string, record: any) => {
        // 兼容多种日期字段名
        const dateStr = date || record.createdAt || record.createTime || record.create_time;
        if (!dateStr) {
          return '-';
        }
        try {
          const dateObj = new Date(dateStr);
          // 检查日期是否有效
          if (isNaN(dateObj.getTime())) {
            return '-';
          }
          return dateObj.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (error) {
          return '-';
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right' as const,
      render: (_: any, record: Question) => (
        <Space size="small" wrap>
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
                title="确定要删除这个题目吗？"
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
            系统题目管理
          </Title>
          {isAdmin && (
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
              >
                创建系统题目
              </Button>
              <Button
                icon={<UploadOutlined />}
                onClick={() => setImportModalVisible(true)}
              >
                导入题目
              </Button>
            </Space>
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
          dataSource={filteredQuestions}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredQuestions.length,
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
            onShowSizeChange: (_, size) => {
              setPageSize(size);
              setCurrentPage(1); // 重置到第一页
            },
          }}
        />
      </Card>

      <Modal
        title={editingQuestion ? '编辑题目' : '创建系统题目'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="题目标题"
            rules={[{ required: true, message: '请输入题目标题' }]}
          >
            <TextArea rows={3} placeholder="请输入题目标题" />
          </Form.Item>

          <Form.Item
            name="type"
            label="题目类型"
            rules={[{ required: true, message: '请选择题目类型' }]}
          >
            <Select 
              placeholder="请选择题目类型"
              value={questionType}
              onChange={(value) => {
                setQuestionType(value);
                form.setFieldsValue({ type: value });
              }}
            >
              <Option value="SINGLE_CHOICE">单选题</Option>
              <Option value="MULTIPLE_CHOICE">多选题</Option>
              <Option value="FILL_BLANK">填空题</Option>
              <Option value="TRUE_FALSE">判断题</Option>
              <Option value="SHORT_ANSWER">简答题</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="difficulty"
            label="难度等级"
            rules={[{ required: true, message: '请选择难度等级' }]}
          >
            <Select placeholder="请选择难度等级">
              <Option value="EASY">简单</Option>
              <Option value="MEDIUM">中等</Option>
              <Option value="HARD">困难</Option>
            </Select>
          </Form.Item>

          {/* 题目选项组件 */}
          <QuestionOptions
            questionType={questionType}
            value={questionOptions}
            onChange={setQuestionOptions}
          />

          {/* 答案输入组件 */}
          <Form.Item
            name="correctAnswer"
            label="正确答案"
            rules={[{ required: true, message: '请输入正确答案' }]}
          >
            <AnswerInput
              questionType={questionType}
              options={questionOptions}
            />
          </Form.Item>

          <Form.Item
            name="explanation"
            label="题目解析"
          >
            <TextArea rows={3} placeholder="请输入题目解析" />
          </Form.Item>

          <Form.Item
            name="subjectId"
            label="学科"
            rules={[{ required: true, message: '请选择学科' }]}>
            <Select placeholder="请选择学科" options={subjects} onChange={onSubjectChange} />
          </Form.Item>

          <Form.Item
            name="knowledgePointIdsList"
            label="知识点"
            rules={[{ required: true, message: '请选择至少一个知识点' }]}>
            <Select placeholder="请选择知识点" mode="multiple" options={knowledgePointOptions} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeModal}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingQuestion ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 文档导入模态框 */}
      <DocumentImport
        visible={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onSuccess={handleImportSuccess}
        isSystem={true}
      />
    </div>
  );
};

export default SystemQuestionManagement;
