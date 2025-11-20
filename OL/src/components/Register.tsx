import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { RegisterRequest } from '../types/auth';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: RegisterRequest) => {
    try {
      setLoading(true);
      clearError();
      await register(values);
      message.success('注册成功！');
      navigate('/');
    } catch (error: any) {
      message.error(error.message || '注册失败');
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
      background: `
        radial-gradient(circle at 25% 25%, #ff6b6b 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, #4ecdc4 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, #45b7d1 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, #f9ca24 0%, transparent 50%),
        radial-gradient(circle at 20% 80%, #f0932b 0%, transparent 50%),
        linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)
      `,
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 动态背景粒子 */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.3), transparent),
          radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.2), transparent),
          radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.4), transparent),
          radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.3), transparent),
          radial-gradient(2px 2px at 160px 30px, rgba(255,255,255,0.2), transparent)
        `,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 100px',
        animation: 'sparkle 20s linear infinite'
      }} />
      
      {/* 大型装饰元素 */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `
          conic-gradient(from 0deg at 50% 50%, 
            rgba(255,107,107,0.1) 0deg,
            rgba(78,205,196,0.1) 72deg,
            rgba(69,183,209,0.1) 144deg,
            rgba(249,202,36,0.1) 216deg,
            rgba(240,147,43,0.1) 288deg,
            rgba(255,107,107,0.1) 360deg
          )
        `,
        animation: 'rotate 30s linear infinite'
      }} />
      
      {/* 浮动装饰球 */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '10%',
        width: '120px',
        height: '120px',
        background: 'linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
        borderRadius: '50%',
        filter: 'blur(1px)',
        animation: 'float1 8s ease-in-out infinite',
        boxShadow: '0 0 50px rgba(255,255,255,0.3)'
      }} />
      <div style={{
        position: 'absolute',
        top: '70%',
        right: '20%',
        width: '80px',
        height: '80px',
        background: 'linear-gradient(45deg, rgba(255,255,255,0.15), rgba(255,255,255,0.03))',
        borderRadius: '50%',
        filter: 'blur(1px)',
        animation: 'float2 12s ease-in-out infinite',
        boxShadow: '0 0 40px rgba(255,255,255,0.2)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '25%',
        left: '15%',
        width: '60px',
        height: '60px',
        background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
        borderRadius: '50%',
        filter: 'blur(1px)',
        animation: 'float3 10s ease-in-out infinite',
        boxShadow: '0 0 30px rgba(255,255,255,0.15)'
      }} />
      
      {/* 添加CSS动画 */}
      <style>
        {`
          @keyframes sparkle {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-100px); }
          }
          @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes float1 {
            0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
            25% { transform: translateY(-30px) translateX(10px) scale(1.1); }
            50% { transform: translateY(-20px) translateX(-5px) scale(0.9); }
            75% { transform: translateY(-40px) translateX(15px) scale(1.05); }
          }
          @keyframes float2 {
            0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
            33% { transform: translateY(-25px) translateX(-10px) scale(1.2); }
            66% { transform: translateY(-15px) translateX(8px) scale(0.8); }
          }
          @keyframes float3 {
            0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
            50% { transform: translateY(-35px) translateX(12px) scale(1.3); }
          }
        `}
      </style>
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          borderRadius: '24px',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden'
        }}
      >
        {/* 卡片内部光效 */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `
            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(255,255,255,0.05) 0%, transparent 50%)
          `,
          animation: 'rotate 20s linear infinite reverse',
          pointerEvents: 'none'
        }} />
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '32px',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{
            display: 'inline-block',
            padding: '20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <UserAddOutlined style={{ 
              fontSize: '56px', 
              background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'
            }} />
          </div>
          <Title level={1} style={{ 
            margin: 0, 
            background: 'linear-gradient(135deg, #1a1a1a, #4a4a4a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '32px',
            fontWeight: '700',
            letterSpacing: '1px',
            textShadow: '0 2px 4px rgba(255, 255, 255, 0.3)'
          }}>
            创建账户
          </Title>
          <Text style={{ 
            color: '#666',
            fontSize: '16px',
            fontWeight: '400',
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
            marginTop: '8px',
            display: 'block'
          }}>
            加入智能组卷系统
          </Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名!' },
              { min: 3, message: '用户名至少3个字符!' },
              { max: 20, message: '用户名最多20个字符!' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线!' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ 
                color: '#667eea',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }} />}
              placeholder="用户名"
              style={{ 
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                boxShadow: `
                  0 4px 16px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `,
                height: '52px',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.border = '2px solid rgba(102, 126, 234, 0.5)';
                e.target.style.boxShadow = `
                  0 4px 20px rgba(102, 126, 234, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3)
                `;
              }}
              onBlur={(e) => {
                e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = `
                  0 4px 16px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `;
              }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱!' },
              { type: 'email', message: '请输入有效的邮箱地址!' }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ 
                color: '#667eea',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }} />}
              placeholder="邮箱"
              style={{ 
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                boxShadow: `
                  0 4px 16px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `,
                height: '52px',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.border = '2px solid rgba(102, 126, 234, 0.5)';
                e.target.style.boxShadow = `
                  0 4px 20px rgba(102, 126, 234, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3)
                `;
              }}
              onBlur={(e) => {
                e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = `
                  0 4px 16px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `;
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码!' },
              { min: 6, message: '密码至少6个字符!' },
              { max: 20, message: '密码最多20个字符!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ 
                color: '#667eea',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }} />}
              placeholder="密码"
              style={{ 
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                boxShadow: `
                  0 4px 16px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `,
                height: '52px',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.border = '2px solid rgba(102, 126, 234, 0.5)';
                e.target.style.boxShadow = `
                  0 4px 20px rgba(102, 126, 234, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3)
                `;
              }}
              onBlur={(e) => {
                e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = `
                  0 4px 16px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `;
              }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ 
                color: '#667eea',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }} />}
              placeholder="确认密码"
              style={{ 
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                boxShadow: `
                  0 4px 16px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `,
                height: '52px',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.border = '2px solid rgba(102, 126, 234, 0.5)';
                e.target.style.boxShadow = `
                  0 4px 20px rgba(102, 126, 234, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3)
                `;
              }}
              onBlur={(e) => {
                e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = `
                  0 4px 16px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `;
              }}
            />
          </Form.Item>

          {error && (
            <div style={{
              color: '#ff4d4f',
              textAlign: 'center',
              marginBottom: '16px',
              padding: '8px',
              background: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: '6px'
            }}>
              {error}
            </div>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: '56px',
                borderRadius: '16px',
                fontSize: '18px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                border: 'none',
                boxShadow: `
                  0 8px 25px rgba(102, 126, 234, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = `
                  0 12px 35px rgba(102, 126, 234, 0.6),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3)
                `;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                e.currentTarget.style.boxShadow = `
                  0 8px 25px rgba(102, 126, 234, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `;
              }}
            >
              {loading ? '注册中...' : '注册'}
            </Button>
          </Form.Item>
        </Form>

        <Divider>
          <Text type="secondary">已有账户？</Text>
        </Divider>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Link to="/login">
            <Button 
              type="link" 
              size="large" 
              style={{ 
                padding: '8px 16px',
                color: '#667eea',
                fontWeight: '600',
                fontSize: '16px',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
                borderRadius: '12px',
                background: 'rgba(102, 126, 234, 0.1)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                e.currentTarget.style.transform = 'translateY(0px)';
              }}
            >
              立即登录
            </Button>
          </Link>
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
        }}>
          <Text style={{ 
            fontSize: '13px',
            color: '#555',
            fontWeight: '500',
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.6)',
            display: 'block'
          }}>
            💡 注册说明
          </Text>
          <Text style={{ 
            fontSize: '14px',
            color: '#333',
            fontWeight: '600',
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
            display: 'block',
            marginTop: '4px'
          }}>
            注册后默认为学生身份
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;

