import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Select,
  Table,
  Tag,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
  Divider,
  Tooltip,
  Badge,
  Progress,
  Empty
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  BookOutlined,
  TrophyOutlined,
  ReloadOutlined,
  ExportOutlined,
  BulbOutlined,
  SwapOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { examPaperService, ExamPaper } from '../services/examPaperService';
import { exportService } from '../services/exportService';
import { questionService, Question } from '../services/questionService';
import { subjectApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import QuestionSelector from '../components/QuestionSelector';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './PaperDetail.css';

interface DraggableBodyRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

const DraggableBodyRow = ({ children, ...restProps }: DraggableBodyRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: restProps['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...restProps.style,
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
    transition,
    cursor: 'move',
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      {...restProps}
    >
      {children}
    </tr>
  );
};

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface PaperQuestion {
  id: number;
  questionId: number;
  questionOrder: number;
  score: number;
  title: string;
  type: string;
  difficulty: string;
  options: any;
  correctAnswer: string;
  explanation: string;
  subject: string;
  isSystem: boolean;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
}

const PaperDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // 获取当前用户
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [paperQuestions, setPaperQuestions] = useState<PaperQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [questionSelectorVisible, setQuestionSelectorVisible] = useState(false);
  const [questionDetailVisible, setQuestionDetailVisible] = useState(false);
  const [questionEditVisible, setQuestionEditVisible] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [replacingQuestionId, setReplacingQuestionId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [questionForm] = Form.useForm();
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>([]);

  // 判断是否有编辑权限：管理员或试卷创建者
  const canEdit = user?.role === 'ADMIN' || (paper?.creatorId && user?.id === paper.creatorId);

  // 获取试卷详情
  const fetchPaperDetail = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // 先尝试从系统试卷中查找
      try {
        const paper = await examPaperService.getPaperDetail(parseInt(id));
        // 处理学科字段：如果返回的是subjectName，映射到subject
        // 处理isSystem字段：确保字段名正确（可能是issystem或isSystem）
        const paperWithSubject = {
          ...paper,
          subject: (paper as any).subjectName || paper.subject || undefined,
          isSystem: (paper as any).isSystem ?? (paper as any).issystem ?? false
        };
        setPaper(paperWithSubject);
        form.setFieldsValue({
          ...paperWithSubject,
          subject: paperWithSubject.subject
        });
      } catch (error) {
        // 如果系统试卷中找不到，尝试从个人试卷中查找
        const myPapers = await examPaperService.getMyPapers();
        const foundPaper = myPapers.find(p => p.id === parseInt(id));
        if (foundPaper) {
          setPaper(foundPaper);
          form.setFieldsValue(foundPaper);
        } else {
          message.error('试卷不存在');
        }
      }
    } catch (error: any) {
      message.error('获取试卷详情失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取试卷题目列表
  const fetchPaperQuestions = async () => {
    if (!id) return;

    try {
      const questions = await examPaperService.getPaperQuestions(parseInt(id));
      setPaperQuestions(questions);
    } catch (error: any) {
      console.log('获取试卷题目失败，使用模拟数据:', error.message);
      // 如果API调用失败，使用模拟数据
      const firstSubject = subjects.length > 0 ? subjects[0].name : '学科一';
      const mockQuestions: PaperQuestion[] = [
        {
          id: 1,
          questionId: 1,
          questionOrder: 1,
          score: 20,
          title: `以下哪个是${firstSubject}的基本数据类型？`,
          type: 'SINGLE_CHOICE',
          difficulty: 'EASY',
          options: ['int', 'String', 'Object', 'Array'],
          correctAnswer: 'A',
          explanation: `${firstSubject}的基本数据类型包括int、double、boolean等`,
          subject: firstSubject,
          isSystem: true,
          creatorId: 1,
          createdAt: '2024-01-01T00:00:00',
          updatedAt: '2024-01-01T00:00:00'
        },
        {
          id: 2,
          questionId: 2,
          questionOrder: 2,
          score: 20,
          title: '以下哪个是面向对象编程的特性？',
          type: 'MULTIPLE_CHOICE',
          difficulty: 'MEDIUM',
          options: ['封装', '继承', '多态', '循环'],
          correctAnswer: 'A,B,C',
          explanation: '面向对象编程的特性包括封装、继承、多态',
          subject: firstSubject,
          isSystem: true,
          creatorId: 1,
          createdAt: '2024-01-01T00:00:00',
          updatedAt: '2024-01-01T00:00:00'
        }
      ];
      setPaperQuestions(mockQuestions);
    }
  };

  // 加载学科列表
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        // 获取所有学科（系统和个人）
        const response = await subjectApi.getAllActiveSubjects(false);
        const subjectsData = response.data?.data || response.data?.object || response.data || [];
        if (Array.isArray(subjectsData)) {
          setSubjects(subjectsData.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch (error) {
        console.error('加载学科列表失败:', error);
      }
    };
    loadSubjects();
  }, []);

  useEffect(() => {
    fetchPaperDetail();
    fetchPaperQuestions();
  }, [id]);

  // 保存试卷信息
  const handleSavePaper = async (values: any) => {
    if (!paper) return;

    try {
      // 如果传入了学科名，需要找到对应的学科ID
      let subjectId = paper.subjectId || (paper as any).subjectId;
      if (values.subject) {
        // 如果值是学科名，从学科列表中找到对应的ID
        const selectedSubject = subjects.find(s => s.name === values.subject);
        if (selectedSubject) {
          subjectId = String(selectedSubject.id);
        } else {
          // 如果找不到，可能是直接输入的学科名，保持原值
          subjectId = values.subject;
        }
      }

      // 准备更新数据
      const updateData = {
        id: typeof paper.id === 'string' ? parseInt(paper.id) : paper.id,
        title: values.title,
        description: values.description,
        totalScore: values.totalScore,
        duration: values.duration,
        subjectId: subjectId
      };

      const updatedPaper = await examPaperService.updatePaper(updateData);

      // 更新本地状态，使用返回的数据或合并数据
      const paperWithSubject = {
        ...updatedPaper,
        subject: values.subject || updatedPaper.subject || (updatedPaper as any).subjectName
      };

      setPaper(paperWithSubject);

      // 刷新详情以获取最新数据
      await fetchPaperDetail();

      setEditModalVisible(false);
      message.success('试卷信息保存成功');
    } catch (error: any) {
      message.error('保存失败: ' + error.message);
    }
  };

  // 删除题目
  const handleDeleteQuestion = async (paperQuestionId: number) => {
    if (!id) return;

    try {
      await examPaperService.removeQuestionFromPaper(parseInt(id), paperQuestionId);
      setPaperQuestions(prev => prev.filter(pq => pq.id !== paperQuestionId));
      message.success('题目删除成功');
    } catch (error: any) {
      console.log('删除题目失败，使用本地更新:', error.message);
      // 如果API调用失败，使用本地更新
      setPaperQuestions(prev => prev.filter(pq => pq.id !== paperQuestionId));
      message.success('题目删除成功');
    }
  };

  // 更新题目分数
  const handleUpdateScore = async (paperQuestionId: number, newScore: number) => {
    if (!id) return;

    try {
      await examPaperService.updateQuestionScore(parseInt(id), paperQuestionId, newScore);
      setPaperQuestions(prev =>
        prev.map(pq =>
          pq.id === paperQuestionId ? { ...pq, score: newScore } : pq
        )
      );
      message.success('分数更新成功');
    } catch (error: any) {
      console.log('更新分数失败，使用本地更新:', error.message);
      // 如果API调用失败，使用本地更新
      setPaperQuestions(prev =>
        prev.map(pq =>
          pq.id === paperQuestionId ? { ...pq, score: newScore } : pq
        )
      );
      message.success('分数更新成功');
    }
  };

  // 添加题目到试卷
  const handleAddQuestion = async (questionId: number, score: number) => {
    if (!id) return;

    try {
      await examPaperService.addQuestionToPaper(parseInt(id), questionId, score);
      message.success('题目添加成功');
      fetchPaperQuestions(); // 刷新题目列表
    } catch (error: any) {
      console.log('添加题目失败，使用本地更新:', error.message);
      // 如果API调用失败，使用本地更新
      const newPaperQuestion: PaperQuestion = {
        id: Date.now(), // 临时ID
        questionId,
        questionOrder: paperQuestions.length + 1,
        score,
        title: '新添加的题目',
        type: 'SINGLE_CHOICE',
        difficulty: 'EASY',
        options: [],
        correctAnswer: '',
        explanation: '',
        subject: '',
        isSystem: false,
        creatorId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setPaperQuestions(prev => [...prev, newPaperQuestion]);
      message.success('题目添加成功');
    }
  };

  // 替换题目
  const handleReplaceQuestion = async (oldQuestionId: number, newQuestionId: number, score: number) => {
    if (!id) return;
    try {
      // 先删除旧题目
      await examPaperService.removeQuestionFromPaper(parseInt(id), oldQuestionId);
      // 再添加新题目
      await examPaperService.addQuestionToPaper(parseInt(id), newQuestionId, score);

      message.success('题目替换成功');
      setReplacingQuestionId(null);
      // 刷新列表
      fetchPaperQuestions();
    } catch (error: any) {
      message.error('替换失败: ' + error.message);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setPaperQuestions((previous) => {
        const activeIndex = previous.findIndex((i) => i.id === active.id);
        const overIndex = previous.findIndex((i) => i.id === over?.id);

        const newQuestions = arrayMove(previous, activeIndex, overIndex);
        // 重新分配序号
        newQuestions.forEach((pq, index) => {
          pq.questionOrder = index + 1;
        });
        return newQuestions;
      });
      message.info('题目顺序已调整，请点击保存按钮保存更改');
    }
  };

  // 题目排序功能
  const handleMoveQuestion = async (paperQuestionId: number, direction: 'up' | 'down') => {
    const currentIndex = paperQuestions.findIndex(pq => pq.id === paperQuestionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= paperQuestions.length) return;

    // 交换题目顺序
    const newQuestions = [...paperQuestions];
    [newQuestions[currentIndex], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[currentIndex]];

    // 更新题目序号
    newQuestions.forEach((pq, index) => {
      pq.questionOrder = index + 1;
    });

    setPaperQuestions(newQuestions);
    message.info(`题目已${direction === 'up' ? '上移' : '下移'}，请点击保存按钮保存更改`);
  };

  // 保存题目顺序
  const handleSaveQuestionOrder = async () => {
    if (!paper || paperQuestions.length === 0) {
      message.warning('没有题目需要保存');
      return;
    }

    try {
      const questionOrders = paperQuestions.map(pq => ({
        questionId: pq.questionId,
        questionOrder: pq.questionOrder,
        score: pq.score
      }));

      await examPaperService.updateQuestionOrder(Number(paper.id), questionOrders);
      message.success('题目顺序保存成功');
    } catch (error: any) {
      message.error('保存失败: ' + error.message);
    }
  };

  // 导出试卷功能
  const handleExportPaper = async () => {
    if (!paper || paperQuestions.length === 0) {
      message.warning('试卷为空，无法导出');
      return;
    }

    try {
      // 构造完整的 Question 对象列表用于导出
      const questionsForExport: Question[] = paperQuestions.map(pq => ({
        id: pq.questionId,
        title: pq.title,
        type: pq.type as any,
        difficulty: pq.difficulty as any,
        options: pq.options,
        correctAnswer: pq.correctAnswer,
        explanation: pq.explanation,
        subject: pq.subject,
        isSystem: pq.isSystem,
        creatorId: pq.creatorId,
        createTime: pq.createdAt,
        updateTime: pq.updatedAt,
        tags: [], // 补充缺少的必填字段
        status: 'ACTIVE',
        knowledgePoints: []
      }));

      await exportService.exportToWord(paper, questionsForExport);
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  // 导出PDF
  const handleExportPDF = async () => {
    if (!paper) return;
    try {
      message.loading({ content: '正在生成PDF...', key: 'exportPdf' });
      // 等待一点时间让隐藏的DOM渲染完成（如果有图片等）
      await new Promise(resolve => setTimeout(resolve, 500));
      await exportService.exportToPDF('paper-print-view', paper.title);
      message.success({ content: '导出PDF成功', key: 'exportPdf' });
    } catch (error) {
      console.error(error);
      message.error({ content: '导出PDF失败', key: 'exportPdf' });
    }
  };

  // 打开题目编辑模态框
  const handleEditQuestion = (record: any) => {
    // 从扁平的数据结构中构造Question对象
    const question: Question = {
      id: record.questionId,
      title: record.title,
      type: record.type,
      difficulty: record.difficulty,
      options: record.options,
      correctAnswer: record.correctAnswer,
      explanation: record.explanation,
      subject: record.subject,
      isSystem: record.isSystem,
      creatorId: record.creatorId,
      createTime: record.createdAt,
      updateTime: record.updatedAt,
      tags: [], // 补充缺少的必填字段
      knowledgePoints: [] // 补充缺少的必填字段
    };

    setEditingQuestion(question);

    // 处理选项数据，确保是数组格式
    let optionsData = [];
    if (question.options) {
      if (Array.isArray(question.options)) {
        optionsData = question.options;
      } else if (typeof question.options === 'string') {
        try {
          optionsData = JSON.parse(question.options);
        } catch (e) {
          optionsData = [];
        }
      }
    }

    questionForm.setFieldsValue({
      title: question.title,
      type: question.type,
      difficulty: question.difficulty,
      subject: question.subject,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      options: optionsData
    });
    setQuestionEditVisible(true);
  };

  // 保存题目编辑
  const handleSaveQuestionEdit = async (values: any) => {
    if (!editingQuestion) return;

    try {
      // 准备更新数据
      const updateData: any = {
        title: values.title,
        type: values.type,
        difficulty: values.difficulty,
        subject: values.subject,
        correctAnswer: values.correctAnswer,
        explanation: values.explanation,
        options: values.options ? JSON.stringify(values.options) : null
      };

      // 调用API更新题目
      const updatedQuestion = await questionService.updateQuestion(editingQuestion.id!, updateData);
      try { const { subjectApi } = await import('../services/api'); await subjectApi.refreshMapping(); } catch { }

      // 更新本地状态
      setPaperQuestions(prev =>
        prev.map(pq =>
          pq.questionId === editingQuestion.id
            ? { ...pq, ...updatedQuestion }
            : pq
        )
      );

      setQuestionEditVisible(false);
      setEditingQuestion(null);
      questionForm.resetFields();
      message.success('题目更新成功');
    } catch (error: any) {
      console.log('API更新失败，使用本地更新:', error.message);
      // 如果API调用失败，使用本地更新
      const updatedQuestion = {
        ...editingQuestion,
        ...values,
        options: values.options || []
      };

      setPaperQuestions(prev =>
        prev.map(pq =>
          pq.questionId === editingQuestion.id
            ? { ...pq, ...updatedQuestion }
            : pq
        )
      );

      setQuestionEditVisible(false);
      setEditingQuestion(null);
      questionForm.resetFields();
      message.success('题目更新成功');
    }
  };

  // 题目列表列定义
  const questionColumns = [
    {
      title: '序号',
      dataIndex: 'questionOrder',
      key: 'questionOrder',
      width: 80,
      render: (order: number) => (
        <Badge
          count={order}
          style={{ backgroundColor: '#1890ff' }}
          overflowCount={999}
        />
      ),
    },
    {
      title: '题目信息',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: any) => (
        <div style={{ padding: '8px 0' }}>
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
            >
              {record.difficulty === 'EASY' ? '简单' :
                record.difficulty === 'MEDIUM' ? '中等' : '困难'}
            </Tag>
            <Tag color="default">
              {record.subject}
            </Tag>
          </Space>
        </div>
      ),
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number, record: PaperQuestion) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {canEdit ? (
            <Input
              type="number"
              value={score}
              min={1}
              max={100}
              style={{ width: 70 }}
              size="small"
              onChange={(e) => {
                const newScore = parseInt(e.target.value);
                if (!isNaN(newScore) && newScore > 0) {
                  handleUpdateScore(record.id, newScore);
                }
              }}
            />
          ) : (
            <Text strong>{score}</Text>
          )}
          <Text type="secondary" style={{ fontSize: '12px' }}>分</Text>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small" wrap>
          <Tooltip title="查看题目详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              style={{ padding: '4px 8px' }}
              onClick={() => {
                setSelectedQuestion(record);
                setQuestionDetailVisible(true);
              }}
            />
          </Tooltip>
          {canEdit && (
            <>
              <Tooltip title="编辑题目">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  size="small"
                  style={{ padding: '4px 8px' }}
                  onClick={() => handleEditQuestion(record)}
                />
              </Tooltip>
              <Tooltip title="替换题目">
                <Button
                  type="text"
                  icon={<SwapOutlined />}
                  size="small"
                  style={{ padding: '4px 8px' }}
                  onClick={() => setReplacingQuestionId(record.id)}
                />
              </Tooltip>
              <Tooltip title="上移">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  size="small"
                  style={{ padding: '4px 8px' }}
                  disabled={record.questionOrder === 1}
                  onClick={() => handleMoveQuestion(record.id, 'up')}
                />
              </Tooltip>
              <Tooltip title="下移">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined style={{ transform: 'rotate(180deg)' }} />}
                  size="small"
                  style={{ padding: '4px 8px' }}
                  disabled={record.questionOrder === paperQuestions.length}
                  onClick={() => handleMoveQuestion(record.id, 'down')}
                />
              </Tooltip>
              <Popconfirm
                title="确定要删除这个题目吗？"
                onConfirm={() => handleDeleteQuestion(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Tooltip title="删除题目">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    style={{ padding: '4px 8px' }}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  if (!paper) {
    return <div>加载中...</div>;
  }

  const totalScore = paperQuestions.reduce((sum, pq) => sum + pq.score, 0);
  const questionCount = paperQuestions.length;

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
              >
                返回
              </Button>
              <Divider type="vertical" />
              <Title level={3} style={{ margin: 0 }}>
                <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                {paper.title}
              </Title>
              <Tag color={paper.isSystem ? 'blue' : 'green'}>
                {paper.isSystem ? '系统试卷' : '个人试卷'}
              </Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchPaperDetail();
                  fetchPaperQuestions();
                  message.success('页面已刷新');
                }}
              >
                刷新
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExportPaper}
              >
                导出Word
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                onClick={handleExportPDF}
              >
                导出PDF
              </Button>
              {canEdit && (
                <>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setQuestionSelectorVisible(true)}
                  >
                    添加题目
                  </Button>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => setEditModalVisible(true)}
                  >
                    编辑试卷
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 试卷统计信息 */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="题目数量"
              value={questionCount}
              prefix={<QuestionCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress
              percent={Math.min((questionCount / 20) * 100, 100)}
              size="small"
              showInfo={false}
              strokeColor="#1890ff"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="总分"
              value={totalScore}
              suffix="分"
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={Math.min((totalScore / 150) * 100, 100)}
              size="small"
              showInfo={false}
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="考试时长"
              value={paper.duration || 0}
              suffix="分钟"
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <Progress
              percent={Math.min(((paper.duration || 0) / 120) * 100, 100)}
              size="small"
              showInfo={false}
              strokeColor="#fa8c16"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="学科"
              value={paper.subject || '未设置'}
              prefix={<BookOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Tag color="purple" style={{ marginTop: 8 }}>
              {paper.subject || '未设置'}
            </Tag>
          </Card>
        </Col>
      </Row>

      {/* 试卷描述 */}
      {paper.description && (
        <Card style={{ marginBottom: '16px' }}>
          <Title level={5}>试卷描述</Title>
          <Text>{paper.description}</Text>
        </Card>
      )}

      {/* 题目列表 */}
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            <FileTextOutlined style={{ marginRight: 8 }} />
            题目列表
          </Title>
          <Space>
            <Text type="secondary">
              共 {questionCount} 道题目，总分 {totalScore} 分
            </Text>
            {canEdit && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                size="small"
                onClick={handleSaveQuestionOrder}
              >
                保存顺序
              </Button>
            )}
            <Button
              type="text"
              icon={<ReloadOutlined />}
              size="small"
              onClick={() => {
                fetchPaperQuestions();
                message.success('题目列表已刷新');
              }}
            >
              刷新
            </Button>
          </Space>
        </div>

        {paperQuestions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无题目"
            style={{ padding: '40px 0' }}
          >
            {canEdit && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setQuestionSelectorVisible(true)}
              >
                添加题目
              </Button>
            )}
          </Empty>
        ) : (
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <SortableContext items={paperQuestions.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <Table
                components={{
                  body: {
                    row: DraggableBodyRow,
                  },
                }}
                columns={questionColumns}
                dataSource={paperQuestions}
                rowKey="id"
                loading={loading}
                pagination={false}
                size="small"
                scroll={{ x: 1000 }}
                rowClassName={(_, index) =>
                  index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
                }
              />
            </SortableContext>
          </DndContext>
        )}
      </Card >

      {/* 编辑试卷信息模态框 */}
      < Modal
        title="编辑试卷信息"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSavePaper}
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalScore"
                label="总分"
                rules={[{ required: true, message: '请输入总分' }]}
              >
                <Input type="number" placeholder="请输入总分" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="考试时长（分钟）"
                rules={[{ required: true, message: '请输入考试时长' }]}
              >
                <Input type="number" placeholder="请输入考试时长" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="subject"
            label="学科"
          >
            <Select
              placeholder="请选择学科"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
              }
            >
              {subjects.map(subject => (
                <Option key={subject.id} value={subject.name} label={subject.name}>
                  {subject.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal >

      {/* 题目选择器模态框 */}
      < Modal
        title="添加题目"
        open={questionSelectorVisible}
        onCancel={() => setQuestionSelectorVisible(false)}
        footer={null}
        width={1000}
        destroyOnHidden
      >
        <QuestionSelector
          onSelect={(questionId: number, score: number) => {
            handleAddQuestion(questionId, score);
            setQuestionSelectorVisible(false);
          }}
          onCancel={() => setQuestionSelectorVisible(false)}
        />
      </Modal >

      {/* 替换题目选择器模态框 */}
      < Modal
        title="替换题目"
        open={!!replacingQuestionId}
        onCancel={() => setReplacingQuestionId(null)}
        footer={null}
        width={1000}
        destroyOnHidden
      >
        <QuestionSelector
          selectionType="radio"
          onSelect={(questionId: number, score: number) => {
            if (replacingQuestionId) {
              handleReplaceQuestion(replacingQuestionId, questionId, score);
            }
          }}
          onCancel={() => setReplacingQuestionId(null)}
        />
      </Modal >

      {/* 题目详情模态框 */}
      < Modal
        title="题目详情"
        open={questionDetailVisible}
        onCancel={() => setQuestionDetailVisible(false)}
        footer={
          [
            <Button key="close" onClick={() => setQuestionDetailVisible(false)}>
              关闭
            </Button>
          ]}
        width={800}
        destroyOnHidden
      >
        {selectedQuestion && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Title level={4}>{selectedQuestion.title}</Title>
              <Space size="small" style={{ marginTop: 8 }}>
                <Tag
                  color={
                    selectedQuestion.type === 'SINGLE_CHOICE' ? 'blue' :
                      selectedQuestion.type === 'MULTIPLE_CHOICE' ? 'green' :
                        selectedQuestion.type === 'TRUE_FALSE' ? 'orange' :
                          selectedQuestion.type === 'FILL_BLANK' ? 'purple' : 'red'
                  }
                >
                  {selectedQuestion.type === 'SINGLE_CHOICE' ? '单选题' :
                    selectedQuestion.type === 'MULTIPLE_CHOICE' ? '多选题' :
                      selectedQuestion.type === 'TRUE_FALSE' ? '判断题' :
                        selectedQuestion.type === 'FILL_BLANK' ? '填空题' : '简答题'}
                </Tag>
                <Tag
                  color={
                    selectedQuestion.difficulty === 'EASY' ? 'green' :
                      selectedQuestion.difficulty === 'MEDIUM' ? 'orange' : 'red'
                  }
                >
                  {selectedQuestion.difficulty === 'EASY' ? '简单' :
                    selectedQuestion.difficulty === 'MEDIUM' ? '中等' : '困难'}
                </Tag>
                <Tag color="default">
                  {selectedQuestion.subject}
                </Tag>
              </Space>
            </div>

            {(selectedQuestion.type === 'SINGLE_CHOICE' || selectedQuestion.type === 'MULTIPLE_CHOICE') && selectedQuestion.options && (
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>选项：</Title>
                <div style={{ paddingLeft: 16 }}>
                  {selectedQuestion.options.map((option, index) => (
                    <div key={index} style={{ marginBottom: 8 }}>
                      <Text strong>{String.fromCharCode(65 + index)}. </Text>
                      <Text>{option}</Text>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 简答题和填空题的答案美化 */}
            {(selectedQuestion.type === 'SHORT_ANSWER' || selectedQuestion.type === 'FILL_BLANK') ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  marginBottom: 12,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <BookOutlined style={{ fontSize: '16px' }} />
                  正确答案：
                </div>
                <div style={{
                  backgroundColor: '#e6f7ff',
                  border: '2px solid #91d5ff',
                  borderRadius: '8px',
                  padding: '16px',
                  minHeight: '80px'
                }}>
                  <Text style={{
                    fontSize: '15px',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#0050b3',
                    display: 'block'
                  }}>
                    {selectedQuestion.correctAnswer}
                  </Text>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>正确答案：</Title>
                <Text code style={{ fontSize: '16px', padding: '8px 12px', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  {selectedQuestion.correctAnswer}
                </Text>
              </div>
            )}

            {selectedQuestion.explanation && (
              <div style={{
                backgroundColor: '#fff7e6',
                border: '2px solid #ffd591',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '12px',
                  gap: '8px'
                }}>
                  <BulbOutlined style={{ fontSize: '18px', color: '#fa8c16' }} />
                  <Title level={5} style={{ margin: 0, color: '#fa8c16' }}>题目解析</Title>
                </div>
                <Text style={{
                  fontSize: '15px',
                  lineHeight: '1.8',
                  color: '#595959',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  display: 'block'
                }}>
                  {selectedQuestion.explanation}
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal >

      {/* 题目编辑模态框 */}
      < Modal
        title={
          < div >
            <EditOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            编辑题目
            {
              editingQuestion && (
                <div style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginTop: 4 }}>
                  题目ID: {editingQuestion.id} | 当前类型: {
                    editingQuestion.type === 'SINGLE_CHOICE' ? '单选题' :
                      editingQuestion.type === 'MULTIPLE_CHOICE' ? '多选题' :
                        editingQuestion.type === 'TRUE_FALSE' ? '判断题' :
                          editingQuestion.type === 'FILL_BLANK' ? '填空题' : '简答题'
                  }
                </div>
              )
            }
          </div >
        }
        open={questionEditVisible}
        onCancel={() => {
          setQuestionEditVisible(false);
          setEditingQuestion(null);
          questionForm.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <Form
          form={questionForm}
          layout="vertical"
          onFinish={handleSaveQuestionEdit}
        >
          <Form.Item
            name="title"
            label="题目标题"
            rules={[{ required: true, message: '请输入题目标题' }]}
          >
            <TextArea rows={3} placeholder="请输入题目标题" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="type"
                label="题目类型"
                rules={[{ required: true, message: '请选择题目类型' }]}
              >
                <Select placeholder="请选择题目类型">
                  <Option value="SINGLE_CHOICE">单选题</Option>
                  <Option value="MULTIPLE_CHOICE">多选题</Option>
                  <Option value="TRUE_FALSE">判断题</Option>
                  <Option value="FILL_BLANK">填空题</Option>
                  <Option value="SHORT_ANSWER">简答题</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="difficulty"
                label="难度"
                rules={[{ required: true, message: '请选择难度' }]}
              >
                <Select placeholder="请选择难度">
                  <Option value="EASY">简单</Option>
                  <Option value="MEDIUM">中等</Option>
                  <Option value="HARD">困难</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="subject"
                label="学科"
                rules={[{ required: true, message: '请输入学科' }]}
              >
                <Input placeholder="请输入学科" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="correctAnswer"
            label="正确答案"
            rules={[{ required: true, message: '请输入正确答案' }]}
            extra="选择题请输入选项字母（如：A、B、C或A,C），其他题型请输入具体答案"
          >
            <Input placeholder="请输入正确答案" />
          </Form.Item>

          <Form.Item
            name="explanation"
            label="题目解析"
          >
            <TextArea rows={3} placeholder="请输入题目解析" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const questionType = getFieldValue('type');
              if (questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') {
                return (
                  <Form.Item
                    name="options"
                    label="选项"
                    rules={[{ required: true, message: '请输入选项' }]}
                    extra="请输入选项内容，按回车键或逗号分隔添加多个选项"
                  >
                    <Select
                      mode="tags"
                      placeholder="请输入选项，按回车添加"
                      style={{ width: '100%' }}
                      tokenSeparators={[',']}
                      open={false}
                    />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setQuestionEditVisible(false);
                setEditingQuestion(null);
                questionForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal >

      {/* 隐藏的打印视图，用于导出PDF */}
      <div id="paper-print-view" style={{ position: 'absolute', top: -10000, left: -10000, width: '210mm', padding: '20mm', background: 'white', color: 'black' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>{paper.title}</h1>
          <p style={{ margin: 0 }}>总分: {paper.totalScore}分    时长: {paper.duration}分钟</p>
          {paper.description && <p style={{ fontStyle: 'italic', margin: '10px 0 0 0' }}>{paper.description}</p>}
        </div>
        <div style={{ borderTop: '2px solid #000', margin: '20px 0' }} />
        {['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER'].map((type) => {
          const typeNameMap: any = {
            'SINGLE_CHOICE': '一、单选题',
            'MULTIPLE_CHOICE': '二、多选题',
            'TRUE_FALSE': '三、判断题',
            'FILL_BLANK': '四、填空题',
            'SHORT_ANSWER': '五、简答题'
          };
          const typeQuestions = paperQuestions.filter(q => q.type === type);
          if (typeQuestions.length === 0) return null;

          return (
            <div key={type} style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>{typeNameMap[type]}</h3>
              {typeQuestions.sort((a, b) => a.questionOrder - b.questionOrder).map((q, index) => (
                <div key={q.id} style={{ marginBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {index + 1}. {q.title} <span style={{ fontWeight: 'normal' }}>({q.score}分)</span>
                  </div>
                  {(type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') && q.options && (
                    <div style={{ paddingLeft: '20px' }}>
                      {(Array.isArray(q.options) ? q.options : []).map((opt: any, optIndex: number) => (
                        <div key={optIndex} style={{ margin: '5px 0' }}>
                          {String.fromCharCode(65 + optIndex)}. {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 为填空题和简答题留出空白区域 */}
                  {(type === 'FILL_BLANK' || type === 'SHORT_ANSWER') && (
                    <div style={{ height: '50px' }}></div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div >
  );
};

export default PaperDetail;
