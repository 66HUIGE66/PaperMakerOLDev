package org.example.papermaker.service;

import org.example.papermaker.entity.PaperRule;
import org.example.papermaker.entity.QuestionEntity;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 遗传算法组卷服务
 * 使用遗传算法解决多约束、多目标的组合优化问题
 * 
 * @author System
 * @since 1.0.0
 */
@Service
public class GeneticAlgorithmService {
    
    private static final Logger log = LoggerFactory.getLogger(GeneticAlgorithmService.class);
    
    // 遗传算法参数
    private static final int POPULATION_SIZE = 50;      // 种群大小
    private static final int MAX_GENERATIONS = 200;     // 最大迭代次数
    private static final double CROSSOVER_RATE = 0.8;   // 交叉概率
    private static final double MUTATION_RATE = 0.1;    // 变异概率
    private static final double ELITE_RATE = 0.1;       // 精英保留比例
    
    // 存储筛选后的题目（用于变异操作，避免重复筛选）
    private List<QuestionEntity> filteredQuestions = new ArrayList<>();
    
    /**
     * 个体类（染色体）- 代表一套试卷
     */
    public static class Individual {
        private List<QuestionEntity> questions;  // 试题ID集合
        private double fitness;                   // 适应度
        
        public Individual(List<QuestionEntity> questions) {
            this.questions = new ArrayList<>(questions);
            this.fitness = 0.0;
        }
        
        public List<QuestionEntity> getQuestions() {
            return questions;
        }
        
        public void setQuestions(List<QuestionEntity> questions) {
            this.questions = questions;
        }
        
        public double getFitness() {
            return fitness;
        }
        
        public void setFitness(double fitness) {
            this.fitness = fitness;
        }
        
        public Individual clone() {
            return new Individual(new ArrayList<>(this.questions));
        }
    }
    
    /**
     * 使用遗传算法生成试卷
     */
    public List<QuestionEntity> generatePaperByGA(PaperRule rule, List<QuestionEntity> allQuestions) {
        log.info("开始遗传算法组卷 - 题库总数: {}, 需要题目数: {}", allQuestions.size(), rule.getTotalQuestionCount());
        
        //  筛选题目（按学科和知识点）
        filterQuestions(rule, allQuestions);
        
        // 1. 初始化种群
        List<Individual> population = initializePopulation(rule, filteredQuestions);
        log.debug("初始种群大小: {}", population.size());
        
        // 2. 迭代进化
        Individual bestIndividual = null;
        double bestFitness = 0.0;
        
        for (int generation = 0; generation < MAX_GENERATIONS; generation++) {
            // 计算适应度
            for (Individual individual : population) {
                double fitness = calculateFitness(individual, rule);
                individual.setFitness(fitness);
            }
            
            // 排序（适应度从高到低）
            population.sort((a, b) -> Double.compare(b.getFitness(), a.getFitness()));
            
            // 记录最优个体
            if (population.get(0).getFitness() > bestFitness) {
                bestFitness = population.get(0).getFitness();
                bestIndividual = population.get(0).clone();
                log.debug("第{}代 - 最优适应度: {:.4f}", generation, bestFitness);
            }
            
            // 如果适应度足够高，提前结束
            if (bestFitness >= 0.95) {
                log.info("找到高质量解，提前结束");
                break;
            }
            
            // 3. 选择、交叉、变异生成新种群
            List<Individual> newPopulation = new ArrayList<>();
            
            // 精英保留
            int eliteCount = (int) (POPULATION_SIZE * ELITE_RATE);
            for (int i = 0; i < eliteCount; i++) {
                newPopulation.add(population.get(i).clone());
            }
            
            // 生成新个体
            while (newPopulation.size() < POPULATION_SIZE) {
                // 选择
                Individual parent1 = tournamentSelection(population);
                Individual parent2 = tournamentSelection(population);
                
                // 交叉
                Individual child;
                if (Math.random() < CROSSOVER_RATE) {
                    child = crossover(parent1, parent2, rule);
                } else {
                    child = parent1.clone();
                }
                
                // 变异
                if (Math.random() < MUTATION_RATE) {
                    mutate(child, filteredQuestions, rule);
                }
                
                newPopulation.add(child);
            }
            
            population = newPopulation;
        }
        
        log.info("遗传算法结束 - 最终适应度: {:.4f}, 选中题目数: {}", 
            bestFitness, bestIndividual != null ? bestIndividual.getQuestions().size() : 0);
        
        return bestIndividual != null ? bestIndividual.getQuestions() : new ArrayList<>();
    }
    
    /**
     * 筛选题目（按学科和知识点）
     */
    private void filterQuestions(PaperRule rule, List<QuestionEntity> allQuestions) {
        Long subjectId = rule.getSubjectId();
        
        if (null != subjectId) {
            //  直接使用学科ID筛选
            filteredQuestions = allQuestions.stream()
                    .filter(q -> subjectId.equals(q.getSubjectId()))
                    .collect(Collectors.toList());
            
            // 获取学科名称用于日志
            String subjectName = SubjectMapping.idToName(subjectId);
            log.info("按学科筛选题目 - 学科ID: {}, 学科名称: {}, 筛选后题目数: {}", 
                subjectId, subjectName != null ? subjectName : "未知", filteredQuestions.size());
        } else {
            log.warn("规则未指定学科ID，使用所有题目");
            filteredQuestions = new ArrayList<>(allQuestions);
        }
        
        // 按知识点筛选题目（如果规则指定了知识点）
        if (rule.getKnowledgePointNames() != null && !rule.getKnowledgePointNames().isEmpty()) {
            filteredQuestions = filteredQuestions.stream()
                    .filter(q -> matchesKnowledgePoints(q, rule))
                    .collect(Collectors.toList());
            log.debug("知识点筛选后题目数: {}, 要求的知识点: {}", 
                filteredQuestions.size(), rule.getKnowledgePointNames().keySet());
        }
        
        //  详细诊断：检查每种题型的题目数量
        if (filteredQuestions.size() < rule.getTotalQuestionCount()) {
            log.warn("题库中该学科的题目数量不足，需要 {} 题，但只有 {} 题", 
                rule.getTotalQuestionCount(), filteredQuestions.size());
            
            //  按题型统计实际题目数
            Map<QuestionEntity.QuestionType, Long> actualTypeCount = filteredQuestions.stream()
                .collect(Collectors.groupingBy(
                    q -> q.getType() != null ? q.getType() : QuestionEntity.QuestionType.SINGLE_CHOICE,
                    Collectors.counting()
                ));
            
            log.warn("实际各题型题目数量: {}", actualTypeCount);
            
            //  检查规则要求的题型分布
            if (rule.getQuestionTypeDistribution() != null) {
                log.warn("规则要求的题型分布: {}", rule.getQuestionTypeDistribution());
            }
        }
    }
    
    /**
     *  初始化种群（使用筛选后的题目）
     */
    private List<Individual> initializePopulation(PaperRule rule, List<QuestionEntity> availableQuestions) {
        List<Individual> population = new ArrayList<>();
        
        //  使用筛选后的题目
        if (availableQuestions == null || availableQuestions.isEmpty()) {
            log.warn("可用题目为空，无法初始化种群");
            return population;
        }
        
        // 生成初始种群
        for (int i = 0; i < POPULATION_SIZE; i++) {
            List<QuestionEntity> selectedQuestions = randomSelectQuestions(
                    availableQuestions, rule);
            population.add(new Individual(selectedQuestions));
        }
        
        return population;
    }
    
    /**
     * 随机选择题目（考虑题型分布）
     */
    private List<QuestionEntity> randomSelectQuestions(
            List<QuestionEntity> allQuestions, PaperRule rule) {
        
        List<QuestionEntity> selected = new ArrayList<>();
        Map<PaperRule.QuestionType, Integer> typeDistribution = rule.getQuestionTypeDistribution();
        
        if (typeDistribution == null || typeDistribution.isEmpty()) {
            // 如果没有题型分布，随机选择
            List<QuestionEntity> shuffled = new ArrayList<>(allQuestions);
            Collections.shuffle(shuffled);
            return shuffled.stream()
                    .limit(rule.getTotalQuestionCount())
                    .collect(Collectors.toList());
        }
        
        // 按题型分组
        Map<PaperRule.QuestionType, List<QuestionEntity>> questionsByType = 
                allQuestions.stream()
                        .collect(Collectors.groupingBy(q -> convertQuestionType(q.getType())));
        
        //  按要求选择每种题型的题目
        for (Map.Entry<PaperRule.QuestionType, Integer> entry : typeDistribution.entrySet()) {
            PaperRule.QuestionType type = entry.getKey();
            int requiredCount = entry.getValue();
            
            List<QuestionEntity> typeQuestions = questionsByType.getOrDefault(type, new ArrayList<>());
            
            //  检查题目数量是否足够
            if (typeQuestions.size() < requiredCount) {
                log.debug("题型 {} 可用题目数 {} 少于需求数 {}", type, typeQuestions.size(), requiredCount);
            }
            
            Collections.shuffle(typeQuestions);
            
            int selectedCount = Math.min(requiredCount, typeQuestions.size());
            selected.addAll(typeQuestions.stream()
                    .limit(selectedCount)
                    .collect(Collectors.toList()));
        }
        
        return selected;
    }
    
    /**
     * 计算适应度函数（核心）
     * 评价一套试卷的优劣
     */
    private double calculateFitness(Individual individual, PaperRule rule) {
        List<QuestionEntity> questions = individual.getQuestions();
        
        if (questions.isEmpty()) {
            return 0.0;
        }
        
        double fitness = 0.0;
        double totalWeight = 0.0;
        
        // 1. 题目数量匹配度（权重30%）
        double countWeight = 0.3;
        int expectedCount = rule.getTotalQuestionCount();
        int actualCount = questions.size();
        double countScore = 1.0 - Math.abs(expectedCount - actualCount) / (double) Math.max(expectedCount, 1);
        fitness += countScore * countWeight;
        totalWeight += countWeight;
        
        // 2. 题型分布匹配度（权重30%）
        double typeWeight = 0.3;
        double typeScore = calculateTypeMatchScore(questions, rule);
        fitness += typeScore * typeWeight;
        totalWeight += typeWeight;
        
        // 3. 难度分布匹配度（权重25%）
        double difficultyWeight = 0.25;
        double difficultyScore = calculateDifficultyMatchScore(questions, rule);
        fitness += difficultyScore * difficultyWeight;
        totalWeight += difficultyWeight;
        
        // 4. 学科相关性（权重15%）
        double subjectWeight = 0.15;
        double subjectScore = calculateSubjectRelevanceScore(questions, rule);
        fitness += subjectScore * subjectWeight;
        totalWeight += subjectWeight;
        
        return totalWeight > 0 ? fitness / totalWeight : 0.0;
    }
    
    /**
     * 计算题型分布匹配度
     */
    private double calculateTypeMatchScore(List<QuestionEntity> questions, PaperRule rule) {
        Map<PaperRule.QuestionType, Integer> expectedDist = rule.getQuestionTypeDistribution();
        if (expectedDist == null || expectedDist.isEmpty()) {
            return 1.0;
        }
        
        // 统计实际题型分布
        Map<PaperRule.QuestionType, Long> actualDist = questions.stream()
                .collect(Collectors.groupingBy(
                        q -> convertQuestionType(q.getType()),
                        Collectors.counting()));
        
        double totalDiff = 0.0;
        int totalExpected = 0;
        
        for (Map.Entry<PaperRule.QuestionType, Integer> entry : expectedDist.entrySet()) {
            int expected = entry.getValue();
            long actual = actualDist.getOrDefault(entry.getKey(), 0L);
            totalDiff += Math.abs(expected - actual);
            totalExpected += expected;
        }
        
        return totalExpected > 0 ? 1.0 - (totalDiff / (2.0 * totalExpected)) : 0.0;
    }
    
    /**
     * 计算难度分布匹配度
     */
    private double calculateDifficultyMatchScore(List<QuestionEntity> questions, PaperRule rule) {
        Map<PaperRule.DifficultyLevel, Float> expectedDist = rule.getDifficultyDistribution();
        if (expectedDist == null || expectedDist.isEmpty()) {
            return 1.0;
        }
        
        // 统计实际难度分布
        Map<PaperRule.DifficultyLevel, Long> actualCount = questions.stream()
                .collect(Collectors.groupingBy(
                        q -> convertDifficultyLevel(q.getDifficulty()),
                        Collectors.counting()));
        
        double totalDiff = 0.0;
        int totalQuestions = questions.size();
        
        for (Map.Entry<PaperRule.DifficultyLevel, Float> entry : expectedDist.entrySet()) {
            float expectedRatio = entry.getValue();
            long actualNum = actualCount.getOrDefault(entry.getKey(), 0L);
            float actualRatio = totalQuestions > 0 ? (float) actualNum / totalQuestions : 0.0f;
            totalDiff += Math.abs(expectedRatio - actualRatio);
        }
        
        return 1.0 - (totalDiff / 2.0);
    }
    
    /**
     * 计算学科相关性分数
     */
    private double calculateSubjectRelevanceScore(List<QuestionEntity> questions, PaperRule rule) {
        if (rule.getSubjectId() == null) {
            return 1.0;
        }
        
        String expectedSubject = SubjectMapping.idToName(rule.getSubjectId());
        if (expectedSubject == null) {
            log.warn("学科ID {} 未找到对应的学科名称", rule.getSubjectId());
            return 0.0;
        }
        
        long matchCount = questions.stream()
                .filter(q -> SubjectMapping.idToName(q.getSubjectId()) != null &&
                        expectedSubject.equals(SubjectMapping.idToName(q.getSubjectId())))
                .count();
        
        return questions.size() > 0 ? (double) matchCount / questions.size() : 0.0;
    }
    
    /**
     * 锦标赛选择
     */
    private Individual tournamentSelection(List<Individual> population) {
        int tournamentSize = 3;
        List<Individual> tournament = new ArrayList<>();
        
        for (int i = 0; i < tournamentSize; i++) {
            int randomIndex = (int) (Math.random() * population.size());
            tournament.add(population.get(randomIndex));
        }
        
        tournament.sort((a, b) -> Double.compare(b.getFitness(), a.getFitness()));
        return tournament.get(0);
    }
    
    /**
     * 交叉操作（单点交叉）
     */
    private Individual crossover(Individual parent1, Individual parent2, PaperRule rule) {
        List<QuestionEntity> questions1 = parent1.getQuestions();
        List<QuestionEntity> questions2 = parent2.getQuestions();
        
        if (questions1.isEmpty() || questions2.isEmpty()) {
            return parent1.clone();
        }
        
        int size = Math.min(questions1.size(), questions2.size());
        int crossoverPoint = (int) (Math.random() * size);
        
        List<QuestionEntity> childQuestions = new ArrayList<>();
        
        // 前半部分来自父代1
        childQuestions.addAll(questions1.subList(0, crossoverPoint));
        
        // 后半部分来自父代2（去重）
        Set<Long> existingIds = childQuestions.stream()
                .map(QuestionEntity::getId)
                .collect(Collectors.toSet());
        
        for (int i = crossoverPoint; i < questions2.size(); i++) {
            QuestionEntity q = questions2.get(i);
            if (!existingIds.contains(q.getId())) {
                childQuestions.add(q);
                existingIds.add(q.getId());
            }
        }
        
        // 如果题目不够，从父代1补充
        for (int i = crossoverPoint; i < questions1.size() && childQuestions.size() < rule.getTotalQuestionCount(); i++) {
            QuestionEntity q = questions1.get(i);
            if (!existingIds.contains(q.getId())) {
                childQuestions.add(q);
                existingIds.add(q.getId());
            }
        }
        
        return new Individual(childQuestions);
    }
    
    /**
     * 变异操作
     */
    private void mutate(Individual individual, List<QuestionEntity> allQuestions, PaperRule rule) {
        List<QuestionEntity> questions = individual.getQuestions();
        
        if (questions.isEmpty() || allQuestions.isEmpty()) {
            return;
        }
        
        // 随机替换一道题
        int mutateIndex = (int) (Math.random() * questions.size());
        
        // 获取当前题目的类型
        QuestionEntity currentQuestion = questions.get(mutateIndex);
        PaperRule.QuestionType targetType = convertQuestionType(currentQuestion.getType());
        
        // 从题库中选择相同类型的其他题目（allQuestions 已经过学科筛选）
        List<QuestionEntity> candidates = allQuestions.stream()
                .filter(q -> convertQuestionType(q.getType()) == targetType)
                .filter(q -> !questions.contains(q))
                .collect(Collectors.toList());
        
        if (!candidates.isEmpty()) {
            int randomIndex = (int) (Math.random() * candidates.size());
            questions.set(mutateIndex, candidates.get(randomIndex));
        }
    }
    
    /**
     * 检查题目是否匹配知识点要求
     */
    private boolean matchesKnowledgePoints(QuestionEntity question, PaperRule rule) {
        if (rule.getKnowledgePointNames() == null || rule.getKnowledgePointNames().isEmpty()) {
            return true;
        }
        
        // 检查题目标题是否包含知识点名称
        String questionTitle = question.getTitle().toLowerCase();
        for (String knowledgePointName : rule.getKnowledgePointNames().keySet()) {
            if (questionTitle.contains(knowledgePointName.toLowerCase())) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 转换题目类型
     */
    private PaperRule.QuestionType convertQuestionType(QuestionEntity.QuestionType entityType) {
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
     * 转换难度级别
     */
    private PaperRule.DifficultyLevel convertDifficultyLevel(QuestionEntity.DifficultyLevel entityDifficulty) {
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
     * 根据学科ID获取学科名称
     */
    // 统一改为使用 SubjectMapping
}

