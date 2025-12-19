package org.example.papermaker.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.service.V;
import org.example.papermaker.entity.*;
import org.example.papermaker.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*; // 包含List, Map, HashMap, ArrayList, Set等
import java.util.stream.Collectors;

/**
 * 学习统计工具类
 * 为AI助手提供访问用户学习统计数据的能力
 * 
 * @author System
 * @since 1.0.0
 */
@Component
public class LearningStatisticsTool {

    @Autowired
    private ExamRecordService examRecordService;

    @Autowired
    private AnswerRecordService answerRecordService;

    @Autowired
    private QuestionService questionService;

    @Autowired
    private KnowledgePointService knowledgePointService;

    @Autowired
    private ExamPaperService examPaperService;

    @Autowired
    private SubjectService subjectService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 获取用户的总体练习情况统计
     * 包括：练习次数、得分统计、正确率统计、时间统计等
     * 
     * @return 总体统计数据（JSON格式字符串）
     */
    @Tool("获取当前用户的总体练习情况统计(当用户指定学科或知识点时不要调用该方法 ，调用getSingleSubjectStatistics)，包括练习次数、得分统计、正确率统计、时间统计、答题统计等。用于生成学习总结和个性化学习计划。注意：如果无法获取用户ID参数，可以不传递该参数，工具会自动从系统上下文获取。")
    public String getOverallStatistics(@V(value = "当前用户Id") Long userId) {
        try {

            if (userId == null) {
                System.out.println("========== 错误：无法获取用户ID ==========");
                return "{\"error\": \"无法获取用户信息，请确保已登录\"}";
            }

            Map<String, Object> statistics = examRecordService.getOverallStatistics(userId);
            System.out.println("获取总体统计数据成功，用户ID: " + userId + ", 数据项数: " + statistics.size());
            System.out.println("统计数据内容: " + objectMapper.writeValueAsString(statistics));
            return objectMapper.writeValueAsString(statistics);
        } catch (Exception e) {
            System.err.println("获取总体统计数据失败: " + e.getMessage());
            e.printStackTrace();
            return "{\"error\": \"获取统计数据失败: " + e.getMessage() + "\"}";
        }
    }

    /**
     * 获取用户的学科分类练习情况统计
     * 包括：各学科的练习次数、得分统计、正确率统计等
     * 
     * @return 学科统计数据（JSON格式字符串）
     */
    @Tool("获取当前用户的学科分类练习情况统计(当用户指定学科或知识点时不要调用该方法 ，调用getSingleSubjectStatistics)，包括各学科的练习次数、得分统计、正确率统计等。用于分析用户在不同学科的表现，识别薄弱学科和优势学科。注意：如果无法获取用户ID参数，可以不传递该参数，工具会自动从系统上下文获取。")
    public String getSubjectStatistics(@V(value = "当前用户Id") Long userId) {
        try {
            if (userId == null) {
                System.out.println("========== 错误：无法获取用户ID ==========");
                return "{\"error\": \"无法获取用户信息，请确保已登录\"}";
            }

            Map<String, Object> statistics = examRecordService.getSubjectStatistics(userId);
            System.out.println("获取学科统计数据成功，用户ID: " + userId + ", 数据项数: " + statistics.size());
            System.out.println("统计数据内容: " + objectMapper.writeValueAsString(statistics));
            return objectMapper.writeValueAsString(statistics);
        } catch (Exception e) {
            System.err.println("获取学科统计数据失败: " + e.getMessage());
            e.printStackTrace();
            return "{\"error\": \"获取统计数据失败: " + e.getMessage() + "\"}";
        }
    }

    /**
     * 获取用户在特定学科的综合学习表现分析
     * 提供多维度统计数据，包括练习频次、成绩表现、答题准确性、时间投入等关键指标
     * 
     * @param userId      用户唯一标识，用于关联个人学习数据
     * @param subjectName 目标学科名称，支持系统中所有已配置学科
     * @return 结构化的学科学习分析报告（JSON格式），包含练习统计、成绩分析、知识点掌握情况等
     * 
     * @apiNote 此方法会自动获取用户在该学科的所有练习记录，并进行深度数据分析。
     *          若用户未登录或学科名称无效，将返回相应的错误信息。
     *          当用户无练习记录时，返回空数据状态而非错误，便于前端处理。
     * 
     * @see #getSingleSubjectKnowledgePointStatistics(Long, String) 获取更详细的知识点级别分析
     */
    @Tool("分析用户在指定学科的综合学习表现，提供多维度数据：练习频次、成绩分布、答题准确率、时间投入效率等。通过深度数据挖掘，识别学科知识点优势与薄弱环节，生成个性化学习建议。支持自动获取用户上下文，无需手动传递用户ID。")
    public String getSingleSubjectStatistics(@V(value = "当前用户Id") Long userId,
            @V(value = "学科名称") String subjectName) {
        try {
            if (userId == null) {
                System.out.println("========== 错误：无法获取用户ID ==========");
                return "{\"error\": \"无法获取用户信息，请确保已登录\"}";
            }

            if (subjectName == null || subjectName.trim().isEmpty()) {
                System.out.println("========== 错误：学科名称不能为空 ==========");
                return "{\"error\": \"学科名称不能为空\"}";
            }
            // 获取学科Id
            Long id = subjectService.getByName(subjectName).getId();

            // 获取该学科的所有练习记录
            List<ExamRecordEntity> subjectRecords = examRecordService.searchRecords(
                    userId, null, null, null, id + "", null, null);

            // 如果没有找到记录，返回空统计
            if (subjectRecords.isEmpty()) {
                Map<String, Object> emptyStats = new HashMap<>();
                emptyStats.put("subjectName", subjectName);
                emptyStats.put("hasData", false);
                emptyStats.put("message", "未找到该学科的练习记录");
                return objectMapper.writeValueAsString(emptyStats);
            }

            // 计算统计数据
            Map<String, Object> statistics = calculateSingleSubjectStatistics(subjectRecords, subjectName);

            System.out.println(
                    "获取单学科统计数据成功，用户ID: " + userId + ", 学科: " + subjectName + ", 记录数: " + subjectRecords.size());
            return objectMapper.writeValueAsString(statistics);
        } catch (Exception e) {
            System.err.println("获取单学科统计数据失败: " + e.getMessage());
            e.printStackTrace();
            return "{\"error\": \"获取统计数据失败: " + e.getMessage() + "\"}";
        }
    }

    /**
     * 计算单学科的统计数据
     * 参考ExamRecordServiceImpl.getSubjectKnowledgePointStatistics()方法的实现
     */
    private Map<String, Object> calculateSingleSubjectStatistics(List<ExamRecordEntity> records, String subjectName) {
        Map<String, Object> result = new HashMap<>();
        result.put("subjectName", subjectName);
        result.put("hasData", true);

        // 基本统计
        int totalRecords = records.size();
        int completedCount = (int) records.stream().filter(r -> r.getStatus() == ExamRecordEntity.ExamStatus.COMPLETED)
                .count();

        // 得分统计
        List<Double> scores = records.stream()
                .filter(r -> r.getScore() != null)
                .map(ExamRecordEntity::getScore)
                .collect(Collectors.toList());

        double totalScore = scores.stream().mapToDouble(Double::doubleValue).sum();
        double avgScore = scores.isEmpty() ? 0.0
                : scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double maxScore = scores.isEmpty() ? 0 : scores.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);
        double minScore = scores.isEmpty() ? 0 : scores.stream().mapToDouble(Double::doubleValue).min().orElse(0.0);

        // 正确率统计
        List<Double> accuracies = records.stream()
                .filter(r -> r.getAccuracy() != null)
                .map(ExamRecordEntity::getAccuracy)
                .collect(Collectors.toList());

        double avgAccuracy = accuracies.isEmpty() ? 0.0
                : accuracies.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        // 时间统计（秒）
        List<Long> timeSpents = records.stream()
                .filter(r -> r.getTimeSpent() != null && r.getTimeSpent() > 0)
                .map(r -> r.getTimeSpent().longValue())
                .collect(Collectors.toList());

        long totalTime = timeSpents.stream().mapToLong(Long::longValue).sum();
        long avgTime = timeSpents.isEmpty() ? 0
                : (long) timeSpents.stream().mapToLong(Long::longValue).average().orElse(0.0);

        // 答题数量统计
        int totalQuestions = records.stream()
                .filter(r -> r.getTotalQuestions() != null)
                .mapToInt(ExamRecordEntity::getTotalQuestions)
                .sum();
        int totalCorrect = records.stream()
                .filter(r -> r.getCorrectAnswers() != null)
                .mapToInt(ExamRecordEntity::getCorrectAnswers)
                .sum();

        // 知识点统计（参考getSubjectKnowledgePointStatistics方法）
        Map<String, Map<String, Object>> knowledgePointStats = new HashMap<>();
        Map<String, Set<Long>> kpRecordMap = new HashMap<>(); // 记录每个知识点在哪些exam_record中出现过

        // 遍历所有练习记录，统计知识点
        for (ExamRecordEntity record : records) {
            try {
                // 获取该记录的所有答题记录
                List<AnswerRecordEntity> answerRecords = answerRecordService.lambdaQuery()
                        .eq(AnswerRecordEntity::getExamRecordId, record.getId())
                        .list();

                // 遍历答题记录，统计知识点
                for (AnswerRecordEntity answerRecord : answerRecords) {
                    if (answerRecord.getQuestionId() == null)
                        continue;

                    // 获取题目
                    QuestionEntity question = questionService.getById(answerRecord.getQuestionId());
                    if (question == null)
                        continue;

                    // 获取题目的知识点ID列表
                    List<Long> knowledgePointIds = question.getKnowledgePointIdsList();
                    if (knowledgePointIds == null || knowledgePointIds.isEmpty())
                        continue;

                    // 遍历知识点
                    for (Long kpId : knowledgePointIds) {
                        try {
                            KnowledgePointEntity knowledgePoint = knowledgePointService.getById(kpId);
                            if (knowledgePoint == null)
                                continue;

                            String kpName = knowledgePoint.getName();
                            if (kpName == null || kpName.trim().isEmpty())
                                continue;

                            // 初始化知识点统计
                            if (!knowledgePointStats.containsKey(kpName)) {
                                Map<String, Object> kpStats = new HashMap<>();
                                kpStats.put("knowledgePointName", kpName);
                                kpStats.put("questionCount", 0);
                                kpStats.put("correctCount", 0);
                                kpStats.put("totalTimeSeconds", 0L);
                                knowledgePointStats.put(kpName, kpStats);
                            }

                            Map<String, Object> kpStats = knowledgePointStats.get(kpName);

                            // 统计题目数
                            kpStats.put("questionCount", (Integer) kpStats.get("questionCount") + 1);

                            // 统计正确数
                            if (answerRecord.getIsCorrect() != null && answerRecord.getIsCorrect()) {
                                kpStats.put("correctCount", (Integer) kpStats.get("correctCount") + 1);
                            }

                            // 统计用时
                            if (answerRecord.getTimeSpent() != null) {
                                kpStats.put("totalTimeSeconds",
                                        (Long) kpStats.get("totalTimeSeconds")
                                                + answerRecord.getTimeSpent().longValue());
                            }

                            // 记录该知识点出现在此exam_record中（用于统计练习次数）
                            String kpKey = subjectName + ":" + kpName;
                            if (!kpRecordMap.containsKey(kpKey)) {
                                kpRecordMap.put(kpKey, new HashSet<>());
                            }
                            kpRecordMap.get(kpKey).add(record.getId());

                        } catch (Exception e) {
                            System.err.println("处理知识点 " + kpId + " 统计失败: " + e.getMessage());
                        }
                    }
                }

            } catch (Exception e) {
                System.err.println("处理练习记录 " + record.getId() + " 统计失败: " + e.getMessage());
            }
        }

        // 转换知识点统计为返回格式
        List<Map<String, Object>> knowledgePoints = new ArrayList<>();
        for (Map.Entry<String, Map<String, Object>> kpEntry : knowledgePointStats.entrySet()) {
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

        // 构建基本统计结果
        result.put("summary", Map.of(
                "totalRecords", totalRecords,
                "completedRecords", completedCount,
                "completionRate",
                totalRecords > 0 ? String.format("%.2f", (double) completedCount / totalRecords * 100) + "%" : "0%"));

        result.put("scoreStatistics", Map.of(
                "totalScore", totalScore,
                "averageScore", String.format("%.2f", avgScore),
                "maxScore", maxScore,
                "minScore", minScore,
                "scoreCount", scores.size()));

        result.put("accuracyStatistics", Map.of(
                "averageAccuracy", String.format("%.2f", avgAccuracy) + "%",
                "accuracyCount", accuracies.size()));

        result.put("timeStatistics", Map.of(
                "totalTimeSeconds", totalTime,
                "averageTimeSeconds", avgTime,
                "totalTimeFormatted", formatTime(totalTime),
                "averageTimeFormatted", formatTime(avgTime)));

        result.put("questionStatistics", Map.of(
                "totalQuestions", totalQuestions,
                "totalCorrect", totalCorrect,
                "correctRate",
                totalQuestions > 0 ? String.format("%.2f", (double) totalCorrect / totalQuestions * 100) + "%" : "0%"));

        // 知识点统计
        result.put("knowledgePointStatistics", Map.of(
                "totalKnowledgePoints", knowledgePoints.size(),
                "knowledgePoints", knowledgePoints));

        return result;
    }

    // /**
    // * 获取用户的单学科知识点统计
    // * 包括：该学科的知识点练习情况、正确率、时间统计等
    // *
    // * @param userId 用户ID
    // * @param subjectName 学科名称
    // * @return 单学科知识点统计数据（JSON格式字符串）
    // */
    // @Tool("获取当前用户特定学科的知识点练习情况统计，包括各知识点的练习次数、正确率、时间统计等。用于分析用户在特定学科各知识点的学习表现，识别薄弱知识点和优势知识点。注意：如果无法获取用户ID参数，可以不传递该参数，工具会自动从系统上下文获取。")
    // public String getSingleSubjectKnowledgePointStatistics(@V(value = "当前用户Id")
    // Long userId,
    // @V(value = "学科名称") String subjectName) {
    // try {
    // if (userId == null) {
    // System.out.println("========== 错误：无法获取用户ID ==========");
    // return "{\"error\": \"无法获取用户信息，请确保已登录\"}";
    // }
    //
    // if (subjectName == null || subjectName.trim().isEmpty()) {
    // System.out.println("========== 错误：学科名称不能为空 ==========");
    // return "{\"error\": \"学科名称不能为空\"}";
    // }
    // //获取学科Id
    // Long id = subjectService.getByName(subjectName).getId();
    //
    // // 获取该学科的所有练习记录
    // List<ExamRecordEntity> subjectRecords = examRecordService.searchRecords(
    // userId, null, null, null, id + "" , null, null);
    //
    // // 如果没有找到记录，返回空统计
    // if (subjectRecords.isEmpty()) {
    // Map<String, Object> emptyStats = new HashMap<>();
    // emptyStats.put("subjectName", subjectName);
    // emptyStats.put("hasData", false);
    // emptyStats.put("message", "未找到该学科的练习记录");
    // emptyStats.put("totalKnowledgePoints", 0);
    // emptyStats.put("knowledgePoints", new ArrayList<>());
    // return objectMapper.writeValueAsString(emptyStats);
    // }
    //
    // // 计算知识点统计数据
    // Map<String, Object> statistics =
    // calculateSingleSubjectKnowledgePointStatistics(subjectRecords, subjectName);
    //
    // System.out.println("获取单学科知识点统计数据成功，用户ID: " + userId + ", 学科: " + subjectName
    // + ", 记录数: " + subjectRecords.size());
    // return objectMapper.writeValueAsString(statistics);
    // } catch (Exception e) {
    // System.err.println("获取单学科知识点统计数据失败: " + e.getMessage());
    // e.printStackTrace();
    // return "{\"error\": \"获取统计数据失败: " + e.getMessage() + "\"}";
    // }
    // }
    //
    // /**
    // * 计算单学科的知识点统计数据
    // * 参考ExamRecordServiceImpl.getSubjectKnowledgePointStatistics()方法的实现
    // */
    // private Map<String, Object>
    // calculateSingleSubjectKnowledgePointStatistics(List<ExamRecordEntity>
    // records, String subjectName) {
    // Map<String, Object> result = new HashMap<>();
    // result.put("subjectName", subjectName);
    // result.put("hasData", true);
    //
    // // 知识点统计（参考getSubjectKnowledgePointStatistics方法）
    // Map<String, Map<String, Object>> knowledgePointStats = new HashMap<>();
    // Map<String, Set<Long>> kpRecordMap = new HashMap<>(); //
    // 记录每个知识点在哪些exam_record中出现过
    //
    // // 遍历所有练习记录，统计知识点
    // for (ExamRecordEntity record : records) {
    // try {
    // // 获取该记录的所有答题记录
    // List<AnswerRecordEntity> answerRecords = answerRecordService.lambdaQuery()
    // .eq(AnswerRecordEntity::getExamRecordId, record.getId())
    // .list();
    //
    // // 遍历答题记录，统计知识点
    // for (AnswerRecordEntity answerRecord : answerRecords) {
    // if (answerRecord.getQuestionId() == null) continue;
    //
    // // 获取题目
    // QuestionEntity question =
    // questionService.getById(answerRecord.getQuestionId());
    // if (question == null) continue;
    //
    // // 获取题目的知识点ID列表
    // List<Long> knowledgePointIds = question.getKnowledgePointIdsList();
    // if (knowledgePointIds == null || knowledgePointIds.isEmpty()) continue;
    //
    // // 遍历知识点
    // for (Long kpId : knowledgePointIds) {
    // try {
    // KnowledgePointEntity knowledgePoint = knowledgePointService.getById(kpId);
    // if (knowledgePoint == null) continue;
    //
    // String kpName = knowledgePoint.getName();
    // if (kpName == null || kpName.trim().isEmpty()) continue;
    //
    // // 初始化知识点统计
    // if (!knowledgePointStats.containsKey(kpName)) {
    // Map<String, Object> kpStats = new HashMap<>();
    // kpStats.put("knowledgePointName", kpName);
    // kpStats.put("questionCount", 0);
    // kpStats.put("correctCount", 0);
    // kpStats.put("totalTimeSeconds", 0L);
    // knowledgePointStats.put(kpName, kpStats);
    // }
    //
    // Map<String, Object> kpStats = knowledgePointStats.get(kpName);
    //
    // // 统计题目数
    // kpStats.put("questionCount", (Integer) kpStats.get("questionCount") + 1);
    //
    // // 统计正确数
    // if (answerRecord.getIsCorrect() != null && answerRecord.getIsCorrect()) {
    // kpStats.put("correctCount", (Integer) kpStats.get("correctCount") + 1);
    // }
    //
    // // 统计用时
    // if (answerRecord.getTimeSpent() != null) {
    // kpStats.put("totalTimeSeconds",
    // (Long) kpStats.get("totalTimeSeconds") +
    // answerRecord.getTimeSpent().longValue());
    // }
    //
    // // 记录该知识点出现在此exam_record中（用于统计练习次数）
    // String kpKey = subjectName + ":" + kpName;
    // if (!kpRecordMap.containsKey(kpKey)) {
    // kpRecordMap.put(kpKey, new HashSet<>());
    // }
    // kpRecordMap.get(kpKey).add(record.getId());
    //
    // } catch (Exception e) {
    // System.err.println("处理知识点 " + kpId + " 统计失败: " + e.getMessage());
    // }
    // }
    // }
    //
    // } catch (Exception e) {
    // System.err.println("处理练习记录 " + record.getId() + " 统计失败: " + e.getMessage());
    // }
    // }
    //
    // // 转换知识点统计为返回格式
    // List<Map<String, Object>> knowledgePoints = new ArrayList<>();
    // for (Map.Entry<String, Map<String, Object>> kpEntry :
    // knowledgePointStats.entrySet()) {
    // String kpName = kpEntry.getKey();
    // Map<String, Object> kpStats = kpEntry.getValue();
    //
    // int questionCount = (Integer) kpStats.get("questionCount");
    // int correctCount = (Integer) kpStats.get("correctCount");
    // long totalTimeSeconds = (Long) kpStats.get("totalTimeSeconds");
    //
    // // 从kpRecordMap获取练习次数（不同exam_record的数量）
    // String kpKey = subjectName + ":" + kpName;
    // int practiceCount = kpRecordMap.containsKey(kpKey) ?
    // kpRecordMap.get(kpKey).size() : 0;
    //
    // // 计算正确率
    // double accuracy = questionCount > 0 ? (correctCount * 100.0 / questionCount)
    // : 0.0;
    //
    // // 计算掌握程度
    // String masteryLevel;
    // if (accuracy >= 80) {
    // masteryLevel = "advanced"; // 高级
    // } else if (accuracy >= 60) {
    // masteryLevel = "intermediate"; // 中级
    // } else {
    // masteryLevel = "beginner"; // 初级
    // }
    //
    // Map<String, Object> kpData = new HashMap<>();
    // kpData.put("knowledgePointName", kpStats.get("knowledgePointName"));
    // kpData.put("practiceCount", practiceCount);
    // kpData.put("questionCount", questionCount);
    // kpData.put("correctCount", correctCount);
    // kpData.put("accuracy", String.format("%.2f", accuracy) + "%");
    // kpData.put("masteryLevel", masteryLevel);
    // kpData.put("totalTimeSeconds", totalTimeSeconds);
    // kpData.put("totalTimeFormatted", formatTime(totalTimeSeconds));
    // kpData.put("averageTimeSeconds", questionCount > 0 ? totalTimeSeconds /
    // questionCount : 0);
    // kpData.put("averageTimeFormatted", formatTime(questionCount > 0 ?
    // totalTimeSeconds / questionCount : 0));
    //
    // knowledgePoints.add(kpData);
    // }
    //
    // // 按题目数降序排序
    // knowledgePoints.sort((a, b) -> {
    // int countA = (Integer) a.get("questionCount");
    // int countB = (Integer) b.get("questionCount");
    // return Integer.compare(countB, countA);
    // });
    //
    // // 计算总体统计
    // int totalQuestions = knowledgePoints.stream().mapToInt(kp -> (Integer)
    // kp.get("questionCount")).sum();
    // int totalCorrect = knowledgePoints.stream().mapToInt(kp -> (Integer)
    // kp.get("correctCount")).sum();
    // long totalTime = knowledgePoints.stream().mapToLong(kp -> (Long)
    // kp.get("totalTimeSeconds")).sum();
    // double overallAccuracy = totalQuestions > 0 ? (totalCorrect * 100.0 /
    // totalQuestions) : 0.0;
    //
    // result.put("summary", Map.of(
    // "totalKnowledgePoints", knowledgePoints.size(),
    // "totalQuestions", totalQuestions,
    // "totalCorrect", totalCorrect,
    // "overallAccuracy", String.format("%.2f", overallAccuracy) + "%",
    // "totalTimeSeconds", totalTime,
    // "totalTimeFormatted", formatTime(totalTime)
    // ));
    //
    // result.put("knowledgePoints", knowledgePoints);
    //
    // return result;
    // }
    private String formatTime(long seconds) {
        if (seconds < 60) {
            return seconds + "秒";
        } else if (seconds < 3600) {
            long minutes = seconds / 60;
            long remainingSeconds = seconds % 60;
            return minutes + "分" + remainingSeconds + "秒";
        } else {
            long hours = seconds / 3600;
            long minutes = (seconds % 3600) / 60;
            return hours + "小时" + minutes + "分";
        }
    }
}
