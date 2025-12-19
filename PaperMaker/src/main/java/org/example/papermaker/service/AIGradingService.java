package org.example.papermaker.service;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import dev.langchain4j.service.spring.AiService;
import dev.langchain4j.service.spring.AiServiceWiringMode;
import org.example.papermaker.dto.GradingResult;

/**
 * AI评分服务接口
 * 使用LangChain4j实现智能评分功能
 * 支持填空题和简答题的自动评分
 */
@AiService(wiringMode = AiServiceWiringMode.EXPLICIT, chatModel = "openAiChatModel")
public interface AIGradingService {

    /**
     * 对主观题答案进行AI评分
     * 
     * @param questionType  题目类型（FILL_BLANK或SHORT_ANSWER）
     * @param questionTitle 题目标题
     * @param correctAnswer 标准答案
     * @param userAnswer    学生答案
     * @param explanation   题目解析（可选）
     * @return 评分结果，包含分数、反馈和建议
     */
    @SystemMessage(fromResource = "AIPrompt/AIGradingPrompt.txt")
    @UserMessage("""
            请对以下主观题答案进行评分：

            题目类型：{{questionType}}
            题目内容：{{questionTitle}}
            标准答案：{{correctAnswer}}
            学生答案：{{userAnswer}}
            题目解析：{{explanation}}

            请严格按照JSON格式输出评分结果。
            """)
    GradingResult gradeAnswer(
            @V("questionType") String questionType,
            @V("questionTitle") String questionTitle,
            @V("correctAnswer") String correctAnswer,
            @V("userAnswer") String userAnswer,
            @V("explanation") String explanation);
}
