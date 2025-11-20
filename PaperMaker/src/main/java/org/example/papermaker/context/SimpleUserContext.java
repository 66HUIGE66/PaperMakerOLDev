package org.example.papermaker.context;

import org.example.papermaker.entity.UserEntity;

/**
 * 简化版用户上下文管理类
 * 
 * @author System
 * @since 1.0.0
 */
public class SimpleUserContext {
    
    private static final ThreadLocal<UserEntity> USER_CONTEXT = new ThreadLocal<>();
    private static final ThreadLocal<String> TOKEN_CONTEXT = new ThreadLocal<>();
    // 专门用于工具类的用户ID存储（在调用AI服务前设置）
    // 使用InheritableThreadLocal确保子线程也能访问
    private static final InheritableThreadLocal<Long> TOOL_USER_ID_CONTEXT = new InheritableThreadLocal<>();
    
    /**
     * 设置当前用户
     */
    public static void setCurrentUser(UserEntity user) {
        USER_CONTEXT.set(user);
    }
    
    /**
     * 设置当前token
     */
    public static void setCurrentToken(String token) {
        TOKEN_CONTEXT.set(token);
    }
    
    /**
     * 获取当前token
     */
    public static String getCurrentToken() {
        return TOKEN_CONTEXT.get();
    }
    
    /**
     * 设置工具类使用的用户ID（用于跨线程传递）
     * 在调用AI服务前调用此方法设置用户ID
     */
    public static void setToolUserId(Long userId) {
        TOOL_USER_ID_CONTEXT.set(userId);
    }

    
    /**
     * 获取当前用户
     */
    public static UserEntity getCurrentUser() {
        return USER_CONTEXT.get();
    }
    
    /**
     * 获取当前用户ID
     */
    public static Long getCurrentUserId() {
        UserEntity user = getCurrentUser();
        return user != null ? user.getId() : null;
    }
    
    /**
     * 获取当前用户名
     */
    public static String getCurrentUsername() {
        UserEntity user = getCurrentUser();
        return user != null ? user.getUsername() : null;
    }
    
    /**
     * 获取当前用户角色
     */
    public static UserEntity.UserRole getCurrentUserRole() {
        UserEntity user = getCurrentUser();
        return user != null ? user.getRole() : null;
    }
    
    /**
     * 检查当前用户是否为管理员
     */
    public static boolean isCurrentUserAdmin() {
        UserEntity user = getCurrentUser();
        return user != null && user.getRole() == UserEntity.UserRole.ADMIN;
    }
    
    /**
     * 检查当前用户是否为学生
     */
    public static boolean isCurrentUserStudent() {
        UserEntity user = getCurrentUser();
        return user != null && user.getRole() == UserEntity.UserRole.STUDENT;
    }
    
    /**
     * 清除当前用户上下文
     */
    public static void clear() {
        USER_CONTEXT.remove();
        TOKEN_CONTEXT.remove();
        TOOL_USER_ID_CONTEXT.remove();
    }
}



