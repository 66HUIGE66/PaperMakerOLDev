package org.example.papermaker.service;

import org.example.papermaker.entity.PaperRule;
import org.example.papermaker.entity.QuestionEntity;
import org.example.papermaker.entity.ExamPaperEntity;
import org.example.papermaker.service.impl.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 组卷策略控制器
 * 根据规则选择最合适的组卷策略
 * 
 * @author System
 * @since 1.0.0
 */
@Service
public class PaperGenerationStrategy {
    
    private static final Logger log = LoggerFactory.getLogger(PaperGenerationStrategy.class);
    
    @Autowired
    private RuleEngine ruleEngine;

    @Autowired
    private AIService aiService;
    
    @Autowired
    private ExamPaperService examPaperService;
    
    @Autowired
    private GeneticAlgorithmService geneticAlgorithmService;
    
    // 提供公共访问方法
    public AIService getAiService() {
        return aiService;
    }
    
    /**
     * 根据规则生成试卷
     */
    public ExamPaperEntity generatePaper(PaperRule rule, List<QuestionEntity> allQuestions) {
        // 验证规则
        RuleEngine.RuleValidationResult validation = ruleEngine.validateRule(rule);
        if (!validation.isValid()) {
            throw new IllegalArgumentException("规则验证失败: " + validation.getErrorMessage());
        }
        
        // 选择组卷策略
        GenerationStrategy strategy = selectStrategy(rule);
        
        switch (strategy) {
            case SIMPLE_FILTER:
                return generateBySimpleFilter(rule, allQuestions);
//            case AI_ENHANCED:
//                return generateByAIEnhanced(rule, allQuestions);
            case GENETIC_ALGORITHM:
                return generateByGeneticAlgorithm(rule, allQuestions);
            default:
                return generateBySimpleFilter(rule, allQuestions);
        }
    }
    
    /**
     * 生成试卷但不保存到数据库（用于预览）
     */
    public ExamPaperEntity generatePaperWithoutSaving(PaperRule rule, List<QuestionEntity> allQuestions) {
        // 验证规则
        RuleEngine.RuleValidationResult validation = ruleEngine.validateRule(rule);
        if (!validation.isValid()) {
            throw new IllegalArgumentException("规则验证失败: " + validation.getErrorMessage());
        }
        
        // 选择组卷策略并生成题目
        GenerationStrategy strategy = selectStrategy(rule);
        List<QuestionEntity> selectedQuestions = null;
        
        switch (strategy) {
            case SIMPLE_FILTER:
                selectedQuestions = ruleEngine.filterQuestionsByRule(allQuestions, rule);
                Collections.shuffle(selectedQuestions);
                int totalQuestions = rule.getTotalQuestionCount();
                if (selectedQuestions.size() > totalQuestions) {
                    selectedQuestions = selectedQuestions.subList(0, totalQuestions);
                }
                break;
            case GENETIC_ALGORITHM:
                selectedQuestions = geneticAlgorithmService.generatePaperByGA(rule, allQuestions);
                if (selectedQuestions.isEmpty()) {
                    // 降级到简单筛选
                    selectedQuestions = ruleEngine.filterQuestionsByRule(allQuestions, rule);
                    Collections.shuffle(selectedQuestions);
                    int count = rule.getTotalQuestionCount();
                    if (selectedQuestions.size() > count) {
                        selectedQuestions = selectedQuestions.subList(0, count);
                    }
                }
                break;
            default:
                selectedQuestions = ruleEngine.filterQuestionsByRule(allQuestions, rule);
                Collections.shuffle(selectedQuestions);
                int total = rule.getTotalQuestionCount();
                if (selectedQuestions.size() > total) {
                    selectedQuestions = selectedQuestions.subList(0, total);
                }
                break;
        }
        
        // 检查题目列表是否为空
        if (selectedQuestions == null || selectedQuestions.isEmpty()) {
            log.warn("题目列表为空，无法创建试卷");
            throw new IllegalArgumentException("题目列表为空，无法创建试卷");
        }
        
        // 创建试卷对象但不保存到数据库
        return createPaperWithoutSaving(rule, selectedQuestions);
    }
    
    /**
     * 选择组卷策略
     */
    private GenerationStrategy selectStrategy(PaperRule rule) {
//        // 如果启用AI生成，优先使用AI增强策略
//        if (rule.getEnableAIGeneration() != null && rule.getEnableAIGeneration() && aiService.isServiceAvailable()) {
//            return GenerationStrategy.AI_ENHANCED;
//        }
        
        // 如果规则复杂（涉及多个约束），使用遗传算法
        if (isComplexRule(rule)) {
            return GenerationStrategy.GENETIC_ALGORITHM;
        }
        
        // 默认使用简单筛选
        return GenerationStrategy.SIMPLE_FILTER;
    }
    
    /**
     * 判断是否为复杂规则
     * 默认使用遗传算法以获得更优的组卷效果
     */
    private boolean isComplexRule(PaperRule rule) {
        // 始终返回true，优先使用遗传算法
        // 遗传算法能够处理多约束、多目标的组合优化问题，效果更好
        return true;
    }
    
    /**
     * 策略一：简单筛选
     */
    private ExamPaperEntity generateBySimpleFilter(PaperRule rule, List<QuestionEntity> allQuestions) {
        // 根据规则筛选题目
        List<QuestionEntity> filteredQuestions = ruleEngine.filterQuestionsByRule(allQuestions, rule);
        
        // 随机选择题目
        Collections.shuffle(filteredQuestions);
        int totalNeeded = rule.getTotalQuestionCount();
        List<QuestionEntity> selectedQuestions = filteredQuestions.stream()
                .limit(totalNeeded)
                .collect(Collectors.toList());
        
        // 创建试卷
        return createExamPaper(rule, selectedQuestions);
    }
    
    /**
     * 策略二：AI增强生成
     */
//    private ExamPaperEntity generateByAIEnhanced(PaperRule rule, List<QuestionEntity> allQuestions) {
//        List<QuestionEntity> selectedQuestions = new ArrayList<>();
//
//        // 先从现有题库中筛选
//        List<QuestionEntity> filteredQuestions = ruleEngine.filterQuestionsByRule(allQuestions, rule);
//        Collections.shuffle(filteredQuestions);
//
//        int totalNeeded = rule.getTotalQuestionCount();
//        int existingCount = Math.min(filteredQuestions.size(), totalNeeded);
//
//        // 添加现有题目
//        selectedQuestions.addAll(filteredQuestions.stream()
//                .limit(existingCount)
//                .collect(Collectors.toList()));
//
//        // 如果题目不够，使用AI生成
//        if (selectedQuestions.size() < totalNeeded) {
//            int needGenerate = totalNeeded - selectedQuestions.size();
//            List<QuestionEntity> aiQuestions = generateQuestionsByAI(rule, needGenerate);
//            selectedQuestions.addAll(aiQuestions);
//        }
//
//        return createExamPaper(rule, selectedQuestions);
//    }
    
    /**
     *  策略三：遗传算法优化（改进降级逻辑）
     */
    private ExamPaperEntity generateByGeneticAlgorithm(PaperRule rule, List<QuestionEntity> allQuestions) {
        log.info("使用遗传算法生成试卷");
        
        // 使用遗传算法选择最优题目组合
        List<QuestionEntity> selectedQuestions = geneticAlgorithmService.generatePaperByGA(rule, allQuestions);
        
        if (selectedQuestions.isEmpty()) {
            log.warn("遗传算法未找到合适解，降级到简单筛选");
            //  尝试简单筛选
            List<QuestionEntity> fallbackQuestions = ruleEngine.filterQuestionsByRule(allQuestions, rule);
            Collections.shuffle(fallbackQuestions);
            int totalNeeded = rule.getTotalQuestionCount();
            List<QuestionEntity> selectedFromFallback = fallbackQuestions.stream()
                    .limit(totalNeeded)
                    .collect(Collectors.toList());
            
            //  如果降级后仍然没有足够的题目，抛出异常而不是返回空试卷
            if (selectedFromFallback.isEmpty()) {
                log.error("遗传算法和简单筛选都无法找到合适解，无法生成试卷");
                throw new IllegalArgumentException("无法生成满足要求的试卷：题库中题目数量不足");
            }
            
            return createExamPaper(rule, selectedFromFallback);
        }
        
        // 创建试卷
        return createExamPaper(rule, selectedQuestions);
    }
    
    /**
     * 使用AI生成题目
     */
//    private List<QuestionEntity> generateQuestionsByAI(PaperRule rule, int count) {
//        List<QuestionEntity> aiQuestions = new ArrayList<>();
//
//        for (int i = 0; i < count; i++) {
//            try {
//                // 构造AI提示词
//                String prompt = buildAIPrompt(rule);
//                String aiResponse = aiService.generateQuestion(prompt);
//
//                // 解析AI响应并创建题目实体
//                QuestionEntity question = parseAIResponse(aiResponse);
//                if (question != null) {
//                    aiQuestions.add(question);
//                }
//            } catch (Exception e) {
//                System.err.println("AI生成题目失败: " + e.getMessage());
//            }
//        }
//
//        return aiQuestions;
//    }
    
    /**
     * 构造AI提示词
     */
//    private String buildAIPrompt(PaperRule rule) {
//        // 构造生成题目的提示词
//        String prompt = String.format(
//            "请根据以下试卷要求生成题目：\n" +
//            "试卷标题：%s\n" +
//            "总分：%d分\n" +
//            "考试时长：%d分钟\n" +
//            "特殊要求：%s\n" +
//            "请生成一道符合要求的题目，包括题目内容、选项（如果是选择题）、正确答案和详细解析。\n" +
//            "题目要贴近实际应用场景，难度适中，内容准确。",
//            rule.getTitle(),
//            rule.getTotalScore().intValue(),
//            rule.getDurationMinutes(),
//            rule.getAiPrompt() != null ? rule.getAiPrompt() : "生成符合要求的题目"
//        );
//        return aiService.generateQuestion(prompt);
//    }
    
    /**
     * 解析AI响应
     */
//    private QuestionEntity parseAIResponse(String aiResponse) {
//        try {
//            QuestionEntity question = new QuestionEntity();
//            question.setTitle("AI生成题目: " + aiResponse.substring(0, Math.min(50, aiResponse.length())));
//            question.setType(QuestionEntity.QuestionType.SINGLE_CHOICE);
//            question.setDifficulty(QuestionEntity.DifficultyLevel.MEDIUM);
//            question.setCorrectAnswer("A");
//            question.setExplanation("AI生成的题目解析");
//            question.setSubject("AI生成");
//            question.setIsSystem(false);
//            question.setCreatorId(1L);
//
//            return question;
//        } catch (Exception e) {
//            System.err.println("解析AI响应失败: " + e.getMessage());
//            return null;
//        }
//    }
//
    /**
     * 创建试卷实体但不保存到数据库
     */
    private ExamPaperEntity createPaperWithoutSaving(PaperRule rule, List<QuestionEntity> questions) {
        //  检查题目列表是否为空
        if (questions == null || questions.isEmpty()) {
            log.warn("题目列表为空，无法创建试卷");
            throw new IllegalArgumentException("题目列表为空，无法创建试卷");
        }
        
        ExamPaperEntity paper = new ExamPaperEntity();
        paper.setTitle(rule.getTitle());
        paper.setDescription("根据规则自动生成的试卷");
        paper.setTotalScore(rule.getTotalScore().intValue());
        paper.setDuration(rule.getDurationMinutes());
        paper.setSubjectId(rule.getSubjectId() != null ? rule.getSubjectId().toString() : "综合");
        paper.setIsSystem(false);
        paper.setCreatorId(rule.getCreatorId() != null ? rule.getCreatorId() : 1L);
        
        // 注意：PaperRule的id字段需要显式调用getter
        try {
            Long ruleId = rule.getId();
            if (ruleId != null) {
                paper.setRuleId(ruleId);
            }
        } catch (Exception e) {
            // 如果getter方法不存在，跳过设置ruleId
            log.debug("PaperRule没有getId()方法，跳过设置ruleId");
        }
        
        // 构建题目ID列表
        StringBuilder questionIds = new StringBuilder();
        for (int i = 0; i < questions.size(); i++) {
            if (i > 0) {
                questionIds.append(",");
            }
            questionIds.append(questions.get(i).getId());
        }
        paper.setQuestionIds(questionIds.toString());
        
        //  不要调用setQuestionIdsList，因为它会将questionIds转换为JSON数组格式，覆盖我们的逗号分隔格式
        // List<Long> questionIdsList = questions.stream()
        //         .map(QuestionEntity::getId)
        //         .collect(Collectors.toList());
        // paper.setQuestionIdsList(questionIdsList);
        
        // 设置生成类型为自动生成
        paper.setGenerationType("AUTO");
        
        log.info("临时生成试卷 - 标题: {}, 实际题目数量: {}/{}, 总分: {}", 
            paper.getTitle(), questions.size(), rule.getTotalQuestionCount(), paper.getTotalScore());
        
        return paper;
    }
    
    /**
     * 创建试卷实体
     */
    private ExamPaperEntity createExamPaper(PaperRule rule, List<QuestionEntity> questions) {
        //  检查题目列表是否为空
        if (questions == null || questions.isEmpty()) {
            log.warn("题目列表为空，无法创建试卷");
            throw new IllegalArgumentException("题目列表为空，无法创建试卷");
        }
        
        ExamPaperEntity paper = new ExamPaperEntity();
        paper.setTitle(rule.getTitle());
        paper.setDescription("根据规则自动生成的试卷");
        paper.setTotalScore(rule.getTotalScore().intValue());
        paper.setDuration(rule.getDurationMinutes());
        paper.setSubjectId(rule.getSubjectId() != null ? rule.getSubjectId().toString() : "综合");
        paper.setIsSystem(false);
        paper.setCreatorId(rule.getCreatorId() != null ? rule.getCreatorId() : 1L);
        
        //  先计算并添加题目，再保存试卷到数据库
        // 计算每道题的分值
        int totalQuestions = questions.size();
        int totalScore = rule.getTotalScore().intValue();
        int baseScore = totalQuestions > 0 ? totalScore / totalQuestions : 1;
        int remainder = totalQuestions > 0 ? totalScore % totalQuestions : 0;
        
        // 记录实际题目数量（用于调试）
        log.debug("规则要求题目数量: {}, 实际筛选出题目数量: {}, 实际添加到试卷的题目数量: {}", 
            rule.getTotalQuestionCount(), totalQuestions, questions.size());
        
        //  构建题目ID列表（在保存之前）
        StringBuilder questionIds = new StringBuilder();
        for (int i = 0; i < questions.size(); i++) {
            if (i > 0) {
                questionIds.append(",");
            }
            questionIds.append(questions.get(i).getId());
        }
        paper.setQuestionIds(questionIds.toString());
        
        //  保存试卷到数据库（此时题目ID已设置）
        examPaperService.save(paper);
        
        // 将每个题目添加到试卷中
        for (int i = 0; i < questions.size(); i++) {
            QuestionEntity question = questions.get(i);
            // 前remainder道题多分配1分
            int questionScore = baseScore + (i < remainder ? 1 : 0);
            examPaperService.addQuestionToPaper(paper.getId(), question.getId(), questionScore);
        }
        
        //  不要调用setQuestionIdsList，因为它会将questionIds转换为JSON数组格式，覆盖我们的逗号分隔格式
        // List<Long> questionIdsList = questions.stream()
        //         .map(QuestionEntity::getId)
        //         .collect(Collectors.toList());
        // paper.setQuestionIdsList(questionIdsList);
        
        // 设置生成类型为自动生成
        paper.setGenerationType("AUTO");
        
        // 记录最终结果
        log.info("试卷生成完成 - 试卷ID: {}, 标题: {}, 实际题目数量: {}/{}, 总分: {}", 
            paper.getId(), paper.getTitle(), questions.size(), rule.getTotalQuestionCount(), paper.getTotalScore());
        
        return paper;
    }
    
    /**
     * 组卷策略枚举
     */
    public enum GenerationStrategy {
        SIMPLE_FILTER,      // 简单筛选
        AI_ENHANCED,        // AI增强
        GENETIC_ALGORITHM   // 遗传算法
    }
}
