import React from 'react';
import { Card, Progress, Typography, Alert, Space, Tag } from 'antd';
import { TrophyOutlined, BulbOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface AIGradingResultProps {
    score: number;
    feedback: string;
    suggestions: string;
    isCorrect: boolean;
}

/**
 * AI评分结果展示组件
 * 用于展示填空题和简答题的AI评分结果
 */
const AIGradingResult: React.FC<AIGradingResultProps> = ({ score, feedback, suggestions, isCorrect }) => {

    // 根据分数获取颜色
    const getScoreColor = (score: number): string => {
        if (score >= 90) return '#52c41a'; // 绿色 - 优秀
        if (score >= 75) return '#1890ff'; // 蓝色 - 良好
        if (score >= 60) return '#faad14'; // 橙色 - 及格
        return '#f5222d'; // 红色 - 不及格
    };

    // 根据分数获取等级
    const getGrade = (score: number): string => {
        if (score >= 90) return '优秀';
        if (score >= 75) return '良好';
        if (score >= 60) return '及格';
        return '不及格';
    };

    return (
        <Card
            style={{
                marginTop: '16px',
                borderLeft: `4px solid ${getScoreColor(score)}`,
                background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)'
            }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* 评分标题和状态 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Space>
                        <TrophyOutlined style={{ fontSize: '24px', color: getScoreColor(score) }} />
                        <Title level={4} style={{ margin: 0 }}>AI智能评分</Title>
                    </Space>
                    <Tag
                        icon={isCorrect ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                        color={isCorrect ? 'success' : 'error'}
                        style={{ fontSize: '14px', padding: '4px 12px' }}
                    >
                        {isCorrect ? '正确' : '错误'}
                    </Tag>
                </div>

                {/* 分数进度条 */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Text strong>得分</Text>
                        <Space>
                            <Text style={{ fontSize: '24px', color: getScoreColor(score), fontWeight: 'bold' }}>
                                {score}
                            </Text>
                            <Text type="secondary">/100</Text>
                            <Tag color={getScoreColor(score)}>{getGrade(score)}</Tag>
                        </Space>
                    </div>
                    <Progress
                        percent={score}
                        strokeColor={{
                            '0%': getScoreColor(score),
                            '100%': getScoreColor(score),
                        }}
                        status="active"
                        showInfo={false}
                    />
                </div>

                {/* 评分反馈 */}
                <Alert
                    message={
                        <Space>
                            <CheckCircleOutlined />
                            <Text strong>评分反馈</Text>
                        </Space>
                    }
                    description={
                        <Paragraph style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
                            {feedback}
                        </Paragraph>
                    }
                    type="info"
                    showIcon={false}
                    style={{
                        background: 'linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)',
                        border: '1px solid #91d5ff'
                    }}
                />

                {/* 改进建议 */}
                {suggestions && (
                    <Alert
                        message={
                            <Space>
                                <BulbOutlined />
                                <Text strong>改进建议</Text>
                            </Space>
                        }
                        description={
                            <Paragraph style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
                                {suggestions}
                            </Paragraph>
                        }
                        type="warning"
                        showIcon={false}
                        style={{
                            background: 'linear-gradient(135deg, #fffbe6 0%, #ffffff 100%)',
                            border: '1px solid #ffe58f'
                        }}
                    />
                )}
            </Space>
        </Card>
    );
};

export default AIGradingResult;
