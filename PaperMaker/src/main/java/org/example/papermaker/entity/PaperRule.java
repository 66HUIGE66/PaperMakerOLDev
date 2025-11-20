package org.example.papermaker.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * 试卷规则实体类
 * 定义组卷的各种规则和约束条件
 * 
 * @author System
 * @since 1.0.0
 */
@Data
public class PaperRule {
    
    /**
     * 规则ID
     */
    private Long id;
    
    /**
     * 试卷标题
     */
    private String title;
    
    /**
     * 所属学科
     */
    private Long subjectId;
    
    /**
     * 总分
     */
    private BigDecimal totalScore;
    
    /**
     * 考试时长（分钟）
     */
    private Integer durationMinutes;
    
    /**
     * 题型分布规则：key为题型，value为所需数量
     */
    private Map<QuestionType, Integer> questionTypeDistribution = new HashMap<>();
    
    /**
     * 难度控制规则：key为难度等级，value为占比（0-1之间，总和为1）
     */
    private Map<DifficultyLevel, Float> difficultyDistribution = new HashMap<>();
    
    /**
     * 知识点覆盖规则：key为知识点ID，value为分数权重
     */
    private Map<Long, Float> knowledgePointWeights = new HashMap<>();
    
    /**
     * 知识点覆盖规则（按名称）：key为知识点名称，value为权重百分比
     * 用于前端传递知识点名称的场景
     */
    private Map<String, Float> knowledgePointNames = new HashMap<>();
    
    /**
     * 大模型增强规则（可选）
     */
    private Boolean enableAIGeneration = false; // 是否启用AI生成题目
    
    /**
     * 给AI的指令，如"生成贴近实际应用的场景题"
     */
    private String aiPrompt;
    
    /**
     * 创建者ID
     */
    private Long creatorId;
    
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
    
    /**
     * 验证规则的有效性
     */
    public boolean isValid() {
        // 基本字段验证
        if (title == null || title.trim().isEmpty()) {
            return false;
        }
        if (totalScore == null || totalScore.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        if (durationMinutes == null || durationMinutes <= 0) {
            return false;
        }
        
        // 难度分布验证
        if (difficultyDistribution != null && !difficultyDistribution.isEmpty()) {
            float sum = difficultyDistribution.values().stream()
                    .reduce(0.0f, Float::sum);
            if (Math.abs(sum - 1.0f) > 0.01f) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 获取总题目数
     */
    public int getTotalQuestionCount() {
        return questionTypeDistribution.values().stream()
                .mapToInt(Integer::intValue)
                .sum();
    }
}













