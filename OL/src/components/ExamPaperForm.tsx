import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Card,
  Select,
  Table,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  Divider,
  Modal
} from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, CheckOutlined } from '@ant-design/icons';
import { ExamPaper, Question, QuestionType, DifficultyLevel } from '../types';
import { calculateTotalScore } from '../utils';
import { useAppStore } from '../store/index';

const { Option } = Select;
const { TextArea } = Input;

interface ExamPaperFormProps {
  visible: boolean;
  editingPaper?: ExamPaper | null;
  onSave: (paper: Omit<ExamPaper, 'id' | 'createTime' | 'updateTime'>) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ExamPaperForm: React.FC<ExamPaperFormProps> = ({ visible, editingPaper, onSave, onCancel, loading }) => {
  const [form] = Form.useForm();
  const { questions } = useAppStore();
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<QuestionType | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | 'all'>('all');

  useEffect(() => {
    if (editingPaper) {
      form.setFieldsValue(editingPaper);
      setSelectedQuestions(editingPaper.questions);
    } else {
      form.resetFields();
      setSelectedQuestions([]);
    }
  }, [editingPaper, form]);

  // 过滤题目
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = !searchText || 
      question.title.toLowerCase().includes(searchText.toLowerCase()) ||
      question.knowledgePoints.some(kp => kp.toLowerCase().includes(searchText.toLowerCase())) ||
      question.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesType = filterType === 'all' || question.type === filterType;
    const matchesDifficulty = filterDifficulty === 'all' || question.difficulty === filterDifficulty;
    
    return matchesSearch && matchesType && matchesDifficulty;
  });


  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedQuestions.length === 0) {
        message.error('请至少选择一道题目');
        return;
      }

      const paperData: Omit<ExamPaper, 'id' | 'createTime' | 'updateTime'> = {
        title: values.title,
        description: values.description,
        questions: selectedQuestions,
        totalScore: calculateTotalScore(selectedQuestions),
        timeLimit: values.timeLimit,
      };

      onSave(paperData);
    } catch (error) {
      message.error('请检查表单填写是否完整');
    }
  };

  const handleAddQuestion = (question: Question) => {
    if (selectedQuestions.some(q => q.id === question.id)) {
      message.warning('该题目已添加');
      return;
    }
    setSelectedQuestions([...selectedQuestions, question]);
  };

  const handleRemoveQuestion = (questionId: string) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
  };

  const questionColumns = [
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      width: '40%',
      render: (text: string, record: Question) => (
        <div>
          <div style={{ marginBottom: 4, fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {record.knowledgePoints.slice(0, 2).map(kp => (
              <Tag key={kp} style={{ marginRight: 4 }}>
                {kp}
              </Tag>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: QuestionType) => {
        const typeMap = {
          [QuestionType.SINGLE_CHOICE]: { text: '单选', color: 'blue' },
          [QuestionType.MULTIPLE_CHOICE]: { text: '多选', color: 'green' },
          [QuestionType.FILL_BLANK]: { text: '填空', color: 'orange' },
          [QuestionType.TRUE_FALSE]: { text: '判断', color: 'purple' },
          [QuestionType.SHORT_ANSWER]: { text: '简答', color: 'cyan' },
        };
        const config = typeMap[type];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 60,
      render: (difficulty: DifficultyLevel) => {
        const difficultyMap = {
          [DifficultyLevel.EASY]: { text: '简', color: 'green' },
          [DifficultyLevel.MEDIUM]: { text: '中', color: 'blue' },
          [DifficultyLevel.HARD]: { text: '难', color: 'orange' },
          [DifficultyLevel.EXPERT]: { text: '专', color: 'red' },
        };
        const config = difficultyMap[difficulty];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: Question) => {
        const isSelected = selectedQuestions.some(q => q.id === record.id);
        return (
          <Button
            type={isSelected ? "default" : "link"}
            icon={isSelected ? <CheckOutlined /> : <PlusOutlined />}
            onClick={() => isSelected ? message.info('该题目已添加') : handleAddQuestion(record)}
            size="small"
            disabled={isSelected}
          >
            {isSelected ? '已添加' : '添加'}
          </Button>
        );
      },
    },
  ];

  const selectedColumns = [
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      width: '50%',
      render: (text: string, record: Question) => (
        <div>
          <div style={{ marginBottom: 4, fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {record.knowledgePoints.slice(0, 2).map(kp => (
              <Tag key={kp} style={{ marginRight: 4 }}>
                {kp}
              </Tag>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: QuestionType) => {
        const typeMap = {
          [QuestionType.SINGLE_CHOICE]: { text: '单选', color: 'blue' },
          [QuestionType.MULTIPLE_CHOICE]: { text: '多选', color: 'green' },
          [QuestionType.FILL_BLANK]: { text: '填空', color: 'orange' },
          [QuestionType.TRUE_FALSE]: { text: '判断', color: 'purple' },
          [QuestionType.SHORT_ANSWER]: { text: '简答', color: 'cyan' },
        };
        const config = typeMap[type];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 60,
      render: (difficulty: DifficultyLevel) => {
        const difficultyMap = {
          [DifficultyLevel.EASY]: { text: '简', color: 'green' },
          [DifficultyLevel.MEDIUM]: { text: '中', color: 'blue' },
          [DifficultyLevel.HARD]: { text: '难', color: 'orange' },
          [DifficultyLevel.EXPERT]: { text: '专', color: 'red' },
        };
        const config = difficultyMap[difficulty];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: Question) => (
        <Popconfirm
          title="确定要移除这道题目吗？"
          onConfirm={() => handleRemoveQuestion(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
          >
            移除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title={editingPaper ? '编辑试卷' : '新建试卷'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          timeLimit: 60,
        }}
      >
        <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="试卷名称"
                rules={[{ required: true, message: '请输入试卷名称' }]}
              >
                <Input placeholder="请输入试卷名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timeLimit"
                label="时间限制（分钟）"
                rules={[{ required: true, message: '请输入时间限制' }]}
              >
                <InputNumber
                  min={1}
                  max={300}
                  style={{ width: '100%' }}
                  placeholder="请输入时间限制"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="试卷描述"
          >
            <TextArea
              rows={3}
              placeholder="请输入试卷描述..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Card>

        <Card title="题目选择" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Input
                placeholder="搜索题目、知识点、标签"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col span={8}>
              <Select
                placeholder="选择题型"
                value={filterType}
                onChange={setFilterType}
                style={{ width: '100%' }}
              >
                <Option value="all">全部题型</Option>
                <Option value={QuestionType.SINGLE_CHOICE}>单选题</Option>
                <Option value={QuestionType.MULTIPLE_CHOICE}>多选题</Option>
                <Option value={QuestionType.FILL_BLANK}>填空题</Option>
                <Option value={QuestionType.TRUE_FALSE}>判断题</Option>
                <Option value={QuestionType.SHORT_ANSWER}>简答题</Option>
              </Select>
            </Col>
            <Col span={8}>
              <Select
                placeholder="选择难度"
                value={filterDifficulty}
                onChange={setFilterDifficulty}
                style={{ width: '100%' }}
              >
                <Option value="all">全部难度</Option>
                <Option value={DifficultyLevel.EASY}>简单</Option>
                <Option value={DifficultyLevel.MEDIUM}>中等</Option>
                <Option value={DifficultyLevel.HARD}>困难</Option>
                <Option value={DifficultyLevel.EXPERT}>专家</Option>
              </Select>
            </Col>
          </Row>

          <Table
            columns={questionColumns}
            dataSource={filteredQuestions}
            rowKey="id"
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
              showQuickJumper: true,
            }}
            scroll={{ y: 200 }}
            size="small"
          />
        </Card>

        <Card title="已选题目" size="small" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span>已选择 {selectedQuestions.length} 道题目</span>
              <span>总分: {calculateTotalScore(selectedQuestions)} 分</span>
            </Space>
          </div>

          <Table
            columns={selectedColumns}
            dataSource={selectedQuestions}
            rowKey="id"
            pagination={false}
            scroll={{ y: 200 }}
            size="small"
          />
        </Card>

        <Divider />

        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>
              取消
            </Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              {editingPaper ? '更新' : '保存'}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default ExamPaperForm;
