import React, { useEffect, useState } from 'react';
import { Modal, Button, Tag, Typography } from 'antd';
import { NotificationOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

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

const AnnouncementPopup: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);

    useEffect(() => {
        const checkLatestAnnouncement = async () => {
            try {
                const token = localStorage.getItem('token');
                // Fetch the latest published announcement (page 1, size 1)
                const res = await axios.get('/api/announcements/published', {
                    params: { page: 1, size: 1 },
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.code === 200 && res.data.data.records && res.data.data.records.length > 0) {
                    const latest = res.data.data.records[0];
                    const lastSeenId = localStorage.getItem('last_seen_announcement_id');

                    // If we haven't seen this announcement yet, show it
                    if (!lastSeenId || parseInt(lastSeenId) < latest.id) {
                        setAnnouncement(latest);
                        setVisible(true);
                    }
                }
            } catch (error) {
                console.error('Failed to check announcements', error);
            }
        };

        // Check slightly after mount to avoid interfering with initial page load
        const timer = setTimeout(checkLatestAnnouncement, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        if (announcement) {
            // Mark as seen
            localStorage.setItem('last_seen_announcement_id', announcement.id.toString());
        }
        setVisible(false);
    };

    if (!announcement) return null;

    return (
        <Modal
            open={visible}
            onCancel={handleClose}
            footer={[
                <Button key="close" type="primary" onClick={handleClose}>
                    我知道了
                </Button>
            ]}
            width={600}
            centered
            maskClosable={false}
            title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationOutlined style={{ color: '#1890ff', marginRight: 8, fontSize: 20 }} />
                    <span style={{ fontSize: 18 }}>重要通知</span>
                </div>
            }
        >
            <div style={{ padding: '10px 0' }}>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Title level={4} style={{ margin: 0 }}>{announcement.title}</Title>
                    <Tag color={typeColors[announcement.type] || 'blue'}>
                        {typeLabels[announcement.type] || announcement.type}
                    </Tag>
                </div>

                <div style={{
                    background: '#f9f9f9',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    marginBottom: '16px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                }}>
                    <pre style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        margin: 0,
                        lineHeight: 1.6,
                        color: '#333'
                    }}>
                        {announcement.content}
                    </pre>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        发布时间：{dayjs(announcement.publishedAt).format('YYYY-MM-DD HH:mm')}
                    </Text>
                </div>
            </div>
        </Modal>
    );
};

export default AnnouncementPopup;
