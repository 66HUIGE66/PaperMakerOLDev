package org.example.papermaker.service;

import org.springframework.stereotype.Service;

/**
 * 相似度评分服务
 * 用于对主观题（填空题、简答题）进行基于相似度的初始评分
 */
@Service
public class SimilarityGradingService {

    /**
     * 计算答案相似度并返回得分
     * 
     * @param userAnswer    用户答案
     * @param correctAnswer 标准答案
     * @param maxScore      该题最大分数
     * @return 相似度得分（按0.5分递增）
     */
    public double calculateScore(String userAnswer, String correctAnswer, double maxScore) {
        if (userAnswer == null || userAnswer.trim().isEmpty()) {
            return 0.0;
        }

        if (correctAnswer == null || correctAnswer.trim().isEmpty()) {
            return 0.0;
        }

        // 标准化答案（去除空格、转小写）
        String normalizedUser = normalizeAnswer(userAnswer);
        String normalizedCorrect = normalizeAnswer(correctAnswer);

        // 完全匹配
        if (normalizedUser.equals(normalizedCorrect)) {
            return maxScore;
        }

        // 计算相似度 (0-1)
        double similarity = calculateSimilarity(normalizedUser, normalizedCorrect);

        // 转换为分数，按0.5分递增
        double rawScore = similarity * maxScore;
        double gradualScore = Math.round(rawScore * 2) / 2.0; // 四舍五入到0.5

        return Math.min(gradualScore, maxScore);
    }

    /**
     * 计算相似度分数（0-1之间）
     * 使用Levenshtein距离算法
     */
    public double calculateSimilarity(String s1, String s2) {
        if (s1.equals(s2)) {
            return 1.0;
        }

        int maxLength = Math.max(s1.length(), s2.length());
        if (maxLength == 0) {
            return 1.0;
        }

        int distance = levenshteinDistance(s1, s2);
        return 1.0 - ((double) distance / maxLength);
    }

    /**
     * 标准化答案
     * 去除多余空格、转小写、去除标点符号
     */
    private String normalizeAnswer(String answer) {
        return answer.trim()
                .toLowerCase()
                .replaceAll("\\s+", " ") // 多个空格替换为单个空格
                .replaceAll("[，。！？；：、]", ""); // 去除中文标点
    }

    /**
     * 计算Levenshtein距离（编辑距离）
     * 表示将一个字符串转换为另一个字符串所需的最少编辑操作次数
     */
    private int levenshteinDistance(String s1, String s2) {
        int len1 = s1.length();
        int len2 = s2.length();

        // 创建距离矩阵
        int[][] dp = new int[len1 + 1][len2 + 1];

        // 初始化第一行和第一列
        for (int i = 0; i <= len1; i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= len2; j++) {
            dp[0][j] = j;
        }

        // 动态规划计算编辑距离
        for (int i = 1; i <= len1; i++) {
            for (int j = 1; j <= len2; j++) {
                if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                            Math.min(dp[i - 1][j], dp[i][j - 1]),
                            dp[i - 1][j - 1]) + 1;
                }
            }
        }

        return dp[len1][len2];
    }

    /**
     * 获取相似度百分比（用于显示）
     */
    public double getSimilarityPercentage(String userAnswer, String correctAnswer) {
        String normalizedUser = normalizeAnswer(userAnswer);
        String normalizedCorrect = normalizeAnswer(correctAnswer);
        return calculateSimilarity(normalizedUser, normalizedCorrect) * 100;
    }
}
