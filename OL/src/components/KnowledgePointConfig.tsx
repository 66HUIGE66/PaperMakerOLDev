import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  message,
  Modal,
  Tag,
  Row,
  Col,
  Select,
  InputNumber,
  Popconfirm,
  Alert,
  Progress
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { knowledgePointApi } from '../services/api';

const { Text } = Typography;
const { Option } = Select;

interface KnowledgePoint {
  id: number;
  name: string;
  description?: string;
  subject: string;
  weight: number;
  difficultyLevel: string;
  isSystem: boolean;
  status: string;
  sortOrder: number;
}

interface KnowledgePointConfigProps {
  visible: boolean;
  onClose: () => void;
  subject?: string;
}

const KnowledgePointConfig: React.FC<KnowledgePointConfigProps> = ({
  visible,
  onClose,
  subject: propSubject
}) => {
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [totalWeight, setTotalWeight] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(propSubject || '计算机科学');

  const subjects = [
    { value: '计算机科学', label: '计算机科学' },
    { value: '数学', label: '数学' },
    { value: '物理', label: '物理' },
    { value: '化学', label: '化学' },
    { value: '英语', label: '英语' },
    { value: '语文', label: '语文' }
  ];

  const difficultyLevels = [
    { value: 'EASY', label: '简单' },
    { value: 'MEDIUM', label: '中等' },
    { value: 'HARD', label: '困难' }
  ];

  useEffect(() => {
    if (visible) {
      loadKnowledgePoints();
    }
  }, [visible, selectedSubject]);

  // 监听传入的学科变化
  useEffect(() => {
    if (propSubject && propSubject !== selectedSubject) {
      setSelectedSubject(propSubject);
    }
  }, [propSubject]);

  const loadKnowledgePoints = async () => {
    try {
      setLoading(true);
      console.log('正在加载知识点，学科:', selectedSubject);
      const response = await knowledgePointApi.getKnowledgePoints(selectedSubject);
      console.log('API响应:', response);
      
      // 处理API响应数据结构
      let data = [];
      if (response && response.data) {
        // 如果response.data是对象，尝试获取data字段
        if (typeof response.data === 'object' && response.data.data) {
          data = Array.isArray(response.data.data) ? response.data.data : [];
        } else if (Array.isArray(response.data)) {
          data = response.data;
        }
      }
      
      console.log('知识点数据:', data);
      setKnowledgePoints(data);
      calculateTotalWeight(data);
    } catch (error) {
      console.error('加载知识点失败:', error);
      message.error('加载知识点失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalWeight = (points: KnowledgePoint[]) => {
    if (!Array.isArray(points)) {
      console.warn('calculateTotalWeight: points不是数组:', points);
      setTotalWeight(0);
      return;
    }
    const total = points.reduce((sum, point) => sum + (point.weight || 0), 0);
    setTotalWeight(total);
  };

  const handleAddKnowledgePoint = () => {
    const newPoint: KnowledgePoint = {
      id: Date.now(), // 临时ID
      name: '',
      description: '',
      subject: selectedSubject,
      weight: 0,
      difficultyLevel: 'MEDIUM',
      isSystem: false,
      status: 'ACTIVE',
      sortOrder: knowledgePoints.length + 1
    };
    setKnowledgePoints([...knowledgePoints, newPoint]);
    setEditingId(newPoint.id);
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleSave = async (id: number) => {
    try {
      const point = knowledgePoints.find(p => p.id === id);
      if (!point) return;

      if (!point.name.trim()) {
        message.error('请输入知识点名称');
        return;
      }

      if (point.weight < 0 || point.weight > 100) {
        message.error('权重必须在0-100之间');
        return;
      }

      // 检查权重总和
      const otherPoints = knowledgePoints.filter(p => p.id !== id);
      const otherTotalWeight = otherPoints.reduce((sum, p) => sum + p.weight, 0);
      if (otherTotalWeight + point.weight > 100) {
        message.error('权重总和不能超过100%');
        return;
      }

      if (id > 0) {
        // 更新现有知识点
        await knowledgePointApi.updateKnowledgePoint(id, point);
        message.success('更新成功');
      } else {
        // 创建新知识点
        const response = await knowledgePointApi.createKnowledgePoint(point);
        const newPoint = response.data;
        setKnowledgePoints(prev => prev.map(p => p.id === id ? { ...newPoint } : p));
        message.success('创建成功');
      }

      setEditingId(null);
      calculateTotalWeight(knowledgePoints);
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await knowledgePointApi.deleteKnowledgePoint(id);
      setKnowledgePoints(prev => prev.filter(p => p.id !== id));
      message.success('删除成功');
      loadKnowledgePoints(); // 重新加载以更新权重
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const handleWeightChange = (id: number, weight: number) => {
    setKnowledgePoints(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, weight } : p);
      calculateTotalWeight(updated);
      return updated;
    });
  };

  const handleBatchUpdateWeights = async () => {
    try {
      const weightMap: Record<number, number> = {};
      knowledgePoints.forEach(point => {
        weightMap[point.id] = point.weight;
      });

      await knowledgePointApi.batchUpdateWeights(weightMap);
      message.success('批量更新成功');
      loadKnowledgePoints();
    } catch (error) {
      console.error('批量更新失败:', error);
      message.error('批量更新失败');
    }
  };

  const handleCreateDefault = async () => {
    try {
      await knowledgePointApi.createDefaultKnowledgePoints(selectedSubject);
      message.success('默认知识点创建成功');
      loadKnowledgePoints();
    } catch (error) {
      console.error('创建默认知识点失败:', error);
      message.error('创建默认知识点失败');
    }
  };

  const renderKnowledgePointItem = (point: KnowledgePoint) => {
    const isEditing = editingId === point.id;
    const isSystem = point.isSystem;

    return (
      <Card
        key={point.id}
        size="small"
        style={{ marginBottom: 8 }}
        actions={isEditing ? [
          <Button
            key="save"
            type="primary"
            size="small"
            icon={<SaveOutlined />}
            onClick={() => handleSave(point.id)}
          >
            保存
          </Button>,
          <Button
            key="cancel"
            size="small"
            onClick={() => setEditingId(null)}
          >
            取消
          </Button>
        ] : [
          <Button
            key="edit"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(point.id)}
            disabled={isSystem}
          >
            编辑
          </Button>,
          <Popconfirm
            key="delete"
            title="确定要删除这个知识点吗？"
            onConfirm={() => handleDelete(point.id)}
            disabled={isSystem}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={isSystem}
            >
              删除
            </Button>
          </Popconfirm>
        ]}
      >
        <Row gutter={16} align="middle">
          <Col span={8}>
            {isEditing ? (
              <Input
                value={point.name}
                onChange={(e) => {
                  const updated = knowledgePoints.map(p => 
                    p.id === point.id ? { ...p, name: e.target.value } : p
                  );
                  setKnowledgePoints(updated);
                }}
                placeholder="知识点名称"
              />
            ) : (
              <Text strong={isSystem}>{point.name}</Text>
            )}
          </Col>
          <Col span={6}>
            {isEditing ? (
              <InputNumber
                value={point.weight}
                onChange={(value) => handleWeightChange(point.id, value || 0)}
                min={0}
                max={100}
                precision={1}
                addonAfter="%"
                style={{ width: '100%' }}
              />
            ) : (
              <Text>{point.weight}%</Text>
            )}
          </Col>
          <Col span={6}>
            {isEditing ? (
              <Select
                value={point.difficultyLevel}
                onChange={(value) => {
                  const updated = knowledgePoints.map(p => 
                    p.id === point.id ? { ...p, difficultyLevel: value } : p
                  );
                  setKnowledgePoints(updated);
                }}
                style={{ width: '100%' }}
              >
                {difficultyLevels.map(level => (
                  <Option key={level.value} value={level.value}>
                    {level.label}
                  </Option>
                ))}
              </Select>
            ) : (
              <Tag color={
                point.difficultyLevel === 'EASY' ? 'green' :
                point.difficultyLevel === 'MEDIUM' ? 'orange' : 'red'
              }>
                {difficultyLevels.find(l => l.value === point.difficultyLevel)?.label}
              </Tag>
            )}
          </Col>
          <Col span={4}>
            {isSystem && <Tag color="blue">系统</Tag>}
          </Col>
        </Row>
        {point.description && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {point.description}
            </Text>
          </div>
        )}
      </Card>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>知识点配置</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 学科选择 */}
        <Card size="small">
          <Space>
            <Text strong>当前学科：</Text>
            {propSubject ? (
              <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                {selectedSubject}
              </Tag>
            ) : (
              <Select
                value={selectedSubject}
                onChange={setSelectedSubject}
                style={{ width: 200 }}
              >
                {subjects.map(subject => (
                  <Option key={subject.value} value={subject.value}>
                    {subject.label}
                  </Option>
                ))}
              </Select>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={loadKnowledgePoints}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </Card>

        {/* 权重总和显示 */}
        <Alert
          message={`权重总和: ${totalWeight.toFixed(1)}%`}
          type={totalWeight > 100 ? 'error' : totalWeight === 100 ? 'success' : 'info'}
          showIcon
          action={
            <Space>
              <Button
                size="small"
                onClick={handleCreateDefault}
              >
                创建默认知识点
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={handleBatchUpdateWeights}
                disabled={totalWeight > 100}
              >
                批量更新权重
              </Button>
            </Space>
          }
        />

        {/* 权重进度条 */}
        <Progress
          percent={totalWeight}
          status={totalWeight > 100 ? 'exception' : totalWeight === 100 ? 'success' : 'active'}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />

        {/* 添加知识点按钮 */}
        <div>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddKnowledgePoint}
            block
          >
            添加知识点
          </Button>
        </div>

        {/* 知识点列表 */}
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          {Array.isArray(knowledgePoints) && knowledgePoints.map(renderKnowledgePointItem)}
        </div>

        {(!Array.isArray(knowledgePoints) || knowledgePoints.length === 0) && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">暂无知识点，点击"添加知识点"开始配置</Text>
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default KnowledgePointConfig;
