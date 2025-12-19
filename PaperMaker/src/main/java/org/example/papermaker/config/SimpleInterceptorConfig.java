package org.example.papermaker.config;

import org.example.papermaker.interceptor.SimplePermissionInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 简化版拦截器配置类
 * 
 * @author System
 * @since 1.0.0
 */
@Configuration
public class SimpleInterceptorConfig implements WebMvcConfigurer {

    @Autowired
    private SimplePermissionInterceptor simplePermissionInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(simplePermissionInterceptor)
                .addPathPatterns("/**") // 拦截所有请求
                .excludePathPatterns(
                        "/api/user/login", // 登录接口
                        "/api/user/create", // 注册接口
                        "/api/user/validate-token", // token验证接口
                        "/api/upload/**", // 文件上传接口
                        "/api/test/**", // 测试API接口
                        "/swagger-ui/**", // Swagger UI
                        "/v3/api-docs/**", // OpenAPI文档
                        "/swagger-resources/**", // Swagger资源
                        "/webjars/**", // 静态资源
                        "/error" // 错误页面

                );
    }
}
