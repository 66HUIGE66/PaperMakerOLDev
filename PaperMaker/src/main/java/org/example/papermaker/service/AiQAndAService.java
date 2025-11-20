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
        chatMemoryProvider = "chatMemoryProvider"//配置会话记忆对象提供者
)
public interface AiQAndAService {
    @SystemMessage(
            "你是一个试题回答助手，能够回答用户关于试题的问题" +
                    "（如这道题怎么写，为什么这么做之类的问题）" +
                    "当用户问你其他话题时不做回答并提示用户"
    )
    public Flux<String> chat(@UserMessage String userMessage);

}
