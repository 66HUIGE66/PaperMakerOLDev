import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, message, Modal, Form, Input, Select, Empty } from 'antd';
import {
    PlusOutlined,
    EyeOutlined,
    BugOutlined,
    BulbOutlined,
    ToolOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;

interface Feedback {
    id: number;
    title: string;
    content: string;
    type: string;
    status: string;
    adminReply?: string;
    repliedAt?: string;
    createdAt: string;
}

const typeOptions = [
    { value: 'BUG', label: 'Bug报告', color: 'red', icon: <BugOutlined /> },
    { value: 'FEATURE', label: '功能建议', color: 'blue', icon: <BulbOutlined /> },
    { value: 'IMPROVEMENT', label: '改进意见', color: 'green', icon: <ToolOutlined /> },
    { value: 'OTHER', label: '其他', color: 'default', icon: <QuestionCircleOutlined /> }
];

const statusOptions = [
    { value: 'PENDING', label: '待处理', color: 'warning' },
    { value: 'PROCESSING', label: '处理中', color: 'processing' },
    { value: 'RESOLVED', label: '已解决', color: 'success' },
    { value: 'REJECTED', label: '已拒绝', color: 'error' },
    { value: 'CLOSED', label: '已关闭', color: 'default' }
];

const MyFeedbackPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [total, setTotal] = useState(0);
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [form] = Form.useForm();
    const [submitLoading, setSubmitLoading] = useState(false);

    const fetchMyFeedbacks = async (page = 1, size = 10) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/feedbacks/my', {
                params: { page, size },
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

    useEffect(() => {
        fetchMyFeedbacks(current, pageSize);
    }, [current, pageSize]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitLoading(true);
            const token = localStorage.getItem('token');
            await axios.post('/api/feedbacks', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('反馈提交成功，感谢您的宝贵意见！');
            setModalVisible(false);
            form.resetFields();
            fetchMyFeedbacks(current, pageSize);
        } catch (error: any) {
            message.error('提交失败: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitLoading(false);
        }
    };

    const columns = [
        { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            width: 120,
            render: (type: string) => {
                const opt = typeOptions.find(o => o.value === type);
                return <Tag color={opt?.color || 'default'} icon={opt?.icon}>{opt?.label || type}</Tag>;
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
            width: 100,
            render: (_: any, record: Feedback) => (
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => {
                    setSelectedFeedback(record);
                    setDetailVisible(true);
                }}>
                    查看
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card
                title="我的反馈"
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                        form.resetFields();
                        form.setFieldsValue({ type: 'OTHER' });
                        setModalVisible(true);
                    }}>
                        提交反馈
                    </Button>
                }
            >
                {feedbacks.length === 0 && !loading ? (
                    <Empty description="暂无反馈记录，点击上方按钮提交新反馈" />
                ) : (
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
                            }
                        }}
                    />
                )}
            </Card>

            {/* 提交反馈模态框 */}
            <Modal
                title="提交反馈"
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={() => setModalVisible(false)}
                confirmLoading={submitLoading}
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="反馈标题" rules={[{ required: true, message: '请输入反馈标题' }]}>
                        <Input placeholder="请简要描述您的问题或建议" />
                    </Form.Item>
                    <Form.Item name="type" label="反馈类型" rules={[{ required: true }]}>
                        <Select>
                            {typeOptions.map(opt => (
                                <Select.Option key={opt.value} value={opt.value}>
                                    <Space>{opt.icon} {opt.label}</Space>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="content" label="详细描述" rules={[{ required: true, message: '请输入详细描述' }]}>
                        <TextArea
                            rows={5}
                            placeholder="请详细描述您遇到的问题或您的建议。如果是Bug，请尽量提供复现步骤。"
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 详情模态框 */}
            <Modal
                title="反馈详情"
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={null}
                width={600}
            >
                {selectedFeedback && (
                    <div>
                        <h3>{selectedFeedback.title}</h3>
                        <p>
                            <Tag color={typeOptions.find(o => o.value === selectedFeedback.type)?.color}>
                                {typeOptions.find(o => o.value === selectedFeedback.type)?.label}
                            </Tag>
                            <Tag color={statusOptions.find(o => o.value === selectedFeedback.status)?.color}>
                                {statusOptions.find(o => o.value === selectedFeedback.status)?.label}
                            </Tag>
                        </p>
                        <p style={{ color: '#999' }}>提交时间：{selectedFeedback.createdAt}</p>
                        <div style={{ marginTop: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                            <strong>反馈内容：</strong>
                            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, marginTop: '8px' }}>{selectedFeedback.content}</pre>
                        </div>
                        {selectedFeedback.adminReply && (
                            <div style={{ marginTop: '16px', padding: '16px', background: '#e6f7ff', borderRadius: '8px', border: '1px solid #91d5ff' }}>
                                <strong>📢 管理员回复：</strong>
                                <pre style={{ whiteSpace: 'pre-wrap', margin: 0, marginTop: '8px' }}>{selectedFeedback.adminReply}</pre>
                                <p style={{ marginTop: '8px', color: '#999', fontSize: '12px' }}>回复时间：{selectedFeedback.repliedAt}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyFeedbackPage;
