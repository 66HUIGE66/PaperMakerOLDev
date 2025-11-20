import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Tag, Space, Modal, Form, Input, Select, InputNumber } from 'antd';
import { ThunderboltOutlined, BookOutlined, AimOutlined, ClockCircleOutlined, StarOutlined, HeartOutlined } from '@ant-design/icons';
import { PracticeMode, QuestionCategory } from '../types';
// import { practiceApi, questionCategoryApi } from '../services/api'; // 移除后端API依赖

const { Title, Text } = Typography;
const { Option } = Select;

interface PracticeModeSelectorProps {
  onModeSelected: (mode: PracticeMode, params: any) => void;
  userId: number;
}

const PracticeModeSelector: React.FC<PracticeModeSelectorProps> = ({ onModeSelected, userId }) => {
  const [modes, setModes] = useState<PracticeMode[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // 暂时使用模拟数据，避免API调用错误
      const mockModes = [
        {
          id: 1,
          name: '随机练习',
          code: 'RANDOM',
          description: '随机选择题目进行练习',
          config: { question_count: 10, time_limit: 0, show_answer: true },
          isSystem: true,
          isActive: true,
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString()
        },
        {
          id: 2,
          name: '专项练习',
          code: 'SPECIFIC',
          description: '针对特定知识点进行练习',
          config: { question_count: 20, time_limit: 0, show_answer: true, allow_retry: true },
          isSystem: true,
          isActive: true,
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString()
        },
        {
          id: 3,
          name: '模拟考试',
          code: 'MOCK_EXAM',
          description: '模拟真实考试环境',
          config: { question_count: 50, time_limit: 120, show_answer: false, auto_submit: true },
          isSystem: true,
          isActive: true,
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString()
        }
      ];
      
      setModes(mockModes);
      
      // 使用动态获取的学科数据，如果没有则使用默认分类
      const mockCategories = subjects.length > 0 ? 
        subjects.map((s, index) => ({
          id: s.id,
          name: s.name,
          parentId: null,
          level: 0,
          isSystem: true
        })) : [
          { id: 1, name: '计算机科学', parentId: null, level: 0, isSystem: true },
          { id: 2, name: '编程语言', parentId: 1, level: 1, isSystem: true },
          { id: 3, name: '学科应用', parentId: 1, level: 1, isSystem: true },
          { id: 4, name: '数学', parentId: null, level: 0, isSystem: true }
        ];
      
      setCategories(mockCategories);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModeIcon = (code: string) => {
    const iconMap = {
      'RANDOM': <ThunderboltOutlined />,
      'SPECIFIC': <AimOutlined />,
      'MOCK_EXAM': <BookOutlined />,
      'MISTAKE_REVIEW': <StarOutlined />,
      'FAVORITE': <HeartOutlined />,
      'DAILY': <ClockCircleOutlined />
    };
    return iconMap[code as keyof typeof iconMap] || <ThunderboltOutlined />;
  };

  const getModeColor = (code: string) => {
    const colorMap = {
      'RANDOM': '#1890ff',
      'SPECIFIC': '#52c41a',
      'MOCK_EXAM': '#fa8c16',
      'MISTAKE_REVIEW': '#722ed1',
      'FAVORITE': '#eb2f96',
      'DAILY': '#13c2c2'
    };
    return colorMap[code as keyof typeof colorMap] || '#1890ff';
  };

  const handleModeClick = (mode: PracticeMode) => {
    setSelectedMode(mode);
    
    // 如果模式需要配置参数，显示配置弹窗
    if (mode.code === 'SPECIFIC' || mode.code === 'MOCK_EXAM') {
      setConfigModalVisible(true);
      form.resetFields();
    } else {
      // 直接开始练习
      onModeSelected(mode, {});
    }
  };

  const handleConfigSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedMode) {
        onModeSelected(selectedMode, values);
        setConfigModalVisible(false);
      }
    } catch (error) {
      console.error('配置验证失败:', error);
    }
  };

  const renderModeCard = (mode: PracticeMode) => {
    const config = mode.config || {};
    
    return (
      <Card
        key={mode.id}
        hoverable
        style={{ height: '100%' }}
        onClick={() => handleModeClick(mode)}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, color: getModeColor(mode.code), marginBottom: 16 }}>
            {getModeIcon(mode.code)}
          </div>
          <Title level={4} style={{ marginBottom: 8 }}>
            {mode.name}
          </Title>
          <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
            {mode.description}
          </Text>
          
          <Space direction="vertical" size="small">
            {config.question_count && (
              <Tag color="blue">
                {config.question_count} 道题目
              </Tag>
            )}
            {config.time_limit && config.time_limit > 0 && (
              <Tag color="orange">
                {config.time_limit} 分钟
              </Tag>
            )}
            {config.show_answer && (
              <Tag color="green">即时反馈</Tag>
            )}
            {config.allow_retry && (
              <Tag color="purple">允许重试</Tag>
            )}
          </Space>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2}>选择练习模式</Title>
        <Text type="secondary">选择适合你的练习方式，开始学习之旅</Text>
      </div>

      <Row gutter={[24, 24]}>
        {modes.map(mode => (
          <Col xs={24} sm={12} lg={8} key={mode.id}>
            {renderModeCard(mode)}
          </Col>
        ))}
      </Row>

      {/* 配置弹窗 */}
      <Modal
        title={`配置 ${selectedMode?.name}`}
        open={configModalVisible}
        onOk={handleConfigSubmit}
        onCancel={() => setConfigModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          {selectedMode?.code === 'SPECIFIC' && (
            <>
              <Form.Item
                name="categories"
                label="选择分类"
                rules={[{ required: true, message: '请选择至少一个分类' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择要练习的分类"
                  style={{ width: '100%' }}
                >
                  {categories.map(category => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="difficulty"
                label="难度选择"
                rules={[{ required: true, message: '请选择难度' }]}
              >
                <Select placeholder="请选择难度">
                  <Option value="EASY">简单</Option>
                  <Option value="MEDIUM">中等</Option>
                  <Option value="HARD">困难</Option>
                  <Option value="EXPERT">专家</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="questionCount"
                label="题目数量"
                rules={[{ required: true, message: '请输入题目数量' }]}
                initialValue={20}
              >
                <InputNumber
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                  placeholder="请输入题目数量"
                />
              </Form.Item>
            </>
          )}
          
          {selectedMode?.code === 'MOCK_EXAM' && (
            <>
              <Form.Item
                name="categories"
                label="考试范围"
                rules={[{ required: true, message: '请选择考试范围' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择考试范围"
                  style={{ width: '100%' }}
                >
                  {categories.map(category => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="timeLimit"
                label="考试时长（分钟）"
                rules={[{ required: true, message: '请输入考试时长' }]}
                initialValue={120}
              >
                <InputNumber
                  min={30}
                  max={300}
                  style={{ width: '100%' }}
                  placeholder="请输入考试时长"
                />
              </Form.Item>
              
              <Form.Item
                name="questionCount"
                label="题目数量"
                rules={[{ required: true, message: '请输入题目数量' }]}
                initialValue={50}
              >
                <InputNumber
                  min={10}
                  max={200}
                  style={{ width: '100%' }}
                  placeholder="请输入题目数量"
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default PracticeModeSelector;
