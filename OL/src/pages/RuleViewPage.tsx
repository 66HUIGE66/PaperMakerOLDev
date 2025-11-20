import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import {
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Descriptions,
  Row,
  Col,
  Statistic,
  Divider,
  message,
  Spin,
  Alert
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  CopyOutlined,
  SettingOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { API_CONFIG } from '../config/api';
import { authService } from '../services/authService';
import RuleConfigDisplay from '../components/RuleConfigDisplay';

const { Title, Text, Paragraph } = Typography;

interface ExamRule {
  id: number;
  name: string;
  description: string;
  totalQuestions: number;
  totalScore: number;
  duration: number;
  ruleConfig: string;
  creatorId: number;
  isSystem: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

const RuleViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rule, setRule] = useState<ExamRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 检查权限
  const isAdmin = user?.role === UserRole.ADMIN;
  const isCreator = user?.id === rule?.creatorId;
  const canEdit = isAdmin || (!rule?.isSystem && isCreator);
  
  console.log('权限检查:', {
    isAdmin,
    isCreator,
    canEdit,
    user: {
      id: user?.id,
      role: user?.role,
      username: user?.username
    },
    rule: {
      id: rule?.id,
      creatorId: rule?.creatorId,
      isSystem: rule?.isSystem,
      name: rule?.name
    }
  });

  useEffect(() => {
    if (id) {
      loadRule(parseInt(id));
    }
  }, [id]);

  const loadRule = async (ruleId: number) => {
    try {
      setLoading(true);
      setError(null);

      const token = authService.getToken();
      if (!token) {
        setError('用户未登录，请先登录');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rules/${ruleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('用户未登录，请先登录');
          return;
        } else if (response.status === 403) {
          setError('无权限访问此规则');
          return;
        } else if (response.status === 404) {
          setError('规则不存在');
          return;
        } else {
          throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('规则加载结果:', result);
      
      if (result.code === 200 && result.data) {
        const ruleData = result.data;
        console.log('规则数据:', {
          id: ruleData.id,
          name: ruleData.name,
          creatorId: ruleData.creatorId,
          isSystem: ruleData.isSystem
        });
        setRule(ruleData);
      } else {
        console.error('加载规则失败:', result.message);
        setError(result.message || '获取规则详情失败');
      }
    } catch (error: any) {
      console.error('Error loading rule:', error);
      setError(error.message || '获取规则详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (rule) {
      navigate(`/rules/edit/${rule.id}`);
    }
  };

  const handleCopy = async () => {
    if (!rule) return;

    try {
      const token = authService.getToken();
      if (!token) {
        message.error('用户未登录，请先登录');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rules/${rule.id}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const result = await response.json();
      if (result.code === 200) {
        message.success('规则复制成功');
        navigate('/rules');
      } else {
        message.error(result.message || '复制规则失败');
      }
    } catch (error) {
      message.error('复制规则失败');
      console.error('Error copying rule:', error);
    }
  };

  const handleStatusToggle = async () => {
    if (!rule) return;

    try {
      const token = authService.getToken();
      if (!token) {
        message.error('用户未登录，请先登录');
        return;
      }

      const newStatus = rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rules/${rule.id}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const result = await response.json();
      if (result.code === 200) {
        message.success('状态更新成功');
        setRule({ ...rule, status: newStatus });
      } else {
        message.error(result.message || '状态更新失败');
      }
    } catch (error) {
      message.error('状态更新失败');
      console.error('Error updating status:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { text: '启用', color: 'green' };
      case 'INACTIVE':
        return { text: '禁用', color: 'red' };
      default:
        return { text: status, color: 'default' };
    }
  };

  const parseRuleConfig = (configStr: string) => {
    try {
      return JSON.parse(configStr);
    } catch {
      return {};
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>加载规则详情中...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/rules')}>
              返回规则列表
            </Button>
          }
        />
      </div>
    );
  }

  if (!rule) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="规则不存在"
          description="请求的规则不存在或已被删除"
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/rules')}>
              返回规则列表
            </Button>
          }
        />
      </div>
    );
  }

  const statusConfig = getStatusConfig(rule.status);
  const ruleConfig = parseRuleConfig(rule.ruleConfig);
  const rc: any = ruleConfig || {};
  const questionTypes = rc.questionTypes || [];
  const typeDist = rc.questionTypeDistribution || {};

  let computedQuestionCount: number | undefined = rc.totalQuestions ?? rule.totalQuestions;
  if (!computedQuestionCount || Number(computedQuestionCount) === 0) {
    if (Array.isArray(questionTypes) && questionTypes.length > 0) {
      computedQuestionCount = questionTypes.reduce((sum: number, t: any) => sum + (Number(t.count) || 0), 0);
    } else if (typeDist && typeof typeDist === 'object') {
      computedQuestionCount = Object.values(typeDist).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
    }
  }

  let computedTotalScore: number | undefined = rc.totalScore ?? rule.totalScore;
  if (!computedTotalScore || Number(computedTotalScore) === 0) {
    if (Array.isArray(questionTypes) && questionTypes.length > 0) {
      computedTotalScore = questionTypes.reduce((sum: number, t: any) => sum + (Number(t.count) || 0) * (Number(t.score) || 0), 0);
    } else if (typeDist && typeof typeDist === 'object') {
      const scorePerType = rc.scorePerType || rc.typeScores || {};
      const perQuestionScore = rc.scorePerQuestion || 0;
      const distScore = Object.entries(typeDist).reduce((sum: number, [type, cnt]: any) => {
        const countNum = Number(cnt) || 0;
        const typeScore = Number(scorePerType?.[type]) || 0;
        return sum + (typeScore > 0 ? countNum * typeScore : 0);
      }, 0);
      if (distScore > 0) {
        computedTotalScore = distScore;
      } else if (perQuestionScore > 0 && computedQuestionCount && computedQuestionCount > 0) {
        computedTotalScore = computedQuestionCount * perQuestionScore;
      }
    }
  }
  const normalizeKP = (kp: any) => {
    if (Array.isArray(kp)) {
      return kp.map((x: any) => ({
        name: x.name || x.point || String(x),
        weight: Number(x.weight) || 0,
      }));
    }
    if (kp && typeof kp === 'object') {
      return Object.entries(kp).map(([name, w]) => ({
        name,
        weight: Number(w) || 0,
      }));
    }
    return [];
  };
  (ruleConfig as any).knowledgePoints = normalizeKP((ruleConfig as any).knowledgePoints);

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(rule.isSystem ? '/system-rules' : '/my-rules')}
          >
            返回
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            {rule.name}
          </Title>
          <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
          {rule.isSystem && <Tag color="blue">系统规则</Tag>}
        </Space>
      </div>

      {/* 操作按钮 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={handleEdit}
            disabled={!canEdit}
          >
            编辑规则
          </Button>
          <Button 
            icon={<CopyOutlined />}
            onClick={handleCopy}
          >
            复制规则
          </Button>
          <Button 
            icon={<SettingOutlined />}
            onClick={handleStatusToggle}
            disabled={!canEdit}
          >
            {rule.status === 'ACTIVE' ? '禁用' : '启用'}
          </Button>
        </Space>
      </Card>

      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: '24px' }}>
        <Descriptions column={2}>
          <Descriptions.Item label="规则名称">{rule.name}</Descriptions.Item>
          <Descriptions.Item label="规则状态">
            <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="题目数量">{computedQuestionCount ?? rule.totalQuestions}</Descriptions.Item>
          <Descriptions.Item label="总分">{computedTotalScore ?? rule.totalScore}</Descriptions.Item>
          <Descriptions.Item label="考试时长">{rule.duration} 分钟</Descriptions.Item>
          <Descriptions.Item label="使用次数">{rule.usageCount || 0}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(rule.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(rule.updatedAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
        
        {rule.description && (
          <>
            <Divider />
            <div>
              <Text strong>规则描述：</Text>
              <Paragraph style={{ marginTop: '8px' }}>
                {rule.description}
              </Paragraph>
            </div>
          </>
        )}
      </Card>

      {/* 规则配置 */}
      <Card title="规则配置" style={{ marginBottom: '24px' }}>
        {ruleConfig.questionTypes && (
          <div style={{ marginBottom: '16px' }}>
            <Text strong>题目类型配置：</Text>
            <Row gutter={16} style={{ marginTop: '8px' }}>
              {ruleConfig.questionTypes.map((type: any, index: number) => (
                <Col span={8} key={index}>
                  <Card size="small">
                    <Statistic
                      title={type.type}
                      value={type.count}
                      suffix="题"
                    />
                    <Text type="secondary">
                      分值: {type.score}分
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {ruleConfig.knowledgePoints && Array.isArray(ruleConfig.knowledgePoints) && ruleConfig.knowledgePoints.length > 0 && (
          <div>
            <Text strong>知识点配置：</Text>
            <Row gutter={16} style={{ marginTop: '8px' }}>
              {ruleConfig.knowledgePoints.map((point: any, index: number) => (
                <Col span={6} key={index}>
                  <Card size="small">
                    <Statistic
                      title={point.point || point.name}
                      value={point.weight}
                      suffix="%"
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {(!ruleConfig.questionTypes && !ruleConfig.knowledgePoints) && (
          <Text type="secondary">暂无详细配置信息</Text>
        )}
      </Card>

      {/* 原始配置数据 - 图形化展示 */}
      <Card title="详细配置信息" style={{ marginTop: '24px' }}>
        <RuleConfigDisplay config={ruleConfig} />
      </Card>
    </div>
  );
};

export default RuleViewPage;








