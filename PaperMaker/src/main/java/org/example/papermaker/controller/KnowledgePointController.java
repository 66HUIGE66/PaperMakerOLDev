package org.example.papermaker.controller;



import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.example.papermaker.context.SimpleUserContext;
import org.example.papermaker.entity.KnowledgePointEntity;
import org.example.papermaker.entity.QuestionEntity;
import org.example.papermaker.entity.UserEntity;
import org.example.papermaker.service.KnowledgePointService;
import org.example.papermaker.service.QuestionService;
import org.example.papermaker.util.SimplePermissionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 知识点管理控制器
 * 
 * @author System
 * @since 1.0.0
 */
@RestController
@RequestMapping("/knowledge-points")
public class KnowledgePointController {

    @Autowired
    private KnowledgePointService knowledgePointService;
    @Autowired
    private org.example.papermaker.service.RedisCacheService redisCacheService;
    @Autowired
    private QuestionService  questionService;

    /**
     * 获取知识点列表
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getKnowledgePoints(
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) Boolean isSystem) {
        try {
            //  权限检查：获取当前用户
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (currentUser == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 401);
                result.put("message", "用户未登录");
                result.put("data", null);
                return ResponseEntity.status(401).body(result);
            }

            List<KnowledgePointEntity> knowledgePoints;
            if (subject != null && !subject.trim().isEmpty()) {
                if (isSystem != null && !isSystem) {
                    knowledgePoints = knowledgePointService.getBySubjectForUser(subject, currentUser.getId());
                } else {
                    knowledgePoints = knowledgePointService.getBySubject(subject);
                }
            } else {
                knowledgePoints = knowledgePointService.getAllActive();
            }

            //  权限控制：非管理员只能看到系统知识点或自己创建的知识点
            if (!SimplePermissionUtils.isAdmin(currentUser)) {
                knowledgePoints = knowledgePoints.stream()
                    .filter(kp -> {
                        Boolean kpIsSystem = kp.getIsSystem();
                        if (kpIsSystem == null) {
                            kpIsSystem = true; // 默认值
                        }
                        // 系统知识点或自己创建的知识点
                        return kpIsSystem || currentUser.getId().equals(kp.getCreatorId());
                    })
                    .collect(java.util.stream.Collectors.toList());
            }

            // 按系统/个人筛选（如果指定了isSystem参数）
            if (isSystem != null) {
                final Boolean finalIsSystem = isSystem;
                knowledgePoints = knowledgePoints.stream()
                    .filter(kp -> finalIsSystem.equals(kp.getIsSystem()))
                    .collect(java.util.stream.Collectors.toList());
            }

            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "获取成功");
            result.put("data", knowledgePoints);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "获取失败: " + e.getMessage());
            result.put("data", null);
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * 创建知识点
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createKnowledgePoint(@RequestBody KnowledgePointEntity knowledgePoint) {
        try {
            // 获取当前用户
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (currentUser != null) {
                knowledgePoint.setCreatorId(currentUser.getId());
                // 关键改动：管理员创建系统知识点，普通用户创建个人知识点
                knowledgePoint.setIsSystem(SimplePermissionUtils.hasSystemManagePermission(currentUser));
            } else {
                knowledgePoint.setIsSystem(false);
            }
            knowledgePoint.setStatus(KnowledgePointEntity.Status.ACTIVE.name());

            // 查重验证：检查知识点名称是否已存在于同一学科
            List<KnowledgePointEntity> existingPoints = knowledgePointService.getBySubject(knowledgePoint.getSubject());
            for (KnowledgePointEntity existing : existingPoints) {
                if (existing.getName().equals(knowledgePoint.getName())) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("code", 400);
                    result.put("message", "学科【" + knowledgePoint.getSubject() + "】下已存在知识点【" + knowledgePoint.getName() + "】");
                    result.put("data", null);
                    return ResponseEntity.badRequest().body(result);
                }
            }

            // 权重已弃用，不再进行校验
            // 如果weight为null，默认设置为0
            if (knowledgePoint.getWeight() == null) {
                knowledgePoint.setWeight(java.math.BigDecimal.ZERO);
            }

            boolean success = knowledgePointService.save(knowledgePoint);
            Map<String, Object> result = new HashMap<>();
            if (success) {
                try { redisCacheService.evictKey(org.example.papermaker.service.CacheKeyBuilder.kpListSystemBySubject(knowledgePoint.getSubject())); } catch (Exception ignored) {}
                result.put("code", 200);
                result.put("message", "创建成功");
                result.put("data", knowledgePoint);
            } else {
                result.put("code", 500);
                result.put("message", "创建失败");
                result.put("data", null);
            }
            return ResponseEntity.ok(result);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // 数据库唯一约束违反
            Map<String, Object> result = new HashMap<>();
            result.put("code", 400);
            result.put("message", "知识点已存在");
            result.put("data", null);
            return ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "创建失败: " + e.getMessage());
            result.put("data", null);
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * 更新知识点
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateKnowledgePoint(
            @PathVariable Long id, @RequestBody KnowledgePointEntity knowledgePoint) {
        try {
            KnowledgePointEntity existing = knowledgePointService.getById(id);
            if (existing == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 404);
                result.put("message", "知识点不存在");
                result.put("data", null);
                return ResponseEntity.notFound().build();
            }
            // 权限检查：非管理员不可编辑系统知识点；普通用户只能编辑自己创建的知识点
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (!SimplePermissionUtils.hasContentEditPermission(currentUser, existing.getCreatorId())
                || !SimplePermissionUtils.hasSystemContentEditPermission(currentUser, Boolean.TRUE.equals(existing.getIsSystem()))) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 403);
                result.put("message", "权限不足，无法编辑此知识点");
                result.put("data", null);
                return ResponseEntity.status(403).body(result);
            }

            // 权重已弃用，不再进行校验
            // 如果weight为null，默认设置为0
            if (knowledgePoint.getWeight() == null) {
                knowledgePoint.setWeight(java.math.BigDecimal.ZERO);
            }

            knowledgePoint.setId(id);
            boolean success = knowledgePointService.updateById(knowledgePoint);
            Map<String, Object> result = new HashMap<>();
            if (success) {
                try {
                    if (existing.getSubject() != null) {
                        redisCacheService.evictKey(org.example.papermaker.service.CacheKeyBuilder.kpListSystemBySubject(existing.getSubject()));
                    }
                } catch (Exception ignored) {}
                result.put("code", 200);
                result.put("message", "更新成功");
                result.put("data", knowledgePoint);
            } else {
                result.put("code", 500);
                result.put("message", "更新失败");
                result.put("data", null);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "更新失败: " + e.getMessage());
            result.put("data", null);
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * 删除知识点
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteKnowledgePoint(@PathVariable Long id) {
        try {
            KnowledgePointEntity existing = knowledgePointService.getById(id);
            if (existing == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 404);
                result.put("message", "知识点不存在");
                result.put("data", null);
                return ResponseEntity.notFound().build();
            }

            // 系统预设的知识点不能删除
            if (existing.getIsSystem()) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("message", "系统预设知识点不能删除");
                result.put("data", null);
                return ResponseEntity.badRequest().body(result);
            }

            // 删除前检查是否有关联题目（兼容当前存储：questions.knowledge_point_ids 为 JSON 字符串）
            List<QuestionEntity> related = questionService.list(
                    new QueryWrapper<QuestionEntity>().isNotNull("knowledge_point_ids")
            );
            if (related != null) {
                for (QuestionEntity q : related) {
                    List<Long> kpIds = q.getKnowledgePointIdsList();
                    if (kpIds != null && kpIds.contains(id)) {
                        Map<String, Object> result = new HashMap<>();
                        result.put("code", 400);
                        result.put("message", "该知识点仍被题目引用，无法删除");
                        result.put("data", null);
                        return ResponseEntity.badRequest().body(result);
                    }
                }
            }

            boolean success = knowledgePointService.removeById(id);
            Map<String, Object> result = new HashMap<>();
            if (success) {
                try { if (existing.getSubject() != null) {
                    redisCacheService.evictKey(org.example.papermaker.service.CacheKeyBuilder.kpListSystemBySubject(existing.getSubject()));
                }} catch (Exception ignored) {}
                result.put("code", 200);
                result.put("message", "删除成功");
                result.put("data", null);
            } else {
                result.put("code", 500);
                result.put("message", "删除失败");
                result.put("data", null);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "删除失败: " + e.getMessage());
            result.put("data", null);
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * 获取知识点权重分布
     */
    @GetMapping("/weight-distribution")
    public ResponseEntity<Map<String, Object>> getWeightDistribution(
            @RequestParam String subject) {
        try {
            Map<String, BigDecimal> distribution = knowledgePointService.getWeightDistribution(subject);
            BigDecimal totalWeight = knowledgePointService.getTotalWeightBySubject(subject);

            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "获取成功");
            result.put("data", Map.of(
                "distribution", distribution,
                "totalWeight", totalWeight
            ));

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "获取失败: " + e.getMessage());
            result.put("data", null);
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * 批量更新权重
     */
    @PutMapping("/batch-update-weights")
    public ResponseEntity<Map<String, Object>> batchUpdateWeights(
            @RequestBody Map<Long, BigDecimal> weightMap) {
        try {
            boolean success = knowledgePointService.batchUpdateWeights(weightMap);
            Map<String, Object> result = new HashMap<>();
            if (success) {
                result.put("code", 200);
                result.put("message", "批量更新成功");
                result.put("data", null);
            } else {
                result.put("code", 400);
                result.put("message", "权重总和不能超过100%");
                result.put("data", null);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "批量更新失败: " + e.getMessage());
            result.put("data", null);
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * 创建默认知识点
     */
    @PostMapping("/create-default")
    public ResponseEntity<Map<String, Object>> createDefaultKnowledgePoints(
            @RequestParam String subject) {
        try {
            Long creatorId = SimpleUserContext.getCurrentUser().getId();
            knowledgePointService.createDefaultKnowledgePoints(subject, creatorId);

            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "默认知识点创建成功");
            result.put("data", null);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "创建失败: " + e.getMessage());
            result.put("data", null);
            return ResponseEntity.status(500).body(result);
        }
    }
}


































