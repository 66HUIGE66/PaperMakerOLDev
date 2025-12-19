package org.example.papermaker.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.example.papermaker.annotation.RequireRole;
import org.example.papermaker.entity.UserEntity;
import org.example.papermaker.service.UserRedisCacheService;
import org.example.papermaker.service.UserService;
import org.example.papermaker.util.JwtUtil;
import org.example.papermaker.vo.RespBean;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户控制器
 * 提供用户的增删改查和登录功能
 * 
 * @author System
 * @since 1.0.0
 */
@RestController
@RequestMapping("/api/user")
@Tag(name = "用户管理", description = "用户的增删改查和登录操作")
public class UserController {

    @Resource
    private UserService userService;

    @Resource
    private JwtUtil jwtUtil;

    @Resource
    private UserRedisCacheService userRedisCacheService;

    /**
     * 获取所有用户（仅系统管理员）
     */
    @GetMapping("/list")
    @RequireRole(UserEntity.UserRole.ADMIN)
    @Operation(summary = "获取所有用户", description = "获取系统中所有的用户列表（仅系统管理员可访问）")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "403", description = "权限不足"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getAllUsers() {
        List<UserEntity> users = userService.list();
        return new RespBean(200, "查询成功", users);
    }

    /**
     * 根据ID获取用户
     */
    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取用户", description = "根据用户ID获取用户详情")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "404", description = "用户不存在"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getUserById(
            @Parameter(description = "用户ID", required = true, example = "1") @PathVariable Long id) {
        UserEntity user = userService.getById(id);
        if (user != null) {
            return new RespBean(200, "查询成功", user);
        } else {
            return new RespBean(404, "用户不存在", null);
        }
    }

    /**
     * 用户登录
     */
    @PostMapping("/login")
    @Operation(summary = "用户登录", description = "用户通过用户名和密码登录系统")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "登录成功"),
            @ApiResponse(responseCode = "401", description = "用户名或密码错误"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean login(
            @Parameter(description = "用户名", required = true, example = "admin") @RequestParam String username,
            @Parameter(description = "密码", required = true, example = "admin123") @RequestParam String password) {
        boolean success = userService.login(username, password);
        if (success) {
            UserEntity user = userService.findByUsername(username);
            // 生成JWT token
            String token = jwtUtil.generateToken(user);

            // 创建登录响应对象
            LoginResponse loginResponse = new LoginResponse();
            loginResponse.setUser(user);
            loginResponse.setToken(token);

            return new RespBean(200, "登录成功", loginResponse);
        } else {
            return new RespBean(401, "用户名或密码错误", null);
        }
    }

    /**
     * 登录响应类
     */
    public static class LoginResponse {
        private UserEntity user;
        private String token;

        public UserEntity getUser() {
            return user;
        }

        public void setUser(UserEntity user) {
            this.user = user;
        }

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }
    }

    /**
     * 用户退出登录
     */
    @PostMapping("/logout")
    @Operation(summary = "用户退出登录", description = "清除用户登录状态和Redis缓存")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "退出成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean logout(
            @Parameter(description = "Authorization请求头") @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // 清除Redis中的用户信息
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                userRedisCacheService.deleteUserFromHeader(authHeader);
            }
            return new RespBean(200, "退出成功", null);
        } catch (Exception e) {
            return new RespBean(500, "退出失败: " + e.getMessage(), null);
        }
    }

    /**
     * 验证token有效性
     */
    @GetMapping("/validate-token")
    @Operation(summary = "验证token", description = "验证当前token是否有效")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "token有效"),
            @ApiResponse(responseCode = "401", description = "token无效或已过期")
    })
    public RespBean validateToken(
            @Parameter(description = "JWT token", required = true) @RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return new RespBean(401, "无效的token格式", null);
            }

            String token = authHeader.substring(7);
            boolean isValid = jwtUtil.validateToken(token);

            if (isValid) {
                String username = jwtUtil.getUsernameFromToken(token);
                return new RespBean(200, "token有效", username);
            } else {
                return new RespBean(401, "token无效或已过期", null);
            }
        } catch (Exception e) {
            return new RespBean(401, "token验证失败", null);
        }
    }

    /**
     * 创建用户
     */
    @PostMapping("/create")
    @Operation(summary = "创建用户", description = "创建新的用户账号")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "创建成功"),
            @ApiResponse(responseCode = "400", description = "请求参数错误"),
            @ApiResponse(responseCode = "409", description = "用户名或邮箱已存在"),
            @ApiResponse(responseCode = "500", description = "创建失败")
    })
    public RespBean createUser(
            @Parameter(description = "用户信息", required = true) @RequestBody UserEntity user) {
        try {
            // 验证必填字段
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                return new RespBean(400, "用户名不能为空", null);
            }
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                return new RespBean(400, "邮箱不能为空", null);
            }
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                return new RespBean(400, "密码不能为空", null);
            }

            // 检查用户名是否已存在
            UserEntity existingUser = userService.findByUsername(user.getUsername());
            if (existingUser != null) {
                return new RespBean(409, "用户名已存在", null);
            }

            // 设置默认值
            if (user.getRole() == null) {
                user.setRole(UserEntity.UserRole.STUDENT); // 默认注册为学生
            }
            if (user.getStatus() == null) {
                user.setStatus(UserEntity.UserStatus.ACTIVE); // 默认状态为活跃
            }
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());

            // 保存用户
            boolean success = userService.save(user);
            if (success) {
                // 注册成功后自动生成JWT token
                String token = jwtUtil.generateToken(user);

                // 创建登录响应对象（与登录接口保持一致）
                LoginResponse loginResponse = new LoginResponse();
                loginResponse.setUser(user);
                loginResponse.setToken(token);

                // 清除密码字段，不返回给前端
                user.setPassword(null);
                loginResponse.setUser(user);

                return new RespBean(200, "注册成功", loginResponse);
            } else {
                return new RespBean(500, "注册失败，请稍后重试", null);
            }
        } catch (Exception e) {
            // 处理数据库约束违反等异常
            if (e.getMessage() != null && e.getMessage().contains("Duplicate entry")) {
                return new RespBean(409, "用户名或邮箱已存在", null);
            }
            return new RespBean(500, "注册失败: " + e.getMessage(), null);
        }
    }
}
