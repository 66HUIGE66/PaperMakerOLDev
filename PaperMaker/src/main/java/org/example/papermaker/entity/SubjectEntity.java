package org.example.papermaker.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 学科实体类
 * 对应数据库表: subjects
 * 
 * 注意：学科的关键词通过关联的知识点名称动态获取，不再存储aliases字段
 */
@Data
@TableName("subjects")
public class SubjectEntity {

    /**
     * 学科ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 学科名称
     */
    @TableField("name")
    private String name;

    /**
     * 学科代码
     */
    @TableField("code")
    private String code;

    /**
     * 学科描述
     */
    @TableField("description")
    private String description;

    /**
     * 排序序号
     */
    @TableField("sort_order")
    private Integer sortOrder;

    /**
     * 是否启用
     */
    @TableField("is_active")
    private Boolean isActive;

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
     * 关联的知识点列表（不存储到数据库，用于返回前端）
     */
    @TableField(exist = false)
    private List<String> keywords;
    
    /**
     * 知识点数量（不存储到数据库，用于统计）
     */
    @TableField(exist = false)
    private Integer keywordCount;
    
    /**
     * 创建者ID
     */
    @TableField("creator_id")
    private Long creatorId;

    /**
     * 是否系统预设
     */
    @TableField("is_system")
    private Boolean isSystem;
    
}

