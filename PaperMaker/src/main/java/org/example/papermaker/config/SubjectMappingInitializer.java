package org.example.papermaker.config;

import org.example.papermaker.service.SubjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 学科映射初始化器
 * 在应用启动时自动从数据库加载学科映射
 */
@Component
@Order(2)  // 在 DatabaseInitializer 之后执行
public class SubjectMappingInitializer implements ApplicationRunner {
    
    @Autowired
    private SubjectService subjectService;
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        System.out.println("========================================");
        System.out.println("初始化学科映射...");
        System.out.println("========================================");
        
        try {
            // 从数据库加载学科映射
            subjectService.refreshSubjectMapping();
            System.out.println("学科映射初始化成功");
        } catch (Exception e) {
            System.err.println("学科映射初始化失败，将使用默认映射: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("========================================");
    }
}

