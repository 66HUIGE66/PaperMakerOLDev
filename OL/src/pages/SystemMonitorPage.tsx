import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Button, Space, message, Spin, Divider } from 'antd';
import {
    ReloadOutlined,
    DesktopOutlined,
    ClockCircleOutlined,
    CloudServerOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../types/auth';
import { useNavigate } from 'react-router-dom';

interface SystemOverview {
    jvmName: string;
    jvmVersion: string;
    jvmVendor: string;
    startTime: string;
    uptime: string;
    osName: string;
    osVersion: string;
    osArch: string;
    availableProcessors: number;
    systemLoadAverage: number;
    heapMemory: {
        init: string;
        used: string;
        committed: string;
        max: string;
        usedPercent: number;
    };
    nonHeapMemory: {
        init: string;
        used: string;
        committed: string;
    };
    serverTime: string;
}

interface MemoryInfo {
    maxMemory: string;
    totalMemory: string;
    usedMemory: string;
    freeMemory: string;
    usedPercent: number;
}

interface ThreadInfo {
    activeThreads: number;
    peakThreadCount: number;
    totalStartedThreadCount: number;
    daemonThreadCount: number;
}

const SystemMonitorPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<SystemOverview | null>(null);
    const [threads, setThreads] = useState<ThreadInfo | null>(null);
    const [gcLoading, setGcLoading] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    // 权限检查
    useEffect(() => {
        if (!isAdmin(user)) {
            message.error('权限不足，仅系统管理员可访问');
            navigate('/');
        }
    }, [user, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [overviewRes, memoryRes, threadsRes] = await Promise.all([
                axios.get('/api/system/overview', { headers }),
                axios.get('/api/system/memory', { headers }),
                axios.get('/api/system/threads', { headers })
            ]);

            if (overviewRes.data.code === 200) {
                setOverview(overviewRes.data.data);
            }
            if (threadsRes.data.code === 200) {
                setThreads(threadsRes.data.data);
            }
        } catch (error: any) {
            message.error('获取系统信息失败: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // 每30秒自动刷新
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleGC = async () => {
        setGcLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/system/gc', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.code === 200) {
                message.success(`垃圾回收完成，释放了 ${res.data.data.freedMemory}`);
                fetchData(); // 刷新数据
            }
        } catch (error: any) {
            message.error('触发垃圾回收失败: ' + (error.response?.data?.message || error.message));
        } finally {
            setGcLoading(false);
        }
    };

    if (loading && !overview) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spin size="large" tip="加载系统信息中..." />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: 'calc(100vh - 64px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontWeight: 700, fontSize: '26px', color: '#1f1f1f', display: 'flex', alignItems: 'center' }}>
                    <DesktopOutlined style={{ marginRight: '12px', color: '#1890ff', fontSize: '30px' }} />
                    <span style={{ background: 'linear-gradient(90deg, #1890ff, #13c2c2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        系统实时监控
                    </span>
                </h2>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} style={{ borderRadius: '6px' }}>
                        刷新数据
                    </Button>
                    <Button icon={<ThunderboltOutlined />} onClick={handleGC} loading={gcLoading} danger type="primary" style={{ borderRadius: '6px' }}>
                        触发GC
                    </Button>
                </Space>
            </div>

            {/* 系统概览 */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        bordered={false}
                        hoverable
                        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
                    >
                        <Statistic
                            title={<span style={{ fontWeight: 600, color: '#666' }}>服务器时间</span>}
                            value={overview?.serverTime || '-'}
                            prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                            valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        bordered={false}
                        hoverable
                        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
                    >
                        <Statistic
                            title={<span style={{ fontWeight: 600, color: '#666' }}>运行时间</span>}
                            value={overview?.uptime || '-'}
                            prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        bordered={false}
                        hoverable
                        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
                    >
                        <Statistic
                            title={<span style={{ fontWeight: 600, color: '#666' }}>CPU核心数</span>}
                            value={overview?.availableProcessors || 0}
                            prefix={<CloudServerOutlined style={{ color: '#722ed1' }} />}
                            suffix="个"
                            valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        bordered={false}
                        hoverable
                        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
                    >
                        <Statistic
                            title={<span style={{ fontWeight: 600, color: '#666' }}>系统负载 (Load Average)</span>}
                            value={
                                (overview?.systemLoadAverage !== undefined && overview?.systemLoadAverage >= 0)
                                    ? overview.systemLoadAverage.toFixed(2)
                                    : '不支持 (Windows)'
                            }
                            prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
                            valueStyle={{ fontSize: '20px', fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Divider style={{ margin: '24px 0' }} />

            {/* 内存信息 */}
            <h3 style={{ marginLeft: '8px', marginBottom: '16px', fontWeight: 'bold' }}>内存使用情况</h3>
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card
                        title={<span style={{ fontWeight: 'bold' }}>堆内存 (Heap Memory)</span>}
                        bordered={false}
                        hoverable
                        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    >
                        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                            <Progress
                                type="line"
                                strokeColor={{
                                    '0%': '#87d068',
                                    '100%': '#108ee9',
                                }}
                                percent={overview?.heapMemory?.usedPercent || 0}
                                status={
                                    (overview?.heapMemory?.usedPercent || 0) > 80 ? 'exception' :
                                        (overview?.heapMemory?.usedPercent || 0) > 60 ? 'normal' : 'active'
                                }
                                format={(percent) => `${percent}% 使用率`}
                                strokeWidth={15}
                            />
                        </div>
                        <Row gutter={16} style={{ marginTop: '16px' }}>
                            <Col span={12}>
                                <Statistic title="已使用" value={overview?.heapMemory?.used || '-'} valueStyle={{ color: '#888' }} />
                            </Col>
                            <Col span={12}>
                                <Statistic title="最大可用" value={overview?.heapMemory?.max || '-'} valueStyle={{ color: '#888' }} />
                            </Col>
                        </Row>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card
                        title={<span style={{ fontWeight: 'bold' }}>非堆内存 (Non-Heap Memory)</span>}
                        bordered={false}
                        hoverable
                        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    >
                        <Row gutter={16} style={{ marginTop: '20px', marginBottom: '20px' }}>
                            <Col span={12}>
                                <Statistic title="已使用" value={overview?.nonHeapMemory?.used || '-'} valueStyle={{ fontSize: '24px', fontWeight: 'bold', color: '#13c2c2' }} />
                            </Col>
                            <Col span={12}>
                                <Statistic title="已提交" value={overview?.nonHeapMemory?.committed || '-'} valueStyle={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }} />
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            <Divider style={{ margin: '32px 0' }} />

            {/* 线程信息 */}
            <h3 style={{ marginLeft: '8px', marginBottom: '16px', fontWeight: 'bold' }}>线程信息</h3>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: '12px', textAlign: 'center' }}>
                        <Statistic title="活跃线程" value={threads?.activeThreads || 0} valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: '12px', textAlign: 'center' }}>
                        <Statistic title="峰值线程" value={threads?.peakThreadCount || 0} valueStyle={{ color: '#722ed1', fontWeight: 'bold' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: '12px', textAlign: 'center' }}>
                        <Statistic title="守护线程" value={threads?.daemonThreadCount || 0} valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: '12px', textAlign: 'center' }}>
                        <Statistic title="累计启动线程" value={threads?.totalStartedThreadCount || 0} valueStyle={{ color: '#52c41a', fontWeight: 'bold' }} />
                    </Card>
                </Col>
            </Row>

            <Divider style={{ margin: '32px 0' }} />

            {/* JVM信息 */}
            <h3 style={{ marginLeft: '8px', marginBottom: '16px', fontWeight: 'bold' }}>JVM详情</h3>
            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Row gutter={[24, 24]}>
                    <Col span={8}>
                        <div style={{ fontSize: '12px', color: '#999' }}>JVM名称</div>
                        <div style={{ fontWeight: 500 }}>{overview?.jvmName}</div>
                    </Col>
                    <Col span={8}>
                        <div style={{ fontSize: '12px', color: '#999' }}>JVM版本</div>
                        <div style={{ fontWeight: 500 }}>{overview?.jvmVersion}</div>
                    </Col>
                    <Col span={8}>
                        <div style={{ fontSize: '12px', color: '#999' }}>JVM厂商</div>
                        <div style={{ fontWeight: 500 }}>{overview?.jvmVendor}</div>
                    </Col>
                    <Col span={8}>
                        <div style={{ fontSize: '12px', color: '#999' }}>操作系统</div>
                        <div style={{ fontWeight: 500 }}>{overview?.osName} {overview?.osVersion}</div>
                    </Col>
                    <Col span={8}>
                        <div style={{ fontSize: '12px', color: '#999' }}>系统架构</div>
                        <div style={{ fontWeight: 500 }}>{overview?.osArch}</div>
                    </Col>
                    <Col span={8}>
                        <div style={{ fontSize: '12px', color: '#999' }}>启动时间</div>
                        <div style={{ fontWeight: 500 }}>{overview?.startTime}</div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default SystemMonitorPage;
