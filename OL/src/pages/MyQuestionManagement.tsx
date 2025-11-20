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
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { questionService, Question } from '../services/questionService';
import QuestionOptions from '../components/QuestionOptions';
import AnswerInput from '../components/AnswerInput';
import SearchFilter, { SearchFilterConfig, SearchFilterValue } from '../components/SearchFilter';
import DocumentImport from '../components/DocumentImport';
import { subjectApi, knowledgePointApi } from '../services/api';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const MyQuestionManagement: React.FC = () => {
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
  const [total, setTotal] = useState(0); // 后端返回的总数
  const [subjects, setSubjects] = useState<Array<{ label: string; value: number }>>([]);
  const [currentFilters, setCurrentFilters] = useState<SearchFilterValue>({}); // 当前筛选条件
  const [knowledgePointOptions, setKnowledgePointOptions] = useState<Array<{ label: string; value: number }>>([]);

  // 加载学科列表
  const loadSubjects = async () => {
    try {
      const response = await subjectApi.getAllActiveSubjects(false, false);
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

  // 获取个人题目列表（使用后端分页和筛选）
  const fetchQuestions = async (page: number = currentPage, size: number = pageSize, filters?: SearchFilterValue) => {
    setLoading(true);
    try {
      // 构建筛选参数
      const filterParams: any = {};
      
      if (filters) {
        // 关键词搜索
        if (filters.search) {
          filterParams.keyword = filters.search;
        }
        
        // 基础筛选
        if (filters.filters) {
          if (filters.filters.type) {
            filterParams.type = filters.filters.type;
          }
          if (filters.filters.difficulty) {
            filterParams.difficulty = filters.filters.difficulty;
          }
          if (filters.filters.subjectId) {
            filterParams.subjectId = filters.filters.subjectId;
          }
          
          // 创建时间范围筛选
          if (filters.filters.createdDate && Array.isArray(filters.filters.createdDate) && filters.filters.createdDate.length === 2) {
            const [start, end] = filters.filters.createdDate;
            // 处理dayjs对象或Date对象
            if (start && end) {
              const dayjs = require('dayjs');
              const startDate = dayjs.isDayjs(start) ? start : dayjs(start);
              const endDate = dayjs.isDayjs(end) ? end : dayjs(end);
              filterParams.startDate = startDate.format('YYYY-MM-DD');
              filterParams.endDate = endDate.format('YYYY-MM-DD');
            }
          }
        }
      }
      
      const response = await questionService.getMyQuestions(page, size, Object.keys(filterParams).length > 0 ? filterParams : undefined);
      setQuestions(response.records);
      setFilteredQuestions(response.records);
      setTotal(response.total); // 保存后端返回的总数
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 搜索和筛选处理（调用后端接口进行筛选）
  const handleSearch = (searchValue: SearchFilterValue) => {
    // 保存当前筛选条件
    setCurrentFilters(searchValue);
    // 重置到第一页
    setCurrentPage(1);
    // 调用后端接口进行筛选
    fetchQuestions(1, pageSize, searchValue);
  };

  // 重置搜索
  const handleResetSearch = () => {
    // 清空筛选条件
    setCurrentFilters({});
    setCurrentPage(1);
    // 重新加载第一页数据（不带筛选条件）
    fetchQuestions(1, pageSize);
  };

  // 处理导入成功
  const handleImportSuccess = () => {
    setImportModalVisible(false);
    fetchQuestions(currentPage, pageSize, currentFilters);
  };

  useEffect(() => {
    loadSubjects();
    fetchQuestions(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // 创建个人题目
    await questionService.createMyQuestion(questionData);
    try { await subjectApi.refreshMapping(); } catch {}
    message.success('个人题目创建成功');
  }
      setModalVisible(false);
      setEditingQuestion(null);
      form.resetFields();
      setQuestionType('SINGLE_CHOICE');
      setQuestionOptions(['', '']);
      fetchQuestions(currentPage, pageSize, currentFilters);
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
      fetchQuestions(currentPage, pageSize, currentFilters);
    } catch (error: any) {
      const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || '删除失败';
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
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Question) => (
        <Space size="small" wrap>
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
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            我的题目管理
          </Title>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              创建个人题目
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setImportModalVisible(true)}
            >
              导入题目
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
          dataSource={filteredQuestions}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total, // 使用后端返回的总数
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) {
                setPageSize(size);
                setCurrentPage(1); // 重置到第一页
                fetchQuestions(1, size, currentFilters); // 重新加载数据（带筛选条件）
              } else {
                fetchQuestions(page, size, currentFilters); // 重新加载数据（带筛选条件）
              }
            },
            onShowSizeChange: (_, size) => {
              setPageSize(size);
              setCurrentPage(1); // 重置到第一页
              fetchQuestions(1, size, currentFilters); // 重新加载数据（带筛选条件）
            },
          }}
        />
      </Card>

      <Modal
        title={editingQuestion ? '编辑题目' : '创建个人题目'}
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
        isSystem={false}
      />
    </div>
  );
};

export default MyQuestionManagement;
