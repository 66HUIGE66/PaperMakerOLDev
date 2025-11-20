import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Space,
  Typography,
  message,
  List,
  Tag,
  Tooltip,
  Popconfirm,
  Divider,
  Row,
  Col,
  Statistic,
  Progress,
  Input,
  Select
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  SwapOutlined,
  ReloadOutlined,
  SaveOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HolderOutlined
} from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { intelligentPaperApi, questionApi } from '../services/api';
import { ExamPaper, Question } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

// 可拖拽的题目项组件
interface DraggableQuestionItemProps {
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: (questionId: number) => void;
}

const DraggableQuestionItem: React.FC<DraggableQuestionItemProps> = ({
  question,
  index,
  onEdit,
  onDelete
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'green';
      case 'MEDIUM': return 'orange';
      case 'HARD': return 'red';
      default: return 'blue';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SINGLE_CHOICE': return 'blue';
      case 'MULTIPLE_CHOICE': return 'purple';
      case 'FILL_BLANK': return 'green';
      case 'TRUE_FALSE': return 'orange';
      case 'SHORT_ANSWER': return 'red';
      default: return 'default';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return '简单';
      case 'MEDIUM': return '中等';
      case 'HARD': return '困难';
      default: return difficulty;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'SINGLE_CHOICE': return '单选题';
      case 'MULTIPLE_CHOICE': return '多选题';
      case 'FILL_BLANK': return '填空题';
      case 'TRUE_FALSE': return '判断题';
      case 'SHORT_ANSWER': return '简答题';
      default: return type;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ 
        ...style,
        cursor: 'move',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        marginBottom: '8px',
        padding: '12px',
        backgroundColor: '#fafafa',
        transition: 'all 0.3s ease'
      }}
      {...attributes}
      {...listeners}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <HolderOutlined style={{ marginRight: '8px', color: '#999' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <Text strong>题目 {index + 1}</Text>
              <div style={{ marginLeft: 'auto' }}>
                <Tag color={getTypeColor(question.type)}>{getTypeText(question.type)}</Tag>
                <Tag color={getDifficultyColor(question.difficulty)}>{getDifficultyText(question.difficulty)}</Tag>
              </div>
            </div>
            <Text ellipsis={{ tooltip: question.title }}>
              {question.title}
            </Text>
          </div>
        </div>
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => onEdit(question)}
            title="编辑题目"
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => onDelete(question.id)}
            title="删除题目"
          />
        </Space>
      </div>
    </div>
  );
};

interface SimpleVisualEditorProps {
  paper: ExamPaper | null;
  visible: boolean;
  onClose: () => void;
  onSave: (paper: ExamPaper) => void;
}

const SimpleVisualEditor: React.FC<SimpleVisualEditorProps> = ({
  paper,
  visible,
  onClose,
  onSave
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('ALL');

  useEffect(() => {
    if (paper && visible) {
      loadQuestions();
      if (paper.questionIds && paper.questionIds.length > 0) {
        loadPaperQuestions();
      }
    }
  }, [paper, visible]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      // 同时获取系统题目和我的题目
      const [systemResponse, myResponse] = await Promise.all([
        questionApi.getSystemQuestions({ current: 1, size: 50 }),
        questionApi.getMyQuestions({ current: 1, size: 50 })
      ]);
      
      const systemQuestions = systemResponse.data.records || [];
      const myQuestions = myResponse.data.records || [];
      setQuestions([...systemQuestions, ...myQuestions]);
    } catch (error) {
      console.error('加载题目失败:', error);
      message.error('加载题目失败');
    } finally {
      setLoading(false);
    }
  };

  const loadPaperQuestions = async () => {
    if (!paper?.questionIds) return;
    
    try {
      const questionPromises = paper.questionIds.map((id: any) => 
        questionApi.getQuestion(id.toString())
      );
      const responses = await Promise.all(questionPromises);
      const paperQuestions = responses.map((res: any) => res.data);
      setSelectedQuestions(paperQuestions);
    } catch (error) {
      console.error('加载试卷题目失败:', error);
      message.error('加载试卷题目失败');
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...selectedQuestions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newQuestions.length) {
      [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
      setSelectedQuestions(newQuestions);
      message.success('题目顺序已调整');
    }
  };

  // 拖拽排序处理函数
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = selectedQuestions.findIndex((item) => item.id === active.id);
      const newIndex = selectedQuestions.findIndex((item) => item.id === over?.id);

      setSelectedQuestions((items) => {
        return arrayMove(items, oldIndex, newIndex);
      });
      message.success('题目顺序已调整');
    }
  };

  const addQuestion = (question: Question) => {
    if (!selectedQuestions.find(q => q.id.toString() === question.id.toString())) {
      setSelectedQuestions([...selectedQuestions, question]);
      message.success('题目已添加');
    } else {
      message.warning('题目已存在');
    }
  };

  const removeQuestion = (questionId: string) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
    message.success('题目已移除');
  };

  const handleSave = () => {
    if (!paper) return;

    const updatedPaper = {
      ...paper,
      questionIdsList: selectedQuestions.map(q => q.id),
      totalScore: selectedQuestions.length * 5, // 假设每题5分
    };

    onSave(updatedPaper);
    message.success('试卷保存成功');
  };

  const handleAutoOptimize = async () => {
    try {
      setLoading(true);
      // 简单的优化：按难度和类型重新排序
      const optimized = [...selectedQuestions].sort((a, b) => {
        // 先按类型排序
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        // 再按难度排序
        const difficultyOrder = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3 };
        return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - 
               difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
      });
      setSelectedQuestions(optimized);
      message.success('试卷优化完成');
    } catch (error) {
      console.error('优化失败:', error);
      message.error('优化失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatistics = () => {
    const typeCount = selectedQuestions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const difficultyCount = selectedQuestions.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { typeCount, difficultyCount };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'green';
      case 'MEDIUM': return 'orange';
      case 'HARD': return 'red';
      default: return 'blue';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SINGLE_CHOICE': return 'blue';
      case 'MULTIPLE_CHOICE': return 'purple';
      case 'FILL_BLANK': return 'green';
      case 'TRUE_FALSE': return 'orange';
      case 'SHORT_ANSWER': return 'red';
      default: return 'default';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return '简单';
      case 'MEDIUM': return '中等';
      case 'HARD': return '困难';
      default: return difficulty;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'SINGLE_CHOICE': return '单选题';
      case 'MULTIPLE_CHOICE': return '多选题';
      case 'FILL_BLANK': return '填空题';
      case 'TRUE_FALSE': return '判断题';
      case 'SHORT_ANSWER': return '简答题';
      default: return type;
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = filterType === 'ALL' || q.type === filterType;
    const matchesDifficulty = filterDifficulty === 'ALL' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesType && matchesDifficulty;
  });

  const stats = getStatistics();

  // 将sensors移到组件顶层，避免在条件渲染中使用hooks
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <Modal
      title="可视化试卷编辑器"
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="optimize" icon={<ReloadOutlined />} onClick={handleAutoOptimize}>
          排序优化
        </Button>,
        <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          保存试卷
        </Button>,
      ]}
    >
      <Row gutter={16}>
        {/* 左侧：试卷统计和操作 */}
        <Col span={6}>
          <Card title="试卷统计" size="small">
            <Statistic title="题目总数" value={selectedQuestions.length} />
            <Statistic title="总分" value={selectedQuestions.length * 5} suffix="分" />
            <Divider />
            
            <Title level={5}>题型分布</Title>
            {Object.entries(stats.typeCount).map(([type, count]) => (
              <div key={type} style={{ marginBottom: 4 }}>
                <Text>{getTypeText(type)}: {count}题</Text>
                <Progress 
                  percent={(count / selectedQuestions.length) * 100} 
                  size="small" 
                  showInfo={false}
                />
              </div>
            ))}
            
            <Divider />
            
            <Title level={5}>难度分布</Title>
            {Object.entries(stats.difficultyCount).map(([difficulty, count]) => (
              <div key={difficulty} style={{ marginBottom: 4 }}>
                <Text>{getDifficultyText(difficulty)}: {count}题</Text>
                <Progress 
                  percent={(count / selectedQuestions.length) * 100} 
                  size="small" 
                  showInfo={false}
                />
              </div>
            ))}
            
            <Divider />
            
            <Button 
              type="dashed" 
              block 
              icon={<PlusOutlined />}
              onClick={() => setShowQuestionSelector(true)}
            >
              添加题目
            </Button>
          </Card>
        </Col>

        {/* 中间：试卷题目列表 */}
        <Col span={12}>
          <Card title="试卷题目" size="small">
            {selectedQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <Text>暂无题目，请添加题目</Text>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedQuestions.map(q => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div style={{ padding: '8px 0' }}>
                    {selectedQuestions.map((question, index) => (
                      <DraggableQuestionItem
                        key={question.id}
                        question={question}
                        index={index}
                        onEdit={(q) => setEditingQuestion(q)}
                        onDelete={(id) => removeQuestion(id.toString())}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </Card>
        </Col>

        {/* 右侧：题目库 */}
        <Col span={6}>
          <Card title="题目库" size="small">
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
              <Input
                placeholder="搜索题目"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
              <Select
                placeholder="题型筛选"
                value={filterType}
                onChange={setFilterType}
                style={{ width: '100%' }}
              >
                <Option value="ALL">全部题型</Option>
                <Option value="SINGLE_CHOICE">单选题</Option>
                <Option value="MULTIPLE_CHOICE">多选题</Option>
                <Option value="FILL_BLANK">填空题</Option>
                <Option value="TRUE_FALSE">判断题</Option>
                <Option value="SHORT_ANSWER">简答题</Option>
              </Select>
              <Select
                placeholder="难度筛选"
                value={filterDifficulty}
                onChange={setFilterDifficulty}
                style={{ width: '100%' }}
              >
                <Option value="ALL">全部难度</Option>
                <Option value="EASY">简单</Option>
                <Option value="MEDIUM">中等</Option>
                <Option value="HARD">困难</Option>
              </Select>
            </Space>
            
            <List
              size="small"
              dataSource={filteredQuestions.slice(0, 10)}
              renderItem={(question) => (
                <List.Item
                  actions={[
                    <Button 
                      size="small" 
                      type="link"
                      onClick={() => addQuestion(question)}
                    >
                      添加
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Text ellipsis={{ tooltip: question.title }}>
                        {question.title}
                      </Text>
                    }
                    description={
                      <Space>
                    <Tag>{getTypeText(question.type)}</Tag>
                    <Tag>{getDifficultyText(question.difficulty)}</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 题目选择器模态框 */}
      <Modal
        title="选择题目"
        open={showQuestionSelector}
        onCancel={() => setShowQuestionSelector(false)}
        width={800}
        footer={null}
      >
        <List
          dataSource={filteredQuestions}
          renderItem={(question) => (
            <List.Item
              actions={[
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => {
                    addQuestion(question);
                    setShowQuestionSelector(false);
                  }}
                >
                  选择
                </Button>
              ]}
            >
              <List.Item.Meta
                title={question.title}
                description={
                  <Space>
                    <Tag>{question.type}</Tag>
                    <Tag>{question.difficulty}</Tag>
                    <Tag>计算机</Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </Modal>
  );
};

export default SimpleVisualEditor;
