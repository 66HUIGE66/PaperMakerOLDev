package org.example.papermaker.config;

import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.agent.tool.ToolSpecification;
import dev.langchain4j.agent.tool.ToolSpecifications;
import dev.langchain4j.service.tool.*;
import org.example.papermaker.tool.SubjectsTool;
import org.example.papermaker.tool.LearningStatisticsTool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


import java.lang.reflect.Method;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;

/**
 * 配置注入tool工具类， 也可以在@AiService中指定工具类
 */
@Configuration
public class ToolConfig {
    @Autowired
    private SubjectsTool subjectsTool;
    
    @Autowired
    private LearningStatisticsTool learningStatisticsTool;

    @Bean
    public ToolProvider toolProvider(){
        return toolProviderRequest -> {
            HashSet<Object> objectsWithTools = new HashSet<>();
            objectsWithTools.add(subjectsTool);
            objectsWithTools.add(learningStatisticsTool);
//            UserMessage userMessage = toolProviderRequest.userMessage();
//            if (userMessage.hasSingleText()) {
//                String singleText = userMessage.singleText();
//                if (singleText.equals("学科")) {
//                    objectsWithTools.add(subjectsTool);
//                }
//            }
            return ToolProviderResult.builder().addAll(parseTools(objectsWithTools)).build();
        };
    }

    private HashMap<ToolSpecification , ToolExecutor> parseTools(Collection<Object> objectsWithTools){
        var tools = new HashMap<ToolSpecification , ToolExecutor>();
        for (Object objectsWithTool : objectsWithTools) {
            for (Method method : objectsWithTool.getClass().getDeclaredMethods()) {
                if (method.isAnnotationPresent(Tool.class)) {
                    //调用工具类将注解的方法信息转为ToolSpecifications信息
                    ToolSpecification toolSpecification = ToolSpecifications.toolSpecificationFrom(method);
                    //构造方法执行器
                    DefaultToolExecutor toolExecutor = new DefaultToolExecutor(objectsWithTool, method);
                    tools.put(toolSpecification , toolExecutor);
                }
            }
        }
        return tools;
    }
}
