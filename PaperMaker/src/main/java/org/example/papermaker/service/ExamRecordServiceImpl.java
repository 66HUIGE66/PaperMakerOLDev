package org.example.papermaker.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import jakarta.annotation.Resource;
import org.example.papermaker.entity.ExamRecordEntity;
import org.example.papermaker.entity.ExamPaperEntity;
import org.example.papermaker.entity.QuestionEntity;
import org.example.papermaker.entity.AnswerRecordEntity;
import org.example.papermaker.entity.KnowledgePointEntity;
import org.example.papermaker.entity.SubjectEntity;
import org.example.papermaker.mapper.ExamRecordMapper;
import org.example.papermaker.mapper.SubjectMapper;
import org.example.papermaker.service.QuestionService;
import org.example.papermaker.service.KnowledgePointService;
import org.example.papermaker.service.AnswerRecordService;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 考试记录服务实现类
 */
@Service
public class ExamRecordServiceImpl extends ServiceImpl<ExamRecordMapper, ExamRecordEntity> implements ExamRecordService {
    
    private static final Logger log = LoggerFactory.getLogger(ExamRecordServiceImpl.class);
    
    @Resource
    private SubjectService subjectService;
    
    @Resource
    private ExamPaperService examPaperService;
    
    @Resource
    private QuestionService questionService;
    
    @Resource
    private KnowledgePointService knowledgePointService;
    
    @Resource
    private AnswerRecordService answerRecordService;
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public List<ExamRecordEntity> getRecordsByUserId(Long userId) {
        try {
            LambdaQueryWrapper<ExamRecordEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ExamRecordEntity::getUserId, userId)
                   .orderByDesc(ExamRecordEntity::getStartTime);
            return list(wrapper);
        } catch (Exception e) {
            // 如果表不存在，返回空列表
            if (e.getMessage() != null && e.getMessage().contains("Unknown column")) {
                System.out.println("exam_records表不存在或结构不匹配，请先创建表");
                return new ArrayList<>();
            }
            throw e;
        }
    }
    
    @Override
    public List<ExamRecordEntity> getRecordsByUserIdAndStatus(Long userId, ExamRecordEntity.ExamStatus status) {
        LambdaQueryWrapper<ExamRecordEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ExamRecordEntity::getUserId, userId)
               .eq(ExamRecordEntity::getStatus, status)
               .orderByDesc(ExamRecordEntity::getStartTime);
        return list(wrapper);
    }
    
    @Override
    public List<ExamRecordEntity> getRecordsByUserIdAndType(Long userId, ExamRecordEntity.ExamType type) {
        LambdaQueryWrapper<ExamRecordEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ExamRecordEntity::getUserId, userId)
               .eq(ExamRecordEntity::getExamType, type)
               .orderByDesc(ExamRecordEntity::getStartTime);
        return list(wrapper);
    }
    
    @Override
    public Map<String, Object> getStatisticsByUserId(Long userId) {
        List<ExamRecordEntity> records = getRecordsByUserId(userId);
        
        Map<String, Object> statistics = new HashMap<>();
        
        // 总记录数
        statistics.put("totalRecords", records.size());
        
        // 完成记录数
        long completedCount = records.stream()
                .filter(r -> r.getStatus() == ExamRecordEntity.ExamStatus.COMPLETED)
                .count();
        statistics.put("completedRecords", completedCount);
        
        // 平均正确率
        double averageAccuracy = records.stream()
                .filter(r -> r.getAccuracy() != null)
                .mapToDouble(ExamRecordEntity::getAccuracy)
                .average()
                .orElse(0.0);
        statistics.put("averageAccuracy", Math.round(averageAccuracy));
        
        // 总练习时间（秒）
        long totalTime = records.stream()
                .filter(r -> r.getStartTime() != null && r.getEndTime() != null)
                .mapToLong(r -> java.time.Duration.between(r.getStartTime(), r.getEndTime()).getSeconds())
                .sum();
        statistics.put("totalTime", totalTime);
        
        // 练习模式记录数
        long practiceCount = records.stream()
                .filter(r -> r.getExamType() == ExamRecordEntity.ExamType.PRACTICE)
                .count();
        statistics.put("practiceRecords", practiceCount);
        
        // 考试模式记录数
        long examCount = records.stream()
                .filter(r -> r.getExamType() == ExamRecordEntity.ExamType.EXAM)
                .count();
        statistics.put("examRecords", examCount);
        
        return statistics;
    }
    
    @Override
    public Map<String, Object> getOverallStatistics(Long userId) {
        List<ExamRecordEntity> records = getRecordsByUserId(userId);
        
        Map<String, Object> statistics = new HashMap<>();
        
        // 基础统计
        int totalRecords = records.size();
        long completedCount = records.stream()
                .filter(r -> r.getStatus() == ExamRecordEntity.ExamStatus.COMPLETED)
                .count();
        long inProgressCount = records.stream()
                .filter(r -> r.getStatus() == ExamRecordEntity.ExamStatus.IN_PROGRESS)
                .count();
        long timeoutCount = records.stream()
                .filter(r -> r.getStatus() == ExamRecordEntity.ExamStatus.TIMEOUT)
                .count();
        
        // 得分统计
        List<Integer> scores = records.stream()
                .filter(r -> r.getScore() != null && r.getTotalScore() != null && r.getTotalScore() > 0)
                .map(r -> r.getScore())
                .collect(java.util.stream.Collectors.toList());
        
        int totalScore = scores.stream().mapToInt(Integer::intValue).sum();
        int maxScore = scores.isEmpty() ? 0 : scores.stream().mapToInt(Integer::intValue).max().orElse(0);
        int minScore = scores.isEmpty() ? 0 : scores.stream().mapToInt(Integer::intValue).min().orElse(0);
        double avgScore = scores.isEmpty() ? 0.0 : scores.stream().mapToInt(Integer::intValue).average().orElse(0.0);
        
        // 正确率统计
        List<Double> accuracies = records.stream()
                .filter(r -> r.getAccuracy() != null)
                .map(ExamRecordEntity::getAccuracy)
                .collect(java.util.stream.Collectors.toList());
        
        double avgAccuracy = accuracies.isEmpty() ? 0.0 : accuracies.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double maxAccuracy = accuracies.isEmpty() ? 0.0 : accuracies.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
        double minAccuracy = accuracies.isEmpty() ? 0.0 : accuracies.stream().mapToDouble(Double::doubleValue).min().orElse(0.0);
        
        // 时间统计（秒）
        List<Long> timeSpents = records.stream()
                .filter(r -> r.getTimeSpent() != null && r.getTimeSpent() > 0)
                .map(r -> r.getTimeSpent().longValue())
                .collect(java.util.stream.Collectors.toList());
        
        long totalTime = timeSpents.stream().mapToLong(Long::longValue).sum();
        long avgTime = timeSpents.isEmpty() ? 0 : (long) timeSpents.stream().mapToLong(Long::longValue).average().orElse(0.0);
        long maxTime = timeSpents.isEmpty() ? 0 : timeSpents.stream().mapToLong(Long::longValue).max().orElse(0);
        long minTime = timeSpents.isEmpty() ? 0 : timeSpents.stream().mapToLong(Long::longValue).min().orElse(0);
        
        // 答题数量统计
        int totalQuestions = records.stream()
                .filter(r -> r.getTotalQuestions() != null)
                .mapToInt(ExamRecordEntity::getTotalQuestions)
                .sum();
        int totalAnswered = records.stream()
                .filter(r -> r.getAnsweredQuestions() != null)
                .mapToInt(ExamRecordEntity::getAnsweredQuestions)
                .sum();
        int totalCorrect = records.stream()
                .filter(r -> r.getCorrectAnswers() != null)
                .mapToInt(ExamRecordEntity::getCorrectAnswers)
                .sum();
        
        // 练习模式 vs 考试模式
        long practiceCount = records.stream()
                .filter(r -> r.getExamType() == ExamRecordEntity.ExamType.PRACTICE)
                .count();
        long examCount = records.stream()
                .filter(r -> r.getExamType() == ExamRecordEntity.ExamType.EXAM)
                .count();
        
        // 最近练习时间
        LocalDateTime lastPracticeTime = records.stream()
                .filter(r -> r.getStartTime() != null)
                .map(ExamRecordEntity::getStartTime)
                .max(LocalDateTime::compareTo)
                .orElse(null);
        
        // 构建统计结果（结构化数据，适合LLM使用）
        statistics.put("summary", Map.of(
            "totalRecords", totalRecords,
            "completedRecords", completedCount,
            "inProgressRecords", inProgressCount,
            "timeoutRecords", timeoutCount,
            "completionRate", totalRecords > 0 ? String.format("%.2f", (double) completedCount / totalRecords * 100) + "%" : "0%"
        ));
        
        statistics.put("scoreStatistics", Map.of(
            "totalScore", totalScore,
            "averageScore", String.format("%.2f", avgScore),
            "maxScore", maxScore,
            "minScore", minScore,
            "scoreCount", scores.size()
        ));
        
        statistics.put("accuracyStatistics", Map.of(
            "averageAccuracy", String.format("%.2f", avgAccuracy) + "%",
            "maxAccuracy", String.format("%.2f", maxAccuracy) + "%",
            "minAccuracy", String.format("%.2f", minAccuracy) + "%",
            "accuracyCount", accuracies.size()
        ));
        
        statistics.put("timeStatistics", Map.of(
            "totalTimeSeconds", totalTime,
            "totalTimeFormatted", formatTime(totalTime),
            "averageTimeSeconds", avgTime,
            "averageTimeFormatted", formatTime(avgTime),
            "maxTimeSeconds", maxTime,
            "maxTimeFormatted", formatTime(maxTime),
            "minTimeSeconds", minTime,
            "minTimeFormatted", formatTime(minTime)
        ));
        
        statistics.put("questionStatistics", Map.of(
            "totalQuestions", totalQuestions,
            "totalAnswered", totalAnswered,
            "totalCorrect", totalCorrect,
            "answerRate", totalQuestions > 0 ? String.format("%.2f", (double) totalAnswered / totalQuestions * 100) + "%" : "0%",
            "correctRate", totalAnswered > 0 ? String.format("%.2f", (double) totalCorrect / totalAnswered * 100) + "%" : "0%"
        ));
        
        statistics.put("typeStatistics", Map.of(
            "practiceCount", practiceCount,
            "examCount", examCount,
            "practicePercentage", totalRecords > 0 ? String.format("%.2f", (double) practiceCount / totalRecords * 100) + "%" : "0%",
            "examPercentage", totalRecords > 0 ? String.format("%.2f", (double) examCount / totalRecords * 100) + "%" : "0%"
        ));
        
        statistics.put("lastPracticeTime", lastPracticeTime != null ? lastPracticeTime.toString() : "无");
        
        // 添加时间趋势数据（最近7天的练习次数）
        Map<String, Integer> dailyPracticeCount = new HashMap<>();
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        records.stream()
                .filter(r -> r.getStartTime() != null && r.getStartTime().isAfter(sevenDaysAgo))
                .forEach(r -> {
                    String dateKey = r.getStartTime().toLocalDate().toString();
                    dailyPracticeCount.put(dateKey, dailyPracticeCount.getOrDefault(dateKey, 0) + 1);
                });
        statistics.put("recentPracticeTrend", dailyPracticeCount);
        
        return statistics;
    }
    
    @Override
    public Map<String, Object> getSubjectStatistics(Long userId) {
        List<ExamRecordEntity> records = getRecordsByUserId(userId);
        Map<String, Object> result = new HashMap<>();
        Map<String, Map<String, Object>> subjectStats = new HashMap<>();
        
        // 统计每个学科的数据
        for (ExamRecordEntity record : records) {
            String subjectName = "未知学科";
            try {
                if (record.getPaperId() != null) {
                    ExamPaperEntity paper = examPaperService.getById(record.getPaperId());
                    if (paper != null && paper.getSubjectId() != null) {
                        String subjectIdStr = paper.getSubjectId().trim();
                        
                        //  尝试按ID查询（如果是数字字符串）
                        try {
                            Long subjectId = Long.parseLong(subjectIdStr);
                            SubjectEntity subject = subjectService.getById(subjectId);
                            if (subject != null && subject.getName() != null) {
                                subjectName = subject.getName();
                            } else {
                                // ID存在但学科不存在，尝试按名称查询
                                SubjectEntity subjectByName = subjectService.getByName(subjectIdStr);
                                if (subjectByName != null && subjectByName.getName() != null) {
                                    subjectName = subjectByName.getName();
                                }
                            }
                        } catch (NumberFormatException e) {
                            //  如果不是数字，尝试按名称查询（如"综合"）
                            SubjectEntity subjectByName = subjectService.getByName(subjectIdStr);
                            if (subjectByName != null && subjectByName.getName() != null) {
                                subjectName = subjectByName.getName();
                            } else {
                                // 如果按名称也查不到，使用原始值（如果它看起来像学科名称）
                                // 否则使用"未知学科"
                                if (!subjectIdStr.isEmpty() && !subjectIdStr.equals("综合")) {
                                    subjectName = subjectIdStr; // 可能是学科名称
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("获取试卷学科信息失败: {}", e.getMessage());
            }

            //  确保 subjectName 不为空
            if (subjectName == null || subjectName.trim().isEmpty()) {
                subjectName = "未知学科";
            }

            // 初始化学科统计
            if (!subjectStats.containsKey(subjectName)) {
                Map<String, Object> stats = new HashMap<>();
                stats.put("subjectName", subjectName);
                stats.put("practiceCount", 0);
                stats.put("totalScore", 0);
                stats.put("totalQuestions", 0);
                stats.put("totalCorrect", 0);
                stats.put("totalTime", 0L);
                stats.put("accuracyList", new ArrayList<Double>());
                stats.put("scoreList", new ArrayList<Integer>());
                subjectStats.put(subjectName, stats);
            }
            
            Map<String, Object> stats = subjectStats.get(subjectName);
            stats.put("practiceCount", (Integer) stats.get("practiceCount") + 1);
            
            if (record.getScore() != null) {
                stats.put("totalScore", (Integer) stats.get("totalScore") + record.getScore());
                ((List<Integer>) stats.get("scoreList")).add(record.getScore());
            }
            
            if (record.getTotalQuestions() != null) {
                stats.put("totalQuestions", (Integer) stats.get("totalQuestions") + record.getTotalQuestions());
            }
            
            if (record.getCorrectAnswers() != null) {
                stats.put("totalCorrect", (Integer) stats.get("totalCorrect") + record.getCorrectAnswers());
            }
            
            if (record.getTimeSpent() != null) {
                stats.put("totalTime", (Long) stats.get("totalTime") + record.getTimeSpent().longValue());
            }
            
            if (record.getAccuracy() != null) {
                ((List<Double>) stats.get("accuracyList")).add(record.getAccuracy());
            }
        }
        
        // 计算每个学科的统计数据
        List<Map<String, Object>> subjectList = new ArrayList<>();
        for (Map.Entry<String, Map<String, Object>> entry : subjectStats.entrySet()) {
            Map<String, Object> stats = entry.getValue();
            int practiceCount = (Integer) stats.get("practiceCount");
            int totalScore = (Integer) stats.get("totalScore");
            int totalQuestions = (Integer) stats.get("totalQuestions");
            int totalCorrect = (Integer) stats.get("totalCorrect");
            long totalTime = (Long) stats.get("totalTime");
            
            @SuppressWarnings("unchecked")
            List<Double> accuracyList = (List<Double>) stats.get("accuracyList");
            @SuppressWarnings("unchecked")
            List<Integer> scoreList = (List<Integer>) stats.get("scoreList");
            
            double avgAccuracy = accuracyList.isEmpty() ? 0.0 : 
                    accuracyList.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double maxAccuracy = accuracyList.isEmpty() ? 0.0 : 
                    accuracyList.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
            double minAccuracy = accuracyList.isEmpty() ? 0.0 : 
                    accuracyList.stream().mapToDouble(Double::doubleValue).min().orElse(0.0);
            
            double avgScore = scoreList.isEmpty() ? 0.0 : 
                    scoreList.stream().mapToInt(Integer::intValue).average().orElse(0.0);
            int maxScore = scoreList.isEmpty() ? 0 : 
                    scoreList.stream().mapToInt(Integer::intValue).max().orElse(0);
            int minScore = scoreList.isEmpty() ? 0 : 
                    scoreList.stream().mapToInt(Integer::intValue).min().orElse(0);
            
            Map<String, Object> subjectData = new HashMap<>();
            subjectData.put("subjectName", stats.get("subjectName"));
            subjectData.put("practiceCount", practiceCount);
            
            Map<String, Object> statisticsMap = new HashMap<>();
            statisticsMap.put("totalScore", totalScore);
            statisticsMap.put("averageScore", String.format("%.2f", avgScore));
            statisticsMap.put("maxScore", maxScore);
            statisticsMap.put("minScore", minScore);
            statisticsMap.put("totalQuestions", totalQuestions);
            statisticsMap.put("totalCorrect", totalCorrect);
            statisticsMap.put("averageAccuracy", String.format("%.2f", avgAccuracy) + "%");
            statisticsMap.put("maxAccuracy", String.format("%.2f", maxAccuracy) + "%");
            statisticsMap.put("minAccuracy", String.format("%.2f", minAccuracy) + "%");
            statisticsMap.put("totalTimeSeconds", totalTime);
            statisticsMap.put("totalTimeFormatted", formatTime(totalTime));
            statisticsMap.put("averageTimeSeconds", practiceCount > 0 ? totalTime / practiceCount : 0);
            statisticsMap.put("averageTimeFormatted", formatTime(practiceCount > 0 ? totalTime / practiceCount : 0));
            subjectData.put("statistics", statisticsMap);
            
            subjectList.add(subjectData);
        }
        
        // 按练习次数排序
        subjectList.sort((a, b) -> {
            int countA = (Integer) a.get("practiceCount");
            int countB = (Integer) b.get("practiceCount");
            return Integer.compare(countB, countA);
        });
        
        result.put("totalSubjects", subjectStats.size());
        result.put("subjects", subjectList);
        
        return result;
    }
    
    @Override
    public Map<String, Object> getSubjectKnowledgePointStatistics(Long userId) {
        List<ExamRecordEntity> records = getRecordsByUserId(userId);
        Map<String, Object> result = new HashMap<>();
        
        // 按学科->知识点分组统计
        // 结构：Map<学科名, Map<知识点名, 统计数据>>
        Map<String, Map<String, Map<String, Object>>> subjectKpStats = new HashMap<>();
        
        // 记录每个知识点在哪些exam_record中出现过（用于统计练习次数）
        Map<String, Set<Long>> kpRecordMap = new HashMap<>(); // key: "学科名:知识点名", value: exam_record_id集合
        
        // 遍历所有练习记录
        for (ExamRecordEntity record : records) {
            try {
                // 获取试卷的学科
                String subjectName = "未知学科";
                if (record.getPaperId() != null) {
                    ExamPaperEntity paper = examPaperService.getById(record.getPaperId());
                    if (paper != null && paper.getSubjectId() != null) {
                        String subjectIdStr = paper.getSubjectId().trim();
                        
                        //  尝试按ID查询（如果是数字字符串）
                        try {
                            Long subjectId = Long.parseLong(subjectIdStr);
                            SubjectEntity subject = subjectService.getById(subjectId);
                            if (subject != null && subject.getName() != null) {
                                subjectName = subject.getName();
                            } else {
                                // ID存在但学科不存在，尝试按名称查询
                                SubjectEntity subjectByName = subjectService.getByName(subjectIdStr);
                                if (subjectByName != null && subjectByName.getName() != null) {
                                    subjectName = subjectByName.getName();
                                }
                            }
                        } catch (NumberFormatException e) {
                            //  如果不是数字，尝试按名称查询（如"综合"）
                            SubjectEntity subjectByName = subjectService.getByName(subjectIdStr);
                            if (subjectByName != null && subjectByName.getName() != null) {
                                subjectName = subjectByName.getName();
                            } else {
                                // 如果按名称也查不到，使用原始值（如果它看起来像学科名称）
                                // 否则使用"未知学科"
                                if (!subjectIdStr.isEmpty() && !subjectIdStr.equals("综合")) {
                                    subjectName = subjectIdStr; // 可能是学科名称
                                }
                            }
                        } catch (Exception e) {
                            log.warn("获取学科信息失败: {}", e.getMessage());
                        }
                    }
                }
                
                // 获取该记录的所有答题记录
                List<AnswerRecordEntity> answerRecords = answerRecordService.lambdaQuery()
                    .eq(AnswerRecordEntity::getExamRecordId, record.getId())
                    .list();
                
                // 遍历答题记录，统计知识点
                for (AnswerRecordEntity answerRecord : answerRecords) {
                    if (answerRecord.getQuestionId() == null) continue;
                    
                    // 获取题目
                    QuestionEntity question = questionService.getById(answerRecord.getQuestionId());
                    if (question == null) continue;
                    
                    // 获取题目的知识点ID列表
                    List<Long> knowledgePointIds = question.getKnowledgePointIdsList();
                    if (knowledgePointIds == null || knowledgePointIds.isEmpty()) continue;
                    
                    // 遍历知识点
                    for (Long kpId : knowledgePointIds) {
                        try {
                            KnowledgePointEntity knowledgePoint = knowledgePointService.getById(kpId);
                            if (knowledgePoint == null) continue;
                            
                            String kpName = knowledgePoint.getName();
                            if (kpName == null || kpName.trim().isEmpty()) continue;
                            
                            // 初始化学科统计
                            if (!subjectKpStats.containsKey(subjectName)) {
                                subjectKpStats.put(subjectName, new HashMap<>());
                            }
                            
                            Map<String, Map<String, Object>> kpStatsMap = subjectKpStats.get(subjectName);
                            
                            // 初始化知识点统计
                            if (!kpStatsMap.containsKey(kpName)) {
                                Map<String, Object> kpStats = new HashMap<>();
                                kpStats.put("knowledgePointName", kpName);
                                kpStats.put("questionCount", 0);
                                kpStats.put("correctCount", 0);
                                kpStats.put("totalTimeSeconds", 0L);
                                kpStatsMap.put(kpName, kpStats);
                            }
                            
                            Map<String, Object> kpStats = kpStatsMap.get(kpName);
                            
                            // 统计题目数
                            kpStats.put("questionCount", (Integer) kpStats.get("questionCount") + 1);
                            
                            // 统计正确数
                            if (answerRecord.getIsCorrect() != null && answerRecord.getIsCorrect()) {
                                kpStats.put("correctCount", (Integer) kpStats.get("correctCount") + 1);
                            }
                            
                            // 统计用时
                            if (answerRecord.getTimeSpent() != null) {
                                kpStats.put("totalTimeSeconds", 
                                    (Long) kpStats.get("totalTimeSeconds") + answerRecord.getTimeSpent().longValue());
                            }
                            
                            // 记录该知识点出现在此exam_record中（用于统计练习次数）
                            String kpKey = subjectName + ":" + kpName;
                            if (!kpRecordMap.containsKey(kpKey)) {
                                kpRecordMap.put(kpKey, new HashSet<>());
                            }
                            kpRecordMap.get(kpKey).add(record.getId());
                            
                        } catch (Exception e) {
                            log.warn("处理知识点 {} 统计失败: {}", kpId, e.getMessage());
                        }
                    }
                }
                
            } catch (Exception e) {
                log.warn("处理练习记录 {} 统计失败: {}", record.getId(), e.getMessage());
            }
        }
        
        // 转换为返回格式
        List<Map<String, Object>> subjectList = new ArrayList<>();
        for (Map.Entry<String, Map<String, Map<String, Object>>> subjectEntry : subjectKpStats.entrySet()) {
            String subjectName = subjectEntry.getKey();
            Map<String, Map<String, Object>> kpStatsMap = subjectEntry.getValue();
            
            Map<String, Object> subjectData = new HashMap<>();
            subjectData.put("subjectName", subjectName);
            
            List<Map<String, Object>> knowledgePoints = new ArrayList<>();
            for (Map.Entry<String, Map<String, Object>> kpEntry : kpStatsMap.entrySet()) {
                String kpName = kpEntry.getKey();
                Map<String, Object> kpStats = kpEntry.getValue();
                
                int questionCount = (Integer) kpStats.get("questionCount");
                int correctCount = (Integer) kpStats.get("correctCount");
                long totalTimeSeconds = (Long) kpStats.get("totalTimeSeconds");
                
                // 从kpRecordMap获取练习次数（不同exam_record的数量）
                String kpKey = subjectName + ":" + kpName;
                int practiceCount = kpRecordMap.containsKey(kpKey) ? kpRecordMap.get(kpKey).size() : 0;
                
                // 计算正确率
                double accuracy = questionCount > 0 ? (correctCount * 100.0 / questionCount) : 0.0;
                
                Map<String, Object> kpData = new HashMap<>();
                kpData.put("knowledgePointName", kpStats.get("knowledgePointName"));
                kpData.put("practiceCount", practiceCount);
                kpData.put("questionCount", questionCount);
                kpData.put("correctCount", correctCount);
                kpData.put("accuracy", String.format("%.2f", accuracy) + "%");
                kpData.put("totalTimeSeconds", totalTimeSeconds);
                kpData.put("totalTimeFormatted", formatTime(totalTimeSeconds));
                kpData.put("averageTimeSeconds", questionCount > 0 ? totalTimeSeconds / questionCount : 0);
                kpData.put("averageTimeFormatted", formatTime(questionCount > 0 ? totalTimeSeconds / questionCount : 0));
                
                knowledgePoints.add(kpData);
            }
            
            // 按题目数降序排序
            knowledgePoints.sort((a, b) -> {
                int countA = (Integer) a.get("questionCount");
                int countB = (Integer) b.get("questionCount");
                return Integer.compare(countB, countA);
            });
            
            subjectData.put("knowledgePoints", knowledgePoints);
            subjectData.put("totalKnowledgePoints", knowledgePoints.size());
            
            subjectList.add(subjectData);
        }
        
        // 按学科名排序
        subjectList.sort((a, b) -> {
            String nameA = (String) a.get("subjectName");
            String nameB = (String) b.get("subjectName");
            return nameA.compareTo(nameB);
        });
        
        result.put("totalSubjects", subjectList.size());
        result.put("subjects", subjectList);
        
        return result;
    }

    /**
     * 格式化时间（秒转为可读格式）
     */
    private String formatTime(long seconds) {
        if (seconds < 60) {
            return seconds + "秒";
        } else if (seconds < 3600) {
            long minutes = seconds / 60;
            long secs = seconds % 60;
            return minutes + "分" + secs + "秒";
        } else {
            long hours = seconds / 3600;
            long minutes = (seconds % 3600) / 60;
            long secs = seconds % 60;
            return hours + "小时" + minutes + "分" + secs + "秒";
        }
    }
    
    @Override
    public boolean createRecord(ExamRecordEntity record) {
        try {
            log.info("开始保存练习记录 - 试卷ID: {}, 用户ID: {}, 得分: {}/{}", 
                record.getPaperId(), record.getUserId(), record.getScore(), record.getTotalScore());
            
            // 设置默认值
            if (record.getCreatedAt() == null) {
                record.setCreatedAt(LocalDateTime.now());
            }
            if (record.getUpdatedAt() == null) {
                record.setUpdatedAt(LocalDateTime.now());
            }
            
            // 确保必填字段有值
            if (record.getStatus() == null) {
                record.setStatus(ExamRecordEntity.ExamStatus.COMPLETED);
            }
            if (record.getExamType() == null) {
                record.setExamType(ExamRecordEntity.ExamType.PRACTICE);
            }
            
            // 设置 studentId 字段，如果为空则使用 userId
            if (record.getStudentId() == null && record.getUserId() != null) {
                record.setStudentId(record.getUserId());
            }
            
            // 如果前端已经提供了试卷标题，直接使用；否则尝试从数据库获取
            if (record.getPaperTitle() == null || record.getPaperTitle().trim().isEmpty()) {
                if (record.getPaperId() != null) {
                    try {
                        ExamPaperEntity paper = examPaperService.getById(record.getPaperId());
                        if (paper != null && paper.getTitle() != null && !paper.getTitle().trim().isEmpty()) {
                            record.setPaperTitle(paper.getTitle());
                            log.info("从数据库获取试卷名称: {}", paper.getTitle());
                        } else {
                            record.setPaperTitle("未命名试卷");
                            log.warn("试卷ID {} 对应的试卷不存在或名称为空", record.getPaperId());
                        }
                    } catch (Exception e) {
                        record.setPaperTitle("未命名试卷");
                        log.error("获取试卷名称失败: {}", e.getMessage());
                    }
                } else {
                    record.setPaperTitle("未命名试卷");
                    log.warn("练习记录缺少试卷ID和试卷标题");
                }
            } else {
                log.info("使用前端提供的试卷标题: {}", record.getPaperTitle());
            }
            
            // 计算时间差
            if (record.getTimeSpent() == null && record.getStartTime() != null && record.getEndTime() != null) {
                long diffInSeconds = java.time.Duration.between(record.getStartTime(), record.getEndTime()).getSeconds();
                record.setTimeSpent((int) diffInSeconds);
            }
            
            boolean result = save(record);
            if (result) {
                log.info("练习记录保存成功 - 记录ID: {}", record.getId());
            } else {
                log.error("练习记录保存失败");
            }
            return result;
        } catch (Exception e) {
            log.error("保存练习记录失败: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @Override
    public boolean updateRecord(ExamRecordEntity record) {
        record.setUpdatedAt(LocalDateTime.now());
        return updateById(record);
    }
    
    @Override
    public boolean deleteRecord(Long recordId) {
        return removeById(recordId);
    }
    
    @Override
    public List<ExamRecordEntity> searchRecords(Long userId, String paperTitle, 
                                               ExamRecordEntity.ExamStatus status, 
                                               ExamRecordEntity.ExamType type,
                                               String subjectId,
                                               String startDate,
                                               String endDate) {
        LambdaQueryWrapper<ExamRecordEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ExamRecordEntity::getUserId, userId);
        
        if (paperTitle != null && !paperTitle.trim().isEmpty()) {
            // 这里需要关联试卷表查询，暂时用paperId模拟
            // wrapper.like(ExamRecordEntity::getPaperId, paperTitle);
        }
        
        if (status != null) {
            wrapper.eq(ExamRecordEntity::getStatus, status);
        }
        
        if (type != null) {
            wrapper.eq(ExamRecordEntity::getExamType, type);
        }
        
        // 日期范围筛选
        if (startDate != null && !startDate.trim().isEmpty()) {
            try {
                LocalDateTime startDateTime = LocalDateTime.parse(startDate.trim() + "T00:00:00");
                wrapper.ge(ExamRecordEntity::getStartTime, startDateTime);
            } catch (Exception e) {
                log.warn("解析开始日期失败: {}", startDate, e);
            }
        }
        
        if (endDate != null && !endDate.trim().isEmpty()) {
            try {
                LocalDateTime endDateTime = LocalDateTime.parse(endDate.trim() + "T23:59:59");
                wrapper.le(ExamRecordEntity::getStartTime, endDateTime);
            } catch (Exception e) {
                log.warn("解析结束日期失败: {}", endDate, e);
            }
        }
        
        wrapper.orderByDesc(ExamRecordEntity::getStartTime);
        List<ExamRecordEntity> allRecords = list(wrapper);
        
        // 如果指定了学科ID，根据试卷的学科进行筛选
        if (subjectId != null && !subjectId.trim().isEmpty() && !subjectId.equals("ALL")) {
            List<ExamRecordEntity> filteredRecords = new ArrayList<>();
            
            // 先通过学科ID获取学科信息（用于后续匹配）
            SubjectEntity filterSubject = null;
            String filterSubjectName = null;
            try {
                Long subjectIdLong = Long.parseLong(subjectId);
                filterSubject = subjectService.getById(subjectIdLong);
                if (filterSubject != null) {
                    filterSubjectName = filterSubject.getName();
                }
            } catch (NumberFormatException e) {
                // 如果subjectId不是数字，尝试按名称查询
                filterSubject = subjectService.getByName(subjectId);
                if (filterSubject != null) {
                    filterSubjectName = filterSubject.getName();
                }
            }
            
            for (ExamRecordEntity record : allRecords) {
                if (record.getPaperId() != null) {
                    try {
                        ExamPaperEntity paper = examPaperService.getById(record.getPaperId());
                        if (paper != null && paper.getSubjectId() != null) {
                            String paperSubjectId = paper.getSubjectId().trim();
                            boolean match = false;
                            
                            // 情况1: 直接ID匹配（如果试卷的subjectId存储的是学科ID）
                            if (paperSubjectId.equals(subjectId)) {
                                match = true;
                            }
                            // 情况2: 学科名称匹配（如果试卷的subjectId存储的是学科名称）
                            else if (filterSubjectName != null && paperSubjectId.equals(filterSubjectName)) {
                                match = true;
                            }
                            // 情况3: 尝试将试卷的subjectId解析为数字，然后与学科ID比较
                            else {
                                try {
                                    Long paperSubjectIdLong = Long.parseLong(paperSubjectId);
                                    Long subjectIdLong = Long.parseLong(subjectId);
                                    if (paperSubjectIdLong.equals(subjectIdLong)) {
                                        match = true;
                                    }
                                } catch (NumberFormatException e) {
                                    // 如果都解析失败，说明都是名称，已经在情况2中处理
                                }
                            }
                            
                            if (match) {
                                filteredRecords.add(record);
                            }
                        }
                    } catch (Exception e) {
                        log.warn("获取试卷 {} 的学科信息失败: {}", record.getPaperId(), e.getMessage());
                    }
                }
            }
            return filteredRecords;
        }
        
        return allRecords;
    }
}
