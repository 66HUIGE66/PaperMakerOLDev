package org.example.papermaker.controller;

import org.example.papermaker.entity.PaperRule;
import org.example.papermaker.entity.QuestionEntity;
import org.example.papermaker.entity.ExamPaperEntity;
import org.example.papermaker.entity.ExamRuleEntity;
import org.example.papermaker.entity.UserEntity;
import org.example.papermaker.service.PaperGenerationStrategy;
import org.example.papermaker.service.SubjectMapping;
import org.example.papermaker.service.QuestionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.papermaker.util.AIRuleGenerationTool;
import org.example.papermaker.context.SimpleUserContext;
import org.example.papermaker.util.SimplePermissionUtils;
import org.example.papermaker.service.ExamRuleService;
import org.example.papermaker.service.QuestionService;
import org.example.papermaker.service.ExamPaperService;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Flux;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 智能组卷控制器
 * 提供规则驱动的智能组卷功能
 * 
 * @author System
 * @since 1.0.0
 */
@RestController
@RequestMapping("/intelligent-paper")
public class IntelligentPaperController {
    
    private static final Logger log = LoggerFactory.getLogger(IntelligentPaperController.class);
    
    @Autowired
    private PaperGenerationStrategy paperGenerationStrategy;
    
    @Autowired
    private AIRuleGenerationTool aiRuleGenerationTool;
    
    @Autowired
    private QuestionService questionService;
    
    @Autowired
    private ExamRuleService examRuleService;
    
    @Autowired
    private ExamPaperService examPaperService;
    
    /**
     * 根据规则生成试卷
     */
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generatePaper(@RequestBody Map<String, Object> ruleConfig) {
        try {
            log.info("开始生成试卷 - 用户ID: {}", SimpleUserContext.getCurrentUser().getId());
            
            // 获取当前用户
            Long currentUserId = SimpleUserContext.getCurrentUser().getId();
            
            // 检查是否应该保存到数据库（默认false，除非明确指定）
            Boolean saveToDatabase = (Boolean) ruleConfig.getOrDefault("saveToDatabase", false);
            
//            // 获取规则ID（如果有）
//            Object ruleIdObj = ruleConfig.get("ruleId");
//            Long ruleId = null;
//            if (ruleIdObj != null) {
//                if (ruleIdObj instanceof Number) {
//                    ruleId = ((Number) ruleIdObj).longValue();
//                }
//            }
//
//            // 如果指定了规则ID，检查是否已存在相同规则生成的试卷
//            if (ruleId != null) {
//                List<ExamPaperEntity> existingPapers = examPaperService.listByRuleId(ruleId);
//                if (!existingPapers.isEmpty()) {
//                    log.info("已存在相同规则生成的试卷，规则ID: {}, 已生成{}份试卷", ruleId, existingPapers.size());
//                    Map<String, Object> result = new HashMap<>();
//                    result.put("code", 409); // HTTP 409 Conflict
//                    result.put("message", String.format("该规则已经生成过%d份试卷，请使用已有的试卷或先删除旧试卷。", existingPapers.size()));
//                    result.put("data", existingPapers); // 返回已存在的试卷列表
//                    return ResponseEntity.status(409).body(result);
//                }
//            }
            
            // 获取所有题目
            List<QuestionEntity> allQuestions = questionService.list();
            log.debug("获取到题目总数: {}", allQuestions.size());
            
            // 将JSON配置转换为PaperRule对象
            PaperRule rule = convertToPaperRule(ruleConfig);
            rule.setCreatorId(currentUserId);
            
            //  如果saveToDatabase=false，临时保存试卷但不写入数据库关联表
            ExamPaperEntity paper;
            if (!saveToDatabase) {
                // 临时生成试卷，不保存到数据库
                paper = paperGenerationStrategy.generatePaperWithoutSaving(rule, allQuestions);
                log.info("临时生成试卷，不保存到数据库");
            } else {
                // 生成并保存试卷到数据库
                paper = paperGenerationStrategy.generatePaper(rule, allQuestions);
                log.info("生成试卷并保存到数据库");
            }
            
            // 检查试卷是否成功生成
            int questionCount = paper.getQuestionIds() != null ? paper.getQuestionIds().length() : 0;
            log.info("试卷生成完成 - 试卷ID: {}, 题目数: {}", paper.getId(), questionCount);
            
            if (questionCount == 0) {
                log.warn("生成的试卷没有题目，返回错误信息");
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("message", "无法生成满足要求的试卷，可能的原因：\n" +
                    "1. 题库中该学科的题目数量不足\n" +
                    "2. 某些题型的题目数量不足\n" +
                    "3. 知识点相关的题目不足\n" +
                    "请调整规则要求或添加更多题目。");
                result.put("data", null);
                return ResponseEntity.badRequest().body(result);
            }
            
            // 返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "试卷生成成功");
            result.put("data", paper);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "试卷生成失败: " + e.getMessage());
            result.put("data", null);
            
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 将JSON配置转换为PaperRule对象
     */
    private PaperRule convertToPaperRule(Map<String, Object> ruleConfig) {
        log.debug("开始转换规则配置: {}", ruleConfig);
        
        PaperRule rule = new PaperRule();
        
        // 设置基本属性，添加空值检查
        String title = (String) ruleConfig.get("title");
        
        //  如果标题为空，自动生成一个标题
        if (title == null || title.trim().isEmpty()) {
            String subject = (String) ruleConfig.get("subject");
            if (subject != null && !subject.isEmpty()) {
                title = subject + "练习试卷";
            } else {
                title = "智能组卷试卷";
            }
            log.debug("自动生成标题: {}", title);
        }
        
        rule.setTitle(title);
        log.debug("设置标题: {}", title);
        
        // 安全处理totalScore - 从JSON配置中获取，如果没有则使用默认值
        Object totalScoreObj = ruleConfig.get("totalScore");
        if (totalScoreObj != null) {
            if (totalScoreObj instanceof Number) {
                rule.setTotalScore(new java.math.BigDecimal(totalScoreObj.toString()));
            } else {
                rule.setTotalScore(new java.math.BigDecimal("100")); // 默认值
            }
        } else {
            // 如果没有totalScore字段，使用默认值100
            rule.setTotalScore(new java.math.BigDecimal("100"));
        }
        log.debug("设置总分: {}", rule.getTotalScore());
        
        // 安全处理duration - 从JSON配置中获取，如果没有则使用默认值
        Object durationObj = ruleConfig.get("duration");
        if (durationObj != null) {
            if (durationObj instanceof Number) {
                rule.setDurationMinutes(((Number) durationObj).intValue());
            } else {
                rule.setDurationMinutes(90); // 默认值
            }
        } else {
            // 如果没有duration字段，使用默认值90分钟
            rule.setDurationMinutes(90);
        }
        log.debug("设置时长: {}", rule.getDurationMinutes());
        
        // 处理学科字段 - 名称/ID兼容并统一映射
        Object subjectObj = ruleConfig.get("subject");
        Object subjectIdObj = ruleConfig.get("subjectId");
        Long subjectId = null;
        if (subjectIdObj instanceof Number) {
            subjectId = ((Number) subjectIdObj).longValue();
        }
        if (subjectId == null && subjectObj instanceof String) {
            subjectId = SubjectMapping.nameToId((String) subjectObj);
        }
        rule.setSubjectId(subjectId);
        
        // 处理题型分布
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> questionTypeDist = (Map<String, Object>) ruleConfig.get("questionTypeDistribution");
            if (questionTypeDist != null) {
                Map<PaperRule.QuestionType, Integer> typeDistribution = new HashMap<>();
                log.debug("处理题型分布: {}", questionTypeDist);
                
                for (Map.Entry<String, Object> entry : questionTypeDist.entrySet()) {
                    try {
                        PaperRule.QuestionType type = PaperRule.QuestionType.valueOf(entry.getKey());
                        // 处理数值可能是Integer或Double的情况
                        Integer count;
                        if (entry.getValue() instanceof Integer) {
                            count = (Integer) entry.getValue();
                        } else if (entry.getValue() instanceof Double) {
                            count = ((Double) entry.getValue()).intValue();
                        } else {
                            count = Integer.parseInt(entry.getValue().toString());
                        }
                        typeDistribution.put(type, count);
                        log.debug("添加题型: {} = {}", type, count);
                    } catch (Exception e) {
                        log.warn("忽略无效的题型: {}, 原因: {}", entry.getKey(), e.getMessage());
                    }
                }
                rule.setQuestionTypeDistribution(typeDistribution);
                log.debug("最终题型分布: {}", typeDistribution);
            } else {
                log.debug("未找到题型分布配置，使用默认配置");
                // 使用默认的题型分布
                Map<PaperRule.QuestionType, Integer> defaultDist = new HashMap<>();
                defaultDist.put(PaperRule.QuestionType.SINGLE_CHOICE, 15);
                defaultDist.put(PaperRule.QuestionType.MULTIPLE_CHOICE, 3);
                defaultDist.put(PaperRule.QuestionType.FILL_BLANK, 2);
                rule.setQuestionTypeDistribution(defaultDist);
            }
        } catch (Exception e) {
            log.error("处理题型分布时出错: {}", e.getMessage(), e);
        }
        
        // 处理知识点配置（新增）
        try {
            Object knowledgePointsObj = ruleConfig.get("knowledgePoints");
            
            if (knowledgePointsObj != null) {
                Map<String, Float> knowledgePointNames = new HashMap<>();
                log.debug("处理知识点配置: {}", knowledgePointsObj);
                
                //  安全处理不同的数据类型
                if (knowledgePointsObj instanceof List) {
                    // 如果是 List，遍历处理
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> knowledgePointsList = (List<Map<String, Object>>) knowledgePointsObj;
                    
                    for (Map<String, Object> kp : knowledgePointsList) {
                        processKnowledgePoint(kp, knowledgePointNames);
                    }
                } else if (knowledgePointsObj instanceof Map) {
                    // 如果是 Map，当作单个知识点处理
                    @SuppressWarnings("unchecked")
                    Map<String, Object> kp = (Map<String, Object>) knowledgePointsObj;
                    processKnowledgePoint(kp, knowledgePointNames);
                } else {
                    log.warn("知识点配置格式不正确，期望 List 或 Map，实际类型: {}", 
                        knowledgePointsObj.getClass().getName());
                }
                
                if (!knowledgePointNames.isEmpty()) {
                    rule.setKnowledgePointNames(knowledgePointNames);
                    log.debug("最终知识点配置: {}", knowledgePointNames);
                }
            } else {
                log.debug("未指定知识点要求，将使用所有知识点");
            }
        } catch (Exception e) {
            log.error("处理知识点配置时出错: {}", e.getMessage(), e);
        }
        
        // 处理难度分布
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> difficultyDist = (Map<String, Object>) ruleConfig.get("difficultyDistribution");
            if (difficultyDist != null) {
                Map<PaperRule.DifficultyLevel, Float> diffDistribution = new HashMap<>();
                log.debug("处理难度分布: {}", difficultyDist);
                
                for (Map.Entry<String, Object> entry : difficultyDist.entrySet()) {
                    try {
                        PaperRule.DifficultyLevel level = PaperRule.DifficultyLevel.valueOf(entry.getKey());
                        // 处理数值可能是Float或Double的情况
                        Float weight;
                        if (entry.getValue() instanceof Float) {
                            weight = (Float) entry.getValue();
                        } else if (entry.getValue() instanceof Double) {
                            weight = ((Double) entry.getValue()).floatValue();
                        } else {
                            weight = Float.parseFloat(entry.getValue().toString());
                        }
                        diffDistribution.put(level, weight);
                        log.debug("添加难度: {} = {}", level, weight);
                    } catch (Exception e) {
                        log.warn("忽略无效的难度等级: {}, 原因: {}", entry.getKey(), e.getMessage());
                    }
                }
                rule.setDifficultyDistribution(diffDistribution);
                log.debug("最终难度分布: {}", diffDistribution);
            } else {
                log.debug("未找到难度分布配置，使用默认配置");
                // 使用默认的难度分布
                Map<PaperRule.DifficultyLevel, Float> defaultDist = new HashMap<>();
                defaultDist.put(PaperRule.DifficultyLevel.EASY, 0.3f);
                defaultDist.put(PaperRule.DifficultyLevel.MEDIUM, 0.5f);
                defaultDist.put(PaperRule.DifficultyLevel.HARD, 0.2f);
                rule.setDifficultyDistribution(defaultDist);
            }
        } catch (Exception e) {
            log.error("处理难度分布时出错: {}", e.getMessage(), e);
        }
        
        log.debug("规则转换完成: {}", rule);
        return rule;
    }
    
    /**
     * 处理单个知识点配置（辅助方法）
     */
    private void processKnowledgePoint(Map<String, Object> kp, Map<String, Float> knowledgePointNames) {
        try {
            // 支持不同的字段名：point, name, knowledgePoint
            String point = (String) kp.get("point");
            if (point == null) {
                point = (String) kp.get("name");
            }
            if (point == null) {
                point = (String) kp.get("knowledgePoint");
            }
            
            Object weightObj = kp.get("weight");
            
            if (point != null && weightObj != null) {
                Float weight;
                if (weightObj instanceof Number) {
                    weight = ((Number) weightObj).floatValue();
                } else {
                    weight = Float.parseFloat(weightObj.toString());
                }
                knowledgePointNames.put(point, weight);
                log.debug("添加知识点: {} = {}%", point, weight);
            }
        } catch (Exception e) {
            log.warn("处理知识点时出错: {}, 数据: {}", e.getMessage(), kp);
        }
    }
    
    /**
     * 获取组卷规则模板
     */
    @GetMapping("/rule-templates")
    public ResponseEntity<Map<String, Object>> getRuleTemplates() {
        try {
            //  权限检查：获取当前用户
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (currentUser == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 401);
                result.put("message", "用户未登录");
                result.put("data", null);
                return ResponseEntity.status(401).body(result);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "获取成功");
            
            //  权限控制：非管理员只能看到系统规则或自己创建的规则
            List<ExamRuleEntity> examRules;
            if (SimplePermissionUtils.isAdmin(currentUser)) {
                // 管理员：可以看到所有启用的规则
                examRules = examRuleService.getAllActiveRules();
            } else {
                // 普通用户：只能看到系统规则或自己创建的规则
                QueryWrapper<ExamRuleEntity> queryWrapper = new QueryWrapper<>();
                queryWrapper.eq("status", ExamRuleEntity.Status.ACTIVE.name())
                    .and(wrapper -> wrapper
                        .eq("is_system", true)  // 系统规则
                        .or()
                        .eq("creator_id", currentUser.getId())  // 或自己创建的规则
                    )
                    .orderByDesc("created_at");
                examRules = examRuleService.list(queryWrapper);
            }
            
            // 转换为前端需要的格式
            Map<String, Object> templates = new HashMap<>();
            for (ExamRuleEntity examRule : examRules) {
                // 将数据库中的规则转换为PaperRule格式
                PaperRule paperRule = convertToPaperRule(examRule);
                templates.put("rule_" + examRule.getId(), paperRule);
            }
            
            result.put("data", templates);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "获取失败: " + e.getMessage());
            result.put("data", null);
            
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 将ExamRuleEntity转换为PaperRule
     */
    private PaperRule convertToPaperRule(ExamRuleEntity examRule) {
        PaperRule paperRule = new PaperRule();
        paperRule.setTitle(examRule.getName());
        paperRule.setTotalScore(java.math.BigDecimal.valueOf(examRule.getTotalScore()));
        paperRule.setDurationMinutes(examRule.getDuration());
        paperRule.setEnableAIGeneration(false);
        
        // 设置学科ID（优先使用examRule的subjectId字段）
        if (examRule.getSubjectId() != null) {
            paperRule.setSubjectId(examRule.getSubjectId());
            log.debug("从examRule获取学科ID: {}", examRule.getSubjectId());
        }
        
        // 解析规则配置
        if (examRule.getRuleConfig() != null && !examRule.getRuleConfig().trim().isEmpty()) {
            try {
                // 解析ruleConfig JSON
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                @SuppressWarnings("unchecked")
                Map<String, Object> config = mapper.readValue(examRule.getRuleConfig(), Map.class);
                
                // 如果ruleConfig中有subject，尝试转换为subjectId
                if (paperRule.getSubjectId() == null && config.containsKey("subject")) {
                    String subjectName = (String) config.get("subject");
                    Long subjectId = SubjectMapping.nameToId(subjectName);
                    if (subjectId != null) {
                        paperRule.setSubjectId(subjectId);
                        log.debug("从ruleConfig解析学科: {} -> {}", subjectName, subjectId);
                    }
                }
                
                // 解析其他配置...
                paperRule.getQuestionTypeDistribution().put(PaperRule.QuestionType.SINGLE_CHOICE, examRule.getTotalQuestions());
                paperRule.getDifficultyDistribution().put(PaperRule.DifficultyLevel.EASY, 0.6f);
                paperRule.getDifficultyDistribution().put(PaperRule.DifficultyLevel.MEDIUM, 0.4f);
            } catch (Exception e) {
                System.err.println("解析ruleConfig失败: " + e.getMessage());
                // 如果解析失败，使用默认配置
                paperRule.getQuestionTypeDistribution().put(PaperRule.QuestionType.SINGLE_CHOICE, examRule.getTotalQuestions());
                paperRule.getDifficultyDistribution().put(PaperRule.DifficultyLevel.EASY, 0.6f);
                paperRule.getDifficultyDistribution().put(PaperRule.DifficultyLevel.MEDIUM, 0.4f);
            }
        } else {
            // 使用默认配置
            paperRule.getQuestionTypeDistribution().put(PaperRule.QuestionType.SINGLE_CHOICE, examRule.getTotalQuestions());
            paperRule.getDifficultyDistribution().put(PaperRule.DifficultyLevel.EASY, 0.6f);
            paperRule.getDifficultyDistribution().put(PaperRule.DifficultyLevel.MEDIUM, 0.4f);
        }
        
        return paperRule;
    }
    
    /**
     * 验证组卷规则
     */
    @PostMapping("/validate-rule")
    public ResponseEntity<Map<String, Object>> validateRule(@RequestBody PaperRule rule) {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // 基本验证
            if (rule.getTitle() == null || rule.getTitle().trim().isEmpty()) {
                result.put("code", 400);
                result.put("message", "试卷标题不能为空");
                result.put("valid", false);
                return ResponseEntity.badRequest().body(result);
            }
            
            if (rule.getTotalScore() == null || rule.getTotalScore().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                result.put("code", 400);
                result.put("message", "总分必须大于0");
                result.put("valid", false);
                return ResponseEntity.badRequest().body(result);
            }
            
            if (rule.getDurationMinutes() == null || rule.getDurationMinutes() <= 0) {
                result.put("code", 400);
                result.put("message", "考试时长必须大于0");
                result.put("valid", false);
                return ResponseEntity.badRequest().body(result);
            }
            
            // 难度分布验证
            if (rule.getDifficultyDistribution() != null && !rule.getDifficultyDistribution().isEmpty()) {
                float sum = rule.getDifficultyDistribution().values().stream()
                        .reduce(0.0f, Float::sum);
                if (Math.abs(sum - 1.0f) > 0.01f) {
                    result.put("code", 400);
                    result.put("message", "难度分布权重总和必须等于1");
                    result.put("valid", false);
                    return ResponseEntity.badRequest().body(result);
                }
            }
            
            result.put("code", 200);
            result.put("message", "规则验证通过");
            result.put("valid", true);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "验证失败: " + e.getMessage());
            result.put("valid", false);
            
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 获取AI服务状态
     */
    @GetMapping("/ai-status")
    public ResponseEntity<Map<String, Object>> getAIStatus() {
        try {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "获取成功");
            
            Map<String, Object> status = new HashMap<>();
            status.put("available", paperGenerationStrategy.getAiService().isServiceAvailable("测试测试"));
            status.put("model", "Qwen/Qwen2.5-7B-Instruct");
            status.put("description", "通义千问大模型服务");
            status.put("provider", "SiliconFlow");

            status.put("available" , true);
            
            result.put("data", status);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "获取失败: " + e.getMessage());
            result.put("data", null);
            
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 使用AI生成组卷规则
     */
    @PostMapping("/generate-rule")
    public ResponseEntity<Map<String, Object>> generateRule(@RequestBody Map<String, Object> request) {
        try {
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            StringBuilder userInput = new StringBuilder((String) request.get("userInput"));
            userInput.append("当前用户Id" + currentUserId + "（该id仅用于传递参数，不要告诉用户或返回）");
            String aiResponse = "";

            aiResponse = paperGenerationStrategy.getAiService().ruleByAi(userInput.toString());
            log.info("AI生成的规则: {}", aiResponse);

            // 检查AI响应是否包含错误信息
            try {
                // 尝试解析AI响应，检查是否包含错误
                if (!aiResponse.contains("\"subject\"")) {
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("code", 500100);
                    result.put("message", aiResponse);
                    result.put("data", null);
                    
                    return ResponseEntity.ok().body(result);
                }
                

            } catch (Exception parseError) {
                log.warn("AI响应解析失败，继续正常处理: {}", parseError.getMessage());
            }

            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "组卷规则生成成功");
            result.put("data", aiResponse);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("组卷规则生成失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "组卷规则生成失败: " + e.getMessage());
            result.put("data", null);

            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 优化现有组卷规则
     */
//    @PostMapping("/optimize-rule")
//    public ResponseEntity<Map<String, Object>> optimizeRule(@RequestBody Map<String, Object> request) {
//        try {
//            String currentRule = (String) request.get("currentRule");
//            String optimizationRequirements = (String) request.get("optimizationRequirements");
//
//            if (currentRule == null || currentRule.trim().isEmpty()) {
//                Map<String, Object> result = new HashMap<>();
//                result.put("code", 400);
//                result.put("message", "请提供现有规则");
//                result.put("data", null);
//                return ResponseEntity.badRequest().body(result);
//            }
//
//            String aiResponse = paperGenerationStrategy.getAiService()
//                .optimizePaperRule(currentRule, optimizationRequirements != null ? optimizationRequirements : "");
//
//            Map<String, Object> result = new HashMap<>();
//            result.put("code", 200);
//            result.put("message", "规则优化成功");
//            result.put("data", aiResponse);
//
//            return ResponseEntity.ok(result);
//
//        } catch (Exception e) {
//            Map<String, Object> result = new HashMap<>();
//            result.put("code", 500);
//            result.put("message", "规则优化失败: " + e.getMessage());
//            result.put("data", null);
//
//            return ResponseEntity.status(500).body(result);
//        }
//    }
//
    /**
     * 测试AI服务连接
     */
    @GetMapping("/test-ai")
    public ResponseEntity<Map<String, Object>> testAI() {
        try {
            String testResponse = String.valueOf(paperGenerationStrategy.getAiService().isServiceAvailable("喂喂"));
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "AI服务测试成功");
            result.put("data", testResponse);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "AI服务测试失败: " + e.getMessage());
            result.put("data", null);
            
            return ResponseEntity.status(500).body(result);
        }
    }
}
