package org.example.papermaker.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 组卷规则实体类
 * 对应数据库中的exam_rules表
 * 
 * @author System
 * @since 1.0.0
 */
@Data
@TableName("exam_rules")
public class ExamRuleEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private String description;

    @TableField("total_questions")
    private Integer totalQuestions;

    @TableField("total_score")
    private Integer totalScore;

    private Integer duration;

    @TableField("rule_config")
    private String ruleConfig;
    
    @TableField("subject_id")
    private Long subjectId;

    @TableField("creator_id")
    private Long creatorId;

    @TableField("is_system")
    private Boolean isSystem;

    private String status;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

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













