package org.example.papermaker.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 考试记录实体类
 * 对应数据库表: exam_records
 */
@Data
@TableName("exam_records")
public class ExamRecordEntity {

    /**
     * 考试记录ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 试卷ID
     */
    @NotNull(message = "试卷ID不能为空")
    @TableField("paper_id")
    private Long paperId;

    /**
     * 试卷名称
     */
    @TableField("paper_title")
    private String paperTitle;

    /**
     * 用户ID
     */
    @NotNull(message = "用户ID不能为空")
    @TableField("user_id")
    private Long userId;

    /**
     * 学生ID（与用户ID相同）
     */
    @TableField("student_id")
    private Long studentId;

    /**
     * 开始时间
     */
    @NotNull(message = "开始时间不能为空")
    @TableField("start_time")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "GMT+8")
    private LocalDateTime startTime;

    /**
     * 结束时间
     */
    @TableField("end_time")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "GMT+8")
    private LocalDateTime endTime;

    /**
     * 得分
     */
    @TableField("score")
    private Double score;

    /**
     * 总分
     */
    @TableField("total_score")
    private Integer totalScore;

    /**
     * 答题数量
     */
    @TableField("answered_questions")
    private Integer answeredQuestions;

    /**
     * 总题目数量
     */
    @TableField("total_questions")
    private Integer totalQuestions;

    /**
     * 正确答题数量
     */
    @TableField("correct_answers")
    private Integer correctAnswers;

    /**
     * 正确率
     */
    @TableField("accuracy")
    private Double accuracy;

    /**
     * 考试类型（练习模式/考试模式）
     */
    @TableField("exam_type")
    private ExamType examType;

    /**
     * 考试状态
     */
    @TableField("status")
    private ExamStatus status;

    /**
     * 用时（秒）
     */
    @TableField("time_spent")
    private Integer timeSpent;

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
     * 考试类型枚举
     */
    public enum ExamType {
        PRACTICE("练习"),
        EXAM("考试");

        private final String description;

        ExamType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 考试状态枚举
     */
    public enum ExamStatus {
        IN_PROGRESS("进行中"),
        COMPLETED("已完成"),
        TIMEOUT("超时");

        private final String description;

        ExamStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}