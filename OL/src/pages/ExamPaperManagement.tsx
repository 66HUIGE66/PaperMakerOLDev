import React, { useState } from 'react';
import { Card, Table, Button, message, Row, Col, Statistic, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, FileTextOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/index';
import { ExamPaper } from '../types';
import ExamPaperForm from '../components/ExamPaperForm';
import SearchFilter, { SearchFilterConfig, SearchFilterValue } from '../components/SearchFilter';
import { learningAnalyticsService } from '../services/learningAnalyticsService';
import './ExamPaperManagement.css';

const { Title, Text } = Typography;

const ExamPaperManagement: React.FC = () => {
  const { examPapers, addExamPaper, updateExamPaper, deleteExamPaper, questions } = useAppStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPaper, setEditingPaper] = useState<ExamPaper | null>(null);
  const [loading, setLoading] = useState(false);
  const [filteredPapers, setFilteredPapers] = useState<ExamPaper[]>([]);
  const [searchFilterValue, setSearchFilterValue] = useState<SearchFilterValue>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [availableSubjects, setAvailableSubjects] = useState<{label: string, value: string}[]>([]);

  // 搜索筛选配置
  const searchFilterConfig: SearchFilterConfig = {
    searchPlaceholder: '搜索试卷标题或描述...',
    searchFields: ['title', 'description'],
    filters: [
      {
        key: 'subject',
        label: '学科',
        type: 'select',
        options: availableSubjects
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
        key: 'questionCountRange',
        label: '题目数量',
        type: 'numberrange'
      }
    ]
  };

  // 打开新建/编辑试卷弹窗
  const showModal = (paper?: ExamPaper) => {
    setEditingPaper(paper || null);
    setModalVisible(true);
  };

  // 关闭弹窗
  const handleCancel = () => {
    setModalVisible(false);
    setEditingPaper(null);
  };

  // 保存试卷
  const handleSave = (paperData: Omit<ExamPaper, 'id' | 'createTime' | 'updateTime'>) => {
    setLoading(true);
    try {
      if (editingPaper) {
        updateExamPaper(editingPaper.id, paperData);
        message.success('试卷更新成功');
      } else {
        addExamPaper(paperData);
        message.success('试卷创建成功');
      }
      setModalVisible(false);
      setEditingPaper(null);
    } catch (error) {
      message.error('操作失败，请重试');
      console.error('保存试卷失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除试卷
  const handleDelete = (id: string) => {
    try {
      deleteExamPaper(id);
      message.success('试卷删除成功');
    } catch (error) {
      message.error('删除失败，请重试');
    }
  };

  // 开始考试
  const startExam = (paperId: string) => {
    // 这里可以添加跳转到考试页面的逻辑
    window.open(`/exam/${paperId}`, '_blank');
  };

  // 搜索和筛选处理
  const handleSearch = (searchValue: SearchFilterValue) => {
    let filtered = [...examPapers];

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
              const paperDate = new Date(paper.createTime || '');
              return paperDate >= start && paperDate <= end;
            }
            if (key === 'durationRange' && Array.isArray(value) && value.length === 2) {
              const [min, max] = value;
              return (paper.duration || 0) >= min && (paper.duration || 0) <= max;
            }
            if (key === 'questionCountRange' && Array.isArray(value) && value.length === 2) {
              const [min, max] = value;
              return (paper.questions?.length || 0) >= min && (paper.questions?.length || 0) <= max;
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
    setFilteredPapers(examPapers);
  };

  // 初始化筛选数据
  React.useEffect(() => {
    setFilteredPapers(examPapers);
    loadSubjects();
  }, [examPapers]);

  const loadSubjects = async () => {
    try {
      const subjects = await learningAnalyticsService.getSubjects();
      setAvailableSubjects(subjects);
    } catch (error) {
      console.error('加载学科失败:', error);
      message.error('加载学科失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '试卷名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: ExamPaper) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description.length > 50 
                ? `${record.description.substring(0, 50)}...` 
                : record.description}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '题目数量',
      dataIndex: 'questions',
      key: 'questionCount',
      render: (questions: any[]) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: '#1890ff' }}>
            {questions.length}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>题</Text>
        </div>
      ),
      width: 100,
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      render: (score: number) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: '#52c41a' }}>
            {score}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>分</Text>
        </div>
      ),
      width: 80,
    },
    {
      title: '考试时长',
      dataIndex: 'timeLimit',
      key: 'timeLimit',
      render: (timeLimit: number) => (
        <div style={{ textAlign: 'center' }}>
          <ClockCircleOutlined style={{ color: '#fa8c16', marginRight: 4 }} />
          <span style={{ fontWeight: 500 }}>{timeLimit}</span>
          <Text type="secondary" style={{ fontSize: 12 }}>分钟</Text>
        </div>
      ),
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (time: string) => (
        <div>
          <div style={{ fontSize: 13 }}>{new Date(time).toLocaleDateString()}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {new Date(time).toLocaleTimeString()}
          </Text>
        </div>
      ),
      sorter: (a: ExamPaper, b: ExamPaper) => 
        new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: ExamPaper) => (
        <div className="action-buttons-container">
          <Button 
            type="primary"
            icon={<PlayCircleOutlined />} 
            size="small" 
            onClick={() => startExam(record.id)}
            className="action-button"
            style={{ 
              borderRadius: 6,
              minWidth: '85px',
              height: '32px',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            开始考试
          </Button>
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => showModal(record)}
            className="action-button"
            style={{ 
              borderRadius: 6,
              minWidth: '65px',
              height: '32px',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            编辑
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
            size="small" 
            danger
            onClick={() => handleDelete(record.id)}
            className="action-button"
            style={{ 
              borderRadius: 6,
              minWidth: '65px',
              height: '32px',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  // 获取统计数据
  const totalPapers = examPapers.length;
  const totalQuestions = questions.length;
  const avgQuestionsPerPaper = totalPapers > 0 ? (totalQuestions / totalPapers).toFixed(1) : '0.0';
  const totalScore = examPapers.reduce((sum, paper) => sum + paper.totalScore, 0);

  return (
    <div className="exam-paper-management fade-in-up">
      {/* 页面头部 */}
      <Card 
        className="page-header-gradient"
        style={{ marginBottom: 24 }}
        bodyStyle={{ padding: '32px' }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <div style={{ color: 'white' }}>
              <Title level={2} style={{ color: 'white', margin: 0, marginBottom: 8 }}>
                <FileTextOutlined style={{ marginRight: 12 }} />
                试卷管理
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
                创建和管理考试试卷，支持智能组卷和在线考试
              </Text>
            </div>
          </Col>
          <Col>
            <Button 
              type="primary" 
              size="large"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
              className="new-paper-button"
              style={{ 
                borderRadius: 8,
                height: 48,
                paddingLeft: 24,
                paddingRight: 24,
                fontSize: 16,
                fontWeight: 500
              }}
            >
              新建试卷
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="beautiful-card stats-card"
            bodyStyle={{ padding: '24px' }}
          >
            <Statistic 
              title="试卷总数" 
              value={totalPapers} 
              valueStyle={{ color: '#1890ff', fontSize: 28, fontWeight: 600 }} 
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="beautiful-card stats-card"
            bodyStyle={{ padding: '24px' }}
          >
            <Statistic 
              title="题目总数" 
              value={totalQuestions} 
              valueStyle={{ color: '#52c41a', fontSize: 28, fontWeight: 600 }} 
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="beautiful-card stats-card"
            bodyStyle={{ padding: '24px' }}
          >
            <Statistic 
              title="平均每卷题目数" 
              value={avgQuestionsPerPaper} 
              valueStyle={{ color: '#fa8c16', fontSize: 28, fontWeight: 600 }} 
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            className="beautiful-card stats-card"
            bodyStyle={{ padding: '24px' }}
          >
            <Statistic 
              title="总分数" 
              value={totalScore} 
              valueStyle={{ color: '#722ed1', fontSize: 28, fontWeight: 600 }} 
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 试卷列表 */}
      <Card 
        className="beautiful-card"
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: '24px 24px 0 24px' }}>
          <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
            试卷列表
          </Title>
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
          className="beautiful-table"
          columns={columns}
          dataSource={filteredPapers}
          rowKey="id"
          scroll={{ x: 1000 }}
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
            onShowSizeChange: (_, size) => {
              setPageSize(size);
              setCurrentPage(1); // 重置到第一页
            },
            style: { padding: '16px 24px' }
          }}
          loading={loading}
          locale={{
            emptyText: (
              <div className="empty-state">
                <FileTextOutlined />
                <div style={{ fontSize: 16, color: '#8c8c8c', marginBottom: 16 }}>
                  暂无试卷数据
                </div>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => showModal()}
                  style={{ borderRadius: 6 }}
                >
                  创建第一份试卷
                </Button>
              </div>
            )
          }}
        />
      </Card>

      <ExamPaperForm
        visible={modalVisible}
        onCancel={handleCancel}
        onSave={handleSave}
        editingPaper={editingPaper}
        loading={loading}
      />
    </div>
  );
};

export default ExamPaperManagement;