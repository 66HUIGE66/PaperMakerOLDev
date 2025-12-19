import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Typography, Modal } from 'antd';
import { NotificationOutlined, RightOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface Announcement {
    id: number;
    title: string;
    content: string;
    type: string;
    status: string;
    publishedAt: string;
}

const typeColors: Record<string, string> = {
    'SYSTEM': 'blue',
    'MAINTENANCE': 'orange',
    'UPDATE': 'green',
    'EVENT': 'purple'
};

const typeLabels: Record<string, string> = {
    'SYSTEM': '系统公告',
    'MAINTENANCE': '维护通知',
    'UPDATE': '更新公告',
    'EVENT': '活动通知'
};

const HomeAnnouncementSection: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const token = localStorage.getItem('token');
                // Get all published announcements, limit to 5 for home page
                const res = await axios.get('/api/announcements/published', {
                    params: { page: 1, size: 5 },
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.code === 200) {
                    setAnnouncements(res.data.data.records || []);
                }
            } catch (error) {
                console.error('Failed to fetch announcements', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    if (announcements.length === 0 && !loading) {
        return null;
    }

    return (
        <div className="home-section">
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <Title level={2} className="home-section-title">最新公告</Title>
                <Text className="home-section-desc">了解系统最新动态与重要通知</Text>
            </div>

            <Card
                bordered={false}
                style={{
                    borderRadius: 16,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    maxWidth: 1000,
                    margin: '0 auto'
                }}
            >
                <List
                    loading={loading}
                    dataSource={announcements}
                    renderItem={item => (
                        <List.Item
                            style={{
                                cursor: 'pointer',
                                padding: '16px 24px',
                                transition: 'all 0.3s'
                            }}
                            className="announcement-item"
                            onClick={() => setSelectedAnnouncement(item)}
                            actions={[
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    {dayjs(item.publishedAt).format('YYYY-MM-DD')} <RightOutlined style={{ fontSize: 10, marginLeft: 4 }} />
                                </Text>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        background: '#e6f7ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#1890ff'
                                    }}>
                                        <NotificationOutlined style={{ fontSize: 18 }} />
                                    </div>
                                }
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                        <Text strong style={{ fontSize: 16, marginRight: 8 }}>{item.title}</Text>
                                        <Tag color={typeColors[item.type] || 'default'}>
                                            {typeLabels[item.type] || item.type}
                                        </Tag>
                                    </div>
                                }
                                description={
                                    <Text type="secondary" ellipsis style={{ maxWidth: 600, display: 'block' }}>
                                        {item.content.substring(0, 100).replace(/[#*`]/g, '')}
                                    </Text>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Card>

            <Modal
                title={null}
                open={!!selectedAnnouncement}
                onCancel={() => setSelectedAnnouncement(null)}
                footer={null}
                width={700}
                centered
            >
                {selectedAnnouncement && (
                    <div style={{ padding: '20px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                            <Tag color={typeColors[selectedAnnouncement.type] || 'default'}>
                                {typeLabels[selectedAnnouncement.type] || selectedAnnouncement.type}
                            </Tag>
                            <Text type="secondary">
                                发布于 {dayjs(selectedAnnouncement.publishedAt).format('YYYY-MM-DD HH:mm:ss')}
                            </Text>
                        </div>

                        <Title level={3} style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                            {selectedAnnouncement.title}
                        </Title>

                        <div style={{
                            fontSize: 16,
                            lineHeight: 1.8,
                            color: '#333',
                            background: '#f9fafb',
                            padding: 24,
                            borderRadius: 8
                        }}>
                            <pre style={{
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'inherit',
                                margin: 0
                            }}>
                                {selectedAnnouncement.content}
                            </pre>
                        </div>
                    </div>
                )}
            </Modal>

            <style>{`
                .announcement-item:hover {
                    background-color: #fafafa;
                }
            `}</style>
        </div>
    );
};

export default HomeAnnouncementSection;
