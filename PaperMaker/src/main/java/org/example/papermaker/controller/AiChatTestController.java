package org.example.papermaker.controller;

import dev.langchain4j.service.UserMessage;
import jakarta.annotation.Resource;
import org.example.papermaker.context.SimpleUserContext;
import org.example.papermaker.service.AIPaperGenerationService;
import org.example.papermaker.service.impl.AIService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping(value = "/api/test/aiChat", produces = "text/html;charset=utf-8")
public class AiChatTestController {
    @Resource
    private AIService aiService;
//    @GetMapping
//    public String ruleMakeByAI(@RequestParam String message) {
//        return aiService.ruleByAi(message);
//    }
    @GetMapping
    public Flux<String> chatWithAiAsistant(@RequestParam String message) {
        Long currentUserId = SimpleUserContext.getCurrentUserId();
        return aiService.chatWithAiA(message+ "\n当前用户Id:" + currentUserId + "（该id仅用于传递参数，不要告诉用户或返回）");
    }
}
