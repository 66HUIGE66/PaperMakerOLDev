package org.example.papermaker.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户反馈实体类
 * 用于收集用户的Bug报告和功能建议
 * 
 * @author System
 * @since 1.0.0
 */
@Data
@TableName("feedbacks")
public class FeedbackEntity {

    /**
     * 反馈ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 反馈标题
     */
    @NotBlank(message = "反馈标题不能为空")
    @TableField("title")
    private String title;

    /**
     * 反馈内容
     */
    @NotBlank(message = "反馈内容不能为空")
    @TableField("content")
    private String content;

    /**
     * 反馈类型
     */
    @TableField("type")
    private FeedbackType type;

    /**
     * 反馈状态
     */
    @TableField("status")
    private FeedbackStatus status;

    /**
     * 提交者ID
     */
    @TableField("submitter_id")
    private Long submitterId;

    /**
     * 提交者用户名（不存储）
     */
    @TableField(exist = false)
    private String submitterName;

    /**
     * 管理员回复
     */
    @TableField("admin_reply")
    private String adminReply;

    /**
     * 回复者ID
     */
    @TableField("replier_id")
    private Long replierId;

    /**
     * 回复时间
     */
    @TableField("replied_at")
    private LocalDateTime repliedAt;

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
     * 反馈类型枚举
     */
    public enum FeedbackType {
        BUG("Bug报告"),
        FEATURE("功能建议"),
        IMPROVEMENT("改进意见"),
        OTHER("其他");

        private final String description;

        FeedbackType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 反馈状态枚举
     */
    public enum FeedbackStatus {
        PENDING("待处理"),
        PROCESSING("处理中"),
        RESOLVED("已解决"),
        REJECTED("已拒绝"),
        CLOSED("已关闭");

        private final String description;

        FeedbackStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
