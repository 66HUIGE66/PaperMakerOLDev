package org.example.papermaker.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.papermaker.annotation.RequireRole;
import org.example.papermaker.context.SimpleUserContext;
import org.example.papermaker.entity.UserEntity;
import org.example.papermaker.util.JwtUtil;
import org.example.papermaker.vo.RespBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;

/**
 * 简化版权限控制拦截器
 * 
 * @author System
 * @since 1.0.0
 */
@Component
public class SimplePermissionInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(SimplePermissionInterceptor.class);

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private org.example.papermaker.service.UserRedisCacheService userRedisCacheService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        // 获取请求路径
        String requestPath = request.getRequestURI();
        String method = request.getMethod();

        // 处理CORS预检请求
        if ("OPTIONS".equals(method)) {
            response.setStatus(HttpServletResponse.SC_OK);
            return true;
        }

        // 跳过公开接口
        if (isPublicPath(requestPath)) {
            return true;
        }

        // 从JWT token中获取当前用户
        UserEntity currentUser = getCurrentUserFromRequest(request);

        if (currentUser == null) {
            // 用户未登录
            writeErrorResponse(response, 401, "用户未登录");
            return false;
        }

        // 设置用户上下文（ThreadLocal）
        log.info("当前登录用户信息{}", currentUser);
        SimpleUserContext.setCurrentUser(currentUser);

        // 将用户信息存入Redis（用于异步线程中获取用户信息）
        // String authHeader = request.getHeader("Authorization");
        // if (authHeader != null && authHeader.startsWith("Bearer ")) {
        // String token = authHeader.substring(7);
        // // 将token存储到ThreadLocal，供工具类使用
        // SimpleUserContext.setCurrentToken(token);
        // // 将用户信息存入Redis
        // userRedisCacheService.setUser(token, currentUser);
        // log.debug("用户信息已存入Redis，用户ID: {}, 用户名: {}", currentUser.getId(),
        // currentUser.getUsername());
        // }

        // 添加调试日志
        log.debug("权限拦截器 - 请求路径: {}, 方法: {}, 用户: {}, 角色: {}, 用户ID: {}",
                requestPath, method, currentUser.getUsername(), currentUser.getRole(), currentUser.getId());

        // ========== 注解式权限检查 ==========
        // 检查处理方法上是否有 @RequireRole 注解
        if (handler instanceof HandlerMethod) {
            HandlerMethod handlerMethod = (HandlerMethod) handler;

            // 优先检查方法级注解，其次检查类级注解
            RequireRole requireRole = handlerMethod.getMethodAnnotation(RequireRole.class);
            if (requireRole == null) {
                requireRole = handlerMethod.getBeanType().getAnnotation(RequireRole.class);
            }

            if (requireRole != null) {
                UserEntity.UserRole[] allowedRoles = requireRole.value();
                UserEntity.UserRole userRole = currentUser.getRole();

                boolean hasPermission = Arrays.stream(allowedRoles)
                        .anyMatch(role -> role.equals(userRole));

                if (!hasPermission) {
                    log.warn("用户 {} (角色: {}) 尝试访问需要 {} 角色的接口: {}",
                            currentUser.getUsername(), userRole, Arrays.toString(allowedRoles), requestPath);
                    writeErrorResponse(response, 403, "权限不足，当前操作需要 " +
                            Arrays.toString(allowedRoles) + " 角色");
                    return false;
                }

                log.debug("@RequireRole 注解权限验证通过: 用户角色 {} 在允许列表 {} 中",
                        userRole, Arrays.toString(allowedRoles));
            }
        }

        // 对于规则管理API，检查用户权限
        if (requestPath.startsWith("/api/rules")) {
            // 管理员可以访问所有规则管理功能
            if (UserEntity.UserRole.ADMIN.equals(currentUser.getRole())) {
                log.debug("管理员权限验证通过");
                return true;
            }

            // 普通用户可以进行的操作：
            // 1. 查看规则（GET请求）
            // 2. 创建自己的规则（POST /user）
            // 3. 删除自己的规则（DELETE /{id}）- 具体权限由控制器检查
            // 4. 复制规则（POST /{id}/copy）- 所有用户都可以复制
            if ("GET".equals(method)) {
                return true; // 允许普通用户查看规则
            } else if ("POST".equals(method)) {
                if (requestPath.equals("/api/rules/user")) {
                    return true; // 允许普通用户创建自己的规则
                } else if (requestPath.matches("/api/rules/\\d+/copy")) {
                    return true; // 允许普通用户复制规则（具体权限由控制器检查）
                } else {
                    // 其他POST操作不允许
                    writeErrorResponse(response, 403, "只有管理员可以进行规则管理操作");
                    return false;
                }
            } else if ("DELETE".equals(method) && requestPath.matches("/api/rules/\\d+")) {
                // 允许删除操作，具体权限由控制器检查（只能删除自己的规则）
                return true;
            } else {
                // 其他修改操作不允许
                writeErrorResponse(response, 403, "只有管理员可以进行规则管理操作");
                return false;
            }
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex)
            throws Exception {
        // 清除用户上下文
        SimpleUserContext.clear();
    }

    /**
     * 检查是否为公开路径
     */
    private boolean isPublicPath(String path) {
        return path.startsWith("/user/login") ||
                path.startsWith("/user/register") ||
                path.startsWith("/user/validate-token") ||
                path.startsWith("/api/upload") ||
                path.startsWith("/api/test") ||
                path.startsWith("/swagger-ui") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/swagger-resources");
        // 移除练习记录API的公开路径配置，让它们通过正常的认证流程
    }

    /**
     * 从请求中获取当前用户
     * 从JWT token中解析用户信息
     */
    private UserEntity getCurrentUserFromRequest(HttpServletRequest request) {
        try {
            // 从请求头中获取token
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return null;
            }

            String token = authHeader.substring(7); // 移除 "Bearer " 前缀

            // 验证token
            if (!jwtUtil.validateToken(token)) {
                return null;
            }

            // 从token中获取用户信息
            UserEntity user = new UserEntity();
            user.setId(jwtUtil.getUserIdFromToken(token));
            user.setUsername(jwtUtil.getUsernameFromToken(token));

            // 设置角色
            String roleStr = jwtUtil.getRoleFromToken(token);
            if ("ADMIN".equals(roleStr)) {
                user.setRole(UserEntity.UserRole.ADMIN);
            } else if ("STUDENT".equals(roleStr)) {
                user.setRole(UserEntity.UserRole.STUDENT);
            } else {
                user.setRole(UserEntity.UserRole.STUDENT); // 默认角色
            }

            // 设置状态
            user.setStatus(UserEntity.UserStatus.ACTIVE);

            return user;
        } catch (Exception e) {
            // token解析失败
            return null;
        }
    }

    /**
     * 写入错误响应
     */
    private void writeErrorResponse(HttpServletResponse response, int code, String message) throws IOException {
        response.setStatus(code);
        response.setContentType("application/json;charset=UTF-8");

        RespBean respBean = new RespBean(code, message, null);
        String jsonResponse = objectMapper.writeValueAsString(respBean);

        PrintWriter writer = response.getWriter();
        writer.write(jsonResponse);
        writer.flush();
        writer.close();
    }
}
