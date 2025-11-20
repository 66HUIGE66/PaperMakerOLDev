import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message, Spin } from 'antd';
import RuleCreatePage from './RuleCreatePage';
import { examRuleApi } from '../services/api';

const RuleEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ruleData, setRuleData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadRuleData();
    }
  }, [id]);

  const loadRuleData = async () => {
    try {
      // ✅ 使用正确的API方法加载规则详情
      const response = await examRuleApi.getRuleById(Number(id));
      if (response.data.code === 200) {
        setRuleData(response.data.data);
      } else {
        message.error(response.data.message || '加载规则详情失败');
        navigate('/rules');
      }
    } catch (error) {
      console.error('加载规则详情失败:', error);
      message.error('加载规则详情失败');
      navigate('/rules');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>加载规则详情中...</div>
      </div>
    );
  }

  // 复用RuleCreatePage，传入编辑模式和初始数据
  return <RuleCreatePage mode="edit" initialData={ruleData} />;
};

export default RuleEditPage;
