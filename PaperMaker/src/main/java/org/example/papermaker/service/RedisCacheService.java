package org.example.papermaker.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.papermaker.entity.KnowledgePointEntity;
import org.example.papermaker.entity.QuestionEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

@Service
public class RedisCacheService {
    @Autowired
    private StringRedisTemplate redis;

    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${feature.cache.enabled:true}")
    private boolean cacheEnabled;

    private final java.util.concurrent.atomic.AtomicLong hits = new java.util.concurrent.atomic.AtomicLong(0);
    private final java.util.concurrent.atomic.AtomicLong misses = new java.util.concurrent.atomic.AtomicLong(0);

    public boolean isEnabled() { return cacheEnabled; }

    public <T> List<T> getList(String key, Class<T> clazz) {
        if (!cacheEnabled) return null;
        try {
            String json = redis.opsForValue().get(key);
            if (json == null || json.isEmpty()) { misses.incrementAndGet(); return null; }
            hits.incrementAndGet();
            return mapper.readValue(json, mapper.getTypeFactory().constructCollectionType(List.class, clazz));
        } catch (Exception e) {
            return null;
        }
    }

    public void setList(String key, List<?> list, Duration ttl) {
        if (!cacheEnabled) return;
        try {
            String json = mapper.writeValueAsString(list);
            redis.opsForValue().set(key, json, ttl);
        } catch (Exception ignored) {}
    }

    public Map<String, Object> getPage(String key) {
        if (!cacheEnabled) return null;
        try {
            String json = redis.opsForValue().get(key);
            if (json == null || json.isEmpty()) { misses.incrementAndGet(); return null; }
            hits.incrementAndGet();
            return mapper.readValue(json, new TypeReference<Map<String, Object>>(){});
        } catch (Exception e) {
            return null;
        }
    }

    public void setPage(String key, List<QuestionEntity> records, long total, long current, long size, Duration ttl) {
        if (!cacheEnabled) return;
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("records", records);
            payload.put("total", total);
            payload.put("current", current);
            payload.put("size", size);
            String json = mapper.writeValueAsString(payload);
            redis.opsForValue().set(key, json, ttl);
        } catch (Exception ignored) {}
    }

    public boolean acquireLock(String lockKey, Duration ttl) {
        try {
            Boolean ok = redis.opsForValue().setIfAbsent(lockKey, "1", ttl);
            return Boolean.TRUE.equals(ok);
        } catch (Exception e) {
            return false;
        }
    }

    public void addIdxForKp(Long kpId, String cacheKey) {
        if (!cacheEnabled) return;
        try { redis.opsForSet().add(CacheKeyBuilder.idxKp(kpId), cacheKey); } catch (Exception ignored) {}
    }
    public void addIdxForQ(Long qId, String cacheKey) {
        if (!cacheEnabled) return;
        try { redis.opsForSet().add(CacheKeyBuilder.idxQ(qId), cacheKey); } catch (Exception ignored) {}
    }

    public void evictByKp(Long kpId) {
        try {
            String idxKey = CacheKeyBuilder.idxKp(kpId);
            Set<String> keys = redis.opsForSet().members(idxKey);
            if (keys != null && !keys.isEmpty()) {
                redis.delete(keys);
            }
        } catch (Exception ignored) {}
    }

    public void evictByQuestion(Long qId) {
        try {
            String idxKey = CacheKeyBuilder.idxQ(qId);
            Set<String> keys = redis.opsForSet().members(idxKey);
            if (keys != null && !keys.isEmpty()) {
                redis.delete(keys);
            }
        } catch (Exception ignored) {}
    }

    public void evictKey(String key) {
        try { redis.delete(key); } catch (Exception ignored) {}
    }

    public void evictByPrefix(String prefix) {
        try {
            java.util.Set<String> keys = redis.keys(prefix + "*");
            if (keys != null && !keys.isEmpty()) redis.delete(keys);
        } catch (Exception ignored) {}
    }

    public java.util.Map<String, Object> getStats() {
        java.util.Map<String, Object> m = new java.util.HashMap<>();
        long h = hits.get();
        long ms = misses.get();
        m.put("enabled", cacheEnabled);
        m.put("hits", h);
        m.put("misses", ms);
        m.put("hitRate", (h + ms) == 0 ? 0.0 : ((double) h / (h + ms)));
        return m;
    }
}