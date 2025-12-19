// 认证相关类型定义

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthResponse {
  code: number;
  message: string;
  object: User | LoginResponse | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// 角色检查辅助函数
export const isAdmin = (user: User | null): boolean => {
  return user?.role === UserRole.ADMIN;
};

export const isContentAdmin = (user: User | null): boolean => {
  return user?.role === UserRole.TEACHER;
};

export const isAnyAdmin = (user: User | null): boolean => {
  return isAdmin(user) || isContentAdmin(user);
};

export const isStudent = (user: User | null): boolean => {
  return user?.role === UserRole.STUDENT;
};

// 权限检查辅助函数
export const canManageSystemContent = (user: User | null): boolean => {
  return isAnyAdmin(user);
};

export const canAccessSystemManagement = (user: User | null): boolean => {
  return isAdmin(user);
};

// 角色显示名称
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return '系统管理员';
    case UserRole.TEACHER:
      return '内容管理员';
    case UserRole.STUDENT:
      return '学生';
    default:
      return '未知角色';
  }
};
