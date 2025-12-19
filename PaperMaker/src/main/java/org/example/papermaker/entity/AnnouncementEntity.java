package org.example.papermaker.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 系统公告实体类
 * 用于发布系统通知和公告
 * 
 * @author System
 * @since 1.0.0
 */
@Data
@TableName("announcements")
public class AnnouncementEntity {

    /**
     * 公告ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 公告标题
     */
    @NotBlank(message = "公告标题不能为空")
    @TableField("title")
    private String title;

    /**
     * 公告内容
     */
    @NotBlank(message = "公告内容不能为空")
    @TableField("content")
    private String content;

    /**
     * 公告类型
     */
    @TableField("type")
    private AnnouncementType type;

    /**
     * 公告状态
     */
    @TableField("status")
    private AnnouncementStatus status;

    /**
     * 发布者ID
     */
    @TableField("publisher_id")
    private Long publisherId;

    /**
     * 发布者用户名（不存储）
     */
    @TableField(exist = false)
    private String publisherName;

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
     * 发布时间
     */
    @TableField("published_at")
    private LocalDateTime publishedAt;

    /**
     * 公告类型枚举
     */
    public enum AnnouncementType {
        SYSTEM("系统公告"),
        MAINTENANCE("维护通知"),
        UPDATE("更新公告"),
        EVENT("活动通知");

        private final String description;

        AnnouncementType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 公告状态枚举
     */
    public enum AnnouncementStatus {
        DRAFT("草稿"),
        PUBLISHED("已发布"),
        ARCHIVED("已归档");

        private final String description;

        AnnouncementStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
