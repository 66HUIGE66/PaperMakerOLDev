import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Statistic } from 'antd';
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
      } catch {}
    };
    load();
  }, []);

  const stats = [
    { title: '题目数量', value: counts.questions },
    { title: '规则数量', value: counts.rules },
    { title: '试卷数量', value: counts.papers },
    { title: '练习记录', value: counts.records },
  ];

  return (
    <div className="home-section" style={{ marginTop: 40 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Title level={3} className="home-section-title">数据概览</Title>
        <Text type="secondary">系统内容与学习成果的简要统计</Text>
      </div>
      <Row gutter={[24, 24]}>
        {stats.map((s, i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <Card hoverable className="home-stats-card" style={{ textAlign: 'center' }}>
              <Statistic title={s.title} value={s.value} valueStyle={{ fontSize: 24 }} />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default HomeStatsSection;