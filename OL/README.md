# OL 前端项目

## 项目概述

OL是一个基于React + TypeScript + Vite的现代化前端项目，用于智能组卷刷题系统。项目采用组件化开发，提供完整的用户界面和交互功能，并集成了完整的用户认证系统，确保系统安全性。

## 技术栈

- **React 18**: 现代化的React框架
- **TypeScript**: 类型安全的JavaScript
- **Vite**: 快速的构建工具
- **Ant Design**: 企业级UI组件库
- **React Router**: 前端路由管理
- **Axios**: HTTP客户端

## 项目结构

```
OL/
├── src/                          # 源代码目录
│   ├── components/               # 公共组件
│   │   ├── ExamPaperForm.tsx    # 试卷表单组件
│   │   ├── FileUpload.tsx       # 文件上传组件
│   │   ├── Layout.tsx           # 布局组件
│   │   ├── LearningStatistics.tsx # 学习统计组件
│   │   ├── PaperGeneration.tsx  # 组卷组件
│   │   ├── PracticeModeSelector.tsx # 练习模式选择器
│   │   ├── QuestionForm.tsx     # 题目表单组件
│   │   ├── RuleForm.tsx         # 规则表单组件
│   │   ├── SimplifiedLayout.tsx # 简化版布局组件
│   │   └── WordImportTest.tsx   # Word导入测试组件
│   ├── pages/                   # 页面组件
│   │   ├── ExamPaperManagement.tsx # 试卷管理页面
│   │   ├── ExamTaking.tsx       # 考试页面
│   │   ├── Home.tsx             # 首页
│   │   ├── KnowledgePointManagement.tsx # 知识点管理页面
│   │   ├── MyContent.tsx        # 我的内容页面
│   │   ├── PaperGeneration.tsx  # 组卷页面
│   │   ├── QuestionManagement.tsx # 题目管理页面
│   │   ├── RuleManagement.tsx   # 规则管理页面
│   │   ├── SimplifiedHome.tsx   # 简化版首页
│   │   ├── SimplifiedPaperGeneration.tsx # 简化版组卷页面
│   │   ├── SimplifiedPractice.tsx # 简化版练习页面
│   │   ├── StatisticsManagement.tsx # 统计管理页面
│   │   └── WordImportTestPage.tsx # Word导入测试页面
│   ├── services/                # API服务
│   ├── store/                   # 状态管理
│   │   └── index.ts            # 状态管理入口
│   ├── types/                   # 类型定义
│   │   └── index.ts            # 类型定义入口
│   ├── utils/                   # 工具函数
│   │   ├── fileImport.ts       # 文件导入工具
│   │   └── index.ts            # 工具函数入口
│   ├── App.css                  # 应用样式
│   ├── App.tsx                  # 应用主组件
│   ├── index.css                # 全局样式
│   ├── main.tsx                 # 应用入口
│   └── SimplifiedApp.tsx        # 简化版应用组件
├── package.json                 # 项目依赖配置
├── package-lock.json           # 依赖锁定文件
├── tsconfig.json               # TypeScript配置
├── tsconfig.node.json          # Node.js TypeScript配置
├── vite.config.ts              # Vite配置
├── vite.config.js              # Vite配置(JS版本)
├── vite.config.d.ts            # Vite配置类型定义
├── start-dev.bat               # Windows开发启动脚本
├── start-dev.sh                # Linux/Mac开发启动脚本
└── README.md                   # 项目说明文档
```

## 功能模块

### 1. 认证模块
- **Login.tsx**: 用户登录页面
- **Register.tsx**: 用户注册页面
- **ProtectedRoute.tsx**: 路由守卫组件
- **UserInfo.tsx**: 用户信息显示组件
- **AuthContext.tsx**: 认证上下文管理
- **authService.ts**: 认证服务API

### 2. 首页模块
- **Home.tsx**: 完整版首页
- **SimplifiedHome.tsx**: 简化版首页

### 3. 组卷模块
- **PaperGeneration.tsx**: 完整版组卷页面
- **SimplifiedPaperGeneration.tsx**: 简化版组卷页面
- **PaperGeneration.tsx** (组件): 组卷组件

### 4. 练习模块
- **SimplifiedPractice.tsx**: 简化版练习页面
- **PracticeModeSelector.tsx**: 练习模式选择器

### 5. 管理模块
- **QuestionManagement.tsx**: 题目管理页面
- **ExamPaperManagement.tsx**: 试卷管理页面
- **RuleManagement.tsx**: 规则管理页面
- **KnowledgePointManagement.tsx**: 知识点管理页面
- **StatisticsManagement.tsx**: 统计管理页面

### 6. 个人模块
- **MyContent.tsx**: 我的内容页面（练习记录、错题本等）

### 7. 工具模块
- **WordImportTestPage.tsx**: Word导入测试页面
- **FileUpload.tsx**: 文件上传组件

## 开发指南

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 启动开发服务器

**Windows用户**:
```bash
# 使用脚本启动 (含认证功能)
start-with-auth.bat

# 或使用原脚本
start-dev.bat

# 或直接使用命令
npm run dev
```

**Linux/Mac用户**:
```bash
# 使用脚本启动 (含认证功能)
./start-with-auth.sh

# 或使用原脚本
./start-dev.sh

# 或直接使用命令
npm run dev
```

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

### 预览生产版本

```bash
npm run preview
# 或
yarn preview
```

## 项目特点

### 1. 组件化开发
- 采用React函数组件和Hooks
- 组件职责单一，易于维护
- 支持组件复用

### 2. 类型安全
- 全面使用TypeScript
- 严格的类型检查
- 良好的开发体验

### 3. 现代化构建
- 使用Vite作为构建工具
- 快速的开发服务器
- 优化的生产构建

### 4. 响应式设计
- 基于Ant Design组件库
- 支持多设备适配
- 良好的用户体验

### 5. 状态管理
- 使用React Context进行状态管理
- 支持全局状态共享
- 易于扩展

## 开发规范

### 1. 文件命名
- 组件文件使用PascalCase命名
- 工具文件使用camelCase命名
- 常量文件使用UPPER_SNAKE_CASE命名

### 2. 组件结构
```tsx
import React from 'react';
import { ComponentProps } from './types';

interface Props {
  // 组件属性定义
}

const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // 组件逻辑
  
  return (
    <div>
      {/* 组件JSX */}
    </div>
  );
};

export default ComponentName;
```

### 3. 样式规范
- 使用CSS Modules或styled-components
- 遵循BEM命名规范
- 保持样式的一致性

### 4. 代码质量
- 使用ESLint进行代码检查
- 使用Prettier进行代码格式化
- 编写单元测试

## 部署说明

### 1. 构建项目
```bash
npm run build
```

### 2. 部署到服务器
将`dist`目录下的文件部署到Web服务器

### 3. 配置反向代理
配置Nginx或Apache将API请求代理到后端服务

## 常见问题

### 1. 依赖安装失败
```bash
# 清除缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 2. 开发服务器启动失败
- 检查端口是否被占用
- 确认Node.js版本是否符合要求
- 检查防火墙设置

### 3. 构建失败
- 检查TypeScript类型错误
- 确认所有依赖已正确安装
- 检查Vite配置是否正确

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

本项目采用MIT许可证，详情请查看LICENSE文件。

## 认证功能

### 访问地址
- **登录页面**: http://localhost:5173/login
- **注册页面**: http://localhost:5173/register
- **系统首页**: http://localhost:5173/ (需要登录)

### 测试账户
- **用户名**: admin
- **密码**: admin123

### 功能特性
- ✅ 用户登录/注册
- ✅ 路由权限控制
- ✅ 自动登录状态保持
- ✅ 安全登出
- ✅ 用户信息显示
- ✅ 美观的登录界面

### 安全机制
- 未登录用户无法访问系统功能
- 自动token验证和管理
- 请求拦截器自动添加认证信息
- 友好的错误提示和加载状态
