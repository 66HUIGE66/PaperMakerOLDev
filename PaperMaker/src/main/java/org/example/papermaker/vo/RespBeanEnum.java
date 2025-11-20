package org.example.papermaker.vo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.ToString;

/**
 * 辉学Java
 * 辉学Java
 * 辉学Java
 */
@Getter
@ToString
@AllArgsConstructor
public enum RespBeanEnum {
    //通用
    SUCCESS(200,"SUCCESS"),
    ERROR(500,"服务器异常"),
    //登录
    LOGIN_ERROR(500210 , "用户id或密码错误"),
    MOBILE_ERROR(500211 , "手机号格式不正确"),
    MOBILE_NOT_FIND(500212 , "手机号不存在"),
    BIND_ERROR(500213 , "参数绑定异常"),
    PASSWORD_ERROR(500233 , "密码更新失败");

    private final Integer code;
    private final String message;
}
