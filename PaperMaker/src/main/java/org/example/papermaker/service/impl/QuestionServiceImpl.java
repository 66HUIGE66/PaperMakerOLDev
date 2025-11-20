package org.example.papermaker.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import jakarta.annotation.Resource;

import org.example.papermaker.entity.QuestionEntity;
import org.example.papermaker.mapper.QuestionMapper;
import org.example.papermaker.service.QuestionService;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.example.papermaker.service.RedisCacheService;
import org.example.papermaker.service.CacheKeyBuilder;

import java.util.Optional;

@Service
public class QuestionServiceImpl extends ServiceImpl<QuestionMapper, QuestionEntity> implements QuestionService {
    @Resource
    private QuestionMapper questionMapper;
    @Autowired
    private RedisCacheService cache;

    @Override
    public IPage<QuestionEntity> getQuestionsByCreator(Long creatorId, Page<QuestionEntity> page) {
        Page<QuestionEntity> entityPage = new Page<>(page.getCurrent(), page.getSize());
        LambdaQueryWrapper<QuestionEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuestionEntity::getCreatorId, creatorId);

        IPage<QuestionEntity> result = questionMapper.selectPage(entityPage, wrapper);
        return result;
    }

    @Override
    public IPage<QuestionEntity> getAllQuestions(Long current, Long size, Long subjectId) {
        Page<QuestionEntity> entityPage = new Page<>(current, size);
        String key = CacheKeyBuilder.qListSystem(current.intValue(), size.intValue(), subjectId);
        var cached = cache.getPage(key);
        if (cached != null) {
            @SuppressWarnings("unchecked")
            java.util.List<QuestionEntity> records = (java.util.List<QuestionEntity>) cached.get("records");
            Number total = (Number) cached.get("total");
            entityPage.setRecords(records);
            entityPage.setTotal(total == null ? records.size() : total.longValue());
            return entityPage;
        }
        // 击穿保护：热点集合加短锁
        cache.acquireLock(CacheKeyBuilder.lock(key), java.time.Duration.ofSeconds(3));
        LambdaQueryWrapper<QuestionEntity> wrapper = new LambdaQueryWrapper<>();
        
        // 如果指定了学科ID，按学科ID筛选
        if (subjectId != null) {
            wrapper.eq(QuestionEntity::getSubjectId, subjectId);
        }
        
        // 不添加其他条件，获取所有题目
        wrapper.orderByDesc(QuestionEntity::getCreatedAt);

        IPage<QuestionEntity> result = questionMapper.selectPage(entityPage, wrapper);
        cache.setPage(key, result.getRecords(), result.getTotal(), result.getCurrent(), result.getSize(), java.time.Duration.ofMinutes(20));
        return result;
    }

    public IPage<QuestionEntity> getQuestionsForUser(Long userId, Long current, Long size, Long subjectId) {
        // 参数安全处理
        Long safeCurrent = Optional.ofNullable(current).orElse(1L);
        Long safeSize = Optional.ofNullable(size).orElse(10L);

        Page<QuestionEntity> entityPage = new Page<>(safeCurrent, safeSize);
        String key = CacheKeyBuilder.qListUser(userId, safeCurrent.intValue(), safeSize.intValue(), subjectId);
        var cached = cache.getPage(key);
        if (cached != null) {
            @SuppressWarnings("unchecked")
            java.util.List<QuestionEntity> records = (java.util.List<QuestionEntity>) cached.get("records");
            Number total = (Number) cached.get("total");
            entityPage.setRecords(records);
            entityPage.setTotal(total == null ? records.size() : total.longValue());
            return entityPage;
        }
        cache.acquireLock(CacheKeyBuilder.lock(key), java.time.Duration.ofSeconds(3));
        LambdaQueryWrapper<QuestionEntity> wrapper = new LambdaQueryWrapper<>();

        // 优化后的权限逻辑
        wrapper.and(w -> w
                .eq(QuestionEntity::getIsSystem, true)
                .or(w2 -> w2
                        .eq(QuestionEntity::getIsSystem, false)
                        .eq(QuestionEntity::getCreatorId, userId)
                )
        );

        // 学科筛选
        if (subjectId != null) {
            wrapper.eq(QuestionEntity::getSubjectId, subjectId);
        }

        // 排序
        wrapper.orderByDesc(QuestionEntity::getCreatedAt);

        IPage<QuestionEntity> page = questionMapper.selectPage(entityPage, wrapper);
        cache.setPage(key, page.getRecords(), page.getTotal(), page.getCurrent(), page.getSize(), java.time.Duration.ofMinutes(20));
        // 为每条记录维护索引，便于失效
        for (QuestionEntity q : page.getRecords()) {
            if (q.getId() != null) {
                cache.addIdxForQ(q.getId(), key);
            }
        }
        return page;
    }
}
