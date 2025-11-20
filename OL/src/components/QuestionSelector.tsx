import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  message,
  Input,
  Select,
  Card,
  Tag,
  Typography,
  Row,
  Col,
  InputNumber,
  Empty,
  Spin
} from 'antd';
import { SearchOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { questionService, Question } from '../services/questionService';

const { Title, Text } = Typography;
const { Option } = Select;

interface QuestionSelectorProps {
  onSelect: (questionId: number, score: number) => void;
  onCancel: () => void;
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({ onSelect, onCancel }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [scores, setScores] = useState<{ [key: number]: number }>({});
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');

  // 获取题目列表
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // 使用专门的方法获取所有题目
      const allQuestions = await questionService.getAllQuestionsForSelector();
      
      // 确保数据是数组格式
      const questionsArray = Array.isArray(allQuestions) ? allQuestions : [];
      setQuestions(questionsArray);
    } catch (error: any) {
      console.log('获取题目列表失败，使用空数组:', error.message);
      // 如果API调用失败，使用空数组
      setQuestions([]);
      message.warning('获取题目列表失败，请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // 过滤题目
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = !typeFilter || question.type === typeFilter;
    const matchesDifficulty = !difficultyFilter || question.difficulty === difficultyFilter;
    const matchesSubject = !subjectFilter || question.subject === subjectFilter;
    
    return matchesSearch && matchesType && matchesDifficulty && matchesSubject;
  });


  // 处理分数变化
  const handleScoreChange = (questionId: number, score: number) => {
    setScores(prev => ({ ...prev, [questionId]: score }));
  };

  // 批量添加题目
  const handleBatchAdd = () => {
    if (selectedQuestions.size === 0) {
      message.warning('请选择要添加的题目');
      return;
    }

    selectedQuestions.forEach(questionId => {
      const score = scores[questionId] || 10;
      onSelect(questionId, score);
    });
  };

  // 题目列表列定义
  const columns = [
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Question) => (
        <div>
          <Text strong style={{ fontSize: '14px' }}>{text}</Text>
          <br />
          <Space size="small" style={{ marginTop: 4 }}>
            <Tag 
              color={
                record.type === 'SINGLE_CHOICE' ? 'blue' :
                record.type === 'MULTIPLE_CHOICE' ? 'green' :
                record.type === 'TRUE_FALSE' ? 'orange' :
                record.type === 'FILL_BLANK' ? 'purple' : 'red'
              }
              size="small"
            >
              {record.type === 'SINGLE_CHOICE' ? '单选题' :
               record.type === 'MULTIPLE_CHOICE' ? '多选题' :
               record.type === 'TRUE_FALSE' ? '判断题' :
               record.type === 'FILL_BLANK' ? '填空题' : '简答题'}
            </Tag>
            <Tag 
              color={
                record.difficulty === 'EASY' ? 'green' :
                record.difficulty === 'MEDIUM' ? 'orange' : 'red'
              }
              size="small"
            >
              {record.difficulty === 'EASY' ? '简单' :
               record.difficulty === 'MEDIUM' ? '中等' : '困难'}
            </Tag>
            <Tag color="default" size="small">
              {record.subject}
            </Tag>
          </Space>
        </div>
      ),
    },
    {
      title: '分数',
      key: 'score',
      width: 120,
      render: (_: any, record: Question) => (
        <InputNumber
          min={1}
          max={100}
          value={scores[record.id!] || 10}
          onChange={(value) => handleScoreChange(record.id!, value || 10)}
          disabled={!selectedQuestions.has(record.id!)}
          style={{ width: 80 }}
          size="small"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: Question) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => {
            message.info('查看题目详情功能待实现');
          }}
        />
      ),
    },
  ];

  return (
    <div>
      {/* 筛选条件 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="搜索题目..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="题目类型"
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="SINGLE_CHOICE">单选题</Option>
              <Option value="MULTIPLE_CHOICE">多选题</Option>
              <Option value="TRUE_FALSE">判断题</Option>
              <Option value="FILL_BLANK">填空题</Option>
              <Option value="SHORT_ANSWER">简答题</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="难度"
              value={difficultyFilter}
              onChange={setDifficultyFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="EASY">简单</Option>
              <Option value="MEDIUM">中等</Option>
              <Option value="HARD">困难</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="学科"
              value={subjectFilter}
              onChange={setSubjectFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="Java编程">Java编程</Option>
              <Option value="Python编程">Python编程</Option>
              <Option value="Web开发">Web开发</Option>
              <Option value="数据库">数据库</Option>
              <Option value="算法">算法</Option>
              <Option value="编程基础">编程基础</Option>
              <Option value="JavaScript">JavaScript</Option>
              <Option value="Linux系统">Linux系统</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Space>
              <Button onClick={() => {
                setSearchText('');
                setTypeFilter('');
                setDifficultyFilter('');
                setSubjectFilter('');
              }}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 题目列表 */}
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>
            可选题目 ({filteredQuestions.length})
          </Title>
          <Space>
            <Text type="secondary">
              已选择 {selectedQuestions.size} 道题目
            </Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleBatchAdd}
              disabled={selectedQuestions.size === 0}
            >
              添加选中题目
            </Button>
          </Space>
        </div>

        {filteredQuestions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="没有找到符合条件的题目"
            style={{ padding: '40px 0' }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredQuestions}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 道题目`,
            }}
            size="small"
            rowSelection={{
              selectedRowKeys: Array.from(selectedQuestions),
              onChange: (selectedRowKeys) => {
                const newSelected = new Set(selectedRowKeys as number[]);
                setSelectedQuestions(newSelected);
                
                // 更新分数
                const newScores: { [key: number]: number } = {};
                selectedRowKeys.forEach(id => {
                  newScores[id as number] = scores[id as number] || 10;
                });
                setScores(newScores);
              },
            }}
          />
        )}
      </Card>

      {/* 底部操作按钮 */}
      <div style={{ textAlign: 'right', marginTop: 16 }}>
        <Space>
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleBatchAdd}
            disabled={selectedQuestions.size === 0}
          >
            添加选中题目 ({selectedQuestions.size})
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default QuestionSelector;

