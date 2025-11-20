package org.example.papermaker.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户实体类
 * 对应数据库表: users
 * 
 * @author hui
 * @since 1.0.0
 */
@Data
@TableName("users")
@Schema(description = "用户实体")
public class UserEntity {

    /**
     * 用户ID
     */
    @TableId(type = IdType.AUTO)
    @Schema(description = "用户ID", example = "1")
    private Long id;

    /**
     * 用户名
     */
    @NotBlank(message = "用户名不能为空")
    @TableField("username")
    @Schema(description = "用户名", example = "admin", required = true)
    private String username;

    /**
     * 邮箱
     */
    @Email(message = "邮箱格式不正确")
    @TableField("email")
    @Schema(description = "邮箱", example = "admin@example.com")
    private String email;

    /**
     * 密码
     */
    @NotBlank(message = "密码不能为空")
    @TableField("password")
    @Schema(description = "密码", example = "admin123", required = true)
    private String password;

    /**
     * 用户角色
     */
    @NotNull(message = "用户角色不能为空")
    @TableField("role")
    @Schema(description = "用户角色", example = "ADMIN", required = true)
    private UserRole role;

    /**
     * 用户状态
     */
    @TableField("status")
    @Schema(description = "用户状态", example = "ACTIVE")
    private UserStatus status;

    /**
     * 创建时间
     */
    @TableField("created_at")
    @Schema(description = "创建时间", example = "2024-01-01T00:00:00")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField("updated_at")
    @Schema(description = "更新时间", example = "2024-01-01T00:00:00")
    private LocalDateTime updatedAt;

    /**
     * 用户角色枚举
     */
    public enum UserRole {
        STUDENT("学生"),
        TEACHER("教师"),
        ADMIN("管理员");

        private final String description;

        UserRole(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 用户状态枚举
     */
    public enum UserStatus {
        ACTIVE("激活"),
        INACTIVE("未激活");

        private final String description;

        UserStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}