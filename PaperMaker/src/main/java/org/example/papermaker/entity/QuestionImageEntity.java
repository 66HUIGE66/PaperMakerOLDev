package org.example.papermaker.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 题目图片实体类
 * 对应数据库表: question_image
 */
@Data
@TableName("question_image")
public class QuestionImageEntity {

    /**
     * 图片ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 关联的题目ID
     */
    @TableField("question_id")
    private Long questionId;

    /**
     * 图片URL
     */
    @TableField("image_url")
    private String imageUrl;

    /**
     * 图片描述
     */
    @TableField("description")
    private String description;

    /**
     * 显示顺序
     */
    @TableField("sort_order")
    private Integer sortOrder;

    /**
     * 创建时间
     */
    @TableField("created_at")
    private LocalDateTime createdAt;
}
