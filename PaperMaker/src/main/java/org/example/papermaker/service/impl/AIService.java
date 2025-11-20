package org.example.papermaker.service.impl;

import org.example.papermaker.service.AIAssistantService;
import org.example.papermaker.service.AIPaperGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

/**
 * AI服务类
 * 负责调用大模型API生成题目
 * 使用HTTP客户端直接调用AI服务
 * 
 * @author System
 * @since 1.0.0
 */
@Service
public class AIService {
    
    @Autowired
    private AIPaperGenerationService aiPaperGenerationService;

    @Autowired
    private AIAssistantService aiAssistantService;

    public String ruleByAi(String userMessage) {
        return aiPaperGenerationService.chat(userMessage);
    }
    public Flux<String> chatWithAiA(String userMessage) {
        return aiAssistantService.chat(userMessage)
                .doFinally(signalType -> {
                    // 清理工具类用户ID上下文
                    org.example.papermaker.context.SimpleUserContext.setToolUserId(null);
                    System.out.println("AIService.chatWithAiA - 清理工具类用户ID上下文");
                });
    }
    
    /**
     * 检查AI服务是否可用
     */
    public boolean isServiceAvailable(String testPrompt) {
        try {
            // 简单的健康检查
            Flux<String> result = aiPaperGenerationService.test(testPrompt);
            return result != null;
        } catch (Exception e) {
            System.err.println("AI服务健康检查失败: " + e.getMessage());
            return false;
        }
    }


}

