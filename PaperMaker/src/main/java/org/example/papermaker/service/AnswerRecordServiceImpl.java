package org.example.papermaker.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import jakarta.annotation.Resource;
import org.example.papermaker.dto.GradingResult;
import org.example.papermaker.entity.AnswerRecordEntity;
import org.example.papermaker.entity.QuestionEntity;
import org.example.papermaker.mapper.AnswerRecordMapper;
import org.example.papermaker.mapper.QuestionMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AnswerRecordServiceImpl extends ServiceImpl<AnswerRecordMapper, AnswerRecordEntity>
        implements AnswerRecordService {

    @Resource
    private AnswerRecordMapper answerRecordMapper;

    @Resource
    private QuestionMapper questionMapper;

    @Autowired(required = false)
    private AIGradingService aiGradingService;

    @Autowired
    private SimilarityGradingService similarityGradingService;

    @Override
    public boolean saveBatchAnswers(Long examRecordId, List<AnswerRecordEntity> answers) {
        if (answers == null || answers.isEmpty()) {
            return true;
        }

        for (AnswerRecordEntity answer : answers) {
            answer.setExamRecordId(examRecordId);
            if (answer.getCreatedAt() == null) {
                answer.setCreatedAt(LocalDateTime.now());
            }

            // 对主观题进行相似度评分（不再自动使用AI评分）
            if (needsSimilarityGrading(answer.getQuestionType())) {
                try {
                    gradeWithSimilarity(answer);
                } catch (Exception e) {
                    // 相似度评分失败时记录日志，但不影响答案保存
                    System.err.println("相似度评分失败 - 题目ID: " + answer.getQuestionId() + ", 错误: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        }

        return saveBatch(answers);
    }

    /**
     * 判断题目类型是否需要相似度评分
     * 填空题和简答题需要相似度评分
     */
    private boolean needsSimilarityGrading(String questionType) {
        return "FILL_BLANK".equals(questionType) || "SHORT_ANSWER".equals(questionType);
    }

    /**
     * 使用相似度对答案进行评分
     */
    private void gradeWithSimilarity(AnswerRecordEntity answer) {
        // 获取题目信息
        QuestionEntity question = questionMapper.selectById(answer.getQuestionId());
        if (question == null) {
            System.err.println("题目不存在，无法进行相似度评分 - 题目ID: " + answer.getQuestionId());
            return;
        }

        // 使用默认分数（题目分数在试卷-题目关系表中，这里使用默认值5分）
        double maxScore = 5.0;

        // 计算相似度评分
        double similarityScore = similarityGradingService.calculateScore(
                answer.getUserAnswer(),
                question.getCorrectAnswer(),
                maxScore);

        // 计算相似度百分比（用于显示）
        double similarityPercentage = similarityGradingService.getSimilarityPercentage(
                answer.getUserAnswer(),
                question.getCorrectAnswer());

        // 保存相似度评分结果
        answer.setSimilarityScore(similarityPercentage / 100.0); // 存储为0-1之间的值
        answer.setFinalScore(similarityScore);
        answer.setScoreType("SIMILARITY");
        answer.setUserAcceptedAiScore(false);

        // 根据相似度评分设置是否正确（相似度>=80%认为正确）
        answer.setIsCorrect(similarityPercentage >= 80.0);

        System.out.println("相似度评分完成 - 题目ID: " + answer.getQuestionId() +
                ", 相似度: " + String.format("%.1f", similarityPercentage) + "%" +
                ", 得分: " + similarityScore + "/" + maxScore);
    }
}
