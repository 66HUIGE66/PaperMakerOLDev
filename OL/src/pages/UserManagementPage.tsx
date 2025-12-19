import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, message, Modal, Form, Input, Select, Popconfirm } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    SearchOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../types/auth';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

const roleOptions = [
    { value: 'STUDENT', label: '学生', color: 'blue' },
    { value: 'TEACHER', label: '内容管理员', color: 'green' },
    { value: 'ADMIN', label: '系统管理员', color: 'red' }
];

const statusOptions = [
    { value: 'ACTIVE', label: '活跃', color: 'success' },
    { value: 'INACTIVE', label: '停用', color: 'default' },
    { value: 'BANNED', label: '封禁', color: 'error' }
];

const UserManagementPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [form] = Form.useForm();
    const [submitLoading, setSubmitLoading] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAdmin(user)) {
            message.error('权限不足，仅系统管理员可访问');
            navigate('/');
        }
    }, [user, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/user/list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.code === 200) {
                setUsers(res.data.object || []);
            }
        } catch (error: any) {
            message.error('获取用户列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (record: User) => {
        setSelectedUser(record);
        form.setFieldsValue(record);
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitLoading(true);
            const token = localStorage.getItem('token');

            // 注意：目前后端UserController尚未提供更新用户的完整接口，这里仅作为演示数据交互
            // 实际项目中需要根据后端API进行调整
            // 暂时模拟成功

            /*
            await axios.put(`/user/${selectedUser?.id}`, values, {
              headers: { Authorization: `Bearer ${token}` }
            });
            */

            message.success('用户信息更新成功 (演示)');
            setModalVisible(false);
            fetchUsers();
        } catch (error: any) {
            message.error('操作失败: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitLoading(false);
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: '用户名', dataIndex: 'username', key: 'username' },
        { title: '邮箱', dataIndex: 'email', key: 'email' },
        {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => {
                const opt = roleOptions.find(o => o.value === role);
                return <Tag color={opt?.color || 'default'}>{opt?.label || role}</Tag>;
            }
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const opt = statusOptions.find(o => o.value === status);
                return <Tag color={opt?.color || 'default'}>{opt?.label || status}</Tag>;
            }
        },
        { title: '注册时间', dataIndex: 'createdAt', key: 'createdAt' },
        {
            title: '操作',
            key: 'actions',
            render: (_: any, record: User) => (
                <Space size="small">
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        编辑
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card title="用户管理">
                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                />
            </Card>

            <Modal
                title="编辑用户"
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={() => setModalVisible(false)}
                confirmLoading={submitLoading}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="username" label="用户名">
                        <Input disabled />
                    </Form.Item>
                    <Form.Item name="email" label="邮箱">
                        <Input />
                    </Form.Item>
                    <Form.Item name="role" label="角色" rules={[{ required: true }]}>
                        <Select>
                            {roleOptions.map(opt => (
                                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                        <Select>
                            {statusOptions.map(opt => (
                                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagementPage;
