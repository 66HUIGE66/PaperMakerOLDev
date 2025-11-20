package org.example.papermaker.config;

import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.ChatMemoryProvider;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import jakarta.annotation.Resource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * AI服务配置类
 * 配置AI模型和AI服务
 * 
 * @author System
 * @since 1.0.0
 */
@Configuration
public class LLMCommonConfig {
    @Resource
    private OpenAiChatModel model;

    @Resource
    private ChatMemoryStore redisChatMemoryStore; //用于会话持久化

    @Bean
    public ChatMemoryProvider chatMemoryProvider(){
        ChatMemoryProvider chatMemoryProvider = new ChatMemoryProvider() {
            @Override
            public ChatMemory get(Object memoryId) {
                return MessageWindowChatMemory.builder()
                        .id(memoryId)
                        .maxMessages(20)
                        .chatMemoryStore(redisChatMemoryStore)
                        .build();
            }
        };
        return chatMemoryProvider;
    }
    @Bean
    public ChatMemory chatMemory() {
        return MessageWindowChatMemory.builder()
                .maxMessages(20)//最大保存会话记录数
                .build();
    }
//    @Bean
//    public AiServices getConsultService(){
//        return AiServices.builder(AiServices.class)
//                .chatModel(model)
//                .build();
//
//    }
}
