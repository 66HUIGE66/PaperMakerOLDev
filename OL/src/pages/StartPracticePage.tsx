import React, { useState, useEffect } from 'react';
import {
  Button,
  Space,
  Tag,
  message,
  Typography,
  Row,
  Col,
  Select,
  Input,
  Spin,
  Empty,
  Pagination,
  Popconfirm,
  Badge,
  Avatar
} from 'antd';
import {
  PlayCircleFilled,
  SearchOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  HomeOutlined,
  DeleteOutlined,
  FileTextOutlined,
  TrophyOutlined,
  RocketOutlined,
  ThunderboltFilled
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ExamPaper } from '../types';
import OnlinePractice from '../components/OnlinePractice';
import PaperDetailModal from '../components/PaperDetailModal';
import { examPaperService } from '../services/examPaperService';
import { useAuth } from '../contexts/AuthContext';
import { subjectApi } from '../services/api';
// Import the custom CSS file
import './StartPracticePage.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const StartPracticePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 检查是否为管理员
  const isAdmin = user?.role === 'ADMIN';

  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedPaper, setSelectedPaper] = useState<ExamPaper | null>(null);
  const [showPractice, setShowPractice] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailPaper, setDetailPaper] = useState<ExamPaper | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9); // Changed to 9 for grid layout
  const [total, setTotal] = useState(0);
  const [filterSubject, setFilterSubject] = useState<number | undefined>(undefined);
  const [subjects, setSubjects] = useState<Array<{ id: number, name: string }>>([]);

  // 加载试卷数据
  const loadPapers = async () => {
    setLoading(true);
    try {
      const params: any = {
        current: currentPage,
        size: pageSize,
      };

      if (searchText.trim()) {
        params.searchText = searchText.trim();
      }
      if (filterType && filterType !== 'ALL') {
        params.type = filterType;
      }
      if (filterSubject !== undefined && filterSubject !== null) {
        params.subjectId = filterSubject;
      }

      const response = await examPaperService.getExamPapers(params);

      const mappedPapers = (response.records || []).map((paper: any) => {
        let creatorName = paper.creatorName;
        if (!creatorName || creatorName === 'undefined' || creatorName === 'null') {
          creatorName = paper.creatorId ? `用户${paper.creatorId}` : '未知用户';
        }
        return {
          ...paper,
          creatorName: creatorName,
        };
      });

      setPapers(mappedPapers);
      setTotal(response.total || 0);

    } catch (error: any) {
      console.error('加载试卷失败:', error);
      if (error.response?.status === 403) {
        message.error('权限不足，无法查看试卷');
      } else if (error.response?.status === 401) {
        message.error('未登录或登录已过期，请重新登录');
      } else {
        message.error(error.message || '加载试卷失败');
      }
      setPapers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 加载学科列表
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await subjectApi.getAllActiveSubjects(false, undefined);
        const subjectsData = response.data?.object || response.data?.data || response.data || [];
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
    loadPapers();
  }, [currentPage, pageSize, searchText, filterType, filterSubject]);

  const handleStartPractice = (paper: ExamPaper) => {
    setSelectedPaper(paper);
    setShowPractice(true);
  };

  const handleViewDetail = (paper: ExamPaper) => {
    setDetailPaper(paper);
    setShowDetail(true);
  };

  const handlePracticeComplete = (result: any) => {
    let currentUserId = 1;
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        currentUserId = userData.id || 1;
      } catch (error) {
        console.error('解析用户数据失败:', error);
      }
    }

    const resultData = {
      paperId: selectedPaper?.id,
      paperTitle: selectedPaper?.title,
      result: result,
      practiceRecord: {
        paperId: selectedPaper?.id,
        userId: currentUserId,
        studentId: currentUserId,
        startTime: result.startTime,
        endTime: result.endTime,
        score: result.score,
        totalScore: result.totalScore,
        answeredQuestions: result.answeredQuestions,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        accuracy: result.totalQuestions > 0 ? (result.correctAnswers / result.totalQuestions) * 100 : 0,
        examType: 'PRACTICE' as const,
        status: 'COMPLETED' as const
      }
    };

    sessionStorage.setItem('practiceResult', JSON.stringify(resultData));
    setShowPractice(false);
    setSelectedPaper(null);
  };

  const handlePracticeExit = () => {
    setShowPractice(false);
    setSelectedPaper(null);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadPapers();
  };

  const handleReset = () => {
    setSearchText('');
    setFilterType('ALL');
    setFilterSubject(undefined);
    setCurrentPage(1);
    loadPapers();
  };

  const handleDelete = async (paper: ExamPaper) => {
    try {
      await examPaperService.deleteExamPaper(paper.id);
      message.success('试卷删除成功');
      loadPapers();
    } catch (error: any) {
      message.error(error.message || '删除试卷失败');
    }
  };

  // 如果正在练习，显示练习界面
  if (showPractice && selectedPaper) {
    return (
      <OnlinePractice
        paper={selectedPaper}
        onComplete={handlePracticeComplete}
        onExit={handlePracticeExit}
      />
    );
  }

  // 获取学科标签
  const getSubjectTag = (paper: ExamPaper) => {
    const subjectDisplay = paper.subject;
    if (subjectDisplay && !isNaN(Number(subjectDisplay)) && subjects.length > 0) {
      const subjectId = Number(subjectDisplay);
      const subject = subjects.find(s => s.id === subjectId);
      return subject ? subject.name : subjectDisplay;
    }
    return subjectDisplay;
  }

  return (
    <div className="practice-page-container">
      {/* 顶部 Hero 区域 */}
      <div className="hero-section animate-fade-in">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <div className="hero-title">
              <RocketOutlined style={{ color: '#1890ff' }} />
              开始您的练习之旅
            </div>
            <Paragraph className="hero-description">
              选择一份试卷开始挑战自我。系统会实时记录您的答题进度和分析您的知识掌握情况，帮助您更有针对性地提高成绩。
            </Paragraph>
            <Space size="large">
              <div className="stats-badge">
                <FileTextOutlined /> 试卷总数: {total}
              </div>
              {/* 这里可以添加更多统计信息 */}
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
            >
              返回首页
            </Button>
          </Col>
        </Row>
      </div>

      {/* 筛选区域 */}
      <div className="filter-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="搜索试卷..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              size="large"
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="选择类型"
              value={filterType}
              onChange={setFilterType}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="ALL">全部类型</Option>
              <Option value="AUTO">智能生成</Option>
              <Option value="MANUAL">手动创建</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="选择学科"
              value={filterSubject}
              onChange={(value) => {
                setFilterSubject(value);
                setCurrentPage(1);
              }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
              size="large"
            >
              <Option value={undefined}>全部学科</Option>
              {subjects.map(subject => (
                <Option key={subject.id} value={subject.id}>{subject.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} size="large">
                搜索
              </Button>
              <Button onClick={handleReset} size="large">
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 试卷列表区域 */}
      <Spin spinning={loading} tip="加载试卷中...">
        {!loading && papers.length === 0 ? (
          <div className="empty-state animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  暂无匹配的试卷，试着调整筛选条件或
                  {isAdmin ? '创建一个新试卷' : '联系管理员'}
                </span>
              }
            />
          </div>
        ) : (
          <div className="paper-grid animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {papers.map((paper) => (
              <div key={paper.id} className="paper-card">
                <div className="paper-card-header">
                  <div className="paper-title" title={paper.title}>{paper.title}</div>
                  <div className="paper-tag-row">
                    {paper.isSystem && <Tag color="blue">系统</Tag>}
                    {getSubjectTag(paper) && <Tag color="orange">{getSubjectTag(paper)}</Tag>}
                    {paper.type === 'AUTO' ?
                      <Tag color="cyan" icon={<ThunderboltFilled />}>智能</Tag> :
                      <Tag color="purple">手动</Tag>
                    }
                  </div>
                </div>

                <div className="paper-card-body">
                  <div className="info-item">
                    <TrophyOutlined /> 总分: {paper.totalScore} 分
                  </div>
                  <div className="info-item">
                    <FileTextOutlined />题目: {paper.totalQuestions} 题
                  </div>
                  <div className="info-item">
                    <ClockCircleOutlined /> 时长: {paper.duration} 分钟
                  </div>
                  <div className="info-item">
                    <UserOutlined /> 创建者: {paper.creatorName || `User ${paper.creatorId}`}
                  </div>
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    type="secondary"
                    style={{ marginTop: 12, fontSize: 13, minHeight: 40 }}
                  >
                    {paper.description || '暂无描述信息'}
                  </Paragraph>
                </div>

                <div className="paper-card-footer">
                  <Space>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetail(paper)}
                      size="small"
                    >
                      详情
                    </Button>
                    {(isAdmin || !paper.isSystem) && (
                      <Popconfirm
                        title="确定删除?"
                        onConfirm={() => handleDelete(paper)}
                        okText="是"
                        cancelText="否"
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                      </Popconfirm>
                    )}
                  </Space>
                  <Button
                    type="primary"
                    shape="round"
                    icon={<PlayCircleFilled />}
                    onClick={() => handleStartPractice(paper)}
                    className="start-btn"
                  >
                    开始
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {total > 0 && (
          <div className="custom-pagination">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              showQuickJumper
              onChange={(page, size) => {
                setCurrentPage(page);
                if (size !== pageSize) {
                  setPageSize(size);
                  setCurrentPage(1);
                }
              }}
              onShowSizeChange={(current, size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={['9', '18', '27', '36']}
            />
          </div>
        )}
      </Spin>

      {/* 试卷详情模态框 */}
      <PaperDetailModal
        visible={showDetail}
        paper={detailPaper}
        onClose={() => {
          setShowDetail(false);
          setDetailPaper(null);
        }}
      />
    </div>
  );
};

export default StartPracticePage;
