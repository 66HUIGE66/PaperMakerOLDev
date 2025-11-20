package org.example.papermaker.controller;

import org.example.papermaker.service.RedisCacheService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/cache")
public class CacheController {
    @Autowired
    private RedisCacheService cache;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> data = cache.getStats();
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "ok");
        result.put("data", data);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/evict")
    public ResponseEntity<Map<String, Object>> evict(@RequestParam(required = false) Long kpId,
                                                     @RequestParam(required = false) Long questionId) {
        if (kpId != null) cache.evictByKp(kpId);
        if (questionId != null) cache.evictByQuestion(questionId);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "evicted");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/evict-prefix")
    public ResponseEntity<Map<String, Object>> evictByPrefix(@RequestParam String prefix) {
        cache.evictByPrefix(prefix);
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "evicted by prefix");
        result.put("prefix", prefix);
        return ResponseEntity.ok(result);
    }
}