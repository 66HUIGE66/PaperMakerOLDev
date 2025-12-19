import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, message, Modal, Form, Input, Select, Popconfirm, Row, Col, Divider } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SendOutlined,
    EyeOutlined,
    NotificationOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../types/auth';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;
const { Option } = Select;

interface Announcement {
    id: number;
    title: string;
    content: string;
    type: string;
    status: string;
    publisherId: number;
    publisherName?: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}

const typeOptions = [
    { value: 'SYSTEM', label: '系统公告', color: 'blue' },
    { value: 'MAINTENANCE', label: '维护通知', color: 'orange' },
    { value: 'UPDATE', label: '更新公告', color: 'green' },
    { value: 'EVENT', label: '活动通知', color: 'purple' }
];

const statusOptions = [
    { value: 'DRAFT', label: '草稿', color: 'default' },
    { value: 'PUBLISHED', label: '已发布', color: 'success' },
    { value: 'ARCHIVED', label: '已归档', color: 'warning' }
];

const AnnouncementManagementPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [total, setTotal] = useState(0);
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [form] = Form.useForm();
    const [submitLoading, setSubmitLoading] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAdmin(user)) {
            message.error('权限不足，仅系统管理员可访问');
            navigate('/');
        }
    }, [user, navigate]);

    const fetchAnnouncements = async (page = 1, size = 10) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/announcements/all', {
                params: { page, size },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.code === 200) {
                setAnnouncements(res.data.data.records || []);
                setTotal(res.data.data.total || 0);
            }
        } catch (error: any) {
            message.error('获取公告列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements(current, pageSize);
    }, [current, pageSize]);

    const handleCreate = () => {
        setSelectedAnnouncement(null);
        form.resetFields();
        form.setFieldsValue({ type: 'SYSTEM', status: 'DRAFT' });
        setModalVisible(true);
    };

    const handleEdit = (record: Announcement) => {
        setSelectedAnnouncement(record);
        form.setFieldsValue(record);
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            if (selectedAnnouncement) {
                await axios.put(`/api/announcements/${selectedAnnouncement.id}`, values, { headers });
                message.success('公告更新成功');
            } else {
                await axios.post('/api/announcements', values, { headers });
                message.success('公告创建成功');
            }

            setModalVisible(false);
            fetchAnnouncements(current, pageSize);
        } catch (error: any) {
            message.error('操作失败: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitLoading(false);
        }
    };

    const handlePublish = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/announcements/${id}/publish`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('公告发布成功');
            fetchAnnouncements(current, pageSize);
        } catch (error: any) {
            message.error('发布失败: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/announcements/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('公告删除成功');
            fetchAnnouncements(current, pageSize);
        } catch (error: any) {
            message.error('删除失败: ' + (error.response?.data?.message || error.message));
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60, fixed: 'left' as const },
        { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (type: string) => {
                const opt = typeOptions.find(o => o.value === type);
                return <Tag color={opt?.color || 'default'}>{opt?.label || type}</Tag>;
            }
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
                const opt = statusOptions.find(o => o.value === status);
                return <Tag color={opt?.color || 'default'}>{opt?.label || status}</Tag>;
            }
        },
        { title: '发布者', dataIndex: 'publisherName', key: 'publisherName', width: 100 },
        { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
        {
            title: '操作',
            key: 'actions',
            width: 280,
            fixed: 'right' as const,
            render: (_: any, record: Announcement) => (
                <Space size="small">
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => {
                        setSelectedAnnouncement(record);
                        setDetailVisible(true);
                    }}>
                        查看
                    </Button>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        编辑
                    </Button>
                    {record.status === 'DRAFT' && (
                        <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handlePublish(record.id)}>
                            发布
                        </Button>
                    )}
                    <Popconfirm title="确定删除该公告？" onConfirm={() => handleDelete(record.id)}>
                        <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: 'calc(100vh - 64px)' }}>
            <Card
                title={<span style={{ fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center' }}><NotificationOutlined style={{ marginRight: '8px', color: '#1890ff' }} />公告管理</span>}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ borderRadius: '6px' }}>
                        新建公告
                    </Button>
                }
                style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                bodyStyle={{ padding: '24px' }}
            >
                <Table
                    columns={columns}
                    dataSource={announcements}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1300 }}
                    pagination={{
                        current,
                        pageSize,
                        total,
                        onChange: (page, size) => {
                            setCurrent(page);
                            setPageSize(size || 10);
                        },
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条公告`
                    }}
                />
            </Card>

            {/* 创建/编辑模态框 */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {selectedAnnouncement ? <EditOutlined style={{ marginRight: '8px', color: '#1890ff' }} /> : <PlusOutlined style={{ marginRight: '8px', color: '#52c41a' }} />}
                        {selectedAnnouncement ? '编辑公告' : '新建公告'}
                    </div>
                }
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={() => setModalVisible(false)}
                confirmLoading={submitLoading}
                width={700}
                maskClosable={false}
            >
                <Form form={form} layout="vertical" style={{ marginTop: '20px' }}>
                    <Form.Item name="title" label="公告标题" rules={[{ required: true, message: '请输入公告标题' }]}>
                        <Input prefix={<EditOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />} placeholder="请输入公告标题" style={{ borderRadius: '6px' }} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="type" label="公告类型" rules={[{ required: true }]}>
                                <Select placeholder="选择类型" style={{ borderRadius: '6px' }}>
                                    {typeOptions.map(opt => (
                                        <Option key={opt.value} value={opt.value}>
                                            <Tag color={opt.color}>{opt.label}</Tag>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="status" label="状态">
                                <Select placeholder="选择状态" style={{ borderRadius: '6px' }}>
                                    {statusOptions.map(opt => (
                                        <Option key={opt.value} value={opt.value}>
                                            <Tag color={opt.color}>{opt.label}</Tag>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="content" label="公告内容" rules={[{ required: true, message: '请输入公告内容' }]}>
                        <TextArea rows={8} placeholder="请输入公告内容支持Markdown格式..." style={{ borderRadius: '6px', resize: 'vertical' }} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 详情模态框 */}
            <Modal
                title="公告详情"
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailVisible(false)}>
                        关闭
                    </Button>
                ]}
                width={700}
            >
                {selectedAnnouncement && (
                    <div style={{ padding: '10px' }}>
                        <h2 style={{ marginBottom: '20px', color: '#333' }}>{selectedAnnouncement.title}</h2>
                        <Space size="large" style={{ marginBottom: '24px', width: '100%' }}>
                            <span><Tag color="blue">类型</Tag> {typeOptions.find(o => o.value === selectedAnnouncement.type)?.label}</span>
                            <span><Tag color="orange">状态</Tag> {statusOptions.find(o => o.value === selectedAnnouncement.status)?.label}</span>
                            <span style={{ color: '#888' }}><ClockCircleOutlined /> 发布时间：{selectedAnnouncement.publishedAt || '未发布'}</span>
                        </Space>
                        <Divider dashed />
                        <div style={{
                            marginTop: '16px',
                            padding: '24px',
                            background: '#f9f9f9',
                            borderRadius: '8px',
                            border: '1px solid #eee',
                            minHeight: '200px',
                            fontSize: '15px',
                            lineHeight: '1.6'
                        }}>
                            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{selectedAnnouncement.content}</pre>
                        </div>
                        <div style={{ marginTop: '20px', textAlign: 'right', color: '#999', fontSize: '12px' }}>
                            创建于: {selectedAnnouncement.createdAt} | 更新于: {selectedAnnouncement.updatedAt}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AnnouncementManagementPage;
