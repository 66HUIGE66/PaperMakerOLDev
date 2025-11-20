import React, { useState, useEffect, useRef } from 'react';
import { 
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  message,
  Spin,
  Alert,
  Breadcrumb,
  Button,
  Space,
  Typography,
  Table,
  Tag,
  Select,
  Grid
} from 'antd';
import {
  TrophyOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  HomeOutlined,
  BookOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import { practiceRecordService, OverallStatistics, SubjectStatistics, SubjectKnowledgePointStatistics } from '../services/practiceRecordService';

const { Title, Paragraph } = Typography;

const PracticeStatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [overallStats, setOverallStats] = useState<OverallStatistics | null>(null);
  const [subjectStats, setSubjectStats] = useState<SubjectStatistics | null>(null);
  const [subjectKpStats, setSubjectKpStats] = useState<SubjectKnowledgePointStatistics | null>(null);
  const [activeTab, setActiveTab] = useState('overall');
  const [selectedSubjectForKp, setSelectedSubjectForKp] = useState<string>('');

  // 图表容器引用
  const overallChartRef = useRef<HTMLDivElement>(null);
  const subjectChartRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);
  const accuracyChartRef = useRef<HTMLDivElement>(null);
  const subjectKpChartRef = useRef<HTMLDivElement>(null);
  const subjectKpAccuracyChartRef = useRef<HTMLDivElement>(null);
  const subjectKpDistributionChartRef = useRef<HTMLDivElement>(null);

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const chartHeight = isMobile ? 320 : 400;
  const distributionHeight = isMobile ? 360 : 500;
  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    if (activeTab === 'overall' && overallStats && subjectStats) {
      // 延迟渲染，确保DOM已准备好
      setTimeout(() => {
        renderOverallChart();
        renderTrendChart();
        renderAccuracyChart();
      }, 100);
    } else if (activeTab === 'subject' && subjectStats) {
      // 延迟渲染，确保DOM已准备好
      setTimeout(() => {
        renderSubjectChart();
      }, 100);
    } else if (activeTab === 'subject-kp' && subjectKpStats && selectedSubjectForKp) {
      // 延迟渲染，确保DOM已准备好
      setTimeout(() => {
        renderSubjectKpChart();
        renderSubjectKpAccuracyChart();
        renderSubjectKpDistributionChart();
      }, 100);
    }
  }, [activeTab, overallStats, subjectStats, subjectKpStats, selectedSubjectForKp]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [overall, subject, subjectKp] = await Promise.all([
        practiceRecordService.getOverallStatistics(),
        practiceRecordService.getSubjectStatistics(),
        practiceRecordService.getSubjectKnowledgePointStatistics()
      ]);
      console.error('学科数据:', subject);
      setOverallStats(overall);
      setSubjectStats(subject);
      setSubjectKpStats(subjectKp);
      
      // 自动选择第一个学科
      if (subjectKp && subjectKp.subjects && subjectKp.subjects.length > 0) {
        setSelectedSubjectForKp(subjectKp.subjects[0].subjectName);
      }
    } catch (error: any) {
      console.error('加载统计数据失败:', error);
      if (error.message?.includes('用户未登录')) {
        message.warning('请先登录以查看统计信息');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        message.error(error.message || '加载统计数据失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // 渲染总体统计图表 - 练习学科分布
  const renderOverallChart = () => {
    if (!subjectStats || !overallChartRef.current || !subjectStats.subjects || subjectStats.subjects.length === 0) return;

    // 先销毁旧图表实例，确保刷新
    const chartDom = overallChartRef.current;
    let chart = echarts.getInstanceByDom(chartDom);
    if (chart) {
      chart.dispose();
    }
    chart = echarts.init(chartDom);
    
    // 准备学科数据
    const subjectData = subjectStats.subjects.map(subject => ({
      value: subject.practiceCount,
      name: subject.subjectName
    }));

    // 生成颜色数组
    const colors = [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#ff9f7f',
      '#919112', '#bb1112', '#32d22d'
    ];

    const option = {
      title: {
        text: '练习学科分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}次 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        type: 'scroll'
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: true,
            formatter: '{b}\n{d}%'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          itemStyle: {
            color: function(params: any) {
              return colors[params.dataIndex % colors.length];
            }
          },
          data: subjectData
        }
      ]
    };
    chart.setOption(option as any);

    // 响应式调整
    window.addEventListener('resize', () => chart.resize());
  };

  // 渲染时间趋势图表
  const renderTrendChart = () => {
    if (!overallStats || !trendChartRef.current) return;

    // 先销毁旧图表实例，确保刷新
    const chartDom = trendChartRef.current;
    let chart = echarts.getInstanceByDom(chartDom);
    if (chart) {
      chart.dispose();
    }
    chart = echarts.init(chartDom);
    const trendData = overallStats.recentPracticeTrend;
    const dates = Object.keys(trendData).sort();
    const values = dates.map(date => trendData[date]);

    const option = {
      title: {
        text: '最近7天练习趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: dates.map(date => date.substring(5)) // 只显示月-日
      },
      yAxis: {
        type: 'value',
        name: '练习次数',
        minInterval: 1, // 确保刻度为整数
        axisLabel: {
          formatter: '{value}' // 只显示整数值
        }
      },
      series: [
        {
          data: values,
          type: 'bar',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#2378f7' },
                { offset: 0.7, color: '#2378f7' },
                { offset: 1, color: '#83bff6' }
              ])
            }
          }
        }
      ]
    };
    chart.setOption(option as any);

    window.addEventListener('resize', () => chart.resize());
  };

  // 渲染正确率对比图表
  const renderAccuracyChart = () => {
    if (!overallStats || !accuracyChartRef.current) return;

    // 先销毁旧图表实例，确保刷新
    const chartDom = accuracyChartRef.current;
    let chart = echarts.getInstanceByDom(chartDom);
    if (chart) {
      chart.dispose();
    }
    chart = echarts.init(chartDom);
    const stats = overallStats.accuracyStatistics;

    const option = {
      title: {
        text: '正确率统计',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          return `${params[0].name}<br/>${params[0].seriesName}: ${params[0].value}%`;
        }
      },
      xAxis: {
        type: 'category',
        data: ['平均正确率', '最高正确率', '最低正确率']
      },
      yAxis: {
        type: 'value',
        name: '正确率(%)',
        max: 100,
        minInterval: 1, // 确保刻度为整数
        axisLabel: {
          formatter: '{value}%' // 显示为百分比整数
        }
      },
      series: [
        {
          name: '正确率',
          type: 'bar',
          data: [
            parseFloat(stats.averageAccuracy.replace('%', '')),
            parseFloat(stats.maxAccuracy.replace('%', '')),
            parseFloat(stats.minAccuracy.replace('%', ''))
          ],
          itemStyle: {
            color: function(params: any) {
              const colors = ['#91cc75', '#fac858', '#ee6666'];
              return colors[params.dataIndex];
            }
          }
        }
      ]
    };
    chart.setOption(option as any);

    window.addEventListener('resize', () => chart.resize());
  };

  // 渲染学科统计图表
  const renderSubjectChart = () => {
    if (!subjectStats || !subjectChartRef.current || subjectStats.subjects.length === 0) return;

    // 先销毁旧图表实例，确保刷新
    const chartDom = subjectChartRef.current;
    let chart = echarts.getInstanceByDom(chartDom);
    if (chart) {
      chart.dispose();
    }
    chart = echarts.init(chartDom);
    
    const subjects = subjectStats.subjects;
    const subjectNames = subjects.map(s => s.subjectName);
    const practiceCounts = subjects.map(s => s.practiceCount);

    const option = {
      title: {
        text: '各学科练习次数',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: subjectNames,
        axisLabel: {
          rotate: 45,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: '练习次数',
        minInterval: 1, // 确保刻度为整数
        axisLabel: {
          formatter: '{value}' // 只显示整数值
        }
      },
      series: [
        {
          data: practiceCounts,
          type: 'bar',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#5470c6' },
              { offset: 1, color: '#91cc75' }
            ])
          }
        }
      ]
    };
    chart.setOption(option as any);

    window.addEventListener('resize', () => chart.resize());
  };

  // 渲染学科知识点统计图表 - 练习次数和题目数
  const renderSubjectKpChart = () => {
    if (!subjectKpStats || !subjectKpChartRef.current || !selectedSubjectForKp) return;

    const selectedSubject = subjectKpStats.subjects.find(s => s.subjectName === selectedSubjectForKp);
    if (!selectedSubject || !selectedSubject.knowledgePoints || selectedSubject.knowledgePoints.length === 0) return;

    // 先销毁旧图表实例，确保刷新
    const chartDom = subjectKpChartRef.current;
    let chart = echarts.getInstanceByDom(chartDom);
    if (chart) {
      chart.dispose();
    }
    chart = echarts.init(chartDom);

    const knowledgePoints = selectedSubject.knowledgePoints;
    const kpNames = knowledgePoints.map(kp => kp.knowledgePointName);
    const practiceCounts = knowledgePoints.map(kp => kp.practiceCount);
    const questionCounts = knowledgePoints.map(kp => kp.questionCount);

    const option = {
      title: {
        text: `${selectedSubjectForKp} - 知识点学习情况`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['练习次数', '题目数'],
        top: 30
      },
      xAxis: {
        type: 'category',
        data: kpNames,
        axisLabel: {
          rotate: 45,
          interval: 0
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '练习次数',
          position: 'left',
          minInterval: 1
        },
        {
          type: 'value',
          name: '题目数',
          position: 'right',
          minInterval: 1
        }
      ],
      series: [
        {
          name: '练习次数',
          type: 'bar',
          data: practiceCounts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#5470c6' },
              { offset: 1, color: '#91cc75' }
            ])
          }
        },
        {
          name: '题目数',
          type: 'bar',
          yAxisIndex: 1,
          data: questionCounts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#fac858' },
              { offset: 1, color: '#ee6666' }
            ])
          }
        }
      ]
    };
    chart.setOption(option as any);

    window.addEventListener('resize', () => chart.resize());
  };

  // 渲染学科知识点正确率图表
  const renderSubjectKpAccuracyChart = () => {
    if (!subjectKpStats || !subjectKpAccuracyChartRef.current || !selectedSubjectForKp) return;

    const selectedSubject = subjectKpStats.subjects.find(s => s.subjectName === selectedSubjectForKp);
    if (!selectedSubject || !selectedSubject.knowledgePoints || selectedSubject.knowledgePoints.length === 0) return;

    // 先销毁旧图表实例，确保刷新
    const chartDom = subjectKpAccuracyChartRef.current;
    let chart = echarts.getInstanceByDom(chartDom);
    if (chart) {
      chart.dispose();
    }
    chart = echarts.init(chartDom);

    const knowledgePoints = selectedSubject.knowledgePoints;
    const kpNames = knowledgePoints.map(kp => kp.knowledgePointName);
    const accuracies = knowledgePoints.map(kp => parseFloat(kp.accuracy.replace('%', '')));

    const option = {
      title: {
        text: `${selectedSubjectForKp} - 知识点正确率`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const param = params[0];
          return `${param.name}<br/>${param.seriesName}: ${param.value}%`;
        }
      },
      xAxis: {
        type: 'category',
        data: kpNames,
        axisLabel: {
          rotate: 45,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: '正确率(%)',
        max: 100,
        minInterval: 1,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: '正确率',
          type: 'bar',
          data: accuracies.map((acc) => ({
            value: acc,
            itemStyle: {
              color: acc >= 80 ? '#91cc75' : acc >= 60 ? '#fac858' : '#ee6666'
            }
          })),
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%'
          }
        }
      ]
    };
    chart.setOption(option as any);

    window.addEventListener('resize', () => chart.resize());
  };

  // 渲染学科知识点分布图表（饼图）- 只显示已练习的知识点
  const renderSubjectKpDistributionChart = () => {
    if (!subjectKpStats || !subjectKpDistributionChartRef.current || !selectedSubjectForKp) return;

    const selectedSubject = subjectKpStats.subjects.find(s => s.subjectName === selectedSubjectForKp);
    if (!selectedSubject || !selectedSubject.knowledgePoints || selectedSubject.knowledgePoints.length === 0) return;

    // 先销毁旧图表实例，确保刷新
    const chartDom = subjectKpDistributionChartRef.current;
    let chart = echarts.getInstanceByDom(chartDom);
    if (chart) {
      chart.dispose();
    }
    chart = echarts.init(chartDom);

    // 只显示已练习的知识点（practiceCount > 0）
    const knowledgePoints = selectedSubject.knowledgePoints.filter(kp => kp.practiceCount > 0);
    
    if (knowledgePoints.length === 0) {
      // 如果没有已练习的知识点，显示提示
      chart.setOption({
        title: {
          text: `${selectedSubjectForKp} - 已练习的知识点题目分布`,
          left: 'center'
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无已练习的知识点',
            fontSize: 16,
            fill: '#999'
          }
        }
      } as any);
      return;
    }
    
    // 按题目数分布
    const distributionData = knowledgePoints.map(kp => ({
      value: kp.questionCount,
      name: kp.knowledgePointName
    }));

    // 生成颜色数组
    const colors = [
      '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
      '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#ff9f7f',
      '#919112', '#bb1112', '#32d22d', '#ff6b6b', '#4ecdc4'
    ];

    const option = {
      title: {
        text: `${selectedSubjectForKp} - 已练习的知识点题目分布`,
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}题 ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 10,
        type: 'scroll',
        itemWidth: 14,
        itemHeight: 14,
        textStyle: {
          fontSize: 12
        }
      },
      series: [
        {
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
            color: function(params: any) {
              return colors[params.dataIndex % colors.length];
            }
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 12
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          data: distributionData
        }
      ]
    };
    chart.setOption(option as any);

    window.addEventListener('resize', () => chart.resize());
  };

  // 学科统计表格列
  const subjectColumns = [
    {
      title: '学科名称',
      dataIndex: 'subjectName',
      key: 'subjectName',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '练习次数',
      dataIndex: 'practiceCount',
      key: 'practiceCount',
      sorter: (a: any, b: any) => a.practiceCount - b.practiceCount,
      render: (count: number) => <strong>{count}</strong>
    },
    {
      title: '平均得分',
      dataIndex: ['statistics', 'averageScore'],
      key: 'averageScore'
    },
    {
      title: '平均正确率',
      dataIndex: ['statistics', 'averageAccuracy'],
      key: 'averageAccuracy',
      render: (text: string) => {
        const value = parseFloat(text.replace('%', ''));
        const color = value >= 80 ? 'green' : value >= 60 ? 'orange' : 'red';
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '总题目数',
      dataIndex: ['statistics', 'totalQuestions'],
      key: 'totalQuestions'
    },
    {
      title: '正确题数',
      dataIndex: ['statistics', 'totalCorrect'],
      key: 'totalCorrect'
    },
    
  ];

  if (loading && !overallStats) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
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
            title: '学习统计'
          }
        ]}
      />

      {/* 页面标题 */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BarChartOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
            <Title level={2} style={{ margin: 0 }}>学习统计</Title>
            <span style={{ marginLeft: '16px', color: '#52c41a', fontSize: '12px', background: '#f6ffed', padding: '4px 8px', borderRadius: '4px' }}>
              v2.0 - 新版统计页面
            </span>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadStatistics}
              loading={loading}
            >
              刷新数据
            </Button>
          </Space>
        </div>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        destroyInactiveTabPane={false}
        items={[
          {
            key: 'overall',
            label: <span><TrophyOutlined />总体统计</span>,
            children: overallStats ? (
              <div>
                {/* 核心指标卡片 */}
                <Row gutter={16} style={{ marginBottom: '16px' }}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="总记录数"
                        value={overallStats.summary.totalRecords}
                        prefix={<BookOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="完成记录"
                        value={overallStats.summary.completedRecords}
                        prefix={<CheckCircleOutlined />}
                        suffix={`/ ${overallStats.summary.totalRecords}`}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="平均正确率"
                        value={overallStats.accuracyStatistics.averageAccuracy}
                        suffix=""
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="完成率"
                        value={overallStats.summary.completionRate}
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginBottom: '16px' }}>
                  <Col span={12}>
                    <Card title="得分统计">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>总分: <strong>{overallStats.scoreStatistics.totalScore}</strong></div>
                        <div>平均分: <strong>{overallStats.scoreStatistics.averageScore}</strong></div>
                        <div>最高分: <strong>{overallStats.scoreStatistics.maxScore}</strong></div>
                        <div>最低分: <strong>{overallStats.scoreStatistics.minScore}</strong></div>
                      </Space>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="模式统计">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>练习次数: <strong>{overallStats.typeStatistics.practiceCount}</strong></div>
                        <div>考试次数: <strong>{overallStats.typeStatistics.examCount}</strong></div>
                        <div>练习占比: <strong>{overallStats.typeStatistics.practicePercentage}</strong></div>
                        <div>考试占比: <strong>{overallStats.typeStatistics.examPercentage}</strong></div>
                      </Space>
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginBottom: '16px' }}>
                  <Col span={12}>
                    <Card title="时间统计">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>总用时: <strong>{overallStats.timeStatistics.totalTimeFormatted}</strong></div>
                        <div>平均用时: <strong>{overallStats.timeStatistics.averageTimeFormatted}</strong></div>
                        <div>最长用时: <strong>{overallStats.timeStatistics.maxTimeFormatted}</strong></div>
                        <div>最短用时: <strong>{overallStats.timeStatistics.minTimeFormatted}</strong></div>
                      </Space>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="答题统计">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>总题目数: <strong>{overallStats.questionStatistics.totalQuestions}</strong></div>
                        <div>已答题数: <strong>{overallStats.questionStatistics.totalAnswered}</strong></div>
                        <div>正确题数: <strong>{overallStats.questionStatistics.totalCorrect}</strong></div>
                        <div>答题率: <strong>{overallStats.questionStatistics.answerRate}</strong></div>
                        <div>正确率: <strong>{overallStats.questionStatistics.correctRate}</strong></div>
                      </Space>
                    </Card>
                  </Col>
                </Row>

                {/* 图表区域 */}
                <Row gutter={16} style={{ marginBottom: '16px' }}>
                  <Col span={12}>
                    <Card>
                      <div ref={overallChartRef} style={{ width: '100%', height: chartHeight }}></div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <div ref={trendChartRef} style={{ width: '100%', height: chartHeight }}></div>
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={24}>
                    <Card>
                      <div ref={accuracyChartRef} style={{ width: '100%', height: chartHeight }}></div>
                    </Card>
                  </Col>
                </Row>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
              </div>
            )
          },
          {
            key: 'subject',
            label: <span><BookOutlined />学科分类统计</span>,
            children: subjectStats ? (
              <div>
                {/* 学科统计概览 */}
                <Row gutter={16} style={{ marginBottom: '16px' }}>
                  <Col span={24}>
                    <Card>
                      <Statistic
                        title="涉及学科总数"
                        value={subjectStats.totalSubjects}
                        prefix={<BookOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* 学科统计图表 */}
                <Card style={{ marginBottom: '16px' }}>
                  <div ref={subjectChartRef} style={{ width: '100%', height: chartHeight }}></div>
                </Card>

                {/* 学科统计表格 */}
                <Card title="学科详细统计">
                  <Table
                    columns={subjectColumns}
                    dataSource={subjectStats.subjects}
                    rowKey="subjectName"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                  />
                </Card>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
              </div>
            )
          },
          {
            key: 'subject-kp',
            label: <span><BookOutlined />学科知识点统计</span>,
            children: subjectKpStats ? (
              <div>
                {/* 学科选择器和统计概览 */}
                <Row gutter={16} style={{ marginBottom: '16px' }}>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="涉及学科总数"
                        value={subjectKpStats.totalSubjects}
                        prefix={<BookOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>选择学科：</strong>
                      </div>
                      <Select
                        value={selectedSubjectForKp}
                        onChange={(value) => setSelectedSubjectForKp(value)}
                        style={{ width: '100%' }}
                        placeholder="请选择学科"
                      >
                        {subjectKpStats.subjects.map(subject => (
                          <Select.Option key={subject.subjectName} value={subject.subjectName}>
                            {subject.subjectName} ({subject.totalKnowledgePoints}个知识点)
                          </Select.Option>
                        ))}
                      </Select>
                    </Card>
                  </Col>
                </Row>

                {/* 当前选中学科的统计信息 */}
                {selectedSubjectForKp && (() => {
                  const selectedSubject = subjectKpStats.subjects.find(s => s.subjectName === selectedSubjectForKp);
                  if (!selectedSubject) return null;
                  
                  return (
                    <div>
                      {/* 统计卡片 */}
                      <Row gutter={16} style={{ marginBottom: '16px' }}>
                        <Col span={6}>
                          <Card>
                            <Statistic
                              title="知识点总数"
                              value={selectedSubject.totalKnowledgePoints}
                              prefix={<BookOutlined />}
                            />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card>
                            <Statistic
                              title="总题目数"
                              value={selectedSubject.knowledgePoints.reduce((sum, kp) => sum + kp.questionCount, 0)}
                            />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card>
                            <Statistic
                              title="总正确数"
                              value={selectedSubject.knowledgePoints.reduce((sum, kp) => sum + kp.correctCount, 0)}
                            />
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card>
                            <Statistic
                              title="平均正确率"
                              value={
                                selectedSubject.knowledgePoints.length > 0
                                  ? (
                                      selectedSubject.knowledgePoints.reduce((sum, kp) => 
                                        sum + parseFloat(kp.accuracy.replace('%', '')), 0
                                      ) / selectedSubject.knowledgePoints.length
                                    ).toFixed(2) + '%'
                                  : '0%'
                              }
                            />
                          </Card>
                        </Col>
                      </Row>

                      {/* 图表区域 */}
                      <Row gutter={16} style={{ marginBottom: '16px' }}>
                        <Col span={24}>
                          <Card>
                            <div ref={subjectKpChartRef} style={{ width: '100%', height: '400px' }}></div>
                          </Card>
                        </Col>
                      </Row>

                      {/* 已练习知识点题目分布 - 单独一行 */}
                      <Row gutter={16} style={{ marginBottom: '16px' }}>
                        <Col span={24}>
                          <Card>
                            <div ref={subjectKpDistributionChartRef} style={{ width: '100%', height: distributionHeight }}></div>
                          </Card>
                        </Col>
                      </Row>

                      <Row gutter={16} style={{ marginBottom: '16px' }}>
                        <Col span={24}>
                          <Card>
                            <div ref={subjectKpAccuracyChartRef} style={{ width: '100%', height: chartHeight }}></div>
                          </Card>
                        </Col>
                      </Row>

                      {/* 详细数据表格 */}
                      <Card title={`${selectedSubjectForKp} - 知识点详细统计`}>
                        <Table
                          columns={[
                            {
                              title: '知识点名称',
                              dataIndex: 'knowledgePointName',
                              key: 'knowledgePointName',
                              render: (text: string) => <Tag color="purple">{text}</Tag>
                            },
                            {
                              title: '练习次数',
                              dataIndex: 'practiceCount',
                              key: 'practiceCount',
                              sorter: (a: any, b: any) => a.practiceCount - b.practiceCount,
                              render: (count: number) => <strong>{count}</strong>
                            },
                            {
                              title: '题目数',
                              dataIndex: 'questionCount',
                              key: 'questionCount',
                              sorter: (a: any, b: any) => a.questionCount - b.questionCount
                            },
                            {
                              title: '正确数',
                              dataIndex: 'correctCount',
                              key: 'correctCount',
                              sorter: (a: any, b: any) => a.correctCount - b.correctCount
                            },
                            {
                              title: '正确率',
                              dataIndex: 'accuracy',
                              key: 'accuracy',
                              sorter: (a: any, b: any) => {
                                const aVal = parseFloat(a.accuracy.replace('%', ''));
                                const bVal = parseFloat(b.accuracy.replace('%', ''));
                                return aVal - bVal;
                              },
                              render: (text: string) => {
                                const value = parseFloat(text.replace('%', ''));
                                const color = value >= 80 ? 'green' : value >= 60 ? 'orange' : 'red';
                                return <Tag color={color}>{text}</Tag>;
                              }
                            },
                            
                          ]}
                          dataSource={selectedSubject.knowledgePoints}
                          rowKey="knowledgePointName"
                          pagination={false}
                          size="small"
                          scroll={{ x: 'max-content' }}
                        />
                      </Card>
                    </div>
                  );
                })()}

                {!selectedSubjectForKp && (
                  <Card>
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      请选择一个学科查看知识点统计
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
              </div>
            )
          }
        ]}
      />
    </div>
  );
};

export default PracticeStatisticsPage;
