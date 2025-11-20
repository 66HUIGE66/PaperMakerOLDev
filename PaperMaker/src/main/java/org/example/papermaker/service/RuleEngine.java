package org.example.papermaker.service;

import org.example.papermaker.entity.PaperRule;
import org.example.papermaker.entity.QuestionEntity;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 规则引擎
 * 负责解析和校验组卷规则
 * 
 * @author System
 * @since 1.0.0
 */
@Service
public class RuleEngine {
    
    private static final Logger log = LoggerFactory.getLogger(RuleEngine.class);
    
    /**
     * 校验规则的有效性并应用默认配置
     */
    public RuleValidationResult validateRule(PaperRule rule) {
        RuleValidationResult result = new RuleValidationResult();
        
        // 基本字段验证
        if (rule.getTitle() == null || rule.getTitle().trim().isEmpty()) {
            result.addError("试卷标题不能为空");
        }
        
        if (rule.getTotalScore() == null || rule.getTotalScore().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            result.addError("总分必须大于0");
        }
        
        if (rule.getDurationMinutes() == null || rule.getDurationMinutes() <= 0) {
            result.addError("考试时长必须大于0");
        }
        
        // 题型分布验证和默认配置
        if (rule.getQuestionTypeDistribution() == null || rule.getQuestionTypeDistribution().isEmpty()) {
            // 应用默认的3:2:1比例
            int totalQuestions = rule.getTotalQuestionCount() > 0 ? rule.getTotalQuestionCount() : 20;
            Map<PaperRule.QuestionType, Integer> defaultDist = new HashMap<>();
            
            // 计算每种题型的数量
            int choiceCount = (int) (totalQuestions * 0.5); // 50% 选择题
            int fillCount = (int) (totalQuestions * 0.33); // 33% 填空题
            int shortCount = totalQuestions - choiceCount - fillCount; // 剩余简答题
            
            defaultDist.put(PaperRule.QuestionType.SINGLE_CHOICE, choiceCount);
            defaultDist.put(PaperRule.QuestionType.FILL_BLANK, fillCount);
            defaultDist.put(PaperRule.QuestionType.SHORT_ANSWER, shortCount);
            
            rule.setQuestionTypeDistribution(defaultDist);
            log.debug("应用默认题型分布: {}", defaultDist);
        } else {
            int totalQuestions = rule.getTotalQuestionCount();
            if (totalQuestions <= 0) {
                result.addError("总题目数必须大于0");
            }
        }
        
        // 难度分布验证和默认配置
        if (rule.getDifficultyDistribution() == null || rule.getDifficultyDistribution().isEmpty()) {
            // 应用默认的难度分布
            Map<PaperRule.DifficultyLevel, Float> defaultDist = new HashMap<>();
            defaultDist.put(PaperRule.DifficultyLevel.EASY, 0.3f);
            defaultDist.put(PaperRule.DifficultyLevel.MEDIUM, 0.5f);
            defaultDist.put(PaperRule.DifficultyLevel.HARD, 0.2f);
            rule.setDifficultyDistribution(defaultDist);
            log.debug("应用默认难度分布: {}", defaultDist);
        } else {
            float sum = rule.getDifficultyDistribution().values().stream()
                    .reduce(0.0f, Float::sum);
            if (Math.abs(sum - 1.0f) > 0.01f) {
                result.addError("难度分布权重总和必须等于1");
            }
        }
        
        result.setValid(result.getErrors().isEmpty());
        return result;
    }
    
    /**
     * 根据规则筛选题目（通用方法，支持所有学科）
     */
    public List<QuestionEntity> filterQuestionsByRule(List<QuestionEntity> allQuestions, PaperRule rule) {
        log.info("开始筛选题目 - 题库总题目数: {}", allQuestions.size());
        
        // 第一步：按学科筛选
        List<QuestionEntity> subjectQuestions = allQuestions.stream()
                .filter(question -> matchesSubject(question, rule))
                .collect(Collectors.toList());
        
        log.debug("学科筛选后的题目数量: {}", subjectQuestions.size());
        
        // 第二步：按知识点筛选（如果规则指定了知识点）
        List<QuestionEntity> knowledgePointQuestions = subjectQuestions;
        if (rule.getKnowledgePointNames() != null && !rule.getKnowledgePointNames().isEmpty()) {
            knowledgePointQuestions = subjectQuestions.stream()
                    .filter(question -> matchesKnowledgePoints(question, rule))
                    .collect(Collectors.toList());
            
            log.debug("知识点筛选后的题目数量: {}, 要求的知识点: {}", 
                knowledgePointQuestions.size(), rule.getKnowledgePointNames().keySet());
        }
        
        // 第三步：按题型和难度分组
        Map<String, List<QuestionEntity>> questionGroups = new HashMap<>();
        for (QuestionEntity question : knowledgePointQuestions) {
            String key = getQuestionTypeFromEntity(question.getType()) + "_" + getDifficultyFromEntity(question.getDifficulty());
            questionGroups.computeIfAbsent(key, k -> new ArrayList<>()).add(question);
        }
        
        // 打印分组情况
        log.debug("题目分组情况: {}", 
            questionGroups.entrySet().stream()
                .collect(Collectors.toMap(
                    Map.Entry::getKey, 
                    entry -> entry.getValue().size() + "题")));
        
        // 根据规则要求筛选题目
        List<QuestionEntity> selectedQuestions = new ArrayList<>();
        Map<PaperRule.QuestionType, Integer> typeDistribution = rule.getQuestionTypeDistribution();
        Map<PaperRule.DifficultyLevel, Float> difficultyDistribution = rule.getDifficultyDistribution();
        
        // 计算每种题型和难度的目标数量
        Map<String, Integer> targetCounts = new HashMap<>();
        for (Map.Entry<PaperRule.QuestionType, Integer> typeEntry : typeDistribution.entrySet()) {
            for (Map.Entry<PaperRule.DifficultyLevel, Float> diffEntry : difficultyDistribution.entrySet()) {
                String key = typeEntry.getKey() + "_" + diffEntry.getKey();
                int count = Math.round(typeEntry.getValue() * diffEntry.getValue());
                if (count > 0) {
                    targetCounts.put(key, count);
                }
            }
        }
        
        // 按分组选择题目
        for (Map.Entry<String, Integer> entry : targetCounts.entrySet()) {
            String groupKey = entry.getKey();
            int requiredCount = entry.getValue();
            List<QuestionEntity> availableQuestions = questionGroups.getOrDefault(groupKey, new ArrayList<>());
            
            log.debug("处理分组: {}, 需要题目数: {}, 可用题目数: {}", 
                groupKey, requiredCount, availableQuestions.size());
            
            if (availableQuestions.isEmpty()) {
                log.warn("没有找到{}类型的题目", groupKey);
                continue;
            }
            
            if (availableQuestions.size() < requiredCount) {
                log.warn("{}类型的题目数量不足，需要{}题，实际只有{}题", 
                    groupKey, requiredCount, availableQuestions.size());
                requiredCount = availableQuestions.size();
            }
            
            // 随机选择题目
            Collections.shuffle(availableQuestions);
            List<QuestionEntity> selected = availableQuestions.stream()
                    .limit(requiredCount)
                    .collect(Collectors.toList());
            
            selectedQuestions.addAll(selected);
            log.debug("已选择{}道{}类型的题目", selected.size(), groupKey);
        }
        
        // 如果没有选到任何题目，返回空列表
        if (selectedQuestions.isEmpty()) {
            log.error("未能选择到任何题目");
            return new ArrayList<>();
        }
        
        // 计算总需求题目数
        int totalRequired = typeDistribution.values().stream().mapToInt(Integer::intValue).sum();
        
        // 如果选择的题目数量与要求相差太大，返回空列表
        if (Math.abs(selectedQuestions.size() - totalRequired) > totalRequired * 0.2) { // 允许20%的误差
            log.error("选择的题目数量与要求相差太大，需要{}题，实际选择了{}题", 
                totalRequired, selectedQuestions.size());
            return new ArrayList<>();
        }
        
        // 按题型和难度统计最终结果
        Map<String, Long> resultStats = selectedQuestions.stream()
                .collect(Collectors.groupingBy(
                    q -> getQuestionTypeFromEntity(q.getType()) + "_" + getDifficultyFromEntity(q.getDifficulty()),
                    Collectors.counting()
                ));
        
        log.info("最终选题结果统计: {}, 总题目数: {}", resultStats, selectedQuestions.size());
        return selectedQuestions;
    }
    
    /**
     * 检查题目是否匹配知识点要求（通用方法）
     */
    private boolean matchesKnowledgePoints(QuestionEntity question, PaperRule rule) {
        if (rule.getKnowledgePointNames() == null || rule.getKnowledgePointNames().isEmpty()) {
            return true;  // 没有指定知识点要求，所有题目都通过
        }
        
        // 获取题目的知识点ID列表
        List<Long> questionKnowledgePointIds = question.getKnowledgePointIdsList();
        if (questionKnowledgePointIds == null || questionKnowledgePointIds.isEmpty()) {
            // 题目没有关联知识点，检查题目标题是否包含知识点名称
            String questionTitle = question.getTitle().toLowerCase();
            for (String knowledgePointName : rule.getKnowledgePointNames().keySet()) {
                if (questionTitle.contains(knowledgePointName.toLowerCase())) {
                    return true;
                }
            }
            return false;
        }
        
        // 检查题目的知识点是否在规则要求的知识点中
        // 这里需要将知识点ID转换为名称进行匹配
        // 暂时使用题目标题包含知识点名称的方式
        String questionTitle = question.getTitle().toLowerCase();
        for (String knowledgePointName : rule.getKnowledgePointNames().keySet()) {
            if (questionTitle.contains(knowledgePointName.toLowerCase())) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 检查题目是否匹配学科要求
     */
    private boolean matchesSubject(QuestionEntity question, PaperRule rule) {
        if (rule.getSubjectId() != null) {

            Long subjectId = question.getSubjectId();
            if (subjectId == null || !subjectId.equals(rule.getSubjectId())) {
                return false;
            }
            
            // 检查题目内容是否包含学科相关的关键词
            String content = question.getTitle().toLowerCase();
            // 优先从数据库加载的关键词
            List<String> keywords = SubjectMapping.getKeywords(rule.getSubjectId());
            // 如果数据库没有关键词，使用本地配置
//            if (keywords.isEmpty()) {
//                keywords = getSubjectKeywords(ruleSubject);
//            }
            
            boolean hasKeyword = keywords.isEmpty() || keywords.stream().anyMatch(content::contains);
            
            if (!hasKeyword) {
                log.debug("题目不包含学科关键词: {}", question.getTitle());
                return false;
            }
        }
        return true;
    }
    
    /**
     * 获取学科相关的关键词
     */
    private List<String> getSubjectKeywords(String subject) {
        if (subject == null) return Collections.emptyList();
        switch (subject.toLowerCase()) {
            case "物理":
                return Arrays.asList("力", "热", "光", "电", "磁", "能量", "速度", "加速度", "质量", "电流", "电压", "电阻", "功率");
            case "数学":
                return Arrays.asList("函数", "方程", "数列", "几何", "概率", "统计", "导数", "积分", "三角", "向量");
            case "化学":
                return Arrays.asList("原子", "分子", "元素", "化合物", "酸", "碱", "氧化", "还原", "浓度", "溶液");
            case "生物":
                return Arrays.asList("细胞", "基因", "遗传", "进化", "生态", "酶", "光合", "呼吸", "代谢", "激素");
            case "计算机科学":
            case "计算机":
            case "cs":
            case "computer":
                return Arrays.asList(
                        "计算机", "操作系统", "网络", "数据库", "数据结构", "算法",
                        "编译", "内存", "CPU", "线程", "进程", "TCP", "HTTP", "Linux");
            case "java编程":
            case "java":
                return Arrays.asList("Java", "JVM", "集合", "泛型", "并发", "Spring", "JDBC", "JPA", "注解");
            case "python编程":
            case "python":
                return Arrays.asList("Python", "列表", "字典", "迭代器", "生成器", "装饰器", "Pandas", "NumPy");
            case "javascript编程":
            case "javascript":
            case "js":
                return Arrays.asList("JavaScript", "DOM", "事件", "ES6", "Promise", "异步", "原型", "闭包");
            default:
                return Arrays.asList(subject.toLowerCase());
        }
    }
    
    /**
     * 检查题目是否匹配规则
     */
    private boolean matchesRule(QuestionEntity question, PaperRule rule) {
        // 检查题型
        if (rule.getQuestionTypeDistribution() != null && !rule.getQuestionTypeDistribution().isEmpty()) {
            PaperRule.QuestionType requiredType = getQuestionTypeFromEntity(question.getType());
            if (!rule.getQuestionTypeDistribution().containsKey(requiredType)) {
                return false;
            }
        }
        
        // 检查难度
        if (rule.getDifficultyDistribution() != null && !rule.getDifficultyDistribution().isEmpty()) {
            PaperRule.DifficultyLevel requiredDifficulty = getDifficultyFromEntity(question.getDifficulty());
            if (!rule.getDifficultyDistribution().containsKey(requiredDifficulty)) {
                return false;
            }
        }
        
        // 检查学科
        if (rule.getSubjectId() != null) {
            // 根据学科ID映射到学科名称进行比较
            String ruleSubject = SubjectMapping.idToName(rule.getSubjectId());
            String qSubjectName = SubjectMapping.idToName(question.getSubjectId());
            if (ruleSubject != null && qSubjectName != null && !ruleSubject.equals(qSubjectName)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 根据学科ID获取学科名称
     */
    // 统一改为使用 SubjectMapping
    
    /**
     * 从QuestionEntity的QuestionType转换为PaperRule的QuestionType
     */
    private PaperRule.QuestionType getQuestionTypeFromEntity(QuestionEntity.QuestionType entityType) {
        if (entityType == null) return PaperRule.QuestionType.SINGLE_CHOICE;
        
        switch (entityType) {
            case SINGLE_CHOICE:
                return PaperRule.QuestionType.SINGLE_CHOICE;
            case MULTIPLE_CHOICE:
                return PaperRule.QuestionType.MULTIPLE_CHOICE;
            case FILL_BLANK:
                return PaperRule.QuestionType.FILL_BLANK;
            case TRUE_FALSE:
                return PaperRule.QuestionType.TRUE_FALSE;
            case SHORT_ANSWER:
                return PaperRule.QuestionType.SHORT_ANSWER;
            default:
                return PaperRule.QuestionType.SINGLE_CHOICE;
        }
    }
    
    /**
     * 从QuestionEntity的DifficultyLevel转换为PaperRule的DifficultyLevel
     */
    private PaperRule.DifficultyLevel getDifficultyFromEntity(QuestionEntity.DifficultyLevel entityDifficulty) {
        if (entityDifficulty == null) return PaperRule.DifficultyLevel.MEDIUM;
        
        switch (entityDifficulty) {
            case EASY:
                return PaperRule.DifficultyLevel.EASY;
            case MEDIUM:
                return PaperRule.DifficultyLevel.MEDIUM;
            case HARD:
                return PaperRule.DifficultyLevel.HARD;
            default:
                return PaperRule.DifficultyLevel.MEDIUM;
        }
    }
    
    /**
     * 规则验证结果类
     */
    public static class RuleValidationResult {
        private boolean valid = true;
        private List<String> errors = new ArrayList<>();
        
        public boolean isValid() {
            return valid;
        }
        
        public void setValid(boolean valid) {
            this.valid = valid;
        }
        
        public List<String> getErrors() {
            return errors;
        }
        
        public void addError(String error) {
            this.errors.add(error);
        }
        
        public String getErrorMessage() {
            return String.join("; ", errors);
        }
    }
}
