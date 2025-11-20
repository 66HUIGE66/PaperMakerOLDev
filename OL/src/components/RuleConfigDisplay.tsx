import React from 'react';
import { Card, Progress, Tag, Descriptions, Row, Col, Space, Typography, Divider } from 'antd';
import { 
  BookOutlined, 
  ClockCircleOutlined, 
  AimOutlined,
  BarChartOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface KnowledgePoint {
  name: string;
  weight: number;
}

interface QuestionType {
  type: string;
  count: number;
  score: number;
}

interface RuleConfig {
  questionTypes?: QuestionType[];
  knowledgePoints?: KnowledgePoint[];
  specialRequirements?: string;
  totalQuestions?: number;
  totalScore?: number;
  duration?: number;
  [key: string]: any;
}

interface RuleConfigDisplayProps {
  config: RuleConfig;
}

const RuleConfigDisplay: React.FC<RuleConfigDisplayProps> = ({ config }) => {
  const getProgressColor = (weight: number) => {
    if (weight >= 20) return '#52c41a'; // 绿色
    if (weight >= 15) return '#1890ff'; // 蓝色
    if (weight >= 10) return '#faad14'; // 橙色
    return '#f5222d'; // 红色
  };

  const getProgressStatus = (weight: number) => {
    if (weight >= 20) return 'success';
    if (weight >= 15) return 'normal';
    if (weight >= 10) return 'active';
    return 'exception';
  };

  const formatQuestionType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'SINGLE_CHOICE': '单选题',
      'MULTIPLE_CHOICE': '多选题',
      'FILL_BLANK': '填空题',
      'TRUE_FALSE': '判断题',
      'SHORT_ANSWER': '简答题'
    };
    return typeMap[type] || type;
  };

  const renderKnowledgePoints = () => {
    if (!config.knowledgePoints || config.knowledgePoints.length === 0) {
      return null;
    }

    return (
      <Card 
        title={
          <Space>
            <BookOutlined />
            <Text strong>知识点权重分布</Text>
          </Space>
        } 
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          {config.knowledgePoints.map((point, index) => (
            <Col span={12} key={index}>
              <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 14 }}>
                    {point.name}
                  </Text>
                  <Text type="secondary" style={{ float: 'right', fontSize: 12 }}>
                    {point.weight}%
                  </Text>
                </div>
                <Progress
                  percent={point.weight}
                  strokeColor={getProgressColor(point.weight)}
                  status={getProgressStatus(point.weight)}
                  strokeWidth={8}
                  showInfo={false}
                />
                <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                  {point.weight >= 20 ? '重点知识点' : 
                   point.weight >= 15 ? '重要知识点' : 
                   point.weight >= 10 ? '一般知识点' : '基础知识点'}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
        
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f5ff', borderRadius: 6 }}>
          <Space>
            <BarChartOutlined style={{ color: '#1890ff' }} />
            <Text strong>权重分析：</Text>
          </Space>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col>
              <Text type="secondary">总知识点：</Text>
              <Text strong>{config.knowledgePoints.length} 个</Text>
            </Col>
            <Col>
              <Text type="secondary">平均权重：</Text>
              <Text strong>
                {Math.round(config.knowledgePoints.reduce((sum, p) => sum + p.weight, 0) / config.knowledgePoints.length)}%
              </Text>
            </Col>
            <Col>
              <Text type="secondary">最高权重：</Text>
              <Text strong>
                {Math.max(...config.knowledgePoints.map(p => p.weight))}%
              </Text>
            </Col>
          </Row>
        </div>
      </Card>
    );
  };

  const renderQuestionTypes = () => {
    if (!config.questionTypes || config.questionTypes.length === 0) {
      return null;
    }

    const totalQuestions = config.questionTypes.reduce((sum, type) => sum + type.count, 0);
    const totalScore = config.questionTypes.reduce((sum, type) => sum + (type.count * type.score), 0);

    return (
      <Card 
        title={
          <Space>
            <AimOutlined />
            <Text strong>题型配置</Text>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          {config.questionTypes.map((questionType, index) => {
            const percentage = Math.round((questionType.count / totalQuestions) * 100);
            return (
              <Col span={8} key={index}>
                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                  <div style={{ textAlign: 'center', marginBottom: 12 }}>
                    <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                      {questionType.count}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      题目数量
                    </Text>
                  </div>
                  
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 14 }}>
                      {formatQuestionType(questionType.type)}
                    </Text>
                  </div>
                  
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      每题 {questionType.score} 分
                    </Text>
                  </div>
                  
                  <Progress
                    percent={percentage}
                    strokeColor="#1890ff"
                    strokeWidth={6}
                    showInfo={false}
                  />
                  
                  <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                    占比 {percentage}%
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
        
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 6 }}>
          <Space>
            <ClockCircleOutlined style={{ color: '#fa8c16' }} />
            <Text strong>题型统计：</Text>
          </Space>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col>
              <Text type="secondary">总题数：</Text>
              <Text strong>{totalQuestions} 题</Text>
            </Col>
            <Col>
              <Text type="secondary">总分值：</Text>
              <Text strong>{totalScore} 分</Text>
            </Col>
            <Col>
              <Text type="secondary">题型数：</Text>
              <Text strong>{config.questionTypes.length} 种</Text>
            </Col>
          </Row>
        </div>
      </Card>
    );
  };

  const renderSpecialRequirements = () => {
    if (!config.specialRequirements) {
      return null;
    }

    return (
      <Card 
        title={
          <Space>
            <InfoCircleOutlined />
            <Text strong>特殊要求</Text>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ 
          padding: 16, 
          backgroundColor: '#f6ffed', 
          border: '1px solid #b7eb8f', 
          borderRadius: 6,
          fontSize: 14,
          lineHeight: 1.6
        }}>
          {config.specialRequirements}
        </div>
      </Card>
    );
  };

  const renderSummary = () => {
    const rc: any = config || {};
    const qts: any[] = Array.isArray(rc.questionTypes) ? rc.questionTypes : [];
    const dist: Record<string, any> = rc.questionTypeDistribution || {};
    let totalQuestions: number = Number(rc.totalQuestions || 0) || 0;
    if (!totalQuestions) {
      if (qts.length > 0) {
        totalQuestions = qts.reduce((sum: number, t: any) => sum + (Number(t.count) || 0), 0);
      } else if (dist && typeof dist === 'object') {
        totalQuestions = Object.values(dist).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
      }
    }
    let totalScore: number = Number(rc.totalScore || 0) || 0;
    if (!totalScore) {
      if (qts.length > 0) {
        totalScore = qts.reduce((sum: number, t: any) => sum + (Number(t.count) || 0) * (Number(t.score) || 0), 0);
      } else if (dist && typeof dist === 'object') {
        const scorePerType = rc.scorePerType || rc.typeScores || {};
        const perQuestionScore = Number(rc.scorePerQuestion || 0) || 0;
        const distScore = Object.entries(dist).reduce((sum: number, [type, cnt]: any) => {
          const countNum = Number(cnt) || 0;
          const typeScore = Number((scorePerType as any)[type]) || 0;
          return sum + (typeScore > 0 ? countNum * typeScore : 0);
        }, 0);
        if (distScore > 0) {
          totalScore = distScore;
        } else if (perQuestionScore > 0 && totalQuestions > 0) {
          totalScore = totalQuestions * perQuestionScore;
        }
      }
    }
    const knowledgePointsCount = Array.isArray(rc.knowledgePoints) ? rc.knowledgePoints.length : 0;

    return (
      <Card 
        title={
          <Space>
            <BarChartOutlined />
            <Text strong>配置概览</Text>
          </Space>
        }
        style={{ backgroundColor: '#fafafa' }}
      >
        <Row gutter={24}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                {totalQuestions}
              </Title>
              <Text type="secondary">总题数</Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                {totalScore}
              </Title>
              <Text type="secondary">总分值</Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ margin: 0, color: '#fa8c16' }}>
                {knowledgePointsCount}
              </Title>
              <Text type="secondary">知识点</Text>
            </div>
          </Col>
        </Row>
        
        {config.duration && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
              <ClockCircleOutlined /> 考试时长：{config.duration} 分钟
            </Tag>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: 0 }}>
      {renderSummary()}
      {renderQuestionTypes()}
      {renderKnowledgePoints()}
      {renderSpecialRequirements()}
    </div>
  );
};

export default RuleConfigDisplay;