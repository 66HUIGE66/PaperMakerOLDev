import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, message, Modal, Form, Input, Select, Statistic, Row, Col } from 'antd';
import {
    CheckOutlined,
    CloseOutlined,
    EyeOutlined,
    MessageOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../types/auth';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;

interface Feedback {
    id: number;
    title: string;
    content: string;
    type: string;
    status: string;
    submitterId: number;
    submitterName?: string;
    adminReply?: string;
    replierId?: number;
    repliedAt?: string;
    createdAt: string;
    updatedAt: string;
}

interface Statistics {
    total: number;
    pending: number;
    resolved: number;
    byType: Record<string, number>;
}

const typeOptions = [
    { value: 'BUG', label: 'Bug报告', color: 'red' },
    { value: 'FEATURE', label: '功能建议', color: 'blue' },
    { value: 'IMPROVEMENT', label: '改进意见', color: 'green' },
    { value: 'OTHER', label: '其他', color: 'default' }
];

const statusOptions = [
    { value: 'PENDING', label: '待处理', color: 'warning' },
    { value: 'PROCESSING', label: '处理中', color: 'processing' },
    { value: 'RESOLVED', label: '已解决', color: 'success' },
    { value: 'REJECTED', label: '已拒绝', color: 'error' },
    { value: 'CLOSED', label: '已关闭', color: 'default' }
];

const FeedbackManagementPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [total, setTotal] = useState(0);
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [detailVisible, setDetailVisible] = useState(false);
    const [replyVisible, setReplyVisible] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [replyForm] = Form.useForm();
    const [submitLoading, setSubmitLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAdmin(user)) {
            message.error('权限不足，仅系统管理员可访问');
            navigate('/');
        }
    }, [user, navigate]);

    const fetchFeedbacks = async (page = 1, size = 10) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params: any = { page, size };
            if (statusFilter) params.status = statusFilter;
            if (typeFilter) params.type = typeFilter;

            const res = await axios.get('/api/feedbacks/all', {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.code === 200) {
                setFeedbacks(res.data.data.records || []);
                setTotal(res.data.data.total || 0);
            }
        } catch (error: any) {
            message.error('获取反馈列表失败');
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/feedbacks/statistics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.code === 200) {
                setStatistics(res.data.data);
            }
        } catch (error) {
            console.error('获取统计信息失败', error);
        }
    };

    useEffect(() => {
        fetchFeedbacks(current, pageSize);
        fetchStatistics();
    }, [current, pageSize, statusFilter, typeFilter]);

    const handleReply = async () => {
        try {
            const values = await replyForm.validateFields();
            setSubmitLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`/api/feedbacks/${selectedFeedback?.id}/reply`, values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('回复成功');
            setReplyVisible(false);
            fetchFeedbacks(current, pageSize);
            fetchStatistics();
        } catch (error: any) {
            message.error('回复失败: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleStatusChange = async (id: number, status: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/feedbacks/${id}/status`, null, {
                params: { status },
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('状态更新成功');
            fetchFeedbacks(current, pageSize);
            fetchStatistics();
        } catch (error: any) {
            message.error('更新失败: ' + (error.response?.data?.message || error.message));
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
        { title: '提交者', dataIndex: 'submitterName', key: 'submitterName', width: 100 },
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
        { title: '提交时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
        {
            title: '操作',
            key: 'actions',
            width: 180,
            render: (_: any, record: Feedback) => (
                <Space size="small">
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => {
                        setSelectedFeedback(record);
                        setDetailVisible(true);
                    }}>
                        查看
                    </Button>
                    {record.status !== 'RESOLVED' && record.status !== 'CLOSED' && (
                        <Button type="link" size="small" icon={<MessageOutlined />} onClick={() => {
                            setSelectedFeedback(record);
                            replyForm.resetFields();
                            setReplyVisible(true);
                        }}>
                            回复
                        </Button>
                    )}
                    {record.status === 'PENDING' && (
                        <Button type="link" size="small" icon={<CloseOutlined />} danger onClick={() => handleStatusChange(record.id, 'REJECTED')}>
                            拒绝
                        </Button>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: 'calc(100vh - 64px)' }}>
            {/* 统计卡片 */}
            {statistics && (
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                    <Col span={6}>
                        <Card bordered={false} hoverable style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Statistic
                                title={<span style={{ fontWeight: 600, color: '#666' }}>总反馈</span>}
                                value={statistics.total}
                                valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card bordered={false} hoverable style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Statistic
                                title={<span style={{ fontWeight: 600, color: '#666' }}>待处理</span>}
                                value={statistics.pending}
                                valueStyle={{ color: '#faad14', fontSize: '24px', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card bordered={false} hoverable style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Statistic
                                title={<span style={{ fontWeight: 600, color: '#666' }}>已解决</span>}
                                value={statistics.resolved}
                                valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card bordered={false} hoverable style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Statistic
                                title={<span style={{ fontWeight: 600, color: '#666' }}>Bug报告</span>}
                                value={statistics.byType?.BUG || 0}
                                valueStyle={{ color: '#ff4d4f', fontSize: '24px', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            <Card
                title={<span style={{ fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center' }}><MessageOutlined style={{ marginRight: '8px', color: '#1890ff' }} />反馈处理</span>}
                extra={
                    <Space>
                        <Select
                            style={{ width: 120, borderRadius: '6px' }}
                            placeholder="筛选状态"
                            allowClear
                            onChange={setStatusFilter}
                        >
                            {statusOptions.map(opt => (
                                <Select.Option key={opt.value} value={opt.value}><Tag color={opt.color}>{opt.label}</Tag></Select.Option>
                            ))}
                        </Select>
                        <Select
                            style={{ width: 120, borderRadius: '6px' }}
                            placeholder="筛选类型"
                            allowClear
                            onChange={setTypeFilter}
                        >
                            {typeOptions.map(opt => (
                                <Select.Option key={opt.value} value={opt.value}><Tag color={opt.color}>{opt.label}</Tag></Select.Option>
                            ))}
                        </Select>
                    </Space>
                }
                style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                bodyStyle={{ padding: '24px' }}
            >
                <Table
                    columns={columns}
                    dataSource={feedbacks}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current,
                        pageSize,
                        total,
                        onChange: (page, size) => {
                            setCurrent(page);
                            setPageSize(size || 10);
                        },
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条反馈`
                    }}
                />
            </Card>

            {/* 详情模态框 */}
            <Modal
                title="反馈详情"
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailVisible(false)}>
                        关闭
                    </Button>
                ]}
                width={700}
            >
                {selectedFeedback && (
                    <div style={{ padding: '10px' }}>
                        <h2 style={{ marginBottom: '20px', color: '#333' }}>{selectedFeedback.title}</h2>
                        <Space size="large" style={{ marginBottom: '24px', width: '100%' }}>
                            <span><strong>提交者：</strong>{selectedFeedback.submitterName}</span>
                            <span><Tag color="blue">{typeOptions.find(o => o.value === selectedFeedback.type)?.label}</Tag></span>
                            <span><Tag color="orange">{statusOptions.find(o => o.value === selectedFeedback.status)?.label}</Tag></span>
                            <span style={{ color: '#888' }}>{selectedFeedback.createdAt}</span>
                        </Space>

                        <div style={{ marginTop: '16px', padding: '20px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                            <strong style={{ display: 'block', marginBottom: '8px', color: '#555' }}>反馈内容：</strong>
                            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', color: '#333' }}>{selectedFeedback.content}</pre>
                        </div>
                        {selectedFeedback.adminReply && (
                            <div style={{ marginTop: '16px', padding: '20px', background: '#e6f7ff', borderRadius: '8px', border: '1px solid #91d5ff' }}>
                                <strong style={{ display: 'block', marginBottom: '8px', color: '#096dd9' }}>管理员回复：</strong>
                                <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', color: '#333' }}>{selectedFeedback.adminReply}</pre>
                                <p style={{ marginTop: '12px', color: '#999', fontSize: '12px', textAlign: 'right', marginBottom: 0 }}>回复时间：{selectedFeedback.repliedAt}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* 回复模态框 */}
            <Modal
                title={<span><MessageOutlined style={{ marginRight: '8px', color: '#1890ff' }} />回复反馈</span>}
                open={replyVisible}
                onOk={handleReply}
                onCancel={() => setReplyVisible(false)}
                confirmLoading={submitLoading}
            >
                <Form form={replyForm} layout="vertical" style={{ marginTop: '20px' }}>
                    <Form.Item name="reply" label="回复内容" rules={[{ required: true, message: '请输入回复内容' }]}>
                        <TextArea rows={6} placeholder="请输入回复内容，将展示给用户..." style={{ borderRadius: '6px' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default FeedbackManagementPage;
