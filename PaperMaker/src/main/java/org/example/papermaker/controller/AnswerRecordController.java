package org.example.papermaker.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.example.papermaker.dto.GradingResult;
import org.example.papermaker.entity.AnswerRecordEntity;
import org.example.papermaker.entity.ExamRecordEntity;
import org.example.papermaker.entity.QuestionEntity;
import org.example.papermaker.mapper.QuestionMapper;
import org.example.papermaker.service.AIGradingService;
import org.example.papermaker.service.AnswerRecordService;
import org.example.papermaker.service.ExamPaperService;
import org.example.papermaker.vo.RespBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/answer-record")
@Tag(name = "答题记录管理")
public class AnswerRecordController {

    @Resource
    private AnswerRecordService answerRecordService;

    @Resource
    private org.example.papermaker.service.ExamRecordService examRecordService;

    @Resource
    private ExamPaperService examPaperService;

    public static class SaveAnswersRequest {
        public Long examRecordId;
        public List<AnswerRecordEntity> answers;
    }

    @PostMapping("/save-batch")
    @Operation(summary = "批量保存答题记录")
    public RespBean saveBatch(@RequestBody SaveAnswersRequest req) {
        if (req == null || req.examRecordId == null) {
            return new RespBean(400, "examRecordId 不能为空", null);
        }
        boolean ok = answerRecordService.saveBatchAnswers(req.examRecordId, req.answers);
        return ok ? new RespBean(200, "保存成功", null) : new RespBean(500, "保存失败", null);
    }

    @GetMapping("/by-exam/{examRecordId}")
    @Operation(summary = "根据考试记录ID获取答题记录")
    public RespBean listByExamRecordId(@PathVariable Long examRecordId) {
        List<AnswerRecordEntity> list = answerRecordService.lambdaQuery()
                .eq(AnswerRecordEntity::getExamRecordId, examRecordId)
                .list();
        return new RespBean(200, "查询成功", list);
    }

    @Autowired(required = false)
    private AIGradingService aiGradingService;

    @Autowired
    private QuestionMapper questionMapper;

    @PostMapping("/ai-regrade/{answerId}")
    @Operation(summary = "对答案进行AI重新评分")
    public RespBean aiRegrade(@PathVariable Long answerId) {
        // 获取答题记录
        AnswerRecordEntity answer = answerRecordService.getById(answerId);
        if (answer == null) {
            return new RespBean(404, "答题记录不存在", null);
        }

        // 检查是否为主观题
        if (!"FILL_BLANK".equals(answer.getQuestionType()) && !"SHORT_ANSWER".equals(answer.getQuestionType())) {
            return new RespBean(400, "只有填空题和简答题支持AI评分", null);
        }

        // 检查AI评分服务是否可用
        if (aiGradingService == null) {
            return new RespBean(500, "AI评分服务未配置", null);
        }

        // 获取题目信息
        QuestionEntity question = questionMapper.selectById(answer.getQuestionId());
        if (question == null) {
            return new RespBean(404, "题目不存在", null);
        }

        try {
            // 调用AI评分服务
            GradingResult result = aiGradingService.gradeAnswer(
                    answer.getQuestionType(),
                    question.getTitle(),
                    question.getCorrectAnswer(),
                    answer.getUserAnswer(),
                    question.getExplanation() != null ? question.getExplanation() : "");

            if (result == null) {
                return new RespBean(500, "AI评分失败", null);
            }

            // 更新答题记录的AI评分信息（但不更新最终得分）
            answer.setAiScore(result.getScore());
            answer.setAiFeedback(result.getFeedback());
            answer.setAiSuggestions(result.getSuggestions());
            answerRecordService.updateById(answer);

            // 返回AI评分结果
            Map<String, Object> data = new HashMap<>();
            data.put("aiScore", result.getScore());
            data.put("aiFeedback", result.getFeedback());
            data.put("aiSuggestions", result.getSuggestions());
            data.put("grade", result.getGrade());
            data.put("currentScore", answer.getFinalScore());
            // 获取题目分值信息
            Long examRecordId = answer.getExamRecordId();
            ExamRecordEntity examRecord = examRecordService.getById(examRecordId);
            Double questionMaxScore = 5.0; // 默认值
            if (examRecord != null) {
                Double score = examPaperService.getQuestionScore(examRecord.getPaperId(), answer.getQuestionId());
                if (score != null) {
                    questionMaxScore = score;
                }
            }

            data.put("maxScore", questionMaxScore);

            return new RespBean(200, "AI评分成功", data);
        } catch (Exception e) {
            e.printStackTrace();
            return new RespBean(500, "AI评分失败: " + e.getMessage(), null);
        }
    }

    @PostMapping("/accept-ai-score/{answerId}")
    @Operation(summary = "接受AI评分结果")
    public RespBean acceptAiScore(@PathVariable Long answerId) {
        // 获取答题记录
        AnswerRecordEntity answer = answerRecordService.getById(answerId);
        if (answer == null) {
            return new RespBean(404, "答题记录不存在", null);
        }

        // 检查是否有AI评分
        if (answer.getAiScore() == null) {
            return new RespBean(400, "该答题记录没有AI评分", null);
        }

        // 获取题目信息以获取最大分数
        QuestionEntity question = questionMapper.selectById(answer.getQuestionId());
        if (question == null) {
            return new RespBean(404, "题目不存在", null);
        }

        // 获取题目在试卷中的分值
        AnswerRecordEntity answerRecord = answerRecordService.getById(answerId);
        ExamRecordEntity examRecord = examRecordService.getById(answerRecord.getExamRecordId());
        Double questionScore = examPaperService.getQuestionScore(examRecord.getPaperId(), answer.getQuestionId());
        double maxScore = questionScore != null ? questionScore : 5.0;

        // 更新最终得分为AI评分（AI评分通常是0-100，需要换算）
        double finalScore = (answer.getAiScore() / 100.0) * maxScore;
        // 保留一位小数
        finalScore = Math.round(finalScore * 10.0) / 10.0;

        answer.setFinalScore(finalScore);
        answer.setScoreType("AI");
        answer.setUserAcceptedAiScore(true);

        // 根据AI评分更新是否正确（得分>=80%认为正确）
        answer.setIsCorrect(answer.getAiScore() >= maxScore * 0.8);

        boolean success = answerRecordService.updateById(answer);

        if (success) {
            // 重新计算考试记录的总分和正确率
            examRecordService.recalculateScore(answer.getExamRecordId());

            Map<String, Object> data = new HashMap<>();
            data.put("finalScore", answer.getFinalScore());
            data.put("scoreType", answer.getScoreType());
            return new RespBean(200, "已接受AI评分", data);
        } else {
            return new RespBean(500, "更新失败", null);
        }
    }
}
