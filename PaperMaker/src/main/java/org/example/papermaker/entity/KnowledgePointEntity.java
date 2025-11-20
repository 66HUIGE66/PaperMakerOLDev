package org.example.papermaker.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 知识点实体类
 * 对应数据库表: knowledge_points
 */
@Data
@TableName("knowledge_points")
public class KnowledgePointEntity {

    /**
     * 知识点ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 知识点名称
     */
    @NotBlank(message = "知识点名称不能为空")
    @TableField("name")
    private String name;

    /**
     * 知识点描述
     */
    @TableField("description")
    private String description;

    /**
     * 所属学科（字符串名称，保留用于兼容）
     */
    @TableField("subject")
    private String subject;
    
    /**
     * 所属学科ID（外键关联到 subjects 表）
     */
    @TableField("subject_id")
    private Long subjectId;

    /**
     * 权重（已弃用，保留字段但不再使用，默认为0）
     */
    @TableField("weight")
    private BigDecimal weight;

    /**
     * 难度等级
     */
    @TableField("difficulty_level")
    private String difficultyLevel;

    /**
     * 创建者ID
     */
    @NotNull(message = "创建者ID不能为空")
    @TableField("creator_id")
    private Long creatorId;

    /**
     * 是否系统预设
     */
    @TableField("is_system")
    private Boolean isSystem;

    /**
     * 状态
     */
    @TableField("status")
    private String status;

    /**
     * 排序序号
     */
    @TableField("sort_order")
    private Integer sortOrder;

    /**
     * 创建时间
     */
    @TableField("created_at")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField("updated_at")
    private LocalDateTime updatedAt;

    /**
     * 难度等级枚举
     */
    public enum DifficultyLevel {
        EASY("简单"),
        MEDIUM("中等"),
        HARD("困难");

        private final String description;

        DifficultyLevel(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 状态枚举
     */
    public enum Status {
        ACTIVE("启用"),
        INACTIVE("禁用"),
        DELETED("已删除");

        private final String description;

        Status(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}













