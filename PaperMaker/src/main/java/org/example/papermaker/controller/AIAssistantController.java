package org.example.papermaker.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;

import org.apache.commons.lang3.StringUtils;
import org.example.papermaker.context.SimpleUserContext;
import org.example.papermaker.service.AIAssistantService;
import org.example.papermaker.service.impl.AIService;
import org.example.papermaker.vo.RespBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.Map;


/**
 * AI助手控制器
 * 提供AI聊天、生成学习计划、生成学习总结等功能
 * 
 * @author System
 * @since 1.0.0
 */
@RestController
@RequestMapping("/api/ai-assistant")
@Tag(name = "AI助手", description = "AI学习助手接口，提供智能问答、学习计划生成、学习总结等功能")
public class AIAssistantController {
    
    private static final Logger log = LoggerFactory.getLogger(AIAssistantController.class);
    
    @Resource
    private AIService aiService;
    
    @Resource
    private AIAssistantService aiAssistantService;
    
    /**
     * AI聊天接口（流式响应）
     * 支持实时回答用户问题，并根据上下文生成个性化建议
     * 
     * @param message 用户消息
     * @param memoryId 会话记忆ID（可选，用于保持上下文）
     * @return 流式响应
     */
    @GetMapping(value = "/chat", produces = "text/event-stream")
    @Operation(summary = "AI聊天（流式）", description = "与AI助手进行实时对话，支持生成学习计划、学习总结和回答问题")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "聊天成功"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public Flux<String> chat(
            @Parameter(description = "用户消息", required = true) @RequestParam String message,
            @Parameter(description = "会话记忆ID（可选）") @RequestParam(required = false) String memoryId) {
        try {
            // 检查用户是否登录
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                return Flux.just("错误：用户未登录，请先登录后再使用AI助手。");
            }
            
            log.info("收到AI聊天请求，用户ID: {}, 消息: {}, memoryId: {}", currentUserId, message, memoryId);
            
            // 设置工具类使用的用户ID
            SimpleUserContext.setToolUserId(currentUserId);
            
            // 调用AI服务（Spring会自动格式化为SSE格式，不需要手动添加data:前缀）
            // 注意：Flux是异步的，工具类可能在不同线程中执行
            // 我们已经在拦截器中设置了ThreadLocal和Redis，工具类会从Redis获取用户信息
            return aiService.chatWithAiA(message + "\n当前用户Id:" + currentUserId)
                    .doOnSubscribe(subscription -> {
                        // 在订阅时确保用户上下文可用（虽然可能在不同线程）
                        // 但工具类会从Redis获取，所以这里不需要额外操作
                        log.debug("AI服务订阅开始，用户ID: {}", currentUserId);
                    })
                    .doFinally(signalType -> {
                        // 清理工具类用户ID上下文
                        SimpleUserContext.setToolUserId(null);
                    });
        } catch (Exception e) {
            log.error("AI聊天失败", e);
            return Flux.just("抱歉，AI助手暂时无法响应，请稍后重试。错误信息：" + e.getMessage());
        }
    }
    
    /**
     * 生成个性化学习计划
     * 基于用户的学习统计数据生成个性化的学习计划
     * 
     * @param goal 学习目标（可选）
     * @param targetDate 目标日期（可选）
     * @return 学习计划（流式响应）
     */
    @GetMapping(value = "/generate-study-plan", produces = "text/event-stream")
    @Operation(summary = "生成学习计划", description = "基于用户的学习统计数据生成个性化学习计划")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "生成成功"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public Flux<String> generateStudyPlan(
            @Parameter(description = "学习目标（可选）") @RequestParam(required = false) String goal,
            @Parameter(description = "目标日期（可选，格式：YYYY-MM-DD）") @RequestParam(required = false) String targetDate,
            @Parameter(description = "目标学科(可选)") @RequestParam(required = false) String subject,
            @Parameter(description = "目标学科知识点(可选)") @RequestParam(required = false) String knowledgePoint
    ) {
        try {
            // 检查用户是否登录
            if (SimpleUserContext.getCurrentUserId() == null) {
                return Flux.just("错误：用户未登录，请先登录后再使用AI助手。");
            }
            
            // 构建生成学习计划的提示词
            StringBuilder prompt = new StringBuilder();

            prompt.append("请根据我的学习统计数据，为我生成一个个性化的学习计划。");

            if (StringUtils.isNoneBlank(subject)) {
                prompt.append("我的目标科目是：").append(subject).append("。");
            }

            if (StringUtils.isNoneBlank(knowledgePoint)) {
                prompt.append("我的目标知识点是：").append(knowledgePoint).append("。");
            }

            if (goal != null && !goal.trim().isEmpty()) {
                prompt.append("我的学习目标是：").append(goal).append("。");
            }
            
            if (targetDate != null && !targetDate.trim().isEmpty()) {
                prompt.append("我希望在").append(targetDate).append("之前完成这个学习计划。");
            }
            
            prompt.append("请先调用getOverallStatistics和getSubjectStatistics工具获取我的学习统计数据，然后基于这些数据生成详细的学习计划，包括：");
            prompt.append("1. 当前学习状况分析");
            prompt.append("2. 薄弱领域识别");
            prompt.append("3. 学习目标设定");
            prompt.append("4. 每日/每周学习任务安排");
            prompt.append("5. 学习方法和建议");
            prompt.append("6. 预期成果和时间节点");
            
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            log.info("生成学习计划请求，用户ID: {}, goal: {}, targetDate: {}", currentUserId, goal, targetDate);

            // 设置工具类使用的用户ID
            SimpleUserContext.setToolUserId(currentUserId);
            
            // Spring会自动格式化为SSE格式，不需要手动添加data:前缀
            return aiService.chatWithAiA(prompt+ "\n当前用户Id:" + currentUserId)
                    .doFinally(signalType -> {
                        // 清理工具类用户ID上下文
                        SimpleUserContext.setToolUserId(null);
                    });
        } catch (Exception e) {
            log.error("生成学习计划失败", e);
            return Flux.just("抱歉，生成学习计划失败，请稍后重试。错误信息：" + e.getMessage());
        }
    }
    
    /**
     * 生成学习总结
     * 基于用户的学习统计数据生成学习总结报告
     * 
     * @param subjectName 学科名称（可选），指定生成特定学科的学习总结
     * @return 学习总结（流式响应）
     */
    @GetMapping(value = "/generate-study-summary", produces = "text/event-stream")
    @Operation(summary = "生成学习总结", description = "基于用户的学习统计数据生成学习总结报告，支持按学科筛选")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "生成成功"),
            @ApiResponse(responseCode = "401", description = "用户未登录"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public Flux<String> generateStudySummary(
            @Parameter(description = "学科名称（可选），不指定则生成所有学科的总结") 
            @RequestParam(required = false) String subjectName) {
        try {
            // 检查用户是否登录
            if (SimpleUserContext.getCurrentUserId() == null) {
                return Flux.just("错误：用户未登录，请先登录后再使用AI助手。");
            }
            
            // 构建生成学习总结的提示词
            StringBuilder prompt = new StringBuilder();
            if (subjectName != null && !subjectName.trim().isEmpty()) {
                // 按特定学科生成总结
                prompt.append("请根据我的").append(subjectName).append("学科的学习统计数据，为我生成一份详细的学习总结报告。");
                prompt.append("请先调用getOverallStatistics和getSubjectStatistics工具获取我的学习统计数据，然后专注分析").append(subjectName).append("学科的学习情况。");
                prompt.append("生成的总结报告应包括：");
                prompt.append("1. ").append(subjectName).append("学科学习概况");
                prompt.append("2. 重点知识点掌握情况");
                prompt.append("3. 学习进度分析");
                prompt.append("4. 薄弱环节识别");
                prompt.append("5. 改进建议和学习方法指导");
            } else {
                // 生成所有学科的总结
                prompt.append("请根据我的学习统计数据，为我生成一份详细的学习总结报告。请先调用getOverallStatistics和getSubjectStatistics工具获取我的学习统计数据，然后基于这些数据生成总结报告，包括：");
                prompt.append("1. 总体学习情况概述");
                prompt.append("2. 各学科表现分析");
                prompt.append("3. 优势领域识别");
                prompt.append("4. 薄弱领域识别");
                prompt.append("5. 学习进步情况");
                prompt.append("6. 改进建议和下一步学习方向");
            }
            
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            log.info("生成学习总结请求，用户ID: {}, 学科: {}", currentUserId, subjectName);

            // 设置工具类使用的用户ID
            SimpleUserContext.setToolUserId(currentUserId);
            
            // Spring会自动格式化为SSE格式，不需要手动添加data:前缀
            return aiService.chatWithAiA(prompt.toString() + "\n当前用户Id:" + currentUserId)
                    .doFinally(signalType -> {
                        // 清理工具类用户ID上下文
                        SimpleUserContext.setToolUserId(null);
                    });
        } catch (Exception e) {
            log.error("生成学习总结失败", e);
            return Flux.just("抱歉，生成学习总结失败，请稍后重试。错误信息：" + e.getMessage());
        }
    }
    
    /**
     * 检查AI服务状态
     * 
     * @return 服务状态
     */
    @GetMapping("/status")
    @Operation(summary = "检查AI服务状态", description = "检查AI助手服务是否可用")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean checkStatus() {
        try {
            // 简单的健康检查
            boolean available = aiService.isServiceAvailable("测试");
            if (available) {
                return new RespBean(200, "AI服务可用", Map.of("status", "available"));
            } else {
                return new RespBean(200, "AI服务不可用", Map.of("status", "unavailable"));
            }
        } catch (Exception e) {
            log.error("检查AI服务状态失败", e);
            return new RespBean(500, "检查服务状态失败: " + e.getMessage(), null);
        }
    }
}

