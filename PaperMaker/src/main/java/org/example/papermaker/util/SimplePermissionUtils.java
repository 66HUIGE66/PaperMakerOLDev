package org.example.papermaker.util;

import org.example.papermaker.entity.UserEntity;

/**
 * 简化版权限工具类
 * 
 * @author System
 * @since 1.0.0
 */
public class SimplePermissionUtils {

    /**
     * 检查用户是否为管理员
     */
    public static boolean isAdmin(UserEntity user) {
        return user != null && user.getRole() == UserEntity.UserRole.ADMIN;
    }


    /**
     * 检查用户是否有系统管理权限
     * 只有管理员可以操作系统内容
     */
    public static boolean hasSystemManagePermission(UserEntity user) {
        return isAdmin(user);
    }

    /**
     * 检查用户是否有内容创建权限
     * 管理员可以创建系统内容，学生可以创建个人内容
     */
    public static boolean hasContentCreatePermission(UserEntity user) {
        return user != null && user.getStatus() == UserEntity.UserStatus.ACTIVE;
    }

    /**
     * 检查用户是否有内容编辑权限
     * 管理员可以编辑所有内容，学生只能编辑自己创建的内容
     */
    public static boolean hasContentEditPermission(UserEntity user, Long creatorId) {
        if (user == null) {
            return false;
        }
        
        // 管理员可以编辑所有内容
        if (isAdmin(user)) {
            return true;
        }
        
        // 学生只能编辑自己创建的内容
        return user.getId().equals(creatorId);
    }

    /**
     * 检查用户是否有系统内容修改权限
     * 只有管理员可以修改系统内容
     */
    public static boolean hasSystemContentEditPermission(UserEntity user, boolean isSystem) {
        if (user == null) {
            return false;
        }
        
        // 如果是系统内容，只有管理员可以修改
        if (isSystem) {
            return isAdmin(user);
        }
        
        // 非系统内容按普通权限处理
        return true;
    }

    /**
     * 检查用户是否有内容查看权限
     * 所有登录用户都可以查看内容
     */
    public static boolean hasViewPermission(UserEntity user) {
        return user != null && user.getStatus() == UserEntity.UserStatus.ACTIVE;
    }

    /**
     * 检查用户是否有复制权限
     * 所有登录用户都可以复制系统内容到个人题库
     */
    public static boolean hasCopyPermission(UserEntity user) {
        return hasViewPermission(user);
    }

    /**
     * 检查是否为系统内容
     */
    public static boolean isSystemContent(Boolean isSystem) {
        return isSystem != null && isSystem;
    }

    /**
     * 检查是否为用户内容
     */
    public static boolean isUserContent(Boolean isSystem) {
        return !isSystemContent(isSystem);
    }
}


























































