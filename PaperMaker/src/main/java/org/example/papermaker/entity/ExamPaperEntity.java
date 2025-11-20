package org.example.papermaker.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 试卷实体类
 * 对应数据库表: exam_papers
 */
@Data
@TableName("exam_papers")
public class ExamPaperEntity {

    /**
     * 试卷ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 试卷标题
     */
    @NotBlank(message = "试卷标题不能为空")
    @TableField("title")
    private String title;

    /**
     * 试卷描述
     */
    @TableField("description")
    private String description;

    /**
     * 总分
     */
    @Positive(message = "总分必须大于0")
    @TableField("total_score")
    private Integer totalScore;

    /**
     * 考试时长（分钟）
     */
    @Positive(message = "考试时长必须大于0")
    @TableField("duration")
    private Integer duration;

    /**
     * 学科id
     */
    @TableField("subject_id")
    private String subjectId;

    /**
     * 创建者ID
     */
    @NotNull(message = "创建者ID不能为空")
    @TableField("creator_id")
    private Long creatorId;

    /**
     * 规则ID（用于标识该试卷是由哪个规则生成的）
     */
    @TableField("rule_id")
    private Long ruleId;

    /**
     * 题目ID列表（JSON格式存储）
     */
    @TableField(exist = false)
    private String questionIds;

    /**
     * 难度系数
     */
    @TableField(exist = false)
    private Double difficultyScore;

    /**
     * 生成类型
     */
    @TableField(exist = false)
    private String generationType;

    /**
     * 试卷状态
     */
    @TableField(exist = false)
    private String status;

    /**
     * 是否为系统试卷
     */
    @TableField("is_system")
    private Boolean isSystem = false;

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

    // ==================== 业务方法 ====================

    /**
     * 获取题目ID列表
     */
    public List<Long> getQuestionIdsList() {
        if (questionIds == null || questionIds.trim().isEmpty()) {
            return new ArrayList<>();
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(questionIds, new TypeReference<List<Long>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /**
     * 设置题目ID列表
     */
    public void setQuestionIdsList(List<Long> questionIdsList) {
        if (questionIdsList == null || questionIdsList.isEmpty()) {
            this.questionIds = null;
        } else {
            try {
                ObjectMapper mapper = new ObjectMapper();
                this.questionIds = mapper.writeValueAsString(questionIdsList);
            } catch (Exception e) {
                this.questionIds = null;
            }
        }
    }
}
