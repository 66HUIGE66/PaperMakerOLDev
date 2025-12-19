package org.example.papermaker.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI评分结果DTO
 * 用于封装AI评分服务返回的评分数据
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradingResult {

    /**
     * 评分分数 (0-100)
     */
    @JsonProperty("score")
    private Integer score;

    /**
     * 评分反馈
     * 说明答案的优点和不足
     */
    @JsonProperty("feedback")
    private String feedback;

    /**
     * 改进建议
     * 给出具体的提升方向
     */
    @JsonProperty("suggestions")
    private String suggestions;

    /**
     * 是否正确
     * 根据分数判断，>=60分为正确
     */
    public boolean isCorrect() {
        return score != null && score >= 60;
    }

    /**
     * 获取评分等级
     * 
     * @return 优秀/良好/及格/不及格
     */
    public String getGrade() {
        if (score == null) {
            return "未评分";
        }
        if (score >= 90) {
            return "优秀";
        } else if (score >= 75) {
            return "良好";
        } else if (score >= 60) {
            return "及格";
        } else {
            return "不及格";
        }
    }
}
