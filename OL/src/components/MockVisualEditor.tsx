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
  Select,
  Pagination
} from 'antd';
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
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HolderOutlined
} from '@ant-design/icons';
import { ExamPaper, Question } from '../types';
import { questionApi, knowledgePointApi, subjectApi } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

// 题干截断组件
const TruncatedText: React.FC<{ text: string; maxLength?: number }> = ({ text, maxLength = 80 }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!text || typeof text !== 'string') {
    return <span>-</span>;
  }
  
  // 解码HTML实体
  const decodeHtml = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };
  
  const decodedText = decodeHtml(text);
  const plainText = decodedText.replace(/<[^>]*>/g, '');
  const textLength = plainText.length;
  
  if (textLength <= maxLength) {
    return <span>{decodedText}</span>;
  }
  
  return (
    <span>
      {expanded ? (
        <>
          <span>{decodedText}</span>
          <Button 
            type="link" 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
            style={{ padding: '0 4px', height: 'auto', marginLeft: 4, fontSize: '12px' }}
          >
            收起
          </Button>
        </>
      ) : (
        <>
          <span>{plainText.slice(0, maxLength)}...</span>
          <Button 
            type="link" 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
            style={{ padding: '0 4px', height: 'auto', marginLeft: 4, fontSize: '12px' }}
          >
            展开
          </Button>
        </>
      )}
    </span>
  );
};

// 可拖拽的题目项组件
interface DraggableQuestionItemProps {
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: (questionId: number) => void;
  extractKnowledgePoints: (question: Question) => string[];
}

const DraggableQuestionItem: React.FC<DraggableQuestionItemProps> = ({
  question,
  index,
  onEdit,
  onDelete,
  extractKnowledgePoints
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
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        marginBottom: '8px',
        padding: '12px',
        backgroundColor: '#fafafa',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {/* 拖拽手柄区域 */}
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              padding: '8px',
              marginRight: '12px',
              borderRadius: '4px',
              backgroundColor: isDragging ? '#e6f7ff' : '#f5f5f5',
              transition: 'background-color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '32px',
              minHeight: '32px',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#e6f7ff';
            }}
            onMouseLeave={(e) => {
              if (!isDragging) {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#f5f5f5';
              }
            }}
            title="拖拽调整顺序"
          >
            <HolderOutlined style={{ color: '#999', fontSize: '20px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <Text strong>题目 {index + 1}</Text>
              <div style={{ marginLeft: 'auto' }}>
                <Tag color={getTypeColor(question.type)}>{getTypeText(question.type)}</Tag>
                <Tag color={getDifficultyColor(question.difficulty)}>{getDifficultyText(question.difficulty)}</Tag>
              </div>
            </div>
            <div style={{ wordBreak: 'break-word', lineHeight: '1.5', marginBottom: '4px' }}>
              <TruncatedText text={question.title} maxLength={80} />
            </div>
            {(() => {
              const kpList = extractKnowledgePoints(question);
              //  如果题目有knowledgePoints字段但提取为空，检查是否是空数组
              if (kpList.length === 0 && question.knowledgePoints && Array.isArray(question.knowledgePoints) && question.knowledgePoints.length === 0) {
                // 空数组，说明后端返回了空数组，这是正常的（表示没有知识点）
                return null;
              }
              
              return kpList.length > 0 ? (
                <Space size={[4, 4]} wrap style={{ marginTop: '4px' }}>
                  {kpList.map((kp: string, idx: number) => (
                    <Tag 
                      key={idx} 
                      color="cyan"
                      style={{ margin: 0, fontSize: '11px' }}
                    >
                      {kp}
                    </Tag>
                  ))}
                </Space>
              ) : null;
            })()}
          </div>
        </div>
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(question);
            }}
            title="编辑题目"
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(question.id);
            }}
            title="删除题目"
          />
        </Space>
      </div>
    </div>
  );
};

interface MockVisualEditorProps {
  paper: ExamPaper | null;
  visible: boolean;
  onClose: () => void;
  onSave: (paper: ExamPaper) => void;
}

const MockVisualEditor: React.FC<MockVisualEditorProps> = ({
  paper,
  visible,
  onClose,
  onSave
}) => {
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [questionBank, setQuestionBank] = useState<Question[]>([]); //  题目库题目列表
  const [loading, setLoading] = useState(false);
  // 题目库分页状态
  const [questionBankPage, setQuestionBankPage] = useState(1);
  const [questionBankPageSize] = useState(5);
  // 试卷题目分页状态
  const [selectedQuestionsPage, setSelectedQuestionsPage] = useState(1);
  const [selectedQuestionsPageSize] = useState(11);
  // 题目库筛选状态
  const [filterKnowledgePoint, setFilterKnowledgePoint] = useState<string>('');
  const [filterQuestionType, setFilterQuestionType] = useState<string>('');
  const [availableKnowledgePoints, setAvailableKnowledgePoints] = useState<string[]>([]);

  // 从数据库加载知识点列表（接受题目列表作为参数，避免state更新延迟问题）
  const loadKnowledgePointsWithQuestions = async (questions: Question[] = []) => {
    if (!paper) return;
    
    // 使用传入的题目列表或当前的questionBank state
    const currentQuestionBank = questions.length > 0 ? questions : questionBank;
    
    try {
      // 根据试卷的学科获取知识点
      let subjectName = '';
      
      // 检查paper.subject是学科名称还是学科ID
      if (paper.subject) {
        const subjectValue = String(paper.subject).trim();
        // 判断是否为纯数字（学科ID）
        if (/^\d+$/.test(subjectValue)) {
          // 是学科ID，需要通过API获取学科名称
          try {
            const subjectId = parseInt(subjectValue, 10);
            const subjectResponse = await subjectApi.getSubjectById(subjectId);
            const subjectData = subjectResponse.data?.data || subjectResponse.data;
            if (subjectData && subjectData.name) {
              subjectName = subjectData.name;
            }
          } catch (error) {
            // 忽略错误
          }
        } else {
          subjectName = subjectValue;
        }
      } else if ((paper as any).subjectId) {
        // 如果有subjectId字段，尝试获取学科名称
        try {
          const subjectId = typeof (paper as any).subjectId === 'number' 
            ? (paper as any).subjectId 
            : parseInt(String((paper as any).subjectId), 10);
          const subjectResponse = await subjectApi.getSubjectById(subjectId);
          const subjectData = subjectResponse.data?.data || subjectResponse.data;
          if (subjectData && subjectData.name) {
            subjectName = subjectData.name;
          }
        } catch (error) {
          // 忽略错误
        }
      }
      
      // 如果试卷没有学科信息，尝试从题目库中提取
      if (!subjectName && currentQuestionBank.length > 0) {
        const subjects = new Set<string>();
        currentQuestionBank.forEach((q: Question) => {
          if (q.subject && typeof q.subject === 'string') {
            subjects.add(q.subject);
          }
        });
        if (subjects.size === 1) {
          subjectName = Array.from(subjects)[0];
        }
      }
      
      if (subjectName) {
        const kpResponse = await knowledgePointApi.getKnowledgePoints(subjectName);
        
        // 处理API响应数据结构（兼容多种响应格式）
        let knowledgePointsData: any[] = [];
        if (kpResponse && kpResponse.data) {
          // 标准格式：{ code: 200, message: "获取成功", data: [...] }
          if (kpResponse.data.code === 200 && kpResponse.data.data) {
            if (Array.isArray(kpResponse.data.data)) {
              knowledgePointsData = kpResponse.data.data;
            } else if (typeof kpResponse.data.data === 'object') {
              // 如果data是对象，尝试提取数组字段
              knowledgePointsData = kpResponse.data.data.list || kpResponse.data.data.records || [];
            }
          } 
          // 直接是数组格式
          else if (Array.isArray(kpResponse.data)) {
            knowledgePointsData = kpResponse.data;
          } 
          // 嵌套data格式
          else if (kpResponse.data.data && Array.isArray(kpResponse.data.data)) {
            knowledgePointsData = kpResponse.data.data;
          }
          // object字段格式
          else if (kpResponse.data.object && Array.isArray(kpResponse.data.object)) {
            knowledgePointsData = kpResponse.data.object;
          }
        }
        
        const kpNames = knowledgePointsData
          .map((kp: any) => kp.name)
          .filter((name: string) => name && name.trim())
          .sort();
        setAvailableKnowledgePoints(kpNames);
        
        // 如果从数据库获取的知识点为空，回退到从题目库提取
        if (kpNames.length === 0) {
          const allKnowledgePoints = new Set<string>();
          currentQuestionBank.forEach((q: Question) => {
            if (q.knowledgePoints && Array.isArray(q.knowledgePoints)) {
              q.knowledgePoints.forEach(kp => allKnowledgePoints.add(kp));
            }
          });
          const kpFromBank = Array.from(allKnowledgePoints).sort();
          if (kpFromBank.length > 0) {
            setAvailableKnowledgePoints(kpFromBank);
          }
        }
      } else {
        // 如果试卷没有学科，直接从题目库提取知识点
        const allKnowledgePoints = new Set<string>();
        currentQuestionBank.forEach((q: Question) => {
          if (q.knowledgePoints && Array.isArray(q.knowledgePoints)) {
            q.knowledgePoints.forEach(kp => allKnowledgePoints.add(kp));
          }
        });
        const kpFromBank = Array.from(allKnowledgePoints).sort();
        setAvailableKnowledgePoints(kpFromBank);
      }
    } catch (error) {
      // 如果API失败，回退到从题目库提取
      const allKnowledgePoints = new Set<string>();
      currentQuestionBank.forEach((q: Question) => {
        if (q.knowledgePoints && Array.isArray(q.knowledgePoints)) {
          q.knowledgePoints.forEach(kp => allKnowledgePoints.add(kp));
        }
      });
      const kpFromBank = Array.from(allKnowledgePoints).sort();
      setAvailableKnowledgePoints(kpFromBank);
    }
  };

  // 从数据库加载知识点列表（无参数版本，供其他场景使用）
  const loadKnowledgePoints = async () => {
    await loadKnowledgePointsWithQuestions();
  };

  //  根据试卷的学科和知识点加载题目库
  const loadQuestionBank = async () => {
    if (!paper) return;

    try {
      setLoading(true);
      console.log("开始获取学科")
      //  获取学科ID（支持学科ID和学科名称两种格式）
      let subjectId: number | null = null;
      if (paper.subject) {
        console.log(123123)

        const subjectValue = String(paper.subject).trim();
        if (/^\d+$/.test(subjectValue)) {
          // 是学科ID，直接使用
          subjectId = parseInt(subjectValue, 10);
        } else {
          // 是学科名称，需要转换为ID
          try {
            const subjectsResponse = await subjectApi.getAllActiveSubjects(false, false);
            const subjects = subjectsResponse.data?.data || subjectsResponse.data || [];
            const subject = subjects.find((s: any) => s.name === subjectValue);
            if (subject && subject.id) {
              subjectId = Number(subject.id);
            }
          } catch (e) {
            console.warn('获取学科ID失败:', e);
          }
        }
      } else if ((paper as any).subjectId) {
        // 如果有subjectId字段，直接使用
        subjectId = typeof (paper as any).subjectId === 'number' 
          ? (paper as any).subjectId 
          : parseInt(String((paper as any).subjectId), 10);
      }
      
      // 构建查询参数
      const params: any = {
        current: 1,
        size: 1000, //  加载更多题目（支持该学科的全部题目）
      };

      //  使用学科ID筛选（后端API支持subjectId参数）
      if (subjectId) {
        params.subjectId = subjectId;
      }
      console.log(222222222222222222)
      const response = await questionApi.getQuestions(params);
      console.log("response1111111111111:" , response)
      if (response.data && response.data.code === 200) {
        //  先获取所有知识点，用于ID到名称的映射
        let knowledgePointMap = new Map<number, string>();
        try {
          // 使用已获取的subjectId或从paper中获取学科信息
          let subjectName = '';
          if (subjectId) {
            // 如果有学科ID，获取学科名称
            try {
              const subjectResponse = await subjectApi.getSubjectById(subjectId);
              const subjectData = subjectResponse.data?.data || subjectResponse.data;
              if (subjectData && subjectData.name) {
                subjectName = subjectData.name;
              }
            } catch (e) {
              // 忽略错误
            }
          } else if (paper?.subject) {
            // 如果没有学科ID，尝试从paper.subject获取
            const subjectValue = String(paper.subject).trim();
            if (!/^\d+$/.test(subjectValue)) {
              subjectName = subjectValue;
            }
          }
          
          //  加载该学科的所有知识点
          if (subjectName) {
            const kpResponse = await knowledgePointApi.getKnowledgePoints(subjectName);
            const kpData: any[] = kpResponse.data?.data || kpResponse.data || [];
            kpData.forEach((kp: any) => {
              if (kp.id && kp.name) {
                knowledgePointMap.set(Number(kp.id), String(kp.name));
              }
            });
          }
        } catch (error) {
          // 忽略错误
        }
        
        const questions = (response.data.object?.records || response.data.records || []).map((q: any) => {
          // 处理枚举类型
          let questionType = 'SINGLE_CHOICE';
          if (q.type) {
            if (typeof q.type === 'string') {
              questionType = q.type;
            } else if (q.type.name) {
              questionType = q.type.name;
            } else if (q.type.toString) {
              questionType = q.type.toString();
            }
          }
          
          let difficulty = 'EASY';
          if (q.difficulty) {
            if (typeof q.difficulty === 'string') {
              difficulty = q.difficulty;
            } else if (q.difficulty.name) {
              difficulty = q.difficulty.name;
            } else if (q.difficulty.toString) {
              difficulty = q.difficulty.toString();
            }
          }

          //  处理知识点：优先使用knowledgePoints，如果没有则从knowledgePointIds转换
          let knowledgePoints: string[] = [];
          if (q.knowledgePoints && Array.isArray(q.knowledgePoints) && q.knowledgePoints.length > 0) {
            // 后端已填充knowledgePoints
            knowledgePoints = q.knowledgePoints.map((kp: any) => {
              if (typeof kp === 'string') return kp.trim();
              if (kp && typeof kp === 'object' && kp.name) return String(kp.name).trim();
              return String(kp).trim();
            }).filter((kp: string) => kp.length > 0);
          } else if (q.knowledgePointIds) {
            // 从knowledgePointIds转换
            try {
              let kpIds: number[] = [];
              if (typeof q.knowledgePointIds === 'string') {
                // JSON字符串格式，如 "[1,2,3]" 或 "1,2,3"
                const trimmed = q.knowledgePointIds.trim();
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                  kpIds = JSON.parse(trimmed);
                } else {
                  // 逗号分隔的字符串
                  kpIds = trimmed.split(',').map((id: string) => parseInt(id.trim(), 10)).filter((id: number) => !isNaN(id));
                }
              } else if (Array.isArray(q.knowledgePointIds)) {
                kpIds = q.knowledgePointIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
              }
              
              if (kpIds.length > 0) {
                knowledgePoints = kpIds
                  .map((id: number) => knowledgePointMap.get(id))
                  .filter((name: string | undefined): name is string => !!name && name.trim().length > 0);
                
              }
            } catch (error) {
              // 忽略解析错误
            }
          }

          return {
            id: Number(q.id),
            title: q.title || '无标题',
            type: questionType as any,
            difficulty: difficulty as any,
            options: Array.isArray(q.options) ? q.options : (Array.isArray(q.optionsList) ? q.optionsList : []),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            subject: q.subject,
            knowledgePoints: knowledgePoints,
            tags: q.tags || [],
            creatorId: q.creatorId || 0,
            isSystem: q.isSystem || false,
            createTime: q.createdAt || q.createTime || '',
            updateTime: q.updatedAt || q.updateTime || ''
          } as Question;
        });
        
        //  过滤掉已经在试卷中的题目
        const existingIds = selectedQuestions.map(q => q.id);
        const filteredQuestions = questions.filter((q: Question) => !existingIds.includes(q.id));
        
        setQuestionBank(filteredQuestions);
        // 重置到第一页
        setQuestionBankPage(1);
        
        // 加载知识点列表（从数据库获取，传入刚加载的题目列表）
        loadKnowledgePointsWithQuestions(filteredQuestions);
      } else {
        setQuestionBank([]);
      }
    } catch (error) {
      setQuestionBank([]);
    } finally {
      setLoading(false);
    }
  };

  // 旧的模拟题目数据（作为备用，已不使用）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mockQuestions: Question[] = [
    {
      id: '1',
      title: '编程中哪个关键字用于继承？',
      type: 'SINGLE_CHOICE',
      difficulty: 'EASY',
      options: ['extends', 'implements', 'class', 'interface'],
      correctAnswer: 'A',
      explanation: 'extends关键字用于类的继承',
      subject: '',
      creatorId: 1,
      isSystem: true,
      createdAt: '2025-09-25T10:00:00',
      updatedAt: '2025-09-25T10:00:00'
    },
    {
      id: '2',
      title: '以下哪些是编程的基本数据类型？',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      options: ['int', 'String', 'boolean', 'double'],
      correctAnswer: 'A,C,D',
      explanation: 'String是引用类型，不是基本数据类型',
      subject: '',
      creatorId: 1,
      isSystem: true,
      createdAt: '2025-09-25T10:00:00',
      updatedAt: '2025-09-25T10:00:00'
    },
    {
      id: '3',
      title: '请简述面向对象编程的三大特性',
      type: 'SHORT_ANSWER',
      difficulty: 'HARD',
      options: [],
      correctAnswer: '封装、继承、多态',
      explanation: '面向对象编程的核心特性',
      subject: '',
      creatorId: 1,
      isSystem: true,
      createdAt: '2025-09-25T10:00:00',
      updatedAt: '2025-09-25T10:00:00'
    },
    {
      id: '4',
      title: '编程语言中var和let的区别是什么？',
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      options: ['作用域不同', '没有区别', '性能不同', '语法不同'],
      correctAnswer: 'A',
      explanation: 'var是函数作用域，let是块级作用域',
      subject: '',
      creatorId: 1,
      isSystem: true,
      createdAt: '2025-09-25T10:00:00',
      updatedAt: '2025-09-25T10:00:00'
    },
    {
      id: '5',
      title: '编程语言新增了哪些语义化标签？',
      type: 'FILL_BLANK',
      difficulty: 'EASY',
      options: [],
      correctAnswer: 'header, nav, section, article, aside, footer',
      explanation: '编程语言引入了更多语义化标签',
      subject: '',
      creatorId: 1,
      isSystem: true,
      createdAt: '2025-09-25T10:00:00',
      updatedAt: '2025-09-25T10:00:00'
    }
  ];

  useEffect(() => {
    if (paper && visible) {
      loadPaperQuestions();
      loadQuestionBank(); //  加载题目库（会自动加载知识点）
      // 重置筛选条件
      setFilterKnowledgePoint('');
      setFilterQuestionType('');
      setQuestionBankPage(1);
      setSelectedQuestionsPage(1);
    }
  }, [paper, visible]);
  
  // 当选中题目数量变化时，如果当前页没有题目，重置到第一页
  useEffect(() => {
    const totalPages = Math.ceil(selectedQuestions.length / selectedQuestionsPageSize);
    if (selectedQuestionsPage > totalPages && totalPages > 0) {
      setSelectedQuestionsPage(1);
    }
  }, [selectedQuestions.length, selectedQuestionsPage, selectedQuestionsPageSize]);

  //  当已选题目变化时，更新题目库（排除已选题目）
  useEffect(() => {
    if (questionBank.length > 0 && selectedQuestions.length > 0) {
      const existingIds = selectedQuestions.map(q => q.id);
      const filteredQuestions = questionBank.filter(q => !existingIds.includes(q.id));
      setQuestionBank(filteredQuestions);
      // 重置到第一页
      setQuestionBankPage(1);
    }
  }, [selectedQuestions]);

  const loadPaperQuestions = async () => {
    //  对于临时试卷（没有id但有questionIds），从questionIds加载题目
    if (!paper?.id && paper?.questionIds && typeof paper.questionIds === 'string' && paper.questionIds.trim().length > 0) {
      try {
        setLoading(true);
        //  去除方括号和其他特殊字符
        const questionIds = paper.questionIds
          .split(',')
          .map(id => id.trim().replace(/[\[\]]/g, '')) // 去除方括号
          .filter(id => id && !isNaN(parseInt(id))); // 确保是有效数字
        
        // 先获取知识点映射（如果试卷有学科信息）
        let knowledgePointMap = new Map<number, string>();
        try {
          if (paper?.subject) {
            let subjectName = '';
            if (typeof paper.subject === 'string' && paper.subject.trim()) {
              const subjectValue = String(paper.subject).trim();
              if (/^\d+$/.test(subjectValue)) {
                try {
                  const subjectId = parseInt(subjectValue, 10);
                  const subjectResponse = await subjectApi.getSubjectById(subjectId);
                  const subjectData = subjectResponse.data?.data || subjectResponse.data;
                  if (subjectData && subjectData.name) {
                    subjectName = subjectData.name;
                  }
                } catch (e) {
                  // 忽略错误
                }
              } else {
                subjectName = subjectValue;
              }
            }
            
            if (subjectName) {
              const kpResponse = await knowledgePointApi.getKnowledgePoints(subjectName);
              const kpData: any[] = kpResponse.data?.data || kpResponse.data || [];
              kpData.forEach((kp: any) => {
                if (kp.id && kp.name) {
                  knowledgePointMap.set(Number(kp.id), String(kp.name));
                }
              });
            }
          }
        } catch (error) {
          // 忽略错误
        }
        
        if (questionIds.length > 0) {
          // 批量获取题目详情
          const questionPromises = questionIds.map(id => 
            questionApi.getQuestion(id).catch(() => null)
          );
          
          const questionResults = await Promise.all(questionPromises);
          const loadedQuestions = questionResults
            .filter(q => q != null)
            .map((response: any) => {
              //  正确处理后端RespBean数据结构：object字段包含实际数据
              const q = response.data?.object || response.data || response;
              
              // 处理枚举类型
              let questionType = 'SINGLE_CHOICE';
              if (q.type) {
                if (typeof q.type === 'string') {
                  questionType = q.type;
                } else if (q.type.name) {
                  questionType = q.type.name; // 枚举的name属性
                } else if (q.type.toString) {
                  questionType = q.type.toString();
                }
              }
              
              let difficulty = 'EASY';
              if (q.difficulty) {
                if (typeof q.difficulty === 'string') {
                  difficulty = q.difficulty;
                } else if (q.difficulty.name) {
                  difficulty = q.difficulty.name; // 枚举的name属性
                } else if (q.difficulty.toString) {
                  difficulty = q.difficulty.toString();
                }
              }
              
              //  处理知识点：后端已直接返回知识点名称列表，直接使用
              let knowledgePoints: string[] = [];
              
              if (q.knowledgePoints && Array.isArray(q.knowledgePoints)) {
                // 后端返回的知识点名称列表
                knowledgePoints = q.knowledgePoints
                  .map((kp: any) => {
                    if (typeof kp === 'string') return kp.trim();
                    if (kp && typeof kp === 'object' && kp.name) return String(kp.name).trim();
                    return String(kp).trim();
                  })
                  .filter((kp: string) => kp.length > 0);
              }
              
              // 如果后端没有返回知识点名称，尝试从knowledgePointDetails获取
              if (knowledgePoints.length === 0 && q.knowledgePointDetails && Array.isArray(q.knowledgePointDetails)) {
                knowledgePoints = q.knowledgePointDetails
                  .map((kp: any) => {
                    if (kp && typeof kp === 'object' && kp.name) return String(kp.name).trim();
                    return '';
                  })
                  .filter((kp: string) => kp.length > 0);
              }
              
              // 如果仍然没有，尝试从knowledgePointIds转换（兼容旧数据）
              if (knowledgePoints.length === 0 && q.knowledgePointIds) {
                try {
                  let kpIds: number[] = [];
                  if (q.knowledgePointIdsList && Array.isArray(q.knowledgePointIdsList)) {
                    kpIds = q.knowledgePointIdsList.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
                  } else if (typeof q.knowledgePointIds === 'string') {
                    const trimmed = q.knowledgePointIds.trim();
                    if (trimmed.length > 0) {
                      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                        kpIds = JSON.parse(trimmed);
                      } else {
                        kpIds = trimmed.split(',').map((id: string) => parseInt(id.trim(), 10)).filter((id: number) => !isNaN(id));
                      }
                    }
                  } else if (Array.isArray(q.knowledgePointIds)) {
                    kpIds = q.knowledgePointIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
                  }
                  
                  // 从映射表中查找名称（作为后备方案）
                  if (kpIds.length > 0 && knowledgePointMap.size > 0) {
                    knowledgePoints = kpIds
                      .map((id: number) => knowledgePointMap.get(id))
                      .filter((name: string | undefined): name is string => !!name && name.trim().length > 0);
                  }
                } catch (error) {
                  // 忽略解析错误
                }
              }

              return {
                id: Number(q.id), //  确保ID是数字类型
                title: q.title || '无标题',
                type: questionType as any,
                difficulty: difficulty as any,
                options: Array.isArray(q.options) ? q.options : (Array.isArray(q.optionsList) ? q.optionsList : []),
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                subject: q.subject,
                knowledgePoints: knowledgePoints,
                tags: q.tags || [],
                creatorId: q.creatorId || 0,
                isSystem: q.isSystem || false,
                createTime: q.createdAt || q.createTime || '',
                updateTime: q.updatedAt || q.updateTime || ''
              } as Question;
            });
          
          setSelectedQuestions(loadedQuestions);
        } else {
          setSelectedQuestions([]);
        }
      } catch (error) {
        message.error('加载试卷题目失败');
        setSelectedQuestions([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // 对于已保存的试卷，从API加载
    if (!paper?.id) return;
    
    try {
      setLoading(true);
      
      //  先加载知识点映射（支持多个学科）
      let knowledgePointMap = new Map<number, string>();
      const loadedSubjects = new Set<string>();
      
      // 加载学科知识点映射的辅助函数
      const loadSubjectKnowledgePoints = async (subjectIdOrName: string | number) => {
        try {
          let subjectName = '';
          
          if (typeof subjectIdOrName === 'number' || (typeof subjectIdOrName === 'string' && /^\d+$/.test(String(subjectIdOrName)))) {
            const subjectId = typeof subjectIdOrName === 'number' ? subjectIdOrName : parseInt(String(subjectIdOrName), 10);
            const subjectResponse = await subjectApi.getSubjectById(subjectId);
            const subjectData = subjectResponse.data?.data || subjectResponse.data;
            if (subjectData && subjectData.name) {
              subjectName = subjectData.name;
            } else {
              return;
            }
          } else {
            subjectName = String(subjectIdOrName);
          }
          
          if (subjectName && !loadedSubjects.has(subjectName)) {
            loadedSubjects.add(subjectName);
            const kpResponse = await knowledgePointApi.getKnowledgePoints(subjectName);
            const kpData: any[] = kpResponse.data?.data || kpResponse.data || [];
            kpData.forEach((kp: any) => {
              if (kp.id && kp.name) {
                knowledgePointMap.set(Number(kp.id), String(kp.name));
              }
            });
          }
        } catch (error) {
          // 静默失败，不输出日志
        }
      };
      
      // 先加载试卷的学科知识点（确保知识点映射表在加载题目前已准备好）
      if (paper?.subject) {
        await loadSubjectKnowledgePoints(paper.subject);
      }
      
      // 使用真实的API获取试卷题目
      const response = await questionApi.getQuestionsByPaperId(typeof paper.id === 'string' ? parseInt(paper.id) : paper.id);
      if (response.data && response.data.code === 200 && response.data.object && response.data.object.length > 0) {
        // 收集所有题目的学科ID，然后批量加载知识点映射
        const subjectIds = new Set<number>();
        response.data.object.forEach((q: any) => {
          if (q.subjectId) {
            subjectIds.add(Number(q.subjectId));
          }
        });
        
        // 批量加载所有相关学科的知识点（确保所有学科的知识点都已加载）
        if (subjectIds.size > 0) {
          await Promise.all(Array.from(subjectIds).map(subjectId => loadSubjectKnowledgePoints(subjectId)));
        } else if (paper?.subject) {
          // 如果题目没有学科ID，尝试使用试卷的学科
          await loadSubjectKnowledgePoints(paper.subject);
        }
        
        // 确保知识点映射表已加载完成（验证）
        if (knowledgePointMap.size === 0 && paper?.subject) {
          // 如果映射表仍然为空，尝试再次加载
          await loadSubjectKnowledgePoints(paper.subject);
        }
        
        // 处理试卷题目关联数据
        const paperQuestions = response.data.object.map((question: any) => {
          
          // 处理枚举类型
          let questionType = 'SINGLE_CHOICE';
          if (question.type) {
            if (typeof question.type === 'string') {
              questionType = question.type;
            } else if (question.type.name) {
              questionType = question.type.name;
            } else if (question.type.toString) {
              questionType = question.type.toString();
            }
          }
          
          let difficulty = 'EASY';
          if (question.difficulty) {
            if (typeof question.difficulty === 'string') {
              difficulty = question.difficulty;
            } else if (question.difficulty.name) {
              difficulty = question.difficulty.name;
            } else if (question.difficulty.toString) {
              difficulty = question.difficulty.toString();
            }
          }
          
          //  处理知识点：后端已直接返回知识点名称列表，直接使用
          let knowledgePoints: string[] = [];
          
          if (question.knowledgePoints && Array.isArray(question.knowledgePoints)) {
            // 后端返回的知识点名称列表
            knowledgePoints = question.knowledgePoints
              .map((kp: any) => {
                if (typeof kp === 'string') return kp.trim();
                if (kp && typeof kp === 'object' && kp.name) return String(kp.name).trim();
                return String(kp).trim();
              })
              .filter((kp: string) => kp.length > 0);
          }
          
          // 如果后端没有返回知识点名称，尝试从knowledgePointDetails获取
          if (knowledgePoints.length === 0 && question.knowledgePointDetails && Array.isArray(question.knowledgePointDetails)) {
            knowledgePoints = question.knowledgePointDetails
              .map((kp: any) => {
                if (kp && typeof kp === 'object' && kp.name) return String(kp.name).trim();
                return '';
              })
              .filter((kp: string) => kp.length > 0);
          }
          
          // 如果仍然没有，尝试从knowledgePointIds转换（兼容旧数据）
          if (knowledgePoints.length === 0) {
            let kpIds: number[] = [];
            
            if (question.knowledgePointIdsList && Array.isArray(question.knowledgePointIdsList)) {
              kpIds = question.knowledgePointIdsList.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
            } else if (question.knowledgePointIds) {
              try {
                if (typeof question.knowledgePointIds === 'string') {
                  const trimmed = question.knowledgePointIds.trim();
                  if (trimmed.length > 0) {
                    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                      kpIds = JSON.parse(trimmed);
                    } else {
                      kpIds = trimmed.split(',').map((id: string) => parseInt(id.trim(), 10)).filter((id: number) => !isNaN(id));
                    }
                  }
                } else if (Array.isArray(question.knowledgePointIds)) {
                  kpIds = question.knowledgePointIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
                }
              } catch (error) {
                // 忽略解析错误
              }
            }
            
            // 从映射表中查找名称（作为后备方案）
            if (kpIds.length > 0 && knowledgePointMap.size > 0) {
              knowledgePoints = kpIds
                .map((id: number) => knowledgePointMap.get(id))
                .filter((name: string | undefined): name is string => !!name && name.trim().length > 0);
            }
          }

          return {
            ...question,
            id: question.questionId || question.id,
            type: questionType,
            difficulty: difficulty,
            knowledgePoints: knowledgePoints,
            tags: question.tags || [],
            options: Array.isArray(question.options) ? question.options : (Array.isArray(question.optionsList) ? question.optionsList : []),
            subject: question.subject,
            subjectId: question.subjectId
          };
        });
        
        setSelectedQuestions(paperQuestions);
      } else {
        setSelectedQuestions([]);
      }
    } catch (error) {
      message.error('加载试卷题目失败');
      setSelectedQuestions([]);
    } finally {
      setLoading(false);
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

    console.log('拖拽结束:', { activeId: active.id, overId: over?.id }); // 调试信息

    if (!over) {
      console.warn('拖拽目标不存在');
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = selectedQuestions.findIndex((item) => item.id === active.id);
      const newIndex = selectedQuestions.findIndex((item) => item.id === over.id);

      console.log('拖拽索引:', { oldIndex, newIndex, total: selectedQuestions.length }); // 调试信息

      if (oldIndex === -1 || newIndex === -1) {
        console.error('找不到对应题目:', { oldIndex, newIndex });
        message.error('无法调整题目顺序');
        return;
      }

      setSelectedQuestions((items) => {
        return arrayMove(items, oldIndex, newIndex);
      });
      message.success('题目顺序已调整');
    }
  };

  const addQuestion = (question: Question) => {
    if (!selectedQuestions.find(q => q.id === question.id)) {
      setSelectedQuestions([...selectedQuestions, question]);
      //  从题目库中移除已添加的题目
      setQuestionBank(questionBank.filter(q => q.id !== question.id));
      message.success('题目已添加');
    } else {
      message.warning('题目已存在');
    }
  };

  // 辅助函数：提取题目的知识点列表（统一处理不同格式）
  const extractKnowledgePoints = (question: Question): string[] => {
    //  如果没有knowledgePoints字段，直接返回空数组
    if (!question.knowledgePoints) {
      return [];
    }
    
    const knowledgePoints = question.knowledgePoints as any;
    let kpList: string[] = [];
    
    //  处理数组格式
    if (Array.isArray(knowledgePoints)) {
      // 如果是空数组，直接返回
      if (knowledgePoints.length === 0) {
        return [];
      }
      
      // 如果是对象数组，提取name字段；如果是字符串数组，直接使用
      kpList = knowledgePoints.map((kp: any) => {
        if (typeof kp === 'string') {
          return kp.trim();
        } else if (kp && typeof kp === 'object') {
          // 尝试多种可能的字段名
          if (kp.name) return String(kp.name).trim();
          if (kp.label) return String(kp.label).trim();
          if (kp.title) return String(kp.title).trim();
          if (kp.value) return String(kp.value).trim();
          // 如果对象有toString方法，使用它
          if (kp.toString && typeof kp.toString === 'function') {
            const str = kp.toString();
            if (str !== '[object Object]') return str.trim();
          }
        }
        return '';
      }).filter((kp: string) => kp.length > 0);
    } 
    //  处理字符串格式
    else if (typeof knowledgePoints === 'string') {
      const trimmed = knowledgePoints.trim();
      if (trimmed.length > 0) {
        // 如果是JSON字符串，尝试解析
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              kpList = parsed.map((kp: any) => {
                if (typeof kp === 'string') return kp.trim();
                if (kp && typeof kp === 'object' && kp.name) return String(kp.name).trim();
                return String(kp).trim();
              }).filter((kp: string) => kp.length > 0);
            }
          } catch (e) {
            // 解析失败，当作逗号分隔的字符串处理
            kpList = trimmed.split(',').map((kp: string) => kp.trim()).filter((kp: string) => kp.length > 0);
          }
        } else {
          // 逗号分隔的字符串
          kpList = trimmed.split(',').map((kp: string) => kp.trim()).filter((kp: string) => kp.length > 0);
        }
      }
    }
    //  处理对象格式（可能是Map或普通对象）
    else if (typeof knowledgePoints === 'object' && knowledgePoints !== null) {
      // 如果是Map对象
      if (knowledgePoints instanceof Map) {
        kpList = Array.from(knowledgePoints.values())
          .map((kp: any) => String(kp).trim())
          .filter((kp: string) => kp.length > 0);
      }
      // 如果是普通对象，尝试提取值
      else {
        try {
          const values = Object.values(knowledgePoints);
          kpList = values
            .map((kp: any) => {
              if (typeof kp === 'string') return kp.trim();
              if (kp && typeof kp === 'object' && kp.name) return String(kp.name).trim();
              return String(kp).trim();
            })
            .filter((kp: string) => kp.length > 0);
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
    
    return kpList;
  };

  // 筛选题目库的公共函数
  const getFilteredQuestions = () => {
    let filtered = [...questionBank];
    
    // 按知识点筛选
    if (filterKnowledgePoint) {
      filtered = filtered.filter(q => {
        const kpList = extractKnowledgePoints(q);
        if (kpList.length === 0) {
          return false;
        }
        
        // 不区分大小写匹配
        const filterKp = filterKnowledgePoint.trim().toLowerCase();
        const matched = kpList.some(kp => {
          const kpLower = kp.toLowerCase();
          return kpLower === filterKp || kpLower.includes(filterKp) || filterKp.includes(kpLower);
        });
        
        return matched;
      });
      
    }
    
    // 按题型筛选
    if (filterQuestionType) {
      filtered = filtered.filter(q => q.type === filterQuestionType);
    }
    
    return filtered;
  };

  const removeQuestion = (questionId: string | number) => {
    const idStr = questionId.toString();
    setSelectedQuestions(selectedQuestions.filter(q => q.id.toString() !== idStr));
    message.success('题目已移除');
  };

  const handleSave = () => {
    if (!paper) return;

    //  计算总分（根据题目数量和规则）
    const totalScore = selectedQuestions.length > 0 
      ? paper.totalScore || selectedQuestions.length * 5 
      : paper.totalScore || 0;

    //  构建questionIds（逗号分隔的字符串）
    const questionIds = selectedQuestions.map(q => q.id.toString()).join(',');
    
    const updatedPaper = {
      ...paper,
      questionIds: questionIds, //  使用字符串格式
      questionIdsList: selectedQuestions.map(q => parseInt(q.id.toString())), // 兼容字段
      totalScore: totalScore,
      totalQuestions: selectedQuestions.length
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

    // 统计知识点分布
    const knowledgePointCount = selectedQuestions.reduce((acc, q) => {
      const kpList = extractKnowledgePoints(q);
      kpList.forEach(kp => {
        acc[kp] = (acc[kp] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return { typeCount, difficultyCount, knowledgePointCount };
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
        <Button key="optimize" icon={<ReloadOutlined />} onClick={handleAutoOptimize} loading={loading}>
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
            <Statistic title="题目总数" value={paper?.totalQuestions || selectedQuestions.length} />
            <Statistic title="总分" value={paper?.totalScore || (selectedQuestions.length * 5)} suffix="分" />
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
            
            <Title level={5}>知识点分布</Title>
            {Object.entries(stats.knowledgePointCount)
              .sort(([, a], [, b]) => b - a) // 按数量降序排序
              .slice(0, 10) // 只显示前10个
              .map(([kp, count]) => (
                <div key={kp} style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: '12px' }}>{kp}: {count}题</Text>
                  <Progress 
                    percent={(count / selectedQuestions.length) * 100} 
                    size="small" 
                    showInfo={false}
                    strokeColor="#52c41a"
                  />
                </div>
              ))}
            {Object.keys(stats.knowledgePointCount).length === 0 && (
              <div style={{ fontSize: '12px', color: '#999' }}>
                <Text type="secondary">暂无知识点数据</Text>
                {selectedQuestions.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: '11px' }}>
                    <Text type="secondary">
                      {selectedQuestions.filter(q => {
                        const kps = extractKnowledgePoints(q);
                        return kps.length === 0;
                      }).length} 道题目未关联知识点
                    </Text>
                  </div>
                )}
              </div>
            )}
            
            <Divider />
            
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
              <>
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
                      {selectedQuestions
                        .slice(
                          (selectedQuestionsPage - 1) * selectedQuestionsPageSize,
                          selectedQuestionsPage * selectedQuestionsPageSize
                        )
                        .map((question, index) => (
                          <DraggableQuestionItem
                            key={question.id}
                            question={question}
                            index={(selectedQuestionsPage - 1) * selectedQuestionsPageSize + index}
                            onEdit={(q) => message.info('编辑功能暂未实现')}
                            onDelete={(id) => removeQuestion(id)}
                            extractKnowledgePoints={extractKnowledgePoints}
                          />
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
                {/* 试卷题目分页 */}
                {selectedQuestions.length > selectedQuestionsPageSize && (
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Pagination
                      current={selectedQuestionsPage}
                      total={selectedQuestions.length}
                      pageSize={selectedQuestionsPageSize}
                      onChange={(page) => {
                        setSelectedQuestionsPage(page);
                        // 滚动到列表顶部
                        const cardElement = document.querySelector('.ant-card-body');
                        if (cardElement) {
                          cardElement.scrollTop = 0;
                        }
                      }}
                      showSizeChanger={false}
                      size="small"
                      showQuickJumper={selectedQuestions.length > 50}
                      showTotal={(total) => `共 ${total} 道题目`}
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        </Col>

        {/* 右侧：题目库 */}
        <Col span={6}>
          <Card 
            title="题目库" 
            size="small"
            bodyStyle={{ 
              padding: '12px',
              overflow: 'hidden',
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto'
            }}
          >
            {/* 筛选控件 */}
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }} size="small">
              {/* 知识点筛选 */}
              <div>
                <Text type="secondary" style={{ fontSize: '12px', marginBottom: 4, display: 'block' }}>知识点筛选</Text>
                <Select
                  placeholder="请选择知识点（支持模糊搜索）"
                  value={filterKnowledgePoint}
                  onChange={(value) => {
                    setFilterKnowledgePoint(value);
                    setQuestionBankPage(1);
                  }}
                  allowClear
                  style={{ width: '100%' }}
                  showSearch
                  filterOption={(input, option) => {
                    // 支持模糊匹配，不区分大小写
                    const label = String(option?.label ?? option?.children ?? '').toLowerCase();
                    const searchText = input.toLowerCase().trim();
                    if (!searchText) return true;
                    return label.includes(searchText) || searchText.includes(label);
                  }}
                  optionFilterProp="children"
                  notFoundContent={availableKnowledgePoints.length === 0 ? '暂无知识点数据' : '无匹配结果'}
                >
                  {availableKnowledgePoints.map(kp => (
                    <Select.Option key={kp} value={kp} label={kp}>{kp}</Select.Option>
                  ))}
                </Select>
              </div>
              
              {/* 题型筛选 */}
              <div>
                <Text type="secondary" style={{ fontSize: '12px', marginBottom: 4, display: 'block' }}>题型筛选</Text>
                <Select
                  placeholder="请选择题型"
                  value={filterQuestionType}
                  onChange={(value) => {
                    setFilterQuestionType(value);
                    setQuestionBankPage(1);
                  }}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Select.Option value="SINGLE_CHOICE">单选题</Select.Option>
                  <Select.Option value="MULTIPLE_CHOICE">多选题</Select.Option>
                  <Select.Option value="TRUE_FALSE">判断题</Select.Option>
                  <Select.Option value="FILL_BLANK">填空题</Select.Option>
                  <Select.Option value="SHORT_ANSWER">简答题</Select.Option>
                </Select>
              </div>
              
              {/* 清除筛选 */}
              {(filterKnowledgePoint || filterQuestionType) && (
                <Button 
                  size="small" 
                  onClick={() => {
                    setFilterKnowledgePoint('');
                    setFilterQuestionType('');
                    setQuestionBankPage(1);
                  }}
                  style={{ width: '100%' }}
                >
                  清除筛选
                </Button>
              )}
            </Space>
            
            {/* 筛选后的题目列表 */}
            <List
              size="small"
              dataSource={getFilteredQuestions().slice(
                (questionBankPage - 1) * questionBankPageSize,
                questionBankPage * questionBankPageSize
              )}
              loading={loading}
              locale={{ 
                emptyText: (() => {
                  const filtered = getFilteredQuestions();
                  if (filtered.length === 0 && questionBank.length > 0) {
                    return '筛选无结果，请调整筛选条件';
                  }
                  return questionBank.length === 0 && !loading ? '暂无相关题目' : undefined;
                })()
              }}
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
                      <div style={{ wordBreak: 'break-word', lineHeight: '1.5' }}>
                        <TruncatedText text={question.title} maxLength={50} />
                      </div>
                    }
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space size="small" wrap>
                          <Tag>{getTypeText(question.type)}</Tag>
                          <Tag>{getDifficultyText(question.difficulty)}</Tag>
                        </Space>
                        {(() => {
                          const kpList = extractKnowledgePoints(question);
                          return kpList.length > 0 ? (
                            <Space size={[4, 4]} wrap>
                              {kpList.map((kp, index) => (
                                <Tag 
                                  key={index} 
                                  color={filterKnowledgePoint && kp.toLowerCase().includes(filterKnowledgePoint.toLowerCase()) ? 'blue' : 'default'}
                                  style={{ margin: 0, fontSize: '11px' }}
                                >
                                  {kp}
                                </Tag>
                              ))}
                            </Space>
                          ) : (
                            <Tag color="default" style={{ fontSize: '11px' }}>无知识点</Tag>
                          );
                        })()}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            
            {/* 分页组件 - 使用筛选后的题目数量 */}
            {(() => {
              const filteredCount = getFilteredQuestions().length;
              
              return filteredCount > questionBankPageSize ? (
                <div style={{ 
                  marginTop: 16,
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  padding: '0 4px',
                  boxSizing: 'border-box'
                }}>
                  <style>{`
                    .question-bank-pagination .ant-pagination {
                      display: flex !important;
                      flex-wrap: wrap !important;
                      justify-content: center !important;
                      align-items: center !important;
                      margin: 0 !important;
                      max-width: 100% !important;
                    }
                    .question-bank-pagination .ant-pagination-item,
                    .question-bank-pagination .ant-pagination-prev,
                    .question-bank-pagination .ant-pagination-next,
                    .question-bank-pagination .ant-pagination-jump-prev,
                    .question-bank-pagination .ant-pagination-jump-next {
                      margin: 2px !important;
                      flex-shrink: 0;
                    }
                    .question-bank-pagination .ant-pagination-options {
                      margin-left: 4px !important;
                      flex-shrink: 0;
                      max-width: 100px;
                    }
                    .question-bank-pagination .ant-pagination-options-quick-jumper {
                      display: inline-flex !important;
                      align-items: center !important;
                      white-space: nowrap;
                    }
                    .question-bank-pagination .ant-pagination-options-quick-jumper input {
                      width: 40px !important;
                      margin: 0 4px !important;
                      padding: 0 4px !important;
                    }
                  `}</style>
                  <div className="question-bank-pagination">
                    <Pagination
                      current={questionBankPage}
                      total={filteredCount}
                      pageSize={questionBankPageSize}
                      onChange={(page) => {
                        setQuestionBankPage(page);
                        // 滚动到列表顶部
                        const cardElement = document.querySelector('.ant-card-body');
                        if (cardElement) {
                          cardElement.scrollTop = 0;
                        }
                      }}
                      showSizeChanger={false}
                      size="small"
                      showQuickJumper={filteredCount > 50}
                      showTotal={(total) => (
                        <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                          共 {total} 道
                        </span>
                      )}
                    />
                  </div>
                </div>
              ) : null;
            })()}
            
            {/* 显示题目总数 - 显示筛选后的数量 */}
            {(() => {
              const filteredCount = getFilteredQuestions().length;
              
              return filteredCount > 0 ? (
                <div style={{ marginTop: 8, textAlign: 'center', color: '#666', fontSize: '12px' }}>
                  {filterKnowledgePoint || filterQuestionType ? (
                    <>筛选结果: {filteredCount} 道 / 共 {questionBank.length} 道</>
                  ) : (
                    <>共 {filteredCount} 道题目</>
                  )}
                </div>
              ) : questionBank.length > 0 ? (
                <div style={{ marginTop: 8, textAlign: 'center', color: '#999', fontSize: '12px' }}>
                  筛选无结果
                </div>
              ) : null;
            })()}
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default MockVisualEditor;
