import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  message,
  Spin,
  Button,
  Space,
  Empty,
  Select,
  Grid
} from 'antd';
import {
  BarChartOutlined,
  ReloadOutlined,
  HomeOutlined,
  BookOutlined,
  CheckCircleOutlined,
  PieChartOutlined,
  LineChartOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import { practiceRecordService, OverallStatistics, SubjectStatistics, SubjectKnowledgePointStatistics } from '../services/practiceRecordService';
import './PracticeStatisticsPage.css';

const { Option } = Select;

const PracticeStatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [overallStats, setOverallStats] = useState<OverallStatistics | null>(null);
  const [subjectStats, setSubjectStats] = useState<SubjectStatistics | null>(null);
  const [subjectKpStats, setSubjectKpStats] = useState<SubjectKnowledgePointStatistics | null>(null);
  const [activeTab, setActiveTab] = useState('overall');
  const [selectedSubjectForKp, setSelectedSubjectForKp] = useState<string>('');

  // Refs
  const overallChartRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);
  const accuracyChartRef = useRef<HTMLDivElement>(null);
  const subjectChartRef = useRef<HTMLDivElement>(null);
  const subjectKpChartRef = useRef<HTMLDivElement>(null);
  const subjectKpDistributionChartRef = useRef<HTMLDivElement>(null);

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    // Render charts based on active tab
    const timer = setTimeout(() => {
      if (activeTab === 'overall' && overallStats && subjectStats) {
        renderOverallChart();
        renderTrendChart();
        renderAccuracyChart();
      } else if (activeTab === 'subject' && subjectStats) {
        renderSubjectChart();
      } else if (activeTab === 'subject-kp' && subjectKpStats && selectedSubjectForKp) {
        renderSubjectKpChart();
        renderSubjectKpDistributionChart();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [activeTab, overallStats, subjectStats, subjectKpStats, selectedSubjectForKp]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [overall, subject, subjectKp] = await Promise.all([
        practiceRecordService.getOverallStatistics(),
        practiceRecordService.getSubjectStatistics(),
        practiceRecordService.getSubjectKnowledgePointStatistics()
      ]);
      setOverallStats(overall);
      setSubjectStats(subject);
      setSubjectKpStats(subjectKp);

      if (subjectKp?.subjects?.length > 0) {
        setSelectedSubjectForKp(subjectKp.subjects[0].subjectName);
      }
    } catch (error: any) {
      if (error.message?.includes('用户未登录')) {
        message.warning('请先登录以查看统计信息');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        message.error('加载统计数据失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Chart Rendering Functions ---

  const renderOverallChart = () => {
    if (!subjectStats?.subjects?.length || !overallChartRef.current) return;
    const chart = echarts.init(overallChartRef.current);
    const data = subjectStats.subjects.map(s => ({ value: s.practiceCount, name: s.subjectName }));

    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: '0%', left: 'center' },
      series: [{
        name: '练习分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        data: data
      }]
    });
    window.addEventListener('resize', () => chart.resize());
  };

  const renderTrendChart = () => {
    if (!overallStats?.recentPracticeTrend || !trendChartRef.current) return;
    const chart = echarts.init(trendChartRef.current);
    const dates = Object.keys(overallStats.recentPracticeTrend).sort();
    const values = dates.map(d => overallStats.recentPracticeTrend[d]);

    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: dates.map(d => d.substring(5)) },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        data: values,
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24,144,255,0.5)' },
            { offset: 1, color: 'rgba(24,144,255,0.05)' }
          ])
        },
        itemStyle: { color: '#1890ff' }
      }]
    });
    window.addEventListener('resize', () => chart.resize());
  };

  const renderAccuracyChart = () => {
    if (!overallStats?.accuracyStatistics || !accuracyChartRef.current) return;
    const chart = echarts.init(accuracyChartRef.current);
    const { averageAccuracy, maxAccuracy, minAccuracy } = overallStats.accuracyStatistics;

    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['平均', '最高', '最低'] },
      yAxis: { type: 'value', max: 100 },
      series: [{
        type: 'bar',
        data: [
          parseFloat(averageAccuracy),
          parseFloat(maxAccuracy),
          parseFloat(minAccuracy)
        ],
        itemStyle: {
          color: (params: any) => {
            const colors = ['#1890ff', '#52c41a', '#ff4d4f'];
            return colors[params.dataIndex];
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '40%'
      }]
    });
    window.addEventListener('resize', () => chart.resize());
  };

  const renderSubjectChart = () => {
    if (!subjectStats?.subjects?.length || !subjectChartRef.current) return;
    const chart = echarts.init(subjectChartRef.current);
    const names = subjectStats.subjects.map(s => s.subjectName);
    const counts = subjectStats.subjects.map(s => s.practiceCount);

    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: { type: 'category', data: names, axisLabel: { interval: 0, rotate: 30 } },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: counts,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#722ed1' },
            { offset: 1, color: '#b37feb' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }]
    });
    window.addEventListener('resize', () => chart.resize());
  };

  const renderSubjectKpChart = () => {
    if (!subjectKpStats || !subjectKpChartRef.current) return;
    const subj = subjectKpStats.subjects.find(s => s.subjectName === selectedSubjectForKp);
    if (!subj?.knowledgePoints?.length) {
      echarts.init(subjectKpChartRef.current).dispose(); // clear if empty
      return;
    }

    const chart = echarts.init(subjectKpChartRef.current);
    const kps = subj.knowledgePoints;

    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['题目数', '正确率(%)'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: kps.map(k => k.knowledgePointName),
        axisLabel: { interval: 0, rotate: 45 }
      },
      yAxis: [
        { type: 'value', name: '题目数' },
        { type: 'value', name: '正确率', max: 100 }
      ],
      series: [
        {
          name: '题目数',
          type: 'bar',
          data: kps.map(k => k.questionCount),
          itemStyle: { color: '#fa8c16', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '正确率(%)',
          type: 'line',
          yAxisIndex: 1,
          data: kps.map(k => parseFloat(k.accuracy)),
          itemStyle: { color: '#52c41a' },
          smooth: true
        }
      ]
    });
    window.addEventListener('resize', () => chart.resize());
  };

  const renderSubjectKpDistributionChart = () => {
    if (!subjectKpStats || !subjectKpDistributionChartRef.current) return;
    const subj = subjectKpStats.subjects.find(s => s.subjectName === selectedSubjectForKp);
    if (!subj?.knowledgePoints?.length) return;

    const chart = echarts.init(subjectKpDistributionChartRef.current);
    const data = subj.knowledgePoints
      .filter(k => k.questionCount > 0)
      .map(k => ({ value: k.questionCount, name: k.knowledgePointName }));

    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: [30, 100],
        roseType: 'area',
        itemStyle: { borderRadius: 8 },
        data: data
      }]
    });
    window.addEventListener('resize', () => chart.resize());
  };

  const getSummaryCards = () => {
    if (!overallStats) return null;
    return (
      <div className="summary-cards">
        <div className="summary-card blue">
          <div className="summary-icon" style={{ color: '#1890ff' }}><BookOutlined /></div>
          <div className="summary-value">{overallStats.summary.totalRecords}</div>
          <div className="summary-label">总练习次数</div>
        </div>
        <div className="summary-card green">
          <div className="summary-icon" style={{ color: '#52c41a' }}><CheckCircleOutlined /></div>
          <div className="summary-value">{overallStats.summary.completedRecords}</div>
          <div className="summary-label">已完成练习</div>
        </div>
        <div className="summary-card orange">
          <div className="summary-icon" style={{ color: '#fa8c16' }}><ThunderboltOutlined /></div>
          <div className="summary-value">{overallStats.accuracyStatistics.averageAccuracy}</div>
          <div className="summary-label">平均正确率</div>
        </div>
        <div className="summary-card purple">
          <div className="summary-icon" style={{ color: '#722ed1' }}><PieChartOutlined /></div>
          <div className="summary-value">{overallStats.summary.completionRate}</div>
          <div className="summary-label">完成率</div>
        </div>
      </div>
    );
  };

  return (
    <div className="statistics-container">
      {/* Hero Section */}
      <div className="statistics-hero animate-fade-up">
        <div className="hero-header">
          <div className="page-title">
            <BarChartOutlined style={{ color: '#1890ff', fontSize: 32 }} />
            <span>学习数据中心</span>
          </div>
          <Space>
            <Button onClick={() => navigate('/')} icon={<HomeOutlined />}>返回首页</Button>
            <Button type="primary" onClick={loadStatistics} icon={<ReloadOutlined />} loading={loading}>刷新数据</Button>
          </Space>
        </div>
        {loading && !overallStats ? <div style={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin /></div> : getSummaryCards()}
      </div>

      {!loading && (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="custom-tabs animate-fade-up"
          style={{ animationDelay: '0.1s' }}
          items={[
            {
              key: 'overall',
              label: <span><PieChartOutlined /> 总体概览</span>,
              children: (
                <div className="charts-grid">
                  <div className="chart-card">
                    <div className="chart-header">
                      <span className="chart-title">近期练习趋势</span>
                    </div>
                    <div ref={trendChartRef} style={{ height: 350, width: '100%' }} />
                  </div>
                  <div className="chart-card">
                    <div className="chart-header">
                      <span className="chart-title">学科练习分布</span>
                    </div>
                    <div ref={overallChartRef} style={{ height: 350, width: '100%' }} />
                  </div>
                  <div className="chart-card full-width">
                    <div className="chart-header">
                      <span className="chart-title">正确率分析</span>
                    </div>
                    <div ref={accuracyChartRef} style={{ height: 300, width: '100%' }} />
                  </div>
                </div>
              )
            },
            {
              key: 'subject',
              label: <span><BarChartOutlined /> 学科统计</span>,
              children: (
                <div className="chart-card animate-fade-up">
                  <div className="chart-header">
                    <span className="chart-title">各学科练习量对比</span>
                  </div>
                  <div ref={subjectChartRef} style={{ height: 500, width: '100%' }} />
                </div>
              )
            },
            {
              key: 'subject-kp',
              label: <span><LineChartOutlined /> 知识点分析</span>,
              children: (
                <div className="animate-fade-up">
                  <Card style={{ marginBottom: 24, borderRadius: 12 }}>
                    <span style={{ marginRight: 16, fontWeight: 500 }}>选择学科:</span>
                    <Select
                      style={{ width: 200 }}
                      value={selectedSubjectForKp}
                      onChange={setSelectedSubjectForKp}
                    >
                      {subjectKpStats?.subjects.map(s => (
                        <Option key={s.subjectName} value={s.subjectName}>{s.subjectName}</Option>
                      ))}
                    </Select>
                  </Card>

                  <div className="charts-grid">
                    <div className="chart-card full-width">
                      <div className="chart-header">
                        <span className="chart-title">{selectedSubjectForKp} - 知识点掌握情况</span>
                      </div>
                      <div ref={subjectKpChartRef} style={{ height: 400, width: '100%' }} />
                    </div>
                    <div className="chart-card full-width">
                      <div className="chart-header">
                        <span className="chart-title">{selectedSubjectForKp} - 题目分布</span>
                      </div>
                      <div ref={subjectKpDistributionChartRef} style={{ height: 500, width: '100%' }} />
                    </div>
                  </div>
                </div>
              )
            }
          ]}
        />
      )}
    </div>
  );
};

export default PracticeStatisticsPage;
