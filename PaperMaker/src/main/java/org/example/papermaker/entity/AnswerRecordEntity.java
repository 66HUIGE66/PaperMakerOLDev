package org.example.papermaker.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 答题记录实体类
 * 对应表：answer_records
 */
@Data
@TableName("answer_records")
public class AnswerRecordEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("exam_record_id")
    private Long examRecordId;

    @TableField("question_id")
    private Long questionId;

    @TableField("question_type")
    private String questionType;

    @TableField("user_answer")
    private String userAnswer;

    @TableField("is_correct")
    private Boolean isCorrect;

    @TableField("time_spent")
    private Integer timeSpent;

    /**
     * AI评分分数 (0-100)
     * 仅用于主观题（填空题、简答题）
     */
    @TableField("ai_score")
    private Integer aiScore;

    /**
     * AI评分反馈
     * 说明答案的优点和不足
     */
    @TableField("ai_feedback")
    private String aiFeedback;

    /**
     * AI改进建议
     * 给出具体的提升方向
     */
    @TableField("ai_suggestions")
    private String aiSuggestions;

    /**
     * 相似度评分 (0-1)
     * 基于答案与标准答案的相似度计算
     */
    @TableField("similarity_score")
    private Double similarityScore;

    /**
     * 最终得分
     * 可能来自相似度评分或AI评分
     */
    @TableField("final_score")
    private Double finalScore;

    /**
     * 评分类型
     * SIMILARITY: 相似度评分
     * AI: AI评分
     */
    @TableField("score_type")
    private String scoreType;

    /**
     * 用户是否接受AI评分
     * 当用户选择使用AI重新评分并接受结果时为true
     */
    @TableField("user_accepted_ai_score")
    private Boolean userAcceptedAiScore;

    @TableField("created_at")
    private LocalDateTime createdAt;
}
