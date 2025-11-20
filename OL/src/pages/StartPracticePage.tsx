import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Typography,
  Row,
  Col,
  Alert,
  Select,
  Input,
  Tooltip,
  Breadcrumb,
  Spin,
  Popconfirm,
  Empty
} from 'antd';
import {
  PlayCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  HomeOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ExamPaper } from '../types';
import OnlinePractice from '../components/OnlinePractice';
import PaperDetailModal from '../components/PaperDetailModal';
import { examPaperService } from '../services/examPaperService';
import { useAuth } from '../contexts/AuthContext';
import { subjectApi } from '../services/api';

const { Title, Text } = Typography;
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
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);
  const [filterSubject, setFilterSubject] = useState<number | undefined>(undefined);
  const [subjects, setSubjects] = useState<Array<{id: number, name: string}>>([]);

  // 加载试卷数据
  const loadPapers = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params: any = {
        current: currentPage,
        size: pageSize,
      };
      
      // 只有当值存在时才添加到参数中
      if (searchText.trim()) {
        params.searchText = searchText.trim();
      }
      if (filterType && filterType !== 'ALL') {
        params.type = filterType;
      }
      if (filterSubject !== undefined && filterSubject !== null) {
        params.subjectId = filterSubject;
      }
      
      console.log('=== 加载试卷 ===');
      console.log('完整参数:', params);
      console.log('学科筛选ID:', filterSubject);
      console.log('学科筛选ID类型:', typeof filterSubject);
      console.log('当前用户信息:', user);
      console.log('当前用户ID:', user?.id);
      console.log('当前用户角色:', user?.role);
      
      const response = await examPaperService.getExamPapers(params);
      console.log('API响应状态码:', response);
      console.log('加载试卷结果:', {
        total: response.total,
        size: response.size,
        current: response.current,
        records: response.records?.length,
        firstRecord: response.records?.[0]
      });
      
      // 详细检查返回的数据
      if (response.records && response.records.length > 0) {
        console.log(' 成功获取到', response.records.length, '条试卷记录');
        response.records.forEach((paper: any, index: number) => {
          console.log(`试卷${index + 1}:`, {
            id: paper.id,
            title: paper.title,
            isSystem: paper.isSystem,
            creatorId: paper.creatorId,
            subject: paper.subject
          });
        });
      } else {
        console.warn('⚠️ API返回的records为空或未定义');
        console.warn('响应对象:', JSON.stringify(response, null, 2));
      }
      
      // 调试：检查返回的数据
      if (response.records && response.records.length > 0) {
        const firstRecord = response.records[0];
        console.log('第一条试卷数据（完整）:', firstRecord);
        console.log('第一条试卷数据（关键字段）:', {
          id: firstRecord.id,
          title: firstRecord.title,
          subject: firstRecord.subject,
          creatorName: firstRecord.creatorName,
          creatorId: firstRecord.creatorId,
          allKeys: Object.keys(firstRecord)
        });
        
        // 检查是否有creatorName字段
        if (!firstRecord.creatorName && firstRecord.creatorId) {
          console.warn('警告：返回的数据中没有creatorName字段，creatorId:', firstRecord.creatorId);
        }
      }
      
      // 确保数据正确映射
      const mappedPapers = (response.records || []).map((paper: any) => {
        // 调试：打印原始数据
        if (paper.id === response.records[0].id) {
          console.log('映射前的试卷数据:', JSON.stringify(paper, null, 2));
        }
        
        // 确保creatorName字段正确提取
        let creatorName = paper.creatorName;
        if (!creatorName || creatorName === 'undefined' || creatorName === 'null') {
          // 如果creatorName不存在或无效，使用creatorId
          creatorName = paper.creatorId ? `用户${paper.creatorId}` : '未知用户';
        }
        
        const mapped = {
          ...paper,
          creatorName: creatorName,
        };
        
        // 调试：打印映射后的数据
        if (paper.id === response.records[0].id) {
          console.log('映射后的试卷数据:', JSON.stringify(mapped, null, 2));
        }
        
        return mapped;
      });
      
      setPapers(mappedPapers);
      setTotal(response.total || 0);
      
      // 如果没有试卷，给出友好提示
      if (mappedPapers.length === 0 && response.total === 0) {
        console.warn('当前没有可用的试卷');
        // 不显示错误消息，因为可能只是没有数据，而不是错误
      }
    } catch (error: any) {
      console.error('加载试卷失败:', error);
      console.error('错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // 根据错误类型给出不同的提示
      if (error.response?.status === 403) {
        message.error('权限不足，无法查看试卷');
      } else if (error.response?.status === 401) {
        message.error('未登录或登录已过期，请重新登录');
      } else {
        message.error(error.message || '加载试卷失败，请检查网络连接或联系管理员');
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
        //  获取所有启用的学科（包括系统学科和个人学科）
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



  const formatDateTime = (dateTime: string): string => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('zh-CN');
  };

  const getDifficultyTag = (difficulty: string) => {
    const difficultyMap = {
      EASY: { color: 'green', text: '简单' },
      MEDIUM: { color: 'orange', text: '中等' },
      HARD: { color: 'red', text: '困难' }
    };
    const difficultyInfo = difficultyMap[difficulty as keyof typeof difficultyMap] || { color: 'default', text: difficulty };
    return <Tag color={difficultyInfo.color}>{difficultyInfo.text}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const typeMap = {
      AUTO: { color: 'blue', text: '智能生成' },
      MANUAL: { color: 'purple', text: '手动创建' }
    };
    const typeInfo = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  const handleStartPractice = (paper: ExamPaper) => {
    setSelectedPaper(paper);
    setShowPractice(true);
  };

  const handleViewDetail = (paper: ExamPaper) => {
    setDetailPaper(paper);
    setShowDetail(true);
  };

  const handlePracticeComplete = (result: any) => {
    console.log('handlePracticeComplete 被调用，结果:', result);
    
    // 从认证上下文获取用户ID
    let currentUserId = 1; // 默认值
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        currentUserId = userData.id || 1;
        console.log('从认证上下文获取用户ID:', currentUserId);
      } catch (error) {
        console.error('解析用户数据失败:', error);
      }
    }
    
    // 准备结果数据
    const resultData = {
      paperId: selectedPaper?.id,
      paperTitle: selectedPaper?.title,
      result: result,
      practiceRecord: {
        paperId: selectedPaper?.id,
        userId: currentUserId,
        studentId: currentUserId, // 学生ID与用户ID相同
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
    
    // 将结果数据存储到sessionStorage，供结果页面使用
    console.log('存储结果数据到 sessionStorage:', resultData);
    sessionStorage.setItem('practiceResult', JSON.stringify(resultData));
    
    // 关闭练习界面
    setShowPractice(false);
    setSelectedPaper(null);
    
    // 跳转到练习结果页面
    // 交由 OnlinePractice 在保存记录后执行跳转到练习详情页
  };

  const handlePracticeExit = () => {
    setShowPractice(false);
    setSelectedPaper(null);
  };

  // 直接使用从服务端返回的数据，不进行前端过滤
  const filteredPapers = papers;

  // 搜索功能
  const handleSearch = () => {
    console.log('执行搜索，当前筛选条件:', {
      searchText,
      filterType,
      filterSubject
    });
    setCurrentPage(1);
    loadPapers();
  };

  // 重置搜索
  const handleReset = () => {
    setSearchText('');
    setFilterType('ALL');
    setFilterSubject(undefined);
    setCurrentPage(1);
    loadPapers();
  };

  // 处理删除试卷
  const handleDelete = async (paper: ExamPaper) => {
    try {
      await examPaperService.deleteExamPaper(paper.id);
      message.success('试卷删除成功');
      loadPapers(); // 重新加载列表
    } catch (error: any) {
      message.error(error.message || '删除试卷失败');
    }
  };

  const columns = [
    {
      title: '试卷信息',
      key: 'paperInfo',
      render: (paper: ExamPaper) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {paper.title}
            {paper.isSystem && <Tag color="blue" style={{ marginLeft: 8 }}>系统试卷</Tag>}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
            {paper.description}
          </div>
          <div style={{ marginBottom: 4 }}>
            {(() => {
              // 如果subject是数字字符串（可能是ID），尝试转换为名称
              const subjectDisplay = paper.subject;
              if (subjectDisplay && !isNaN(Number(subjectDisplay)) && subjects.length > 0) {
                // 如果是数字，尝试从subjects列表中找到对应的名称
                const subjectId = Number(subjectDisplay);
                const subject = subjects.find(s => s.id === subjectId);
                return subject ? (
                  <Tag color="orange" style={{ marginRight: 4 }}>{subject.name}</Tag>
                ) : (
                  <Tag color="orange" style={{ marginRight: 4 }}>{subjectDisplay}</Tag>
                );
              }
              return subjectDisplay ? (
                <Tag color="orange" style={{ marginRight: 4 }}>{subjectDisplay}</Tag>
              ) : null;
            })()}
            {paper.tags && paper.tags.map((tag, index) => (
              <Tag key={index} color="blue" style={{ marginRight: 4 }}>
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      )
    },
    {
      title: '试卷配置',
      key: 'paperConfig',
      render: (paper: ExamPaper) => (
        <div>
          <div>题目数量: {paper.totalQuestions}</div>
          <div>总分: {paper.totalScore}</div>
          <div>时长: {paper.duration}分钟</div>
        </div>
      )
    },
    {
      title: '创建信息',
      key: 'creationInfo',
      render: (paper: ExamPaper) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <UserOutlined style={{ marginRight: 4, color: '#666' }} />
            {paper.creatorName || `用户${paper.creatorId}`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ClockCircleOutlined style={{ marginRight: 4, color: '#666' }} />
            {formatDateTime(paper.createdAt || paper.createTime || '')}
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (paper: ExamPaper) => (
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStartPractice(paper)}
          >
            开始练习
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(paper)}
          >
            详情
          </Button>
          {(isAdmin || !paper.isSystem) && (
            <Popconfirm
              title="确定要删除这份试卷吗？"
              description="删除后无法恢复，请谨慎操作。"
              onConfirm={() => handleDelete(paper)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

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
            title: '开始练习'
          }
        ]}
      />

      {/* 页面标题 */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PlayCircleOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
            <Title level={2} style={{ margin: 0 }}>开始练习</Title>
          </div>
        </div>
      </Card>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="搜索试卷名称或描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col span={5}>
            <Select
              placeholder="选择类型"
              value={filterType}
              onChange={setFilterType}
              style={{ width: '100%' }}
            >
              <Option value="ALL">全部类型</Option>
              <Option value="AUTO">智能生成</Option>
              <Option value="MANUAL">手动创建</Option>
            </Select>
          </Col>
          <Col span={5}>
            <Select
              placeholder="选择学科"
              value={filterSubject}
              onChange={(value) => {
                console.log('学科筛选变更:', value, '类型:', typeof value);
                setFilterSubject(value);
                setCurrentPage(1);
              }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
            >
              <Option value={undefined}>全部学科</Option>
              {subjects.map(subject => (
                <Option key={subject.id} value={subject.id}>{subject.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
              <Text type="secondary">
                共找到 {total} 份试卷
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 练习说明 */}
      <Card style={{ marginBottom: '16px' }}>
        <Alert
          message="练习说明"
          description="选择一份试卷开始在线练习。系统将记录您的答题进度和成绩，支持暂停和继续功能。"
          type="info"
          showIcon
        />
      </Card>

      {/* 试卷列表 */}
      <Card>
        {!loading && papers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <p style={{ fontSize: '16px', marginBottom: '8px' }}>暂无可用试卷</p>
                  <p style={{ fontSize: '14px', color: '#8c8c8c' }}>
                    {isAdmin 
                      ? '您还没有创建任何试卷，请先创建试卷后再开始练习。'
                      : '当前没有可用的系统试卷。如果您是管理员，请创建系统试卷；如果您是普通用户，请联系管理员创建系统试卷。'}
                  </p>
                </div>
              }
            />
          </div>
        )}
        <Table
          columns={columns}
          dataSource={filteredPapers}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['8', '16', '24', '32'],
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
        />
      </Card>

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
