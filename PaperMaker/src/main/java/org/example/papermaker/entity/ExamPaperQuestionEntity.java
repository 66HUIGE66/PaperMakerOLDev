package org.example.papermaker.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 试卷题目关联实体
 * 
 * @author System
 * @since 1.0.0
 */
@Data
@TableName("exam_paper_questions")
public class ExamPaperQuestionEntity {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 试卷ID
     */
    private Long paperId;
    
    /**
     * 题目ID
     */
    private Long questionId;
    
    /**
     * 题目顺序
     */
    private Integer questionOrder;
    
    /**
     * 题目分值
     */
    private Integer score;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
}

























































