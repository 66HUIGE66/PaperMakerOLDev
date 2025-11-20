package org.example.papermaker.controller;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 测试控制器
 * 用于验证后端服务是否正常运行
 * 
 * @author System
 * @since 1.0.0
 */
@RestController
@RequestMapping("/api/test")
@CrossOrigin(originPatterns = "*")
public class TestController {

    /**
     * 测试API连接
     */
    @GetMapping("/ping")
    public Map<String, Object> ping() {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "后端服务正常运行");
        response.put("data", Map.of(
            "timestamp", System.currentTimeMillis(),
            "service", "PaperMaker",
            "version", "1.0.0"
        ));
        return response;
    }

    /**
     * 测试规则管理API
     */
    @GetMapping("/rules")
    public Map<String, Object> testRules() {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "规则管理API测试成功");
        response.put("data", Map.of(
            "total", 0,
            "records", new Object[0],
            "current", 1,
            "size", 10
        ));
        return response;
    }
}
