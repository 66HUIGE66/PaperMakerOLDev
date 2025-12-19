import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Space,
  Tag,
  Modal,
  message,
  Row,
  Col,
  DatePicker,
  Select,
  Input,
  Pagination,
  Empty,
  Spin,
  Tooltip
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import {
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  HomeOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { practiceRecordService, PracticeRecord, PracticeStatistics } from '../services/practiceRecordService';
import { subjectApi } from '../services/api';
// 引入新的 CSS
import './PracticeRecordsPage.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

const PracticeRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [statistics, setStatistics] = useState<PracticeStatistics>({
    totalRecords: 0,
    completedRecords: 0,
    averageAccuracy: 0,
    totalTime: 0,
    practiceRecords: 0,
    examRecords: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string; isSystem?: boolean }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthentication();
    loadSubjects();
    const hasInitialFilter = filterSubject !== 'ALL' || (searchText && searchText.trim()) || filterStatus !== 'ALL' ||
      (dateRange[0] !== null && dateRange[1] !== null);
    if (hasInitialFilter) {
      loadRecords(true);
    } else {
      loadRecords(false);
    }
  }, []);

  const loadSubjects = async () => {
    try {
      const response = await subjectApi.getAllActiveSubjects(false);
      if (response.data.code === 200) {
        const subjectsList = response.data.data || response.data.object || [];
        const allSubjects = subjectsList.map((s: any) => ({
          id: s.id,
          name: s.name,
          isSystem: s.isSystem ?? false
        }));
        setSubjects(allSubjects);
      }
    } catch (error: any) {
      console.error('加载学科列表失败:', error);
    }
  };

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!(token && user));
  };

  const loadRecords = useCallback(async (useSearch: boolean = false) => {
    setLoading(true);
    try {
      let recordsData: PracticeRecord[] = [];
      const hasFilter = filterSubject !== 'ALL' || (searchText && searchText.trim()) || filterStatus !== 'ALL' ||
        (dateRange[0] !== null && dateRange[1] !== null);

      if (hasFilter) {
        const params: any = {};
        if (searchText && searchText.trim()) params.paperTitle = searchText.trim();
        if (filterStatus !== 'ALL') params.status = filterStatus;
        if (filterSubject !== 'ALL') params.subjectId = filterSubject;
        if (dateRange[0] && dateRange[1]) {
          params.startDate = dateRange[0].format('YYYY-MM-DD');
          params.endDate = dateRange[1].format('YYYY-MM-DD');
        }
        recordsData = await practiceRecordService.searchRecords(params);
      } else {
        recordsData = await practiceRecordService.getMyRecords();
      }

      setRecords(recordsData);

      try {
        const stats = await practiceRecordService.getStatistics();
        setStatistics(stats);
      } catch (statsError: any) {
        setStatistics({
          totalRecords: recordsData.length,
          completedRecords: recordsData.filter(r => r.status === 'COMPLETED').length,
          averageAccuracy: recordsData.length > 0
            ? Math.round(recordsData.reduce((sum, r) => sum + (r.accuracy || 0), 0) / recordsData.length)
            : 0,
          totalTime: recordsData.reduce((sum, r) => {
            const start = new Date(r.startTime);
            const end = r.endTime ? new Date(r.endTime) : new Date();
            return sum + Math.floor((end.getTime() - start.getTime()) / 1000);
          }, 0),
          practiceRecords: recordsData.filter(r => r.examType === 'PRACTICE').length,
          examRecords: recordsData.filter(r => r.examType === 'EXAM').length
        });
      }
    } catch (error: any) {
      console.error('加载练习记录失败:', error);
      if (error.response?.status === 401 || error.message?.includes('用户未登录')) {
        message.warning('您需要登录才能查看练习记录');
      } else {
        message.error(error.message || '加载练习记录失败');
      }
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filterSubject, searchText, filterStatus, dateRange]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}小时${minutes}分`;
    if (minutes > 0) return `${minutes}分${secs}秒`;
    return `${secs}秒`;
  };

  const calculateTimeSpent = (startTime: string, endTime?: string): number => {
    if (!endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  };

  const formatDateTime = (dateTime: string): string => {
    return dayjs(dateTime).format('YYYY-MM-DD HH:mm');
  };

  const handleViewDetail = (record: PracticeRecord) => {
    if (record.id) {
      navigate(`/practice-detail/${record.id}`);
    } else {
      message.error('记录ID无效');
    }
  };

  const handleDeleteRecord = (recordId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条练习记录吗？此操作无法撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await practiceRecordService.deleteRecord(recordId);
          setRecords(records.filter(record => record.id !== recordId));
          message.success('删除成功');
          // 简单更新统计数据，不重新请求
          setStatistics(prev => ({
            ...prev,
            totalRecords: Math.max(0, prev.totalRecords - 1)
          }));
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      }
    });
  };

  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const hasFilter = filterSubject !== 'ALL' || (searchText && searchText.trim()) || filterStatus !== 'ALL' ||
        (dateRange[0] !== null && dateRange[1] !== null);
      loadRecords(hasFilter);
    }, 500);

    return () => clearTimeout(timer);
  }, [filterSubject, searchText, filterStatus, dateRange, loadRecords]);

  // 前端分页处理
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRecords = records.slice(startIndex, endIndex);

  return (
    <div className="practice-records-container">
      {/* 1. Hero 统计区域 */}
      <div className="records-hero animate-fade-in">
        <div className="hero-header">
          <div className="page-title">
            <TrophyOutlined />
            <span>我的练习历程</span>
          </div>
          <Space>
            <Button
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
            >
              返回首页
            </Button>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => loadRecords(true)}
              loading={loading}
              shape="round"
            >
              刷新数据
            </Button>
          </Space>
        </div>

        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon-wrapper">
              <FileTextOutlined />
            </div>
            <div className="stat-content">
              <div className="stat-label">总练习次数</div>
              <div className="stat-value">{statistics.totalRecords}</div>
            </div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon-wrapper">
              <CheckCircleOutlined />
            </div>
            <div className="stat-content">
              <div className="stat-label">已完成练习</div>
              <div className="stat-value">{statistics.completedRecords}</div>
            </div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon-wrapper">
              <BarChartOutlined />
            </div>
            <div className="stat-content">
              <div className="stat-label">平均正确率</div>
              <div className="stat-value">{statistics.averageAccuracy}%</div>
            </div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon-wrapper">
              <FieldTimeOutlined />
            </div>
            <div className="stat-content">
              <div className="stat-label">累计练习时长</div>
              <div className="stat-value" style={{ fontSize: '18px' }}>
                {formatTime(statistics.totalTime)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 筛选和搜索栏 */}
      <div className="filter-bar animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="filter-item" style={{ flexGrow: 2 }}>
          <Input
            placeholder="搜索试卷关键词..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="large"
            bordered={false}
            style={{ background: '#f5f5f5', borderRadius: '8px' }}
          />
        </div>
        <div className="filter-item">
          <Select
            placeholder="练习状态"
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: '100%' }}
            size="large"
            bordered={false}
            className="custom-select"
          >
            <Option value="ALL">全部状态</Option>
            <Option value="COMPLETED">✅ 已完成</Option>
            <Option value="IN_PROGRESS">⏳ 进行中</Option>
            <Option value="TIMEOUT">⏰超时</Option>
          </Select>
        </div>
        <div className="filter-item">
          <Select
            placeholder="全部学科"
            value={filterSubject}
            onChange={setFilterSubject}
            style={{ width: '100%' }}
            size="large"
            bordered={false}
          >
            <Option value="ALL">📚 全部学科</Option>
            {subjects.map(s => (
              <Option key={s.id} value={String(s.id)}>{s.name}</Option>
            ))}
          </Select>
        </div>
        <div className="filter-item" style={{ flexGrow: 1.5 }}>
          <RangePicker
            style={{ width: '100%', border: 'none', background: '#f5f5f5', borderRadius: '8px', padding: '8px 12px' }}
            value={dateRange[0] && dateRange[1] ? [dateRange[0], dateRange[1]] as [Dayjs, Dayjs] : null}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) setDateRange([dates[0], dates[1]]);
              else setDateRange([null, null]);
            }}
          />
        </div>
      </div>

      {/* 3. 记录列表 */}
      <Spin spinning={loading}>
        {records.length === 0 && !loading ? (
          <div className="empty-state" style={{ background: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center' }}>
            <Empty description="暂无练习记录，快去开始新的练习吧！" />
            <Button type="primary" style={{ marginTop: 20 }} onClick={() => navigate('/start-practice')}>
              去练习
            </Button>
          </div>
        ) : (
          <div className="record-list animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {currentRecords.map((record) => (
              <div key={record.id} className="record-card">
                <div className="record-info-main">
                  <div className="record-title" title={record.paperTitle}>
                    {record.paperTitle || '未命名试卷'}
                    <Tag>{record.examType === 'EXAM' ? '考试' : '练习'}</Tag>
                  </div>
                  <div className="record-meta">
                    <span className="meta-item"><CalendarOutlined /> {formatDateTime(record.startTime)}</span>
                    <span className="meta-item"><ClockCircleOutlined /> 用时: {formatTime(calculateTimeSpent(record.startTime, record.endTime))}</span>
                  </div>
                </div>

                <div className="record-stats">
                  <div className="mini-stat">
                    <div className="mini-stat-label">总分</div>
                    <div className="mini-stat-value score">
                      {record.score}/{record.totalScore}
                    </div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-label">正确率</div>
                    <div className="mini-stat-value accuracy">
                      {record.accuracy ? Math.round(record.accuracy) : 0}%
                    </div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-label">进度</div>
                    <div className="mini-stat-value">
                      {record.answeredQuestions}/{record.totalQuestions}
                    </div>
                  </div>
                </div>

                <div className="record-actions">
                  <div className={`status-badge ${record.status.toLowerCase()}`}>
                    {record.status === 'COMPLETED' ? '已完成' :
                      record.status === 'IN_PROGRESS' ? '进行中' : '超时'}
                  </div>
                  <Space>
                    <Tooltip title="查看详情">
                      <Button
                        shape="circle"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(record)}
                      />
                    </Tooltip>
                    <Tooltip title="删除记录">
                      <Button
                        shape="circle"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => handleDeleteRecord(record.id, e)}
                      />
                    </Tooltip>
                  </Space>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {records.length > 0 && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={records.length}
              showSizeChanger
              showQuickJumper
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              onShowSizeChange={(current, size) => setPageSize(size)}
            />
          </div>
        )}
      </Spin>
    </div>
  );
};

export default PracticeRecordsPage;
