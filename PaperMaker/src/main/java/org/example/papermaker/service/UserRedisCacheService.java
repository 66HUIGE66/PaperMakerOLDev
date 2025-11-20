package org.example.papermaker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.papermaker.entity.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * 用户Redis缓存服务
 * 用于在Redis中存储和获取用户信息，解决异步线程中无法获取用户上下文的问题
 * 
 * @author System
 * @since 1.0.0
 */
@Service
public class UserRedisCacheService {
    
    private static final String USER_CACHE_PREFIX = "user:token:";
    private static final long EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24小时，与JWT过期时间一致
    
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * 将用户信息存入Redis
     * 
     * @param token JWT token
     * @param user 用户实体
     */
    public void setUser(String token, UserEntity user) {
        try {
            String key = USER_CACHE_PREFIX + token;
            String userJson = objectMapper.writeValueAsString(user);
            // 设置过期时间，与JWT过期时间一致
            redisTemplate.opsForValue().set(key, userJson, Duration.ofMillis(EXPIRATION_TIME));
        } catch (Exception e) {
            throw new RuntimeException("保存用户信息到Redis失败", e);
        }
    }
    
    /**
     * 从Redis获取用户信息
     * 
     * @param token JWT token
     * @return 用户实体，如果不存在则返回null
     */
    public UserEntity getUser(String token) {
        try {
            String key = USER_CACHE_PREFIX + token;
            String userJson = redisTemplate.opsForValue().get(key);
            if (userJson == null || userJson.isEmpty()) {
                return null;
            }
            return objectMapper.readValue(userJson, UserEntity.class);
        } catch (Exception e) {
            System.err.println("从Redis获取用户信息失败: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * 从请求头中提取token并获取用户信息
     * 
     * @param authHeader Authorization请求头（格式：Bearer token）
     * @return 用户实体，如果不存在则返回null
     */
    public UserEntity getUserFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7); // 移除 "Bearer " 前缀
        return getUser(token);
    }
    
    /**
     * 删除用户信息
     * 
     * @param token JWT token
     */
    public void deleteUser(String token) {
        String key = USER_CACHE_PREFIX + token;
        redisTemplate.delete(key);
    }
    
    /**
     * 从请求头中提取token并删除用户信息
     * 
     * @param authHeader Authorization请求头（格式：Bearer token）
     */
    public void deleteUserFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return;
        }
        String token = authHeader.substring(7); // 移除 "Bearer " 前缀
        deleteUser(token);
    }
}



