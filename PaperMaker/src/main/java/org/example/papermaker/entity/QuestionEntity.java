package org.example.papermaker.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 题目实体类
 * 对应数据库表: questions
 */
@Data
@TableName("questions")
public class QuestionEntity {

    /**
     * 题目ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 题目标题
     */
    @NotBlank(message = "题目标题不能为空")
    @TableField("title")
    private String title;

    /**
     * 题目类型
     */
    @NotNull(message = "题目类型不能为空")
    @TableField("type")
    private QuestionType type;

    /**
     * 难度等级
     */
    @NotNull(message = "难度等级不能为空")
    @TableField("difficulty")
    private DifficultyLevel difficulty;

    /**
     * 选择题选项（JSON格式存储）
     */
    @TableField("options")
    private String options;

    /**
     * 正确答案
     */
    @NotBlank(message = "正确答案不能为空")
    @TableField("correct_answer")
    private String correctAnswer;

    /**
     * 题目解析
     */
    @TableField("explanation")
    private String explanation;

    /**
     * 学科ID
     */
    @TableField("subject_id")
    private Long subjectId;

    /**
     * 知识点ID列表（JSON格式存储）
     */
    @TableField("knowledge_point_ids")
    private String knowledgePointIds;

    /**
     * 知识点名称列表（用于显示，不存储到数据库）
     */
    @TableField(exist = false)
    private List<String> knowledgePoints;

    /**
     * 题目状态
     */
    @TableField(exist = false)
    private String status;

    /**
     * 创建者ID
     */
    @NotNull(message = "创建者ID不能为空")
    @TableField("creator_id")
    private Long creatorId;

    /**
     * 是否为系统题目
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

    // ==================== 枚举定义 ====================

    /**
     * 题目类型枚举
     */
    public enum QuestionType {
        SINGLE_CHOICE("单选题"),
        MULTIPLE_CHOICE("多选题"),
        FILL_BLANK("填空题"),
        TRUE_FALSE("判断题"),
        SHORT_ANSWER("简答题");

        private final String description;

        QuestionType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }

        /**
         * 检查是否为选择题
         */
        public boolean isChoiceQuestion() {
            return this == SINGLE_CHOICE || this == MULTIPLE_CHOICE;
        }

        /**
         * 检查是否需要选项
         */
        public boolean needsOptions() {
            return this == SINGLE_CHOICE || this == MULTIPLE_CHOICE;
        }
    }

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


    // ==================== 业务方法 ====================

    /**
     * 检查是否为选择题
     */
    public boolean isChoiceQuestion() {
        return this.type != null && this.type.isChoiceQuestion();
    }

    /**
     * 检查是否需要选项
     */
    public boolean needsOptions() {
        return this.type != null && this.type.needsOptions();
    }

    /**
     * 获取题目类型的中文描述
     */
    public String getTypeDescription() {
        return this.type != null ? this.type.getDescription() : "";
    }

    /**
     * 获取难度等级的中文描述
     */
    public String getDifficultyDescription() {
        return this.difficulty != null ? this.difficulty.getDescription() : "";
    }

    /**
     * 获取选项列表
     */
    public List<String> getOptionsList() {
        if (options == null || options.trim().isEmpty()) {
            return new ArrayList<>();
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(options, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /**
     * 设置选项列表
     */
    public void setOptionsList(List<String> optionsList) {
        if (optionsList == null || optionsList.isEmpty()) {
            this.options = null;
        } else {
            try {
                ObjectMapper mapper = new ObjectMapper();
                this.options = mapper.writeValueAsString(optionsList);
            } catch (Exception e) {
                this.options = null;
            }
        }
    }

    /**
     * 设置知识点ID列表
     */
    public void setKnowledgePointIdsList(List<Long> knowledgePointIdsList) {
        if (knowledgePointIdsList != null && !knowledgePointIdsList.isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                this.knowledgePointIds = mapper.writeValueAsString(knowledgePointIdsList);
            } catch (Exception e) {
                this.knowledgePointIds = null;
            }
        } else {
            this.knowledgePointIds = null;
        }
    }

    /**
     * 获取知识点ID列表
     */
    public List<Long> getKnowledgePointIdsList() {
        if (knowledgePointIds != null && !knowledgePointIds.trim().isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                return mapper.readValue(knowledgePointIds, new TypeReference<List<Long>>() {});
            } catch (Exception e) {
                return new ArrayList<>();
            }
        }
        return new ArrayList<>();
    }

    /**
     * 检查是否有知识点
     */
    public boolean hasKnowledgePoints() {
        return knowledgePoints != null && !knowledgePoints.isEmpty();
    }

    /**
     * 获取知识点数量
     */
    public int getKnowledgePointCount() {
        return knowledgePoints != null ? knowledgePoints.size() : 0;
    }
}

