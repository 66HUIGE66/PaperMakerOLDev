package org.example.papermaker.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.example.papermaker.context.SimpleUserContext;
import org.example.papermaker.entity.ExamRecordEntity;
import org.example.papermaker.service.ExamRecordService;
import org.example.papermaker.vo.RespBean;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

/**
 * 考试记录控制器
 * 提供练习记录的增删改查功能
 * 
 * @author System
 * @since 1.0.0
 */
@RestController
@RequestMapping("/exam-record")
@Tag(name = "练习记录管理", description = "练习记录的增删改查操作")
public class ExamRecordController {
    
    private static final Logger log = LoggerFactory.getLogger(ExamRecordController.class);
    
    @Resource
    private ExamRecordService examRecordService;
    
    /**
     * 获取当前用户的练习记录
     */
    @GetMapping("/my-records")
    @Operation(summary = "获取我的练习记录", description = "获取当前用户的所有练习记录")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getMyRecords() {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            
            if (currentUserId == null) {
                return new RespBean(401, "用户未登录", null);
            }
            
            List<ExamRecordEntity> records = examRecordService.getRecordsByUserId(currentUserId);
            return new RespBean(200, "查询成功", records);
        } catch (Exception e) {
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 根据状态获取练习记录
     */
    @GetMapping("/my-records/status/{status}")
    @Operation(summary = "根据状态获取练习记录", description = "根据状态获取当前用户的练习记录")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getMyRecordsByStatus(
            @Parameter(description = "记录状态", required = true, example = "COMPLETED")
            @PathVariable String status) {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                return new RespBean(401, "用户未登录", null);
            }
            
            ExamRecordEntity.ExamStatus examStatus = ExamRecordEntity.ExamStatus.valueOf(status);
            List<ExamRecordEntity> records = examRecordService.getRecordsByUserIdAndStatus(currentUserId, examStatus);
            return new RespBean(200, "查询成功", records);
        } catch (Exception e) {
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 根据类型获取练习记录
     */
    @GetMapping("/my-records/type/{type}")
    @Operation(summary = "根据类型获取练习记录", description = "根据类型获取当前用户的练习记录")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getMyRecordsByType(
            @Parameter(description = "记录类型", required = true, example = "PRACTICE")
            @PathVariable String type) {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                return new RespBean(401, "用户未登录", null);
            }
            
            ExamRecordEntity.ExamType examType = ExamRecordEntity.ExamType.valueOf(type);
            List<ExamRecordEntity> records = examRecordService.getRecordsByUserIdAndType(currentUserId, examType);
            return new RespBean(200, "查询成功", records);
        } catch (Exception e) {
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 根据ID获取练习记录详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取练习记录详情", description = "根据ID获取练习记录详情")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "403", description = "无权访问该记录"),
            @ApiResponse(responseCode = "404", description = "记录不存在"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getRecordById(
            @Parameter(description = "记录ID", required = true, example = "1")
            @PathVariable Long id) {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                return new RespBean(401, "用户未登录", null);
            }
            
            ExamRecordEntity record = examRecordService.getById(id);
            if (record == null) {
                return new RespBean(404, "记录不存在", null);
            }
            
            // 验证记录是否属于当前用户
            if (!record.getUserId().equals(currentUserId)) {
                return new RespBean(403, "无权访问该记录", null);
            }
            
            return new RespBean(200, "查询成功", record);
        } catch (Exception e) {
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取练习统计信息
     */
    @GetMapping("/my-statistics")
    @Operation(summary = "获取练习统计信息", description = "获取当前用户的练习统计信息")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getMyStatistics() {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                return new RespBean(401, "用户未登录", null);
            }
            
            Map<String, Object> statistics = examRecordService.getStatisticsByUserId(currentUserId);
            return new RespBean(200, "查询成功", statistics);
        } catch (Exception e) {
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 获取总体练习情况统计（
     */
    @GetMapping("/overall-statistics")
    @Operation(summary = "获取总体练习统计", description = "获取当前用户的总体练习情况统计，数据结构适合LLM分析")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getOverallStatistics() {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                return new RespBean(401, "用户未登录", null);
            }
            
            Map<String, Object> statistics = examRecordService.getOverallStatistics(currentUserId);
            return new RespBean(200, "查询成功", statistics);
        } catch (Exception e) {
            log.error("获取总体统计失败", e);
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 获取学科分类练习情况统计
     */
    @GetMapping("/subject-statistics")
    @Operation(summary = "获取学科分类统计", description = "获取当前用户的学科分类练习情况统计，数据结构适合LLM分析")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getSubjectStatistics() {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                return new RespBean(401, "用户未登录", null);
            }
            
            Map<String, Object> statistics = examRecordService.getSubjectStatistics(currentUserId);
            return new RespBean(200, "查询成功", statistics);
        } catch (Exception e) {
            log.error("获取学科统计失败", e);
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 获取学科知识点学习情况统计
     */
    @GetMapping("/subject-knowledge-point-statistics")
    @Operation(summary = "获取学科知识点统计", description = "获取当前用户的学科知识点学习情况统计，数据结构适合LLM分析")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getSubjectKnowledgePointStatistics() {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                return new RespBean(401, "用户未登录", null);
            }
            
            Map<String, Object> statistics = examRecordService.getSubjectKnowledgePointStatistics(currentUserId);
            return new RespBean(200, "查询成功", statistics);
        } catch (Exception e) {
            log.error("获取学科知识点统计失败", e);
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 创建练习记录
     */
    @PostMapping("/create")
    @Operation(summary = "创建练习记录", description = "创建新的练习记录")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "创建成功"),
            @ApiResponse(responseCode = "400", description = "请求参数错误"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "500", description = "创建失败")
    })
    public RespBean createRecord(
            @Parameter(description = "练习记录信息", required = true)
            @RequestBody ExamRecordEntity record) {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            
            log.info("创建练习记录 - 用户ID: {}, 试卷ID: {}", currentUserId, record.getPaperId());
            
            // 如果上下文中没有用户ID，尝试从请求体中获取
            if (currentUserId == null) {
                currentUserId = record.getUserId();
                log.info("从请求体获取用户ID: {}", currentUserId);
            }
            
            if (currentUserId == null) {
                log.warn("用户ID为空，返回未登录错误");
                return new RespBean(401, "用户未登录", null);
            }
            
            // 设置用户ID和学生ID
            record.setUserId(currentUserId);
            if (record.getStudentId() == null) {
                record.setStudentId(currentUserId);
            }

            boolean success = examRecordService.createRecord(record);
            if (success) {
                // 返回包含新建记录ID的对象
                return new RespBean(200, "创建成功", record);
            } else {
                return new RespBean(500, "创建失败", null);
            }
        } catch (Exception e) {
            return new RespBean(500, "创建失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 更新练习记录
     */
    @PutMapping("/update")
    @Operation(summary = "更新练习记录", description = "更新练习记录信息")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "更新成功"),
            @ApiResponse(responseCode = "400", description = "请求参数错误"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "500", description = "更新失败")
    })
    public RespBean updateRecord(
            @Parameter(description = "练习记录信息", required = true)
            @RequestBody ExamRecordEntity record) {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                return new RespBean(401, "用户未登录", null);
            }
            
            // 验证记录是否属于当前用户
            ExamRecordEntity existingRecord = examRecordService.getById(record.getId());
            if (existingRecord == null || !existingRecord.getUserId().equals(currentUserId)) {
                return new RespBean(403, "无权访问该记录", null);
            }
            
            boolean success = examRecordService.updateRecord(record);
            if (success) {
                return new RespBean(200, "更新成功", record);
            } else {
                return new RespBean(500, "更新失败", null);
            }
        } catch (Exception e) {
            return new RespBean(500, "更新失败: " + e.getMessage(), null);
        }
    }

    /**
     * 保存进行中进度（剩余时间/已答数量等）
     */
    @PostMapping("/progress/save")
    @Operation(summary = "保存进行中进度", description = "保存或更新进行中练习的进度，包括用时与已答数量")
    public RespBean saveProgress(@RequestBody Map<String, Object> body) {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                return new RespBean(401, "用户未登录", null);
            }

            Long recordId = body.get("recordId") instanceof Number ? ((Number) body.get("recordId")).longValue() : null;
            Long paperId = body.get("paperId") instanceof Number ? ((Number) body.get("paperId")).longValue() : null;
            Integer answered = body.get("answeredQuestions") instanceof Number ? ((Number) body.get("answeredQuestions")).intValue() : null;
            Integer total = body.get("totalQuestions") instanceof Number ? ((Number) body.get("totalQuestions")).intValue() : null;
            Long timeSpent = body.get("timeSpent") instanceof Number ? ((Number) body.get("timeSpent")).longValue() : null;

            ExamRecordEntity rec;
            if (recordId != null) {
                rec = examRecordService.getById(recordId);
                if (rec == null) return new RespBean(404, "记录不存在", null);
                if (!rec.getUserId().equals(currentUserId)) return new RespBean(403, "无权访问该记录", null);
            } else {
                rec = new ExamRecordEntity();
                rec.setUserId(currentUserId);
                rec.setStudentId(currentUserId);
                rec.setPaperId(paperId);
                rec.setStatus(ExamRecordEntity.ExamStatus.IN_PROGRESS);
                rec.setExamType(ExamRecordEntity.ExamType.PRACTICE);
                rec.setStartTime(java.time.LocalDateTime.now());
                examRecordService.save(rec);
            }

            if (answered != null) rec.setAnsweredQuestions(answered);
            if (total != null) rec.setTotalQuestions(total);
            if (timeSpent != null) rec.setTimeSpent(timeSpent.intValue());
            rec.setStatus(ExamRecordEntity.ExamStatus.IN_PROGRESS);
            rec.setUpdatedAt(java.time.LocalDateTime.now());
            examRecordService.updateById(rec);

            return new RespBean(200, "进度已保存", rec);
        } catch (Exception e) {
            return new RespBean(500, "保存进度失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取进行中进度（用于恢复倒计时）
     */
    @GetMapping("/progress/latest")
    @Operation(summary = "获取最近的进行中记录", description = "返回当前用户最近的进行中练习记录")
    public RespBean getLatestProgress(@RequestParam(required = false) Long paperId) {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                return new RespBean(401, "用户未登录", null);
            }
            List<ExamRecordEntity> list = examRecordService.getRecordsByUserIdAndStatus(currentUserId, ExamRecordEntity.ExamStatus.IN_PROGRESS);
            if (paperId != null) {
                list = list.stream().filter(r -> paperId.equals(r.getPaperId())).toList();
            }
            ExamRecordEntity rec = list.stream().findFirst().orElse(null);
            return new RespBean(200, "查询成功", rec);
        } catch (Exception e) {
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 删除练习记录
     */
    @DeleteMapping("/delete/{id}")
    @Operation(summary = "删除练习记录", description = "删除指定的练习记录")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "删除成功"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "403", description = "无权访问"),
            @ApiResponse(responseCode = "500", description = "删除失败")
    })
    public RespBean deleteRecord(
            @Parameter(description = "记录ID", required = true, example = "1")
            @PathVariable Long id) {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                return new RespBean(401, "用户未登录", null);
            }
            
            // 验证记录是否属于当前用户
            ExamRecordEntity existingRecord = examRecordService.getById(id);
            if (existingRecord == null || !existingRecord.getUserId().equals(currentUserId)) {
                return new RespBean(403, "无权访问该记录", null);
            }
            
            boolean success = examRecordService.deleteRecord(id);
            if (success) {
                return new RespBean(200, "删除成功", null);
            } else {
                return new RespBean(500, "删除失败", null);
            }
        } catch (Exception e) {
            return new RespBean(500, "删除失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 搜索练习记录
     */
    @PostMapping("/search")
    @Operation(summary = "搜索练习记录", description = "根据条件搜索练习记录")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "500", description = "查询失败")
    })
    public RespBean searchRecords(
            @Parameter(description = "搜索条件", required = true)
            @RequestBody Map<String, Object> searchParams) {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                return new RespBean(401, "用户未登录", null);
            }
            
            String paperTitle = (String) searchParams.get("paperTitle");
            String statusStr = (String) searchParams.get("status");
            String typeStr = (String) searchParams.get("type");
            String subjectId = (String) searchParams.get("subjectId");
            String startDate = (String) searchParams.get("startDate");
            String endDate = (String) searchParams.get("endDate");
            
            ExamRecordEntity.ExamStatus status = null;
            if (statusStr != null && !statusStr.equals("ALL")) {
                status = ExamRecordEntity.ExamStatus.valueOf(statusStr);
            }
            
            ExamRecordEntity.ExamType type = null;
            if (typeStr != null && !typeStr.equals("ALL")) {
                type = ExamRecordEntity.ExamType.valueOf(typeStr);
            }

            List<ExamRecordEntity> records = examRecordService.searchRecords(currentUserId, paperTitle, status, type, subjectId, startDate, endDate);
            return new RespBean(200, "查询成功", records);
        } catch (Exception e) {
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }
}
