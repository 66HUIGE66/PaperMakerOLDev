import React, { useState, useEffect } from 'react';
import { Button, message, Spin, Row, Col, Typography } from 'antd';
import {
    ArrowLeftOutlined,
    CalendarOutlined,
    CheckCircleFilled,
    LockFilled,
    StarFilled,
    SearchOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { studyPlanService, StudyPlan } from '../services/studyPlanService';
import { subjectService } from '../services/subjectService';
import ReactMarkdown from 'react-markdown';
import dayjs from 'dayjs';
import './MyPlanDetailPage.css';

const { Title, Text } = Typography;

const MyPlanDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [plan, setPlan] = useState<StudyPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [subjectName, setSubjectName] = useState('');
    const [searchingStage, setSearchingStage] = useState<number | null>(null);
    const [searchResults, setSearchResults] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        if (id) {
            fetchPlanDetail(Number(id));
        }
    }, [id]);

    const fetchPlanDetail = async (planId: number) => {
        try {
            const data = await studyPlanService.getPlanById(planId);
            setPlan(data);
            if (data.subjectId) {
                const subjects = await subjectService.getSubjects();
                const subj = subjects.find(s => Number(s.value) === data.subjectId);
                setSubjectName(subj ? subj.label : '未知学科');
            }
        } catch (error) {
            console.error('Failed to fetch plan detail', error);
            message.error('加载计划详情失败');
        } finally {
            setLoading(false);
        }
    };



    const handleSearchResources = async (stageIndex: number, stageTitle: string) => {
        setSearchingStage(stageIndex);
        try {
            message.loading('正在搜索学习资源...', 0);
            const result = await studyPlanService.searchResources(stageTitle);
            message.destroy();
            setSearchResults(prev => ({ ...prev, [stageIndex]: result }));
        } catch (error) {
            message.destroy();
            message.error('搜索失败，请稍后重试');
        } finally {
            setSearchingStage(null);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
    }

    if (!plan) {
        return <div style={{ textAlign: 'center', padding: 50 }}>计划不存在或已删除</div>;
    }

    const remainingDays = dayjs(plan.deadline).diff(dayjs(), 'day');

    // Calculate real progress based on total days passed vs total duration
    const calculateProgress = () => {
        const created = dayjs(plan.createdAt);
        const deadline = dayjs(plan.deadline);
        const now = dayjs();

        const totalDuration = deadline.diff(created, 'day');
        const daysPassed = now.diff(created, 'day');

        if (totalDuration <= 0) return 100;
        if (daysPassed <= 0) return 0;

        const percent = Math.min(100, Math.floor((daysPassed / totalDuration) * 100));
        return percent;
    };

    const progress = calculateProgress();

    // Parse AI suggestions into "modules" for timeline
    const renderTimeline = () => {
        if (!plan.aiSuggestion) return null;

        const lines = plan.aiSuggestion.split('\n');
        const modules: { title: string; content: string[], resources: string[], status: string, dateRange?: string }[] = [];
        let isParsingStages = false;
        let currentModuleIndex = -1;
        let isParsingResources = false;

        // Regex patterns
        const stageHeaderPattern = /###\s*\d+\.\s*(.+)/; // Main Section Header: ### 1. XXX
        const stageItemPattern = /-\s*\*\*(.+?)\*\*\s*[：:]\s*(.+)/; // Stage Item: - **第一阶段...**：内容
        const resourcesHeaderPattern = /^\s+学习资源[：:]\s*$/; // "  学习资源："
        const bulletPointPattern = /^[○◦•]\s+(.+)/; // Bullet points for resources

        lines.forEach((line, lineIdx) => {
            // Check if we are in a ### section (any content, not just specific keywords)
            if (line.match(stageHeaderPattern)) {
                // Start parsing if it's any numbered section (flexible, not keyword-dependent)
                isParsingStages = true;
                isParsingResources = false;
            } else if (line.startsWith('## ')) {
                // Stop parsing stages if we hit a main ## section
                isParsingStages = false;
                isParsingResources = false;
            }

            if (isParsingStages) {
                const match = line.match(stageItemPattern);
                if (match) {
                    // New stage found
                    isParsingResources = false;
                    const titlePart = match[1]; // "第一阶段（2025...）"
                    const contentPart = match[2]; // "熟悉..."

                    // Extract Date Range
                    let dateRange = "";
                    let displayTitle = titlePart;
                    const dateMatch = titlePart.match(/[（(](.+?)[)）]/);
                    if (dateMatch) {
                        dateRange = dateMatch[1];
                        displayTitle = titlePart.replace(/[（(].+?[)）]/, '').trim();
                    }

                    // Determine status
                    let status = 'locked';
                    if (dateRange && dateRange.includes('至')) {
                        const dates = dateRange.split('至').map(s => s.trim());
                        if (dates.length === 2) {
                            const start = dayjs(dates[0]);
                            const end = dayjs(dates[1]);
                            const now = dayjs();
                            if (now.isAfter(end)) status = 'completed';
                            else if (now.isAfter(start)) status = 'in-progress';
                            else status = 'locked';
                        }
                    } else {
                        status = modules.length === 0 ? 'in-progress' : 'locked';
                    }

                    modules.push({
                        title: displayTitle,
                        dateRange: dateRange,
                        content: [contentPart],
                        resources: [],
                        status: status
                    });
                    currentModuleIndex = modules.length - 1;
                } else if (line.match(resourcesHeaderPattern) && currentModuleIndex >= 0) {
                    // Found "学习资源：" header
                    isParsingResources = true;
                } else if (currentModuleIndex >= 0 && line.trim().length > 0) {
                    // Collect resource lines (either after "学习资源：" or bullet-point resources like "○ xxx")
                    const bulletMatch = line.match(bulletPointPattern);
                    if (bulletMatch || isParsingResources) {
                        // This is a resource line
                        const resourceLine = bulletMatch ? bulletMatch[1] : line.trim();
                        if (!resourceLine.startsWith('-') || resourceLine.match(/\*\*/)) {
                            // Avoid re-parsing stage items as resources
                            if (!resourceLine.match(stageItemPattern)) {
                                modules[currentModuleIndex].resources.push(resourceLine);
                            }
                        }
                    }
                }
            }
        });

        // Fallback if no structured stages found
        if (modules.length === 0) {
            return (
                <div style={{ marginTop: 24, background: 'white', padding: 24, borderRadius: 12 }}>
                    <Title level={4}>详细计划</Title>
                    <ReactMarkdown>{plan.aiSuggestion}</ReactMarkdown>
                </div>
            );
        }

        return (
            <div className="timeline-container">
                <div className="timeline-line"></div>
                {modules.map((mod, index) => {
                    const status = mod.status;
                    const icon = status === 'completed' ? <CheckCircleFilled /> : (status === 'in-progress' ? <LockFilled style={{ color: '#4f46e5' }} /> : <LockFilled />);

                    return (
                        <div key={index} className="timeline-item">
                            <div className={`timeline-icon ${status}`}>
                                {icon}
                            </div>
                            <div className="timeline-card-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                                    <div>
                                        <h3 className="timeline-title" style={{ opacity: status === 'locked' ? 0.5 : 1, fontSize: 16 }}>
                                            {mod.title}
                                        </h3>
                                        {mod.dateRange && (
                                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                                                <CalendarOutlined style={{ marginRight: 4 }} /> {mod.dateRange}
                                            </div>
                                        )}
                                    </div>
                                    {status === 'in-progress' && (
                                        <span style={{ background: '#eef2ff', color: '#4f46e5', fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                                            进行中
                                        </span>
                                    )}
                                </div>

                                <div style={{ color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
                                    {mod.content.map((line, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 8 }}>
                                            {status === 'completed' ? <CheckCircleFilled style={{ color: '#22c55e', marginTop: 5 }} /> : <div style={{ width: 14 }} />}
                                            <span>{line}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Learning Resources Section */}
                                {mod.resources && mod.resources.length > 0 && (
                                    <div style={{ marginTop: 20 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            📚 学习资源
                                            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
                                                为你推荐 {mod.resources.length} 个资源
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {mod.resources.map((resource, rIdx) => {
                                                // Parse resource to extract title and URL
                                                const urlMatch = resource.match(/链接[:：]\s*(https?:\/\/[^\s\n]+)/);
                                                const titleMatch = resource.match(/📖\s*\*?\*?(.+?)\*?\*?[\n\r]/);
                                                const url = urlMatch ? urlMatch[1] : '';
                                                const title = titleMatch ? titleMatch[1].trim() : resource.substring(0, 50);

                                                // Determine icon and color based on content
                                                let icon = '📄';
                                                let bgColor = '#f0f9ff';
                                                let iconColor = '#3b82f6';
                                                if (resource.includes('视频') || resource.includes('video')) {
                                                    icon = '▶️';
                                                    bgColor = '#fef3c7';
                                                    iconColor = '#f59e0b';
                                                } else if (resource.includes('教程') || resource.includes('tutorial')) {
                                                    icon = '📖';
                                                    bgColor = '#f0fdf4';
                                                    iconColor = '#22c55e';
                                                } else if (resource.includes('文档') || resource.includes('doc')) {
                                                    icon = '📝';
                                                    bgColor = '#fce7f3';
                                                    iconColor = '#ec4899';
                                                }

                                                return (
                                                    <a
                                                        key={rIdx}
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 12,
                                                            padding: 12,
                                                            background: 'white',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: 8,
                                                            textDecoration: 'none',
                                                            color: 'inherit',
                                                            transition: 'all 0.2s',
                                                            cursor: url ? 'pointer' : 'default'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (url) {
                                                                e.currentTarget.style.borderColor = iconColor;
                                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 8,
                                                            background: bgColor,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: 20,
                                                            flexShrink: 0
                                                        }}>
                                                            {icon}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {title}
                                                            </div>
                                                            {url && (
                                                                <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {url}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Search Resources Button */}
                                <div style={{ marginTop: 16 }}>
                                    <Button
                                        type="dashed"
                                        icon={searchingStage === index ? <LoadingOutlined /> : <SearchOutlined />}
                                        onClick={() => handleSearchResources(index, mod.title)}
                                        loading={searchingStage === index}
                                        style={{ borderRadius: 8 }}
                                    >
                                        {searchingStage === index ? '搜索中...' : '搜索相关学习资料'}
                                    </Button>
                                </div>

                                {/* Display cached search results for this stage */}
                                {searchResults[index] && (
                                    <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                                            🔍 搜索结果
                                        </div>
                                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#475569', margin: 0 }}>
                                            {searchResults[index]}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="detail-page-container">
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
                {/* Back Navigation */}
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 24, color: '#64748b' }}>
                    返回列表
                </Button>

                {/* Hero Header */}
                <div className="detail-header">
                    <div className="header-decoration-1"></div>
                    <div className="header-decoration-2"></div>

                    <Row gutter={48} align="middle" style={{ position: 'relative', zIndex: 1 }}>
                        <Col xs={24} md={16}>
                            <div className="highlight-tag">
                                <StarFilled style={{ fontSize: 12 }} /> 重点计划
                            </div>
                            <h1 className="detail-title">{subjectName} 学习计划</h1>
                            <p className="detail-description">
                                {plan.targetDescription}
                            </p>

                            <div style={{ marginTop: 32, display: 'flex', gap: 24, alignItems: 'center' }}>
                                <div style={{ color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CalendarOutlined />
                                    <span>预计 {dayjs(plan.deadline).format('MM月DD日')} 完成</span>
                                </div>
                            </div>
                        </Col>

                        <Col xs={0} md={8}>
                            <div className="progress-card">
                                <div style={{ position: 'relative', width: 80, height: 80 }}>
                                    <svg className="circular-chart" viewBox="0 0 36 36">
                                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path className="circle" strokeDasharray={`${progress}, 100`} stroke="#4ade80" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <text x="18" y="20.35" className="percentage">{progress}%</text>
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ color: '#c7d2fe', fontSize: 12, textTransform: 'uppercase', fontWeight: 600 }}>当前状态</div>
                                    <div style={{ color: 'white', fontWeight: 500, fontSize: 16 }}>{plan.status === 'ONGOING' ? '进行中' : '已完成'}</div>
                                    <div style={{ color: '#818cf8', fontSize: 12, marginTop: 4 }}>剩余 {remainingDays} 天</div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>

                <Row gutter={32} justify="center">
                    <Col xs={24} lg={18}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
                            <Title level={4} style={{ margin: 0, color: '#1e293b' }}>学习路径</Title>
                            <Text type="secondary">AI 智能规划路线</Text>
                        </div>
                        {renderTimeline()}
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default MyPlanDetailPage;
