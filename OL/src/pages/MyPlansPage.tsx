import React, { useState, useEffect } from 'react';
import { Button, List, Modal, Form, Input, Select, DatePicker, message, Progress, Row, Col, Typography } from 'antd';
import {
    PlusOutlined,
    RocketOutlined,
    RightOutlined,
    FireOutlined,
    TrophyOutlined,
    SearchOutlined,
    PlayCircleOutlined,
    ClockCircleOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { studyPlanService, StudyPlan } from '../services/studyPlanService';
import { subjectService } from '../services/subjectService';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import './MyPlansPage.css';

const { Title, Text } = Typography;

// Color mapping for different subjects or random assignment
// Color mapping with explicit gradients for inline styling
const coverColors = [
    'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', // Indigo
    'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', // Orange
    'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', // Purple
    'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', // Cyan
    'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', // Pink
];

const MyPlansPage: React.FC = () => {
    const [plans, setPlans] = useState<StudyPlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [form] = Form.useForm();
    const [aiLoading, setAiLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPlans();
        fetchSubjects();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const data = await studyPlanService.getMyPlans();
            setPlans(data);
        } catch (error) {
            console.error('Failed to fetch plans', error);
            message.error('获取学习计划失败');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await subjectService.getSubjects();
            setSubjects(response.map(s => ({ id: Number(s.value), name: s.label })));
        } catch (error) {
            console.error('Failed to fetch subjects', error);
        }
    };

    const handleCreatePlan = async (values: any) => {
        setLoading(true);
        try {
            const planData = {
                ...values,
                deadline: values.deadline.format('YYYY-MM-DDTHH:mm:ss'),
                status: 'ONGOING'
            };
            await studyPlanService.createPlan(planData);
            message.success('创建成功');
            setCreateModalVisible(false);
            form.resetFields();
            fetchPlans();
        } catch (error) {
            console.error('Failed to create plan', error);
            message.error('创建失败');
        } finally {
            setLoading(false);
        }
    };

    const handleAiCreate = async () => {
        try {
            const values = await form.validateFields();
            setAiLoading(true);
            const deadlineStr = values.deadline.format('YYYY-MM-DDTHH:mm:ss');
            await studyPlanService.generatePlanByAI(values.subjectId, values.targetDescription, deadlineStr);
            message.success('AI生成计划成功');
            setCreateModalVisible(false);
            form.resetFields();
            fetchPlans();
        } catch (error) {
            console.error('AI generate failed', error);
            message.error('AI生成失败，请检查输入或稍后重试');
        } finally {
            setAiLoading(false);
        }
    };

    const handleDeletePlan = async (planId: number, planName: string) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除学习计划"${planName}"吗？此操作不可恢复。`,
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await studyPlanService.deletePlan(planId);
                    message.success('删除成功');
                    fetchPlans();
                } catch (error) {
                    console.error('Failed to delete plan', error);
                    message.error('删除失败，请稍后重试');
                }
            }
        });
    };

    // Calculate progress based on time or mock data (since real progress is complex)
    const calculateProgress = (plan: StudyPlan) => {
        // Mock logic: randomly generated or time-based
        const total = dayjs(plan.deadline).diff(dayjs(plan.createdAt), 'day');
        const passed = dayjs().diff(dayjs(plan.createdAt), 'day');
        let percent = total > 0 ? Math.floor((passed / total) * 100) : 0;
        if (percent > 100) percent = 100;
        if (percent < 0) percent = 0;
        return percent;
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 animate-fade-in" style={{ padding: 24, background: '#f8fafc' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <Title level={2} style={{ margin: 0, fontSize: 30, fontWeight: 700, color: '#0f172a' }}>我的学习计划</Title>
                        <Text type="secondary" style={{ fontSize: 16, marginTop: 8, display: 'block' }}>
                            坚持就是胜利！今天你已经学习了 <Text strong style={{ color: '#4f46e5' }}>0 分钟</Text>。
                        </Text>
                    </div>

                    <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ background: 'white', padding: '8px 16px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 8, background: '#fff7ed', color: '#f97316', borderRadius: 8 }}><FireOutlined style={{ fontSize: 20 }} /></div>
                            <div>
                                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>连续打卡</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>0 天</div>
                            </div>
                        </div>
                        <div style={{ background: 'white', padding: '8px 16px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ padding: 8, background: '#eff6ff', color: '#3b82f6', borderRadius: 8 }}><TrophyOutlined style={{ fontSize: 20 }} /></div>
                            <div>
                                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>已完成计划</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>0 个</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: 8, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ background: '#f1f5f9', borderRadius: 8, padding: 4, display: 'flex', gap: 4 }}>
                        <Button type="text" style={{ background: 'white', borderRadius: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', color: '#0f172a', fontWeight: 500 }}>进行中</Button>
                        <Button type="text" style={{ color: '#64748b' }}>已完成</Button>
                        <Button type="text" style={{ color: '#64748b' }}>收藏</Button>
                    </div>
                    <div style={{ position: 'relative', width: 300 }}>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="搜索我的计划..."
                            bordered={false}
                            style={{ background: 'transparent' }}
                        />
                    </div>
                </div>
            </div>

            {/* Plans Grid */}
            <List
                grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 3 }}
                dataSource={[...plans, { isAddButton: true } as any]}
                loading={loading}
                renderItem={(item: any) => {
                    if (item.isAddButton) {
                        return (
                            <List.Item>
                                <div
                                    className="plan-card"
                                    onClick={() => setCreateModalVisible(true)}
                                    style={{
                                        height: 380,
                                        background: 'white',
                                        borderRadius: 24,
                                        border: '2px dashed #e2e8f0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#94a3b8'
                                    }}
                                >
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                        <PlusOutlined style={{ fontSize: 24 }} />
                                    </div>
                                    <span style={{ fontWeight: 500 }}>创建新计划</span>
                                </div>
                            </List.Item>
                        );
                    }

                    const progress = calculateProgress(item);
                    const colorClass = coverColors[item.id % coverColors.length] || coverColors[0];
                    const subjectName = subjects.find(s => s.id === item.subjectId)?.name || '综合学科';

                    return (
                        <List.Item>
                            <div
                                className="plan-card"
                                onClick={() => navigate(`/my-plans/${item.id}`)}
                                style={{
                                    background: 'white',
                                    borderRadius: 24,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    height: 420,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}
                            >
                                {/* Card Header / Cover */}
                                <div style={{
                                    height: 100,
                                    padding: 24,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    background: colorClass,
                                    position: 'relative'
                                }}>
                                    <div style={{ padding: 0, display: 'flex', justifyContent: 'space-between', width: '100%', zIndex: 1 }}>
                                        <div style={{ fontSize: 32 }}>
                                            {item.status === 'COMPLETED' ? '🎓' : '💻'}
                                        </div>
                                        <div style={{
                                            background: 'rgba(255,255,255,0.25)',
                                            backdropFilter: 'blur(4px)',
                                            padding: '4px 12px',
                                            borderRadius: 8,
                                            color: 'white',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            {subjectName}
                                        </div>
                                    </div>
                                </div>

                                {/* content */}
                                <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', marginTop: 0 }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {subjectName}专项提升
                                    </h3>
                                    <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16, height: 40, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {item.targetDescription}
                                    </p>

                                    {/* Progress */}
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                            <span style={{ color: '#64748b', fontWeight: 500 }}>总进度</span>
                                            <span style={{ color: '#4f46e5', fontWeight: 700 }}>{progress}%</span>
                                        </div>
                                        <Progress percent={progress} showInfo={false} strokeColor="#4f46e5" trailColor="#f1f5f9" size="small" />
                                    </div>

                                    <div style={{ marginTop: 'auto' }}>
                                        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>上次学到</div>
                                        <div style={{ background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <PlayCircleOutlined style={{ color: '#4f46e5' }} />
                                            <span style={{ fontSize: 13, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {item.aiSuggestion ? 'AI 推荐任务' : '查看详情以开始'}
                                            </span>
                                        </div>
                                    </div>
                                </div>


                                {/* Footer */}
                                <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                                        <ClockCircleOutlined />
                                        <span>截止: {dayjs(item.deadline).format('MM-DD')}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePlan(item.id, `${subjectName}专项提升`);
                                            }}
                                            style={{ color: '#ef4444', padding: '4px 8px' }}
                                        >
                                            删除
                                        </Button>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#4f46e5', fontWeight: 500 }}>
                                            继续学习 <RightOutlined style={{ fontSize: 10 }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </List.Item>
                    );
                }}
            />

            {/* Create Modal - Kept relatively same but styled slightly */}
            <Modal
                title="制定学习计划"
                open={createModalVisible}
                onCancel={() => setCreateModalVisible(false)}
                footer={null}
                width={640}
                centered
            >
                <div style={{ marginTop: 20 }}>
                    <Form form={form} layout="vertical" onFinish={handleCreatePlan}>
                        <div style={{ marginBottom: 24, padding: 16, background: '#f0faff', borderRadius: 8, border: '1px solid #bae7ff' }}>
                            <RocketOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                            <span style={{ color: '#0050b3' }}>告诉 AI 你的目标，全自动生成个性化学习路径和每日任务。</span>
                        </div>
                        <Form.Item name="subjectId" label="选择学科" rules={[{ required: true }]}>
                            <Select size="large" placeholder="请选择你要提升的学科" options={subjects.map(s => ({ label: s.name, value: s.id }))} />
                        </Form.Item>
                        <Form.Item name="targetDescription" label="你的目标描述" rules={[{ required: true }]}>
                            <Input.TextArea rows={4} size="large" placeholder="例如：我想在一个月内突击复习高中物理力学部分..." />
                        </Form.Item>
                        <Form.Item name="deadline" label="期望达成时间" rules={[{ required: true }]}>
                            <DatePicker style={{ width: '100%' }} size="large" />
                        </Form.Item>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Button size="large" block onClick={() => handleCreatePlan(form.getFieldsValue())}>手动创建</Button>
                            </Col>
                            <Col span={12}>
                                <Button type="primary" size="large" onClick={handleAiCreate} loading={aiLoading} block
                                    style={{ background: 'linear-gradient(45deg, #1890ff, #722ed1)', border: 'none' }}>
                                    ✨ AI 生成专属计划
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </div>
            </Modal>
        </div>
    );
};

export default MyPlansPage;
