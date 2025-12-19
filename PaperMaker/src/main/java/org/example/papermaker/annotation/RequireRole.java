package org.example.papermaker.annotation;

import org.example.papermaker.entity.UserEntity;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 角色权限注解
 * 用于标注Controller方法所需的角色权限
 * 
 * @author System
 * @since 1.0.0
 */
@Target({ ElementType.METHOD, ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {

    /**
     * 允许访问的角色列表
     * 用户角色必须在此列表中才能访问
     */
    UserEntity.UserRole[] value();

    /**
     * 是否要求所有角色（AND逻辑）
     * false = 用户拥有任意一个角色即可（OR逻辑，默认）
     * true = 用户必须拥有所有指定角色（AND逻辑，通常不用）
     */
    boolean requireAll() default false;
}
