import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { LoginRequest } from '../types/auth';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const onFinish = async (values: LoginRequest) => {
    try {
      setLoading(true);
      clearError();
      await login(values);
      message.success('登录成功！');

      // 获取重定向地址，如果没有则跳转到首页
      const from = searchParams.get('from');
      navigate(from || '/');
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f7ff 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 装饰背景圆 */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(24,144,255,0.1) 0%, rgba(24,144,255,0.02) 70%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(24,144,255,0.08) 0%, rgba(24,144,255,0.02) 70%, transparent 100%)',
      }} />

      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          border: 'none',
          zIndex: 1
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(24,144,255,0.1)',
            marginBottom: '16px',
            color: '#1890ff'
          }}>
            <LoginOutlined style={{ fontSize: '32px' }} />
          </div>
          <Title level={2} style={{
            margin: '0 0 8px',
            color: '#002766',
            fontSize: '24px',
            fontWeight: 600
          }}>
            智能组卷系统
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            新一代在线考试与智能组卷平台
          </Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
              placeholder="用户名"
              style={{ borderRadius: '4px' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
              placeholder="密码"
              style={{ borderRadius: '4px' }}
            />
          </Form.Item>

          {error && (
            <div style={{
              color: '#ff4d4f',
              textAlign: 'center',
              marginBottom: '24px',
              padding: '8px',
              background: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: '40px',
                borderRadius: '4px',
                fontSize: '16px',
                background: '#1890ff',
                borderColor: '#1890ff',
                fontWeight: 500
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '24px 0', fontSize: '12px', color: '#999' }}>还没有账号？</Divider>

        <div style={{ textAlign: 'center' }}>
          <Link to="/register">
            <Button type="link" style={{ fontSize: '14px' }}>
              立即注册新账号
            </Button>
          </Link>
        </div>

        <div style={{
          marginTop: '32px',
          padding: '12px',
          background: '#f5f7fa',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#666',
          fontSize: '12px'
        }}>
          💡 测试账号: <b>admin</b> / <b>admin123</b>
        </div>
      </Card>
    </div>
  );
};

export default Login;

