import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Input,
  Breadcrumb,
  Alert
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
  BarChartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { practiceRecordService, PracticeRecord, PracticeStatistics } from '../services/practiceRecordService';
import { subjectApi } from '../services/api';

const { Title } = Typography;
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
    // 初始加载：如果有筛选条件则使用搜索，否则获取全部
    const hasInitialFilter = filterSubject !== 'ALL' || (searchText && searchText.trim()) || filterStatus !== 'ALL' || 
                            (dateRange[0] !== null && dateRange[1] !== null);
    if (hasInitialFilter) {
      loadRecords(true);
    } else {
      loadRecords(false);
    }
  }, []);

  // 加载学科列表（同时加载系统学科和个人学科）
  const loadSubjects = async () => {
    try {
      // 直接加载所有学科，然后根据isSystem字段分组
      const response = await subjectApi.getAllActiveSubjects(false);
      
      if (response.data.code === 200) {
        const subjectsList = response.data.data || response.data.object || [];
        const allSubjects = subjectsList.map((s: any) => ({
          id: s.id,
          name: s.name,
          isSystem: s.isSystem ?? false // 默认false，如果null则认为是个人学科
        }));
        
        console.log('加载的学科列表:', allSubjects); // 调试信息
        console.log('系统学科数量:', allSubjects.filter(s => s.isSystem).length);
        console.log('个人学科数量:', allSubjects.filter(s => !s.isSystem).length);
        
        setSubjects(allSubjects);
      } else {
        console.error('获取学科列表失败:', response.data.message);
      }
    } catch (error: any) {
      console.error('加载学科列表失败:', error);
      // 如果加载失败，尝试分别加载系统学科和个人学科
      try {
        const [systemResponse, personalResponse] = await Promise.all([
          subjectApi.getAllActiveSubjects(false, true),
          subjectApi.getAllActiveSubjects(false, false)
        ]);
        
        const allSubjects: Array<{ id: number; name: string; isSystem?: boolean }> = [];
        
        if (systemResponse.data.code === 200) {
          const systemSubjects = systemResponse.data.data || systemResponse.data.object || [];
          systemSubjects.forEach((s: any) => {
            allSubjects.push({
              id: s.id,
              name: s.name,
              isSystem: true
            });
          });
        }
        
        if (personalResponse.data.code === 200) {
          const personalSubjects = personalResponse.data.data || personalResponse.data.object || [];
          personalSubjects.forEach((s: any) => {
            allSubjects.push({
              id: s.id,
              name: s.name,
              isSystem: false
            });
          });
        }
        
        setSubjects(allSubjects);
      } catch (fallbackError: any) {
        console.error('加载学科列表失败（备用方案）:', fallbackError);
      }
    }
  };

  // 检查认证状态
  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!(token && user));
  };

  const loadRecords = useCallback(async (useSearch: boolean = false) => {
    setLoading(true);
    try {
      let recordsData: PracticeRecord[] = [];
      
      // 根据是否有筛选条件决定使用搜索还是获取全部
      const hasFilter = filterSubject !== 'ALL' || (searchText && searchText.trim()) || filterStatus !== 'ALL' || 
                       (dateRange[0] !== null && dateRange[1] !== null);
      
      // 如果有筛选条件，使用搜索接口；否则获取全部记录
      if (hasFilter) {
        const params: any = {};
        if (searchText && searchText.trim()) {
          params.paperTitle = searchText.trim();
        }
        if (filterStatus !== 'ALL') {
          params.status = filterStatus;
        }
        if (filterSubject !== 'ALL') {
          params.subjectId = filterSubject;
        }
        if (dateRange[0] && dateRange[1]) {
          params.startDate = dateRange[0].format('YYYY-MM-DD');
          params.endDate = dateRange[1].format('YYYY-MM-DD');
          console.log('日期筛选范围:', params.startDate, '到', params.endDate); // 调试信息
        }
        
        console.log('搜索参数:', params); // 调试信息
        recordsData = await practiceRecordService.searchRecords(params);
        console.log('搜索结果:', recordsData.length, '条记录'); // 调试信息
        if (recordsData.length > 0) {
          console.log('第一条记录的开始时间:', recordsData[0].startTime); // 调试信息
        }
      } else {
        recordsData = await practiceRecordService.getMyRecords();
      }
      
      setRecords(recordsData);

      // 加载统计信息
      try {
        const stats = await practiceRecordService.getStatistics();
        setStatistics(stats);
      } catch (statsError: any) {
        // 如果统计信息加载失败，使用默认值
        console.warn('统计信息加载失败，使用默认值:', statsError.message);
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

      // 处理认证错误
      if (error.response?.status === 401 || error.message?.includes('用户未登录')) {
        Modal.warning({
          title: '需要登录',
          content: (
            <div>
              <p>您需要登录才能查看练习记录。</p>
              <p style={{ fontSize: '12px', color: '#666', margin: '8px 0' }}>
                注意：每个浏览器都需要单独登录才能查看对应的练习记录。
              </p>
              <p style={{ fontSize: '12px', color: '#666' }}>
                这是因为练习记录与用户账户绑定，不同浏览器之间的数据是独立的。
              </p>
            </div>
          ),
          okText: '去登录',
          onOk: () => {
            navigate('/login');
          },
          cancelText: '稍后再说',
          onCancel: () => {
            // 保持在当前页面，但显示空数据
          }
        });
      }
      // 如果是数据库表不存在的错误，显示友好提示
      else if (error.message && error.message.includes('Unknown column')) {
        message.warning('数据库表尚未创建，请联系管理员创建exam_records表');
      }
      // 其他错误
      else {
        message.error(error.message || '加载练习记录失败');
      }

      // 设置空数据
      setRecords([]);
      setStatistics({
        totalRecords: 0,
        completedRecords: 0,
        averageAccuracy: 0,
        totalTime: 0,
        practiceRecords: 0,
        examRecords: 0
      });
    } finally {
      setLoading(false);
    }
  }, [filterSubject, searchText, filterStatus, dateRange]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟${secs}秒`;
    } else if (minutes > 0) {
      return `${minutes}分钟${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  const calculateTimeSpent = (startTime: string, endTime?: string): number => {
    if (!endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  };

  const formatDateTime = (dateTime: string): string => {
    const date = new Date(dateTime);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusTag = (status: string) => {
    const statusMap = {
      COMPLETED: { color: 'green', text: '已完成' },
      IN_PROGRESS: { color: 'orange', text: '进行中' },
      TIMEOUT: { color: 'red', text: '超时' }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const typeMap = {
      PRACTICE: { color: 'blue', text: '练习模式' },
      EXAM: { color: 'purple', text: '考试模式' }
    };
    const typeInfo = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  const handleViewDetail = (record: PracticeRecord) => {
    navigate(`/practice-detail/${record.id}`);
  };

  const handleDeleteRecord = (recordId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条练习记录吗？',
      onOk: async () => {
        try {
          await practiceRecordService.deleteRecord(recordId);
          setRecords(records.filter(record => record.id !== recordId));
          message.success('删除成功');
          // 重新加载统计信息
          const stats = await practiceRecordService.getStatistics();
          setStatistics(stats);
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      }
    });
  };

  // 当筛选条件变化时，重新加载数据（排除初始加载）
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // 使用防抖，避免频繁请求
    const timer = setTimeout(() => {
      const hasFilter = filterSubject !== 'ALL' || (searchText && searchText.trim()) || filterStatus !== 'ALL' || 
                       (dateRange[0] !== null && dateRange[1] !== null);
      loadRecords(hasFilter);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filterSubject, searchText, filterStatus, dateRange, loadRecords]);

  // 直接使用 records，因为筛选已经在后端完成
  const filteredRecords = records;

  const columns = [
    {
      title: '试卷信息',
      key: 'paperInfo',
      render: (record: PracticeRecord) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {record.paperTitle || '未命名试卷'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {getTypeTag(record.examType)}
            <span style={{ marginLeft: 8 }}>
              {formatDateTime(record.startTime)}
            </span>
          </div>
        </div>
      )
    },
    {
      title: '答题情况',
      key: 'answerStatus',
      render: (record: PracticeRecord) => (
        <div>
          <div>已答: {record.answeredQuestions || 0}/{record.totalQuestions || 0}</div>
          <div>正确: {record.correctAnswers || 0}/{record.totalQuestions || 0}</div>
        </div>
      )
    },
    {
      title: '得分',
      key: 'score',
      render: (record: PracticeRecord) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {record.score || 0}/{record.totalScore || 0}
          </div>
          <div style={{ color: '#666' }}>
            正确率: {record.accuracy ? Math.round(record.accuracy) : 0}%
          </div>
        </div>
      )
    },
    {
      title: '用时',
      key: 'timeSpent',
      render: (record: PracticeRecord) => {
        const timeSpent = calculateTimeSpent(record.startTime, record.endTime);
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ClockCircleOutlined style={{ marginRight: 4, color: '#666' }} />
            {formatTime(timeSpent)}
          </div>
        );
      }
    },
    {
      title: '状态',
      key: 'status',
      render: (record: PracticeRecord) => getStatusTag(record.status)
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: PracticeRecord) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRecord(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 面包屑导航 */}
      <Breadcrumb 
        style={{ marginBottom: '16px' }}
        items={[
          {
            title: (
              <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                <HomeOutlined /> 首页
              </span>
            )
          },
          {
            title: '练习记录'
          }
        ]}
      />

      {/* 页面标题 */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TrophyOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
            <Title level={2} style={{ margin: 0 }}>练习记录</Title>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadRecords}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>
      </Card>

      {/* 认证状态提示 */}
      {isAuthenticated === false && (
        <Alert
          message="登录提示"
          description={
            <div>
              <p><strong>您当前未登录，无法查看练习记录。</strong></p>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#666' }}>
                练习记录存储在服务器上，与您的用户账户绑定。登录后，您可以在任何浏览器中查看您的所有练习记录。
              </p>
            </div>
          }
          type="warning"
          showIcon
          action={
            <Button size="small" type="primary" onClick={() => navigate('/login')}>
              立即登录
            </Button>
          }
          style={{ marginBottom: '16px' }}
        />
      )}

      {/*{isAuthenticated === true && (*/}
      {/*  <Alert*/}
      {/*    message="跨浏览器使用提示"*/}
      {/*    description={*/}
      {/*      <span style={{ fontSize: '13px' }}>*/}
      {/*        您的练习记录存储在服务器上，与账户绑定。在任何浏览器中登录您的账户后，都可以查看您的所有练习记录。*/}
      {/*        如果其他浏览器中看不到记录，请确保已在该浏览器中登录。*/}
      {/*      </span>*/}
      {/*    }*/}
      {/*    type="info"*/}
      {/*    showIcon*/}
      {/*    closable*/}
      {/*    style={{ marginBottom: '16px' }}*/}
      {/*  />*/}
      {/*)}*/}

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总记录数"
              value={statistics.totalRecords}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成记录"
              value={statistics.completedRecords}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均正确率"
              value={statistics.averageAccuracy}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总练习时间"
              value={formatTime(statistics.totalTime)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主要内容 */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Input
                placeholder="搜索试卷名称"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="选择状态"
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: '100%' }}
              >
                <Option value="ALL">全部状态</Option>
                <Option value="COMPLETED">已完成</Option>
                <Option value="IN_PROGRESS">进行中</Option>
                <Option value="TIMEOUT">超时</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="选择学科"
                value={filterSubject}
                onChange={setFilterSubject}
                style={{ width: '100%' }}
              >
                <Option value="ALL">全部学科</Option>
                {(() => {
                  const systemSubjects = subjects.filter(s => s.isSystem === true);
                  const personalSubjects = subjects.filter(s => s.isSystem === false);
                  
                  return (
                    <>
                      {systemSubjects.length > 0 && (
                        <Select.OptGroup label="系统学科">
                          {systemSubjects.map(subject => (
                            <Option key={subject.id} value={String(subject.id)}>
                              {subject.name}
                            </Option>
                          ))}
                        </Select.OptGroup>
                      )}
                      {personalSubjects.length > 0 && (
                        <Select.OptGroup label="个人学科">
                          {personalSubjects.map(subject => (
                            <Option key={subject.id} value={String(subject.id)}>
                              {subject.name}
                            </Option>
                          ))}
                        </Select.OptGroup>
                      )}
                    </>
                  );
                })()}
              </Select>
            </Col>
            <Col span={6}>
              <RangePicker
                style={{ width: '100%' }}
                value={dateRange[0] && dateRange[1] ? [dateRange[0], dateRange[1]] as [Dayjs, Dayjs] : null}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]]);
                  } else {
                    setDateRange([null, null]);
                  }
                }}
                format="YYYY-MM-DD"
              />
            </Col>
            <Col span={4}>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => loadRecords(true)}
                style={{ width: '100%' }}
              >
                搜索
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredRecords.length,
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
          }}
        />
      </Card>
    </div>
  );
};

export default PracticeRecordsPage;
