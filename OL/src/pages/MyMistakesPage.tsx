import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Empty, Spin, message, Modal, Collapse, Typography, Space } from 'antd';
import { practiceRecordService } from '../services/practiceRecordService';
import { ExclamationCircleOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Title, Text, Paragraph } = Typography;

const questionTypeMap: Record<string, string> = {
    SINGLE_CHOICE: '单选题',
    MULTIPLE_CHOICE: '多选题',
    FILL_BLANK: '填空题',
    TRUE_FALSE: '判断题',
    SHORT_ANSWER: '简答题',
};

const MyMistakesPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [mistakes, setMistakes] = useState<any[]>([]);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [currentMistake, setCurrentMistake] = useState<any>(null);

    useEffect(() => {
        fetchMistakes();
    }, []);

    const fetchMistakes = async () => {
        setLoading(true);
        try {
            const data = await practiceRecordService.getWrongQuestions();
            setMistakes(data);
        } catch (error: any) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = (item: any) => {
        setCurrentMistake(item);
        setViewModalVisible(true);
    };

    return (
        <div style={{ padding: 24 }}>
            <Title level={2}><ExclamationCircleOutlined /> 我的错题本</Title>
            <Paragraph>
                这里汇总了您在练习和考试中做错的题目，按错误频率排序。温故而知新，请重点复习高频错题。
            </Paragraph>

            <Spin spinning={loading}>
                {mistakes.length === 0 && !loading ? (
                    <Empty description="太棒了！目前没有错题记录，或者您还没有进行过练习。" />
                ) : (
                    <List
                        grid={{ gutter: 16, column: 1 }}
                        dataSource={mistakes}
                        renderItem={(item) => (
                            <List.Item>
                                <Card
                                    hoverable
                                    title={
                                        <Space>
                                            <Tag color="red">错误 {item.mistakeCount} 次</Tag>
                                            <Tag color="blue">{item.subjectName}</Tag>
                                            <Text strong>{questionTypeMap[item.question.type] || item.question.type}</Text>
                                        </Space>
                                    }
                                    extra={
                                        <Button type="primary" ghost icon={<EyeOutlined />} onClick={() => handleViewDetail(item)}>
                                            查看解析
                                        </Button>
                                    }
                                >
                                    <div style={{ marginBottom: 12 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            <ClockCircleOutlined /> 最近错误时间: {new Date(item.lastMistakeTime).toLocaleString()}
                                        </Text>
                                    </div>
                                    <Paragraph ellipsis={{ rows: 2, expandable: false }}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {item.question.title}
                                        </ReactMarkdown>
                                        {(item.question.type === 'SINGLE_CHOICE' || item.question.type === 'MULTIPLE_CHOICE') && (
                                            <div style={{ marginTop: 8 }}>
                                                {(item.question.optionsList || (item.question.options ? JSON.parse(item.question.options) : [])).slice(0, 4).map((option: string, index: number) => (
                                                    <div key={index} style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>{String.fromCharCode(65 + index)}. {option}</div>
                                                ))}
                                                {(item.question.optionsList?.length > 4 || (item.question.options && JSON.parse(item.question.options).length > 4)) && <div style={{ color: '#999', fontSize: 12 }}>...</div>}
                                            </div>
                                        )}
                                    </Paragraph>
                                </Card>
                            </List.Item>
                        )}
                    />
                )}
            </Spin>

            <Modal
                title="错题详情与解析"
                open={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setViewModalVisible(false)}>
                        关闭
                    </Button>
                ]}
                width={800}
            >
                {currentMistake && (
                    <div>
                        <Card title="题目内容" type="inner" style={{ marginBottom: 16 }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {currentMistake.question.title}
                            </ReactMarkdown>
                            {(currentMistake.question.type === 'SINGLE_CHOICE' || currentMistake.question.type === 'MULTIPLE_CHOICE') && (
                                <div style={{ marginTop: 16 }}>
                                    {(currentMistake.question.optionsList || (currentMistake.question.options ? JSON.parse(currentMistake.question.options) : [])).map((option: string, index: number) => (
                                        <div key={index} style={{ marginBottom: 8, padding: '8px 12px', background: '#fafafa', borderRadius: 4, border: '1px solid #f0f0f0' }}>
                                            <span style={{ fontWeight: 'bold', marginRight: 8 }}>{String.fromCharCode(65 + index)}.</span>
                                            {option}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {currentMistake.myLastAnswer && (
                            <Card title="您的最近一次回答" type="inner" style={{ marginBottom: 16, borderColor: '#ffccc7', background: '#fff2f0' }}>
                                <Text strong style={{ color: '#cf1322' }}>{currentMistake.myLastAnswer}</Text>
                            </Card>
                        )}

                        <Card title="正确答案" type="inner" style={{ marginBottom: 16, borderColor: '#b7eb8f', background: '#f6ffed' }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {currentMistake.question.correctAnswer}
                            </ReactMarkdown>
                        </Card>

                        {currentMistake.aiFeedback && (
                            <Card title="AI 讲评" type="inner" style={{ marginBottom: 16, borderColor: '#d3adf7', background: '#f9f0ff' }}>
                                <Paragraph>
                                    <Text strong>反馈：</Text>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentMistake.aiFeedback}</ReactMarkdown>
                                </Paragraph>
                                {currentMistake.aiSuggestions && (
                                    <Paragraph>
                                        <Text strong>建议：</Text>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentMistake.aiSuggestions}</ReactMarkdown>
                                    </Paragraph>
                                )}
                            </Card>
                        )}

                        <Card title="解析" type="inner" style={{ background: '#f0faff', borderColor: '#bae7ff' }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {currentMistake.question.explanation || "暂无解析"}
                            </ReactMarkdown>
                        </Card>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyMistakesPage;
