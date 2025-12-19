import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Input,
  Select,
  message,
  Tag,
  Upload,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tabs,
  Spin,
  Progress
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownloadOutlined,
  FileWordOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/index';
import { Question, QuestionType, DifficultyLevel, ImportResult, KnowledgePoint } from '../types/index';
// import { importFile, ImportMode } from '../utils/importService'; // 已删除，使用前端解析
import QuestionForm from '../components/QuestionForm';
import FileUpload from '../components/FileUpload';
import { knowledgePointApi } from '../services/api';
import { learningAnalyticsService } from '../services/learningAnalyticsService';

const { Option } = Select;

const QuestionManagement: React.FC = () => {
  const {
    questions,
    addQuestion,
    updateQuestion,
    deleteQuestion
  } = useAppStore();

  const [loading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<QuestionType | 'all'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterKnowledgePoint, setFilterKnowledgePoint] = useState<string>('all');
  const [availableKnowledgePoints, setAvailableKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<{ label: string, value: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<string>('');

  // 统计数据
  const totalQuestions = questions.length;
  const typeStats = Object.values(QuestionType).reduce((acc, type) => {
    acc[type] = questions.filter((q: Question) => q.type === type).length;
    return acc;
  }, {} as Record<QuestionType, number>);

  const difficultyStats = Object.values(DifficultyLevel).reduce((acc, level) => {
    acc[level as DifficultyLevel] = questions.filter((q: Question) => q.difficulty === level).length;
    return acc;
  }, {} as Record<DifficultyLevel, number>);

  // 加载知识点数据
  useEffect(() => {
    loadKnowledgePoints();
    loadSubjects();
  }, []);

  const loadKnowledgePoints = async () => {
    try {
      const response = await knowledgePointApi.getKnowledgePoints();
      if (response && response.data && response.data.data) {
        setAvailableKnowledgePoints(response.data.data);
      }
    } catch (error) {
      console.error('加载知识点失败:', error);
      message.error('加载知识点失败');
    }
  };

  const loadSubjects = async () => {
    try {
      const subjects = await learningAnalyticsService.getSubjects();
      setAvailableSubjects(subjects);
    } catch (error) {
      console.error('加载学科失败:', error);
      message.error('加载学科失败');
    }
  };

  // 搜索方法
  const handleSearch = () => {
    // 这里可以调用后端搜索API
    message.info('搜索功能已触发');
  };

  // 重置筛选条件
  const handleResetFilters = () => {
    setSearchText('');
    setFilterType('all');
    setFilterDifficulty('all');
    setFilterSubject('all');
    setFilterKnowledgePoint('all');
    setCurrentPage(1); // 重置到第一页
  };

  // 过滤后的题目
  const filteredQuestions = questions.filter((question: Question) => {
    const matchesSearch = !searchText ||
      question.title.toLowerCase().includes(searchText.toLowerCase()) ||
      question.knowledgePoints.some((kp: string) => kp.toLowerCase().includes(searchText.toLowerCase())) ||
      question.tags.some((tag: string) => tag.toLowerCase().includes(searchText.toLowerCase()));

    const matchesType = filterType === 'all' || question.type === filterType;
    const matchesDifficulty = filterDifficulty === 'all' || question.difficulty === filterDifficulty;

    return matchesSearch && matchesType && matchesDifficulty;
  });

  const columns = [
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      width: '40%',
      render: (text: string, record: Question) => {
        // 简单的Markdown图片解析渲染
        const renderContent = (content: string) => {
          if (!content) return '';
          const parts = content.split(/(!\[.*?\]\(.*?\))/g);
          return (
            <div>
              {parts.map((part, index) => {
                const match = part.match(/!\[(.*?)\]\((.*?)\)/);
                if (match) {
                  return <img key={index} src={match[2]} alt={match[1]} style={{ maxWidth: '100%', maxHeight: 150, display: 'block', margin: '8px 0', borderRadius: 4 }} />;
                }
                return <span key={index}>{part}</span>;
              })}
            </div>
          );
        };
        return (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>{renderContent(text)}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              {record.options && record.options.length > 0 && (
                <div>
                  {record.options.slice(0, 4).map((opt: string, idx: number) => (
                    <div key={idx} style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{String.fromCharCode(65 + idx)}. </span>
                      {opt && opt.includes('![') ? (
                        <img
                          src={opt.match(/!\[.*?\]\((.*?)\)/)?.[1] || ''}
                          alt={`选项${String.fromCharCode(65 + idx)}`}
                          style={{ maxWidth: 60, maxHeight: 40, verticalAlign: 'middle', borderRadius: 2 }}
                        />
                      ) : (
                        <span>{opt?.slice(0, 20)}{opt && opt.length > 20 ? '...' : ''}</span>
                      )}
                    </div>
                  ))}
                  {record.options.length > 4 && <div>...还有{record.options.length - 4}个选项</div>}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: '题型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: QuestionType) => {
        const typeMap = {
          [QuestionType.SINGLE_CHOICE]: { text: '单选题', color: 'blue' },
          [QuestionType.MULTIPLE_CHOICE]: { text: '多选题', color: 'green' },
          [QuestionType.FILL_BLANK]: { text: '填空题', color: 'orange' },
          [QuestionType.TRUE_FALSE]: { text: '判断题', color: 'purple' },
          [QuestionType.SHORT_ANSWER]: { text: '简答题', color: 'cyan' },
        };
        const config = typeMap[type];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: DifficultyLevel) => {
        const difficultyMap = {
          [DifficultyLevel.EASY]: { text: '简单', color: 'green' },
          [DifficultyLevel.MEDIUM]: { text: '中等', color: 'blue' },
          [DifficultyLevel.HARD]: { text: '困难', color: 'orange' },
          [DifficultyLevel.EXPERT]: { text: '专家', color: 'red' },
        };
        const config = difficultyMap[difficulty];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '知识点',
      dataIndex: 'knowledgePoints',
      key: 'knowledgePoints',
      width: 150,
      render: (points: string[]) => (
        <div>
          {points.slice(0, 2).map(point => (
            <Tag key={point} style={{ marginBottom: 2 }}>
              {point}
            </Tag>
          ))}
          {points.length > 2 && <Tag>+{points.length - 2}</Tag>}
        </div>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 120,
      render: (tags: string[]) => (
        <div>
          {tags.slice(0, 2).map(tag => (
            <Tag key={tag} color="default" style={{ marginBottom: 2 }}>
              {tag}
            </Tag>
          ))}
          {tags.length > 2 && <Tag color="default">+{tags.length - 2}</Tag>}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Question) => (
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
            title="确定要删除这道题目吗？"
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
      ),
    },
  ];

  const handleAdd = () => {
    setEditingQuestion(null);
    setModalVisible(true);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteQuestion(id);
    message.success('删除成功');
  };

  const handleModalOk = (question: Question) => {
    if (editingQuestion) {
      updateQuestion(editingQuestion.id, question);
      message.success('更新成功');
    } else {
      addQuestion(question);
      message.success('添加成功');
    }
    setModalVisible(false);
    setEditingQuestion(null);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingQuestion(null);
  };

  const handleImport = async (file: File) => {
    setImportLoading(true);
    setImportProgress(0);
    setImportStatus('开始解析...');

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      setImportStatus('正在解析文件...');

      // 使用前端解析
      const fileType = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls') ? 'excel' : 'word';
      let result: ImportResult;

      if (fileType === 'excel') {
        const { parseExcelDocument } = await import('../utils/fileImport');
        result = await parseExcelDocument(file);
      } else {
        const { parseWordDocument } = await import('../utils/fileImport');
        result = await parseWordDocument(file);
      }

      clearInterval(progressInterval);
      setImportProgress(100);
      setImportStatus('解析完成');

      if (result.success && result.questions) {
        setImportStatus('正在保存题目...');

        // 将解析出的题目添加到store中
        result.questions.forEach(question => {
          addQuestion(question);
        });

        message.success(result.message);
        setImportModalVisible(false);
      } else {
        message.error(result.message);
        if (result.errors && result.errors.length > 0) {
          console.error('导入错误详情:', result.errors);
          // 显示详细错误信息
          if (result.errors.length <= 3) {
            result.errors.forEach(error => {
              message.error(error);
            });
          }
        }
      }
    } catch (error) {
      message.error('导入失败');
      console.error('导入异常:', error);
      setImportStatus('导入失败');
    } finally {
      setImportLoading(false);
      setTimeout(() => {
        setImportProgress(0);
        setImportStatus('');
      }, 2000);
    }
  };

  const handleExport = () => {
    // 导出功能实现
    message.info('导出功能开发中');
  };

  return (
    <div className="fade-in">
      <Card className="page-card">
        <div className="page-card-header">
          <div className="page-card-title">题库管理</div>
          <Space>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setImportModalVisible(true)}
            >
              批量导入
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出题目
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加题目
            </Button>
          </Space>
        </div>
        <div className="page-card-content">
          <Tabs
            defaultActiveKey="list"
            items={[
              {
                key: 'list',
                label: '题目列表',
                children: (
                  <>
                    {/* 统计信息 */}
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                      <Col span={6}>
                        <Statistic title="总题目数" value={totalQuestions} />
                      </Col>
                      <Col span={6}>
                        <Statistic title="单选题" value={typeStats[QuestionType.SINGLE_CHOICE]} />
                      </Col>
                      <Col span={6}>
                        <Statistic title="多选题" value={typeStats[QuestionType.MULTIPLE_CHOICE]} />
                      </Col>
                      <Col span={6}>
                        <Statistic title="填空题" value={typeStats[QuestionType.FILL_BLANK]} />
                      </Col>
                    </Row>

                    {/* 搜索和筛选 */}
                    <div className="table-toolbar">
                      <Space wrap>
                        <Input
                          placeholder="搜索题目、知识点、标签"
                          prefix={<SearchOutlined />}
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          style={{ width: 300 }}
                        />
                        <Select
                          placeholder="选择学科"
                          value={filterSubject}
                          onChange={setFilterSubject}
                          style={{ width: 150 }}
                          showSearch
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          <Option value="all">全部学科</Option>
                          {availableSubjects.map(subject => (
                            <Option key={subject.value} value={subject.value}>
                              {subject.label}
                            </Option>
                          ))}
                        </Select>
                        <Select
                          placeholder="选择知识点"
                          value={filterKnowledgePoint}
                          onChange={setFilterKnowledgePoint}
                          style={{ width: 200 }}
                          showSearch
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          disabled={!filterSubject || filterSubject === 'all'}
                        >
                          <Option value="all">全部知识点</Option>
                          {availableKnowledgePoints
                            .filter(kp => !filterSubject || filterSubject === 'all' || kp.subject === filterSubject)
                            .map(kp => (
                              <Option key={kp.id} value={kp.id}>
                                {kp.name} ({kp.subject})
                              </Option>
                            ))}
                        </Select>
                        <Select
                          placeholder="选择题型"
                          value={filterType}
                          onChange={setFilterType}
                          style={{ width: 120 }}
                        >
                          <Option value="all">全部题型</Option>
                          <Option value={QuestionType.SINGLE_CHOICE}>单选题</Option>
                          <Option value={QuestionType.MULTIPLE_CHOICE}>多选题</Option>
                          <Option value={QuestionType.FILL_BLANK}>填空题</Option>
                          <Option value={QuestionType.TRUE_FALSE}>判断题</Option>
                          <Option value={QuestionType.SHORT_ANSWER}>简答题</Option>
                        </Select>
                        <Select
                          placeholder="选择难度"
                          value={filterDifficulty}
                          onChange={setFilterDifficulty}
                          style={{ width: 120 }}
                        >
                          <Option value="all">全部难度</Option>
                          <Option value={DifficultyLevel.EASY}>简单</Option>
                          <Option value={DifficultyLevel.MEDIUM}>中等</Option>
                          <Option value={DifficultyLevel.HARD}>困难</Option>
                          <Option value={DifficultyLevel.EXPERT}>专家</Option>
                        </Select>
                        <Button
                          type="primary"
                          icon={<SearchOutlined />}
                          onClick={handleSearch}
                          loading={loading}
                        >
                          搜索
                        </Button>
                        <Button
                          onClick={handleResetFilters}
                        >
                          重置
                        </Button>
                      </Space>
                    </div>

                    {/* 题目表格 */}
                    <Table
                      columns={columns}
                      dataSource={filteredQuestions}
                      rowKey="id"
                      loading={loading}
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
                        onShowSizeChange: (current, size) => {
                          setPageSize(size);
                          setCurrentPage(1); // 重置到第一页
                        },
                      }}
                      scroll={{ x: 1000 }}
                    />
                  </>
                )
              },
              {
                key: 'stats',
                label: '题型统计',
                children: (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card title="题型分布" size="small">
                        {Object.entries(typeStats).map(([type, count]) => (
                          <div key={type} style={{ marginBottom: 8 }}>
                            <span style={{ marginRight: 8 }}>
                              {type === QuestionType.SINGLE_CHOICE && '单选题'}
                              {type === QuestionType.MULTIPLE_CHOICE && '多选题'}
                              {type === QuestionType.FILL_BLANK && '填空题'}
                              {type === QuestionType.TRUE_FALSE && '判断题'}
                              {type === QuestionType.SHORT_ANSWER && '简答题'}
                            </span>
                            <span style={{ float: 'right', color: '#1890ff' }}>{count}</span>
                          </div>
                        ))}
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="难度分布" size="small">
                        {Object.entries(difficultyStats).map(([level, count]) => (
                          <div key={level} style={{ marginBottom: 8 }}>
                            <span style={{ marginRight: 8 }}>
                              {level === DifficultyLevel.EASY as unknown as string && '简单'}
                              {level === DifficultyLevel.MEDIUM as unknown as string && '中等'}
                              {level === DifficultyLevel.HARD as unknown as string && '困难'}
                              {level === DifficultyLevel.EXPERT as unknown as string && '专家'}
                            </span>
                            <span style={{ float: 'right', color: '#1890ff' }}>{count}</span>
                          </div>
                        ))}
                      </Card>
                    </Col>
                  </Row>
                )
              }
            ]}
          />
        </div>
      </Card>

      {/* 题目编辑模态框 */}
      <Modal
        title={editingQuestion ? '编辑题目' : '添加题目'}
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <QuestionForm
          question={editingQuestion}
          onSave={handleModalOk}
          onCancel={handleModalCancel}
        />
      </Modal>

      {/* 导入模态框 */}
      <Modal
        title="批量导入题目"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        width={800}
      >
        <FileUpload
          onImportComplete={(result) => {
            if (result.successCount > 0) {
              // 刷新题目列表
              // 这里可以调用API重新加载题目
            }
            setImportModalVisible(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default QuestionManagement;
