//package org.example.papermaker.entity;
//
//import com.baomidou.mybatisplus.annotation.*;
//import com.fasterxml.jackson.annotation.JsonFormat;
//import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
//import jakarta.validation.constraints.NotBlank;
//import jakarta.validation.constraints.NotNull;
//import jakarta.validation.constraints.Size;
//import lombok.Data;
//import lombok.EqualsAndHashCode;
//import lombok.ToString;
//import org.apache.ibatis.mapping.FetchType;
//
//import java.time.LocalDateTime;
//
//
///**
// * 题目附件实体类
// * 对应数据库表: question_attachments
// * 使用MyBatis-Plus框架
// *
// * @author System
// * @since 2.0.0
// */
//@Data
//@TableName("question_attachments")
//public class QuestionAttachmentEntity {
//
//    /**
//     * 附件ID
//     */
//    @TableId(type = IdType.AUTO)
//    private Long id;
//
//    /**
//     * 关联的题目ID
//     */
//    @NotNull(message = "题目ID不能为空")
//    @TableField("question_id")
//    private Long questionId;
//
//    /**
//     * 附件类型
//     * IMAGE: 图片
//     * AUDIO: 音频
//     * VIDEO: 视频
//     * DOCUMENT: 文档
//     * OTHER: 其他
//     */
//    @NotNull(message = "附件类型不能为空")
//    @TableField("type")
//    private AttachmentType type;
//
//    /**
//     * 原始文件名
//     */
//    @NotBlank(message = "原始文件名不能为空")
//    @Size(max = 255, message = "原始文件名长度不能超过255个字符")
//    @TableField("original_name")
//    private String originalName;
//
//    /**
//     * 存储文件名
//     */
//    @NotBlank(message = "存储文件名不能为空")
//    @Size(max = 255, message = "存储文件名长度不能超过255个字符")
//    @TableField("file_name")
//    private String fileName;
//
//    /**
//     * 文件路径
//     */
//    @NotBlank(message = "文件路径不能为空")
//    @Size(max = 500, message = "文件路径长度不能超过500个字符")
//    @TableField("file_path")
//    private String filePath;
//
//    /**
//     * 文件大小（字节）
//     */
//    @TableField("file_size")
//    private Long fileSize;
//
//    /**
//     * MIME类型
//     */
//    @Size(max = 100, message = "MIME类型长度不能超过100个字符")
//    @TableField("mime_type")
//    private String mimeType;
//
//    /**
//     * 文件扩展名
//     */
//    @Size(max = 20, message = "文件扩展名长度不能超过20个字符")
//    @TableField("file_extension")
//    private String fileExtension;
//
//    /**
//     * 附件描述
//     */
//    @Size(max = 500, message = "附件描述长度不能超过500个字符")
//    @TableField("description")
//    private String description;
//
//    /**
//     * 附件状态
//     * UPLOADING: 上传中
//     * COMPLETED: 已完成
//     * FAILED: 失败
//     * DELETED: 已删除
//     */
//    @NotNull(message = "附件状态不能为空")
//    @TableField("status")
//    private AttachmentStatus status = AttachmentStatus.UPLOADING;
//
//    /**
//     * 排序顺序
//     */
//    @TableField("sort_order")
//    private Integer sortOrder = 0;
//
//    /**
//     * 创建时间
//     */
//    @TableField(value = "created_at", fill = FieldFill.INSERT)
//    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
//    private LocalDateTime createdAt;
//
//    /**
//     * 更新时间
//     */
//    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
//    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
//    private LocalDateTime updatedAt;
//
//    // ==================== 关联关系 ====================
//    // 注意：MyBatis-Plus中关联关系需要通过Service层处理，这里只是定义字段
//
//    /**
//     * 关联的题目（多对一）
//     */
//    @TableField(exist = false)
//    private QuestionEntity question;
//
//    // ==================== 枚举定义 ====================
//
//    /**
//     * 附件类型枚举
//     */
//    public enum AttachmentType {
//        IMAGE("图片"),
//        AUDIO("音频"),
//        VIDEO("视频"),
//        DOCUMENT("文档"),
//        OTHER("其他");
//
//        private final String description;
//
//        AttachmentType(String description) {
//            this.description = description;
//        }
//
//        public String getDescription() {
//            return description;
//        }
//
//        /**
//         * 检查是否为图片类型
//         */
//        public boolean isImage() {
//            return this == IMAGE;
//        }
//
//        /**
//         * 检查是否为音频类型
//         */
//        public boolean isAudio() {
//            return this == AUDIO;
//        }
//
//        /**
//         * 检查是否为视频类型
//         */
//        public boolean isVideo() {
//            return this == VIDEO;
//        }
//
//        /**
//         * 检查是否为文档类型
//         */
//        public boolean isDocument() {
//            return this == DOCUMENT;
//        }
//    }
//
//    /**
//     * 附件状态枚举
//     */
//    public enum AttachmentStatus {
//        UPLOADING("上传中"),
//        COMPLETED("已完成"),
//        FAILED("失败"),
//        DELETED("已删除");
//
//        private final String description;
//
//        AttachmentStatus(String description) {
//            this.description = description;
//        }
//
//        public String getDescription() {
//            return description;
//        }
//
//        /**
//         * 检查是否已完成
//         */
//        public boolean isCompleted() {
//            return this == COMPLETED;
//        }
//
//        /**
//         * 检查是否可用
//         */
//        public boolean isAvailable() {
//            return this == COMPLETED;
//        }
//    }
//
//    // ==================== 业务方法 ====================
//
//    /**
//     * 获取文件大小的可读格式
//     * @return 格式化的文件大小
//     */
//    public String getFormattedFileSize() {
//        if (this.fileSize == null || this.fileSize <= 0) {
//            return "0 B";
//        }
//
//        String[] units = {"B", "KB", "MB", "GB", "TB"};
//        int unitIndex = 0;
//        double size = this.fileSize.doubleValue();
//
//        while (size >= 1024 && unitIndex < units.length - 1) {
//            size /= 1024;
//            unitIndex++;
//        }
//
//        return String.format("%.2f %s", size, units[unitIndex]);
//    }
//
//    /**
//     * 获取完整的文件URL
//     * @param baseUrl 基础URL
//     * @return 完整的文件URL
//     */
//    public String getFullUrl(String baseUrl) {
//        if (baseUrl == null || baseUrl.trim().isEmpty()) {
//            return this.filePath;
//        }
//
//        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
//        String path = this.filePath.startsWith("/") ? this.filePath : "/" + this.filePath;
//
//        return base + path;
//    }
//
//    /**
//     * 检查附件是否可用
//     * @return 是否可用
//     */
//    public boolean isAvailable() {
//        return this.status != null && this.status.isAvailable();
//    }
//
//    /**
//     * 检查是否为图片
//     * @return 是否为图片
//     */
//    public boolean isImage() {
//        return this.type != null && this.type.isImage();
//    }
//
//    /**
//     * 检查是否为音频
//     * @return 是否为音频
//     */
//    public boolean isAudio() {
//        return this.type != null && this.type.isAudio();
//    }
//
//    /**
//     * 检查是否为视频
//     * @return 是否为视频
//     */
//    public boolean isVideo() {
//        return this.type != null && this.type.isVideo();
//    }
//
//    /**
//     * 检查是否为文档
//     * @return 是否为文档
//     */
//    public boolean isDocument() {
//        return this.type != null && this.type.isDocument();
//    }
//
//    /**
//     * 标记为已完成
//     */
//    public void markAsCompleted() {
//        this.status = AttachmentStatus.COMPLETED;
//    }
//
//    /**
//     * 标记为失败
//     */
//    public void markAsFailed() {
//        this.status = AttachmentStatus.FAILED;
//    }
//
//    /**
//     * 标记为已删除
//     */
//    public void markAsDeleted() {
//        this.status = AttachmentStatus.DELETED;
//    }
//}
//
//
