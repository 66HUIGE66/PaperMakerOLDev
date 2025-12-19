package org.example.papermaker.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("study_plan")
@Schema(description = "学习计划")
public class StudyPlanEntity {

    @TableId(type = IdType.AUTO)
    @Schema(description = "计划ID")
    private Long id;

    @Schema(description = "用户ID")
    private Long userId;

    @Schema(description = "关联学科ID")
    private Long subjectId;

    @Schema(description = "学习目标")
    private String targetDescription;

    @Schema(description = "截止日期")
    private LocalDateTime deadline;

    @Schema(description = "状态: ONGOING(进行中), COMPLETED(已完成)")
    private String status;

    @Schema(description = "已生成的试卷ID列表(JSON)")
    private String generatedPaperIds;

    @Schema(description = "AI生成的建议/计划内容")
    private String aiSuggestion;

    @Schema(description = "创建时间")
    private LocalDateTime createdAt;

    @Schema(description = "更新时间")
    private LocalDateTime updatedAt;
}
