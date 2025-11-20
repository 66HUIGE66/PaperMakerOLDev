package org.example.papermaker.service;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.spring.AiService;
import dev.langchain4j.service.spring.AiServiceWiringMode;
import reactor.core.publisher.Flux;

@AiService(
        wiringMode = AiServiceWiringMode.EXPLICIT,
        chatModel = "openAiChatModel",
        streamingChatModel = "openAiStreamingChatModel",
        chatMemoryProvider = "chatMemoryProvider",//配置会话记忆对象提供者
        tools = {"subjectsTool", "learningStatisticsTool"}
)
public interface AIAssistantService {
    @SystemMessage(fromResource = "AIPrompt/AiAssistantPrompt.txt")
    public Flux<String> chat(@UserMessage String userMessage);

}
