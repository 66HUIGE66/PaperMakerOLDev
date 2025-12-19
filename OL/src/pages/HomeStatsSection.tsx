import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Statistic } from 'antd';
import {
  FileTextOutlined,
  DeploymentUnitOutlined,
  ReadOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store';
import { questionService } from '../services/questionService';
import { examPaperService } from '../services/examPaperService';
import { practiceRecordService } from '../services/practiceRecordService';
import { examRuleApi } from '../services/api';

const { Title, Text } = Typography as any;

const HomeStatsSection: React.FC = () => {
  const { questions, examRules, examPapers, examRecords } = useAppStore();
  const [counts, setCounts] = useState({
    questions: questions.length,
    rules: examRules.length,
    papers: examPapers.length,
    records: examRecords.length,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, pRes, rRes, recRes] = await Promise.all([
          questionService.getAllQuestions(1, 1).catch(() => null),
          examPaperService.getExamPapers({ current: 1, size: 1 }).catch(() => null),
          examRuleApi.getRules({ page: 1, size: 1 }).catch(() => null),
          practiceRecordService.getOverallStatistics().catch(() => null),
        ]);

        const qTotal = qRes ? (qRes.total ?? qRes.records?.length ?? 0) : questions.length;
        const pTotal = pRes ? (pRes.total ?? pRes.records?.length ?? 0) : examPapers.length;

        let rTotal = examRules.length;
        if (rRes && (rRes as any).data) {
          const d = (rRes as any).data;
          rTotal = d?.data?.total ?? d?.object?.total ?? (Array.isArray(d?.data?.records) ? d.data.records.length : rTotal);
        }

        const recTotal = recRes ? recRes.summary?.totalRecords ?? 0 : examRecords.length;

        setCounts({ questions: qTotal, rules: rTotal, papers: pTotal, records: recTotal });
      } catch { }
    };
    load();
  }, []);

  const stats = [
    { title: '题目总数', value: counts.questions, icon: <ReadOutlined />, color: '#1890ff' },
    { title: '组卷规则', value: counts.rules, icon: <DeploymentUnitOutlined />, color: '#722ed1' },
    { title: '试卷库存', value: counts.papers, icon: <FileTextOutlined />, color: '#fa8c16' },
    { title: '练习人次', value: counts.records, icon: <TrophyOutlined />, color: '#52c41a' },
  ];

  return (
    <div className="home-section">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2} className="home-section-title">平台数据</Title>
        <Text className="home-section-desc">海量题库支撑，见证你的每一次成长</Text>
      </div>
      <Row gutter={[24, 24]}>
        {stats.map((s, i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <Card hoverable className="home-stats-card">
              <div style={{ fontSize: 32, color: s.color, marginBottom: 8 }}>
                {s.icon}
              </div>
              <div className="stats-value">{s.value}</div>
              <div style={{ color: '#8c8c8c' }}>{s.title}</div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default HomeStatsSection;