import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Select,
  Space,
  Typography,
  message,
  List,
  Tag,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Progress,
  Pagination
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { questionApi } from '../services/api';
import { ExamPaper, Question } from '../types';

// 扩展Question类型以包含score属性
interface ExtendedQuestion extends Question {
  score?: number;
}

const { Text } = Typography;
const { Option } = Select;

interface VisualPaperEditorProps {
  paper: ExamPaper | null;
  visible: boolean;
  onClose: () => void;
  onSave: (paper: ExamPaper) => void;
}

interface QuestionItemProps {
  question: ExtendedQuestion;
  index: number;
  onEdit: (question: ExtendedQuestion) => void;
  onDelete: (questionId: string) => void;
}

// 题干截断组件 - 优化版本
const TruncatedText: React.FC<{ text: string; maxLength?: number }> = ({ text, maxLength = 80 }) => {
  const [expanded, setExpanded] = useState(false);
  
  // 处理空文本
  if (!text || typeof text !== 'string') {
    return <span>-</span>;
  }
  
  // 解码HTML实体
  const decodeHtml = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };
  
  // 获取纯文本长度（去除HTML标签和实体）
  const decodedText = decodeHtml(text);
  const plainText = decodedText.replace(/<[^>]*>/g, '');
  const textLength = plainText.length;
  
  // 如果文本长度不超过限制，直接返回
  if (textLength <= maxLength) {
    return <span>{decodedText}</span>;
  }
  
  // 需要截断
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
            style={{ padding: '0 4px', height: 'auto', marginLeft: 4, fontSize: '12px', verticalAlign: 'baseline' }}
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
            style={{ padding: '0 4px', height: 'auto', marginLeft: 4, fontSize: '12px', verticalAlign: 'baseline' }}
          >
            展开
          </Button>
        </>
      )}
    </span>
  );
};

// 题目组件
const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  index,
  onEdit,
  onDelete
}) => {
  return (
    <Card
      size="small"
      style={{ marginBottom: 8 }}
      actions={[
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => onEdit(question)}
        />,
        <Popconfirm
          title="确定要删除这道题目吗？"
          onConfirm={() => onDelete(question.id.toString())}
          okText="确定"
          cancelText="取消"
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ]}
    >
      <div style={{ marginBottom: 8 }}>
        <Text strong>题目 {index + 1}</Text>
      </div>
      {/* 使用截断组件优化长题干显示 */}
      <div 
        style={{ 
          wordBreak: 'break-word',
          fontSize: '14px',
          color: '#333',
          lineHeight: '1.5'
        }}
      >
        <TruncatedText text={question.title} maxLength={80} />
      </div>
      <div style={{ marginTop: 8 }}>
        <Space>
          <Tag>{question.type}</Tag>
          <Tag>{question.difficulty}</Tag>
          <Tag>{question.score}分</Tag>
        </Space>
      </div>
    </Card>
  );
};

const VisualPaperEditor: React.FC<VisualPaperEditorProps> = ({
  paper,
  visible,
  onClose,
  onSave
}) => {
  const [questions, setQuestions] = useState<ExtendedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<ExtendedQuestion[]>([]);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  
  // 题目库筛选相关状态
  const [filteredQuestions, setFilteredQuestions] = useState<ExtendedQuestion[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [knowledgePoints, setKnowledgePoints] = useState<string[]>([]);
  // 题目库分页状态
  const [questionBankPage, setQuestionBankPage] = useState(1);
  const [questionBankPageSize] = useState(10);

  useEffect(() => {
    if (paper && visible) {
      loadQuestions();
      loadPaperQuestions();
    }
  }, [paper, visible]);

  const loadQuestions = async () => {
    try {
      console.log("开始加载")
      setLoading(true);
      //  根据试卷的学科筛选题目
      const params: any = { current: 1, size: 100 };
      if (paper?.subject) {
        params.subject = paper.subject;
        console.log('按学科筛选题目，学科ID:', paper.subject);
      }
      
      const response = await questionApi.getQuestions(params);
      const allQuestions = response.data.records || [];
      console.log('筛选后题目数量:', allQuestions.length);
      setQuestions(allQuestions);
      
      // 提取知识点列表
      const allKnowledgePoints = new Set<string>();
      allQuestions.forEach((question: any) => {
        if (question.knowledgePoints) {
          question.knowledgePoints.forEach((kp: string) => allKnowledgePoints.add(kp));
        }
      });
      setKnowledgePoints(Array.from(allKnowledgePoints));
      
      // 初始筛选
      filterQuestions(allQuestions);
    } catch (error) {
      console.error('加载题目失败:', error);
      message.error('加载题目失败');
    } finally {
      setLoading(false);
    }
  };

  // 题目筛选函数
  const filterQuestions = (questionsToFilter: ExtendedQuestion[] = questions) => {
    let filtered = questionsToFilter;
    
    // 按学科筛选
    if (selectedSubject) {
      filtered = filtered.filter(q => q.subject === selectedSubject);
    }
    
    // 按知识点筛选
    if (selectedKnowledgePoint) {
      filtered = filtered.filter(q => 
        q.knowledgePoints && q.knowledgePoints.includes(selectedKnowledgePoint)
      );
    }
    
    // 按难度筛选
    if (selectedDifficulty) {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }
    
    // 按题型筛选
    if (selectedType) {
      filtered = filtered.filter(q => q.type === selectedType);
    }
    
    setFilteredQuestions(filtered);
  };

  // 筛选条件变化时的处理
  useEffect(() => {
    filterQuestions();
    // 重置到第一页
    setQuestionBankPage(1);
  }, [selectedSubject, selectedKnowledgePoint, selectedDifficulty, selectedType, questions]);

  const loadPaperQuestions = async () => {
    if (!paper?.id) return;
    
    try {
      setLoading(true);
      console.log('加载试卷题目，试卷ID:', paper.id);
      const response = await questionApi.getQuestionsByPaperId(typeof paper.id === 'string' ? parseInt(paper.id) : paper.id);
      const paperQuestions = response.data.records || [];
      console.log('试卷题目数量:', paperQuestions.length);
      setSelectedQuestions(paperQuestions);
    } catch (error) {
      console.error('加载试卷题目失败:', error);
      message.error('加载试卷题目失败');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (question: ExtendedQuestion) => {
    if (selectedQuestions.find(q => q.id.toString() === question.id.toString())) {
      message.warning('该题目已存在于试卷中');
      return;
    }
    
    setSelectedQuestions([...selectedQuestions, question]);
    message.success('题目添加成功');
  };

  const removeQuestion = (questionId: string) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id.toString() !== questionId));
    message.success('题目删除成功');
  };

  const editQuestion = (_question: ExtendedQuestion) => {
    // 这里可以打开编辑模态框
    message.info('编辑功能待实现');
  };

  const handleSave = () => {
    if (!paper) return;
    
    const updatedPaper = {
      ...paper,
      questions: selectedQuestions
    };
    
    onSave(updatedPaper);
    message.success('试卷保存成功');
  };

  const getStatistics = () => {
    const totalQuestions = selectedQuestions.length;
    const totalScore = selectedQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
    
    const typeDistribution = selectedQuestions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const difficultyDistribution = selectedQuestions.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalQuestions,
      totalScore,
      typeDistribution,
      difficultyDistribution
    };
  };

  const stats = getStatistics();

  if (!visible || !paper) {
    return null;
  }

  return (
    <Modal
      title={`可视化编辑试卷 - ${paper.title}`}
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          保存试卷
        </Button>
      ]}
    >
      <Row gutter={16}>
        {/* 左侧：试卷统计 */}
        <Col span={6}>
          <Card title="试卷统计" size="small">
            <Statistic title="题目总数" value={stats.totalQuestions} />
            <Statistic title="总分" value={stats.totalScore} suffix="分" />
            
            <div style={{ marginTop: 16 }}>
              <Text strong>题型分布</Text>
              {Object.entries(stats.typeDistribution).map(([type, count]) => (
                <div key={type} style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>{type}: {count}题</Text>
                  </div>
                  <Progress 
                    percent={(count / stats.totalQuestions) * 100} 
                    size="small" 
                    strokeColor="#1890ff"
                  />
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 16 }}>
              <Text strong>难度分布</Text>
              {Object.entries(stats.difficultyDistribution).map(([difficulty, count]) => (
                <div key={difficulty} style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>{difficulty}: {count}题</Text>
                  </div>
                  <Progress 
                    percent={(count / stats.totalQuestions) * 100} 
                    size="small" 
                    strokeColor="#52c41a"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 中间：试卷题目 */}
        <Col span={12}>
          <Card 
            title="试卷题目" 
            size="small"
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setShowQuestionSelector(true)}
              >
                添加题目
              </Button>
            }
          >
            {selectedQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <Text>暂无题目，点击"添加题目"开始组卷</Text>
              </div>
            ) : (
              selectedQuestions.map((question, index) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  index={index}
                  onEdit={editQuestion}
                  onDelete={removeQuestion}
                />
              ))
            )}
          </Card>
        </Col>

        {/* 右侧：题目库 */}
        <Col span={6}>
          <Card title="题目库" size="small">
            {/* 筛选控件 */}
            <div style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {/* 学科筛选 */}
                <Select
                  placeholder="选择学科"
                  value={selectedSubject}
                  onChange={setSelectedSubject}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="计算机">计算机</Option>
                  <Option value="数学">数学</Option>
                  <Option value="物理">物理</Option>
                  <Option value="化学">化学</Option>
                  <Option value="英语">英语</Option>
                </Select>
                
                {/* 知识点筛选 */}
                <Select
                  placeholder="选择知识点"
                  value={selectedKnowledgePoint}
                  onChange={setSelectedKnowledgePoint}
                  allowClear
                  style={{ width: '100%' }}
                >
                  {knowledgePoints.map(kp => (
                    <Option key={kp} value={kp}>{kp}</Option>
                  ))}
                </Select>
                
                {/* 难度筛选 */}
                <Select
                  placeholder="选择难度"
                  value={selectedDifficulty}
                  onChange={setSelectedDifficulty}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="EASY">简单</Option>
                  <Option value="MEDIUM">中等</Option>
                  <Option value="HARD">困难</Option>
                  <Option value="EXPERT">专家</Option>
                </Select>
                
                {/* 题型筛选 */}
                <Select
                  placeholder="选择题型"
                  value={selectedType}
                  onChange={setSelectedType}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="SINGLE_CHOICE">单选题</Option>
                  <Option value="MULTIPLE_CHOICE">多选题</Option>
                  <Option value="TRUE_FALSE">判断题</Option>
                  <Option value="FILL_BLANK">填空题</Option>
                  <Option value="SHORT_ANSWER">简答题</Option>
                </Select>
                
                {/* 清除筛选 */}
                <Button 
                  size="small" 
                  onClick={() => {
                    setSelectedSubject('');
                    setSelectedKnowledgePoint('');
                    setSelectedDifficulty('');
                    setSelectedType('');
                  }}
                  style={{ width: '100%' }}
                >
                  清除筛选
                </Button>
              </Space>
            </div>
            
            {/* 题目列表 */}
            <List
              size="small"
              dataSource={filteredQuestions.slice(
                (questionBankPage - 1) * questionBankPageSize,
                questionBankPage * questionBankPageSize
              )}
              loading={loading}
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
                      <div 
                        style={{ 
                          wordBreak: 'break-word',
                          fontSize: '14px',
                          lineHeight: '1.5'
                        }}
                      >
                        <TruncatedText text={question.title} maxLength={50} />
                      </div>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        <Space>
                          <Tag color="blue">{question.type}</Tag>
                          <Tag color="green">{question.difficulty}</Tag>
                        </Space>
                        {question.knowledgePoints && question.knowledgePoints.length > 0 && (
                          <div>
                            {question.knowledgePoints.slice(0, 2).map((kp: string) => (
                              <Tag key={kp} color="orange">{kp}</Tag>
                            ))}
                            {question.knowledgePoints.length > 2 && (
                              <Tag color="default">+{question.knowledgePoints.length - 2}</Tag>
                            )}
                          </div>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            
            {/* 分页组件 - 确保在题目数量超过页大小时显示 */}
            {filteredQuestions.length > questionBankPageSize ? (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Pagination
                  current={questionBankPage}
                  total={filteredQuestions.length}
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
                  showQuickJumper={filteredQuestions.length > 50}
                  showTotal={(total) => `共 ${total} 条`}
                />
              </div>
            ) : null}
            
            {/* 显示筛选结果数量 */}
            <div style={{ marginTop: 8, textAlign: 'center', color: '#666', fontSize: '12px' }}>
              共 {filteredQuestions.length} 道题目
            </div>
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
                      添加
                    </Button>
                  ]}
            >
              <List.Item.Meta
                title={
                  <div 
                    style={{ 
                      wordBreak: 'break-word',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                  >
                    <TruncatedText text={question.title} maxLength={100} />
                  </div>
                }
                description={
                  <Space>
                    <Tag>{question.type}</Tag>
                    <Tag>{question.difficulty}</Tag>
                    <Tag>{question.score || 5}分</Tag>
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

export default VisualPaperEditor;