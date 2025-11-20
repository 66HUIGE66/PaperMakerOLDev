package org.example.papermaker.service;



import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.example.papermaker.entity.KnowledgePointEntity;
import org.example.papermaker.entity.SubjectEntity;
import org.example.papermaker.mapper.KnowledgePointMapper;
import org.example.papermaker.mapper.SubjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 知识点服务类
 * 
 * @author System
 * @since 1.0.0
 */
@Service
public class KnowledgePointService extends ServiceImpl<KnowledgePointMapper, KnowledgePointEntity> {

    @Autowired
    private SubjectMapper subjectMapper;
    @Autowired
    private RedisCacheService cache;
    @Value("${feature.cache.enabled:true}")
    private boolean cacheEnabled;
//    private SubjectService subjectService;

    /**
     * 根据学科名称获取知识点列表
     */
    public List<KnowledgePointEntity> getBySubject(String subject) {
        // 优先读缓存（系统维度，不区分用户；控制层可进一步按用户过滤）
        String subjectKey = subject == null ? "unknown" : subject.trim();
        List<KnowledgePointEntity> cached = cache.getList(CacheKeyBuilder.kpListSystemBySubject(subjectKey), KnowledgePointEntity.class);
        if (cached != null) {
            return cached;
        }

        QueryWrapper<KnowledgePointEntity> queryWrapper = new QueryWrapper<>();

        // 首先尝试按学科名称查询（兼容旧数据）
        queryWrapper.eq("subject", subject)
                   .eq("status", KnowledgePointEntity.Status.ACTIVE.name())
                   .orderByAsc("sort_order", "id");

        List<KnowledgePointEntity> resultByName = list(queryWrapper);

        // 如果按名称没有找到，尝试按学科ID查询（新数据格式）
        if (resultByName.isEmpty()) {
            try {
                // 尝试将学科名称转换为ID
                Long subjectId = getSubjectIdByName(subject);
                if (subjectId != null) {
                    QueryWrapper<KnowledgePointEntity> queryWrapperById = new QueryWrapper<>();
                    queryWrapperById.eq("subject_id", subjectId)
                                   .eq("status", KnowledgePointEntity.Status.ACTIVE.name())
                                   .orderByAsc("sort_order", "id");
                    resultByName = list(queryWrapperById);
                }
            } catch (Exception e) {
                // 忽略转换异常，返回空结果
            }
        }

        // 回写缓存并维护索引
        cache.setList(CacheKeyBuilder.kpListSystemBySubject(subjectKey), resultByName, java.time.Duration.ofHours(1));
        for (KnowledgePointEntity kp : resultByName) {
            if (kp.getId() != null) {
                cache.addIdxForKp(kp.getId(), CacheKeyBuilder.kpListSystemBySubject(subjectKey));
            }
        }
        return resultByName;
    }

    /**
     * 按用户维度获取某学科的个人知识点列表，并缓存
     */
    public List<KnowledgePointEntity> getBySubjectForUser(String subject, Long userId) {
        String subjectKey = subject == null ? "unknown" : subject.trim();
        String key = CacheKeyBuilder.kpListUserBySubject(userId, subjectKey);
        List<KnowledgePointEntity> cached = cache.getList(key, KnowledgePointEntity.class);
        if (cached != null) return cached;

        QueryWrapper<KnowledgePointEntity> qw = new QueryWrapper<>();
        qw.eq("subject", subjectKey)
          .eq("status", KnowledgePointEntity.Status.ACTIVE.name())
          .eq("is_system", false)
          .eq("creator_id", userId)
          .orderByAsc("sort_order", "id");
        List<KnowledgePointEntity> list = list(qw);
        cache.setList(key, list, java.time.Duration.ofHours(1));
        for (KnowledgePointEntity kp : list) { if (kp.getId() != null) cache.addIdxForKp(kp.getId(), key); }
        return list;
    }

    /**
     * 分页查询：支持 subjectId / subjectName / subjectCode、关键字、状态
     * 统一默认只显示 ACTIVE
     */
    public IPage<KnowledgePointEntity> pageQuery(
            Integer current,
            Integer size,
            Long subjectId,
            String subjectName,
            String subjectCode,
            String keyword,
            String status
    ) {
        if (current == null || current <= 0) current = 1;
        if (size == null || size <= 0) size = 10;

        QueryWrapper<KnowledgePointEntity> qw = new QueryWrapper<>();

        // 统一状态：默认ACTIVE
        String finalStatus = (status == null || status.isBlank())
                ? KnowledgePointEntity.Status.ACTIVE.name()
                : status;
        qw.eq("status", finalStatus);

        // 学科筛选 - 优先subject_id
        if (subjectId != null) {
            qw.eq("subject_id", subjectId);
        } else if (subjectName != null && !subjectName.isBlank()) {
            // 兼容旧数据：subject 字段
            qw.and(w -> w.eq("subject", subjectName).or().eq("subject", subjectName.trim()));
            Long sid = getSubjectIdByName(subjectName);
            if (sid != null) {
                qw.or().eq("subject_id", sid);
            }
        } else if (subjectCode != null && !subjectCode.isBlank()) {
            try {
                SubjectEntity s = subjectMapper.selectByCode(subjectCode);
                if (s != null) qw.eq("subject_id", s.getId());
            } catch (Exception ignored) {
            }
        }

        // 关键字
        if (keyword != null && !keyword.isBlank()) {
            final String kw = keyword.trim();
            qw.and(w -> w.like("name", kw).or().like("description", kw));
        }

        // 排序
        qw.orderByAsc("sort_order", "id");

        return this.baseMapper.selectPage(new Page<>(current, size), qw);
    }

    /**
     * 根据学科名称获取学科ID
     */
    private Long getSubjectIdByName(String subjectName) {
        try {
            SubjectEntity subject = subjectMapper.selectByName(subjectName);
            return subject != null ? subject.getId() : null;
        } catch (Exception e) {
            // 如果通过名称找不到，尝试通过code找到
            try {
                SubjectEntity subject = subjectMapper.selectByCode(subjectName);
                return subject != null ? subject.getId() : null;
            } catch (Exception e2) {
                return null;
            }
        }
    }

    /**
     * 根据学科ID获取知识点列表
     */
    public List<KnowledgePointEntity> getBySubjectId(Long subjectId) {
        QueryWrapper<KnowledgePointEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("subject_id", subjectId)
                   .eq("status", KnowledgePointEntity.Status.ACTIVE.name())
                   .orderByAsc("sort_order", "id");
        return list(queryWrapper);
    }

    /**
     * 获取所有启用的知识点
     */
    public List<KnowledgePointEntity> getAllActive() {
        QueryWrapper<KnowledgePointEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", KnowledgePointEntity.Status.ACTIVE.name())
                   .orderByAsc("subject", "sort_order", "id");
        return list(queryWrapper);
    }

    /**
     * 根据学科获取知识点权重总和
     */
    public BigDecimal getTotalWeightBySubject(String subject) {
        List<KnowledgePointEntity> knowledgePoints = getBySubject(subject);
        return knowledgePoints.stream()
                .map(KnowledgePointEntity::getWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * 获取知识点权重分布
     */
    public Map<String, BigDecimal> getWeightDistribution(String subject) {
        List<KnowledgePointEntity> knowledgePoints = getBySubject(subject);
        return knowledgePoints.stream()
                .collect(Collectors.toMap(
                    KnowledgePointEntity::getName,
                    KnowledgePointEntity::getWeight,
                    (existing, replacement) -> existing
                ));
    }

    /**
     * 验证权重总和是否合理
     */
    public boolean validateWeightSum(String subject, BigDecimal newWeight) {
        BigDecimal currentTotal = getTotalWeightBySubject(subject);
        return currentTotal.add(newWeight).compareTo(new BigDecimal("100")) <= 0;
    }

    /**
     * 创建默认知识点
     */
    public void createDefaultKnowledgePoints(String subject, Long creatorId) {
        // 基础概念
        KnowledgePointEntity basicConcepts = new KnowledgePointEntity();
        basicConcepts.setName("基础概念");
        basicConcepts.setDescription("学科基础概念和定义");
        basicConcepts.setSubject(subject);
        basicConcepts.setWeight(BigDecimal.ZERO); // 权重已弃用，默认为0
        basicConcepts.setDifficultyLevel(KnowledgePointEntity.DifficultyLevel.EASY.name());
        basicConcepts.setCreatorId(creatorId);
        basicConcepts.setIsSystem(true);
        basicConcepts.setStatus(KnowledgePointEntity.Status.ACTIVE.name());
        basicConcepts.setSortOrder(1);
        save(basicConcepts);

        // 核心理论
        KnowledgePointEntity coreTheory = new KnowledgePointEntity();
        coreTheory.setName("核心理论");
        coreTheory.setDescription("学科核心理论和原理");
        coreTheory.setSubject(subject);
        coreTheory.setWeight(BigDecimal.ZERO); // 权重已弃用，默认为0
        coreTheory.setDifficultyLevel(KnowledgePointEntity.DifficultyLevel.MEDIUM.name());
        coreTheory.setCreatorId(creatorId);
        coreTheory.setIsSystem(true);
        coreTheory.setStatus(KnowledgePointEntity.Status.ACTIVE.name());
        coreTheory.setSortOrder(2);
        save(coreTheory);

        // 应用实践
        KnowledgePointEntity application = new KnowledgePointEntity();
        application.setName("应用实践");
        application.setDescription("理论知识的实际应用");
        application.setSubject(subject);
        application.setWeight(BigDecimal.ZERO); // 权重已弃用，默认为0
        application.setDifficultyLevel(KnowledgePointEntity.DifficultyLevel.HARD.name());
        application.setCreatorId(creatorId);
        application.setIsSystem(true);
        application.setStatus(KnowledgePointEntity.Status.ACTIVE.name());
        application.setSortOrder(3);
        save(application);
    }

    /**
     * 更新知识点权重（权重已弃用，不再进行校验）
     */
    public boolean updateWeight(Long id, BigDecimal newWeight) {
        KnowledgePointEntity knowledgePoint = getById(id);
        if (knowledgePoint == null) {
            return false;
        }

        // 权重已弃用，不再进行校验
        if (newWeight == null) {
            newWeight = BigDecimal.ZERO;
        }

        knowledgePoint.setWeight(newWeight);
        return updateById(knowledgePoint);
    }

    /**
     * 批量更新知识点权重
     */
    public boolean batchUpdateWeights(Map<Long, BigDecimal> weightMap) {
        for (Map.Entry<Long, BigDecimal> entry : weightMap.entrySet()) {
            if (!updateWeight(entry.getKey(), entry.getValue())) {
                return false;
            }
        }
        return true;
    }
}













