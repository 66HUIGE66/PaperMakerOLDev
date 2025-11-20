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

    @TableField("created_at")
    private LocalDateTime createdAt;
}


