package org.example.papermaker.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.example.papermaker.entity.ExamRuleEntity;
import org.example.papermaker.entity.UserEntity;
import org.example.papermaker.service.ExamRuleService;
import org.example.papermaker.context.SimpleUserContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 规则管理控制器
 * 提供组卷规则的完整CRUD操作
 * 
 * @author System
 * @since 1.0.0
 */
@RestController
@RequestMapping("/api/rules")
@CrossOrigin(originPatterns = "*")
public class ExamRuleController {
    
    private static final Logger log = LoggerFactory.getLogger(ExamRuleController.class);

    @Autowired
    private ExamRuleService examRuleService;

    /**
     * 检查当前用户是否为管理员
     */
    private boolean isAdmin() {
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        return currentUser != null && UserEntity.UserRole.ADMIN.equals(currentUser.getRole());
    }

    /**
     * 检查当前用户是否有权限查看指定规则
     */
    private boolean hasViewPermission(ExamRuleEntity rule) {
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        
        // 管理员可以查看所有规则
        if (UserEntity.UserRole.ADMIN.equals(currentUser.getRole())) {
            return true;
        }
        
        // 普通用户可以查看自己创建的规则和系统规则
        return currentUser.getId().equals(rule.getCreatorId()) || 
               (rule.getIsSystem() != null && rule.getIsSystem());
    }

    /**
     * 检查当前用户是否有权限操作指定规则
     */
    private boolean hasPermission(ExamRuleEntity rule) {
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (currentUser == null) {
            log.warn("hasPermission: 当前用户为空");
            return false;
        }
        
        log.debug("hasPermission检查 - 用户: {}, 角色: {}, 用户ID: {}, 规则ID: {}, 创建者ID: {}, 是否系统规则: {}", 
            currentUser.getUsername(), currentUser.getRole(), currentUser.getId(), 
            rule.getId(), rule.getCreatorId(), rule.getIsSystem());
        
        // 管理员可以操作所有规则
        if (UserEntity.UserRole.ADMIN.equals(currentUser.getRole())) {
            log.debug("管理员权限验证通过");
            return true;
        }
        
        // 普通用户只能操作自己创建的规则
        boolean isCreator = currentUser.getId().equals(rule.getCreatorId());
        log.debug("是否为创建者: {}", isCreator);
        return isCreator;
    }

    /**
     * 管理员专用：获取所有规则（包括系统规则）
     */
    @GetMapping("/admin/all")
    public ResponseEntity<Map<String, Object>> getAllRulesForAdmin(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isSystem) {
        
        try {
            // 权限检查：只有管理员可以访问
            if (!isAdmin()) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 403);
                response.put("message", "只有管理员可以访问此接口");
                response.put("data", null);
                return ResponseEntity.status(403).body(response);
            }
            
            Page<ExamRuleEntity> pageParam = new Page<>(page, size);
            QueryWrapper<ExamRuleEntity> queryWrapper = new QueryWrapper<>();
            
            // 构建查询条件
            if (name != null && !name.trim().isEmpty()) {
                queryWrapper.like("name", name.trim());
            }
            if (status != null && !status.trim().isEmpty()) {
                queryWrapper.eq("status", status);
            }
            if (isSystem != null) {
                queryWrapper.eq("is_system", isSystem);
            }
            
            // 排序
            queryWrapper.orderByDesc("created_at");
            
            Page<ExamRuleEntity> result = examRuleService.page(pageParam, queryWrapper);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取所有规则成功");
            response.put("data", result);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取规则列表失败: " + e.getMessage());
            response.put("data", null);
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 普通用户创建规则接口
     * 注意：普通用户可以创建使用系统提供的学科的规则，
     * 但创建的规则始终是用户自己的规则（isSystem=false），不属于系统规则
     */
    @PostMapping("/user")
    public ResponseEntity<Map<String, Object>> createUserRule(@RequestBody ExamRuleEntity rule) {
        try {
            // 设置创建者信息
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 401);
                response.put("message", "用户未登录");
                response.put("data", null);
                return ResponseEntity.status(401).body(response);
            }
            
            rule.setCreatorId(currentUserId);
            // 强制设置为非系统规则：普通用户无论选择什么学科，创建的规则都是个人规则
            rule.setIsSystem(false);
            rule.setStatus(ExamRuleEntity.Status.ACTIVE.name());
            rule.setCreatedAt(LocalDateTime.now());
            rule.setUpdatedAt(LocalDateTime.now());
            
            boolean success = examRuleService.createRule(rule);
            
            Map<String, Object> response = new HashMap<>();
            if (success) {
                response.put("code", 200);
                response.put("message", "规则创建成功");
                response.put("data", rule);
            } else {
                response.put("code", 500);
                response.put("message", "规则创建失败");
                response.put("data", null);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "创建规则失败: " + e.getMessage());
            response.put("data", null);
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 管理员专用：创建系统规则
     */
    @PostMapping("/admin/system")
    public ResponseEntity<Map<String, Object>> createSystemRule(@RequestBody ExamRuleEntity rule) {
        try {
            // 权限检查：只有管理员可以创建系统规则
            if (!isAdmin()) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 403);
                response.put("message", "只有管理员可以创建系统规则");
                response.put("data", null);
                return ResponseEntity.status(403).body(response);
            }
            
            // 设置创建者信息
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                currentUserId = 1L; // 默认用户ID，用于测试
            }
            
            rule.setCreatorId(currentUserId);
            rule.setIsSystem(true); // 强制设置为系统规则
            rule.setStatus(ExamRuleEntity.Status.ACTIVE.name());
            rule.setCreatedAt(LocalDateTime.now());
            rule.setUpdatedAt(LocalDateTime.now());
            
            boolean success = examRuleService.createRule(rule);
            
            Map<String, Object> response = new HashMap<>();
            if (success) {
                response.put("code", 200);
                response.put("message", "系统规则创建成功");
                response.put("data", rule);
            } else {
                response.put("code", 500);
                response.put("message", "系统规则创建失败");
                response.put("data", null);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "创建系统规则失败: " + e.getMessage());
            response.put("data", null);
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取规则列表（分页）
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getRules(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isSystem) {
        
        try {
            Page<ExamRuleEntity> pageParam = new Page<>(page, size);
            QueryWrapper<ExamRuleEntity> queryWrapper = new QueryWrapper<>();
            
            // 构建查询条件
            if (name != null && !name.trim().isEmpty()) {
                queryWrapper.like("name", name.trim());
            }
            if (status != null && !status.trim().isEmpty()) {
                queryWrapper.eq("status", status);
            }
            if (isSystem != null) {
                queryWrapper.eq("is_system", isSystem);
            }



            // 权限控制：非管理员只能看到自己创建的规则和系统规则
            if (!isAdmin()) {
                UserEntity currentUser = SimpleUserContext.getCurrentUser();
                log.info("当前登录用户Id:{}" ,  currentUser.getId());
                if (currentUser != null) {
                    queryWrapper.and(wrapper -> wrapper
                        .eq("creator_id", currentUser.getId())
                        .or()
                        .eq("is_system", true)
                    );
                }
            }
            
            // 排序
            queryWrapper.orderByDesc("created_at");
            
            Page<ExamRuleEntity> result = examRuleService.page(pageParam, queryWrapper);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取成功");
            response.put("data", result);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
            response.put("data", null);
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取所有启用的规则（用于下拉选择）
     */
    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getActiveRules() {
        try {
            //  权限检查：获取当前用户
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (currentUser == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 401);
                response.put("message", "用户未登录");
                response.put("data", null);
                return ResponseEntity.status(401).body(response);
            }
            
            List<ExamRuleEntity> rules;
            //  权限控制：非管理员只能看到系统规则或自己创建的规则
            if (isAdmin()) {
                // 管理员：可以看到所有启用的规则
                rules = examRuleService.getAllActiveRules();
            } else {
                // 普通用户：只能看到系统规则或自己创建的规则
                QueryWrapper<ExamRuleEntity> queryWrapper = new QueryWrapper<>();
                queryWrapper.eq("status", ExamRuleEntity.Status.ACTIVE.name())
                    .and(wrapper -> wrapper
                        .eq("is_system", true)  // 系统规则
                        .or()
                        .eq("creator_id", currentUser.getId())  // 或自己创建的规则
                    )
                    .orderByDesc("created_at");
                rules = examRuleService.list(queryWrapper);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取成功");
            response.put("data", rules);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
            response.put("data", null);
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 根据ID获取规则详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getRuleById(@PathVariable Long id) {
        try {
            ExamRuleEntity rule = examRuleService.getRuleById(id);
            
            Map<String, Object> response = new HashMap<>();
            if (rule != null) {
                // 权限检查：管理员可以查看所有规则，普通用户可以查看自己创建的规则和系统规则
                if (!hasViewPermission(rule)) {
                    response.put("code", 403);
                    response.put("message", "无权限访问此规则");
                    response.put("data", null);
                    return ResponseEntity.status(403).body(response);
                }
                
                response.put("code", 200);
                response.put("message", "获取成功");
                response.put("data", rule);
            } else {
                response.put("code", 404);
                response.put("message", "规则不存在");
                response.put("data", null);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取失败: " + e.getMessage());
            response.put("data", null);
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 创建新规则
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createRule(@RequestBody ExamRuleEntity rule) {
        try {
            // 设置创建者信息
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                currentUserId = 1L; // 默认用户ID，用于测试
            }
            
            rule.setCreatorId(currentUserId);
            
            // 权限控制：只有管理员可以创建系统规则
            if (rule.getIsSystem() != null && rule.getIsSystem() && !isAdmin()) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 403);
                response.put("message", "只有管理员可以创建系统规则");
                response.put("data", null);
                return ResponseEntity.status(403).body(response);
            }
            
            // 如果不是管理员，强制设置为非系统规则
            if (!isAdmin()) {
                rule.setIsSystem(false);
            }
            
            rule.setStatus(ExamRuleEntity.Status.ACTIVE.name());
            rule.setCreatedAt(LocalDateTime.now());
            rule.setUpdatedAt(LocalDateTime.now());
            
            boolean success = examRuleService.createRule(rule);
            
            Map<String, Object> response = new HashMap<>();
            if (success) {
                response.put("code", 200);
                response.put("message", "创建成功");
                response.put("data", rule);
            } else {
                response.put("code", 500);
                response.put("message", "创建失败");
                response.put("data", null);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "创建失败: " + e.getMessage());
            response.put("data", null);
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 更新规则
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateRule(@PathVariable Long id, @RequestBody ExamRuleEntity rule) {
        try {
            // 检查规则是否存在
            ExamRuleEntity existingRule = examRuleService.getRuleById(id);
            if (existingRule == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "规则不存在");
                response.put("data", null);
                return ResponseEntity.ok(response);
            }
            
            // 权限检查：只有管理员或规则创建者可以更新规则
            log.debug("updateRule权限检查开始");
            boolean hasPermission = hasPermission(existingRule);
            log.debug("权限检查结果: {}", hasPermission);
            
            if (!hasPermission) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 403);
                response.put("message", "无权限更新此规则");
                response.put("data", null);
                log.warn("权限检查失败，返回403错误");
                return ResponseEntity.status(403).body(response);
            }
            
            log.debug("权限检查通过，继续更新规则");
            
            // 设置更新信息
            rule.setId(id);
            rule.setUpdatedAt(LocalDateTime.now());
            // 保持原有的创建者信息
            rule.setCreatorId(existingRule.getCreatorId());
            rule.setIsSystem(existingRule.getIsSystem());
            rule.setCreatedAt(existingRule.getCreatedAt());
            
            boolean success = examRuleService.updateRule(rule);
            
            Map<String, Object> response = new HashMap<>();
            if (success) {
                response.put("code", 200);
                response.put("message", "更新成功");
                response.put("data", rule);
            } else {
                response.put("code", 500);
                response.put("message", "更新失败");
                response.put("data", null);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "更新失败: " + e.getMessage());
            response.put("data", null);
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 删除规则
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteRule(@PathVariable Long id) {
        try {
            // 检查规则是否存在
            ExamRuleEntity existingRule = examRuleService.getRuleById(id);
            if (existingRule == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "规则不存在");
                response.put("data", null);
                return ResponseEntity.ok(response);
            }
            
            // 权限检查：只有管理员或规则创建者可以删除规则
            if (!hasPermission(existingRule)) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 403);
                response.put("message", "无权限删除此规则");
                response.put("data", null);
                return ResponseEntity.status(403).body(response);
            }
            
            // 系统规则只有管理员可以删除
            if (existingRule.getIsSystem() && !isAdmin()) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 403);
                response.put("message", "只有管理员可以删除系统规则");
                response.put("data", null);
                return ResponseEntity.status(403).body(response);
            }
            
            boolean success = examRuleService.deleteRule(id);
            
            Map<String, Object> response = new HashMap<>();
            if (success) {
                response.put("code", 200);
                response.put("message", "删除成功");
                response.put("data", null);
            } else {
                response.put("code", 500);
                response.put("message", "删除失败");
                response.put("data", null);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "删除失败: " + e.getMessage());
            response.put("data", null);
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 批量删除规则
     */
    @DeleteMapping("/batch")
    public ResponseEntity<Map<String, Object>> batchDeleteRules(@RequestBody List<Long> ids) {
        try {
            int successCount = 0;
            int failCount = 0;
            
            for (Long id : ids) {
                ExamRuleEntity existingRule = examRuleService.getRuleById(id);
                if (existingRule != null && !existingRule.getIsSystem()) {
                    if (examRuleService.deleteRule(id)) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } else {
                    failCount++;
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", String.format("批量删除完成，成功：%d，失败：%d", successCount, failCount));
            response.put("data", Map.of("successCount", successCount, "failCount", failCount));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "批量删除失败: " + e.getMessage());
            response.put("data", null);
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 启用/禁用规则
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateRuleStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            ExamRuleEntity existingRule = examRuleService.getRuleById(id);
            if (existingRule == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "规则不存在");
                response.put("data", null);
                return ResponseEntity.ok(response);
            }
            
            existingRule.setStatus(status);
            existingRule.setUpdatedAt(LocalDateTime.now());
            
            boolean success = examRuleService.updateRule(existingRule);
            
            Map<String, Object> response = new HashMap<>();
            if (success) {
                response.put("code", 200);
                response.put("message", "状态更新成功");
                response.put("data", existingRule);
            } else {
                response.put("code", 500);
                response.put("message", "状态更新失败");
                response.put("data", null);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "状态更新失败: " + e.getMessage());
            response.put("data", null);
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 复制规则
     */
    @PostMapping("/{id}/copy")
    public ResponseEntity<Map<String, Object>> copyRule(@PathVariable Long id) {
        try {
            ExamRuleEntity existingRule = examRuleService.getRuleById(id);
            if (existingRule == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "规则不存在");
                response.put("data", null);
                return ResponseEntity.ok(response);
            }
            
            // 创建副本
            ExamRuleEntity newRule = new ExamRuleEntity();
            newRule.setName(existingRule.getName() + " (副本)");
            newRule.setDescription(existingRule.getDescription());
            newRule.setTotalQuestions(existingRule.getTotalQuestions());
            newRule.setTotalScore(existingRule.getTotalScore());
            newRule.setDuration(existingRule.getDuration());
            newRule.setRuleConfig(existingRule.getRuleConfig());
            
            Long currentUserId = SimpleUserContext.getCurrentUserId();
            if (currentUserId == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 401);
                response.put("message", "用户未登录，无法复制规则");
                response.put("data", null);
                return ResponseEntity.status(401).body(response);
            }
            newRule.setCreatorId(currentUserId);
            newRule.setIsSystem(false); // 复制的规则总是个人规则
            newRule.setStatus(ExamRuleEntity.Status.ACTIVE.name());
            newRule.setCreatedAt(LocalDateTime.now());
            newRule.setUpdatedAt(LocalDateTime.now());
            
            boolean success = examRuleService.createRule(newRule);
            
            Map<String, Object> response = new HashMap<>();
            if (success) {
                response.put("code", 200);
                response.put("message", "复制成功");
                response.put("data", newRule);
            } else {
                response.put("code", 500);
                response.put("message", "复制失败");
                response.put("data", null);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "复制失败: " + e.getMessage());
            response.put("data", null);
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取规则统计信息
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        try {
            Map<String, Object> statistics = new HashMap<>();
            
            // 获取总规则数
            long totalCount = examRuleService.getTotalRuleCount();
            statistics.put("totalCount", totalCount);
            
            // 获取活跃规则数
            long activeCount = examRuleService.getActiveRuleCount();
            statistics.put("activeCount", activeCount);
            
            // 获取非活跃规则数
            long inactiveCount = totalCount - activeCount;
            statistics.put("inactiveCount", inactiveCount);
            
            // 获取系统规则数
            long systemCount = examRuleService.getSystemRuleCount();
            statistics.put("systemCount", systemCount);
            
            // 获取用户规则数
            long userCount = totalCount - systemCount;
            statistics.put("userCount", userCount);
            
            // 获取当前用户规则数（如果不是管理员）
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (currentUser != null && !isAdmin()) {
                long currentUserRuleCount = examRuleService.getUserRuleCount(currentUser.getId());
                statistics.put("currentUserRuleCount", currentUserRuleCount);
            }
            
            // 获取今日创建的规则数
            LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
            QueryWrapper<ExamRuleEntity> todayQuery = new QueryWrapper<>();
            todayQuery.ge("created_at", todayStart);
            long todayCreated = examRuleService.count(todayQuery);
            statistics.put("todayCreated", todayCreated);
            
            // 获取本周创建的规则数
            LocalDateTime weekStart = todayStart.minusDays(todayStart.getDayOfWeek().getValue() - 1);
            QueryWrapper<ExamRuleEntity> weekQuery = new QueryWrapper<>();
            weekQuery.ge("created_at", weekStart);
            long thisWeekCreated = examRuleService.count(weekQuery);
            statistics.put("thisWeekCreated", thisWeekCreated);
            
            // 获取本月创建的规则数
            LocalDateTime monthStart = todayStart.withDayOfMonth(1);
            QueryWrapper<ExamRuleEntity> monthQuery = new QueryWrapper<>();
            monthQuery.ge("created_at", monthStart);
            long thisMonthCreated = examRuleService.count(monthQuery);
            statistics.put("thisMonthCreated", thisMonthCreated);
            
            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取统计信息成功");
            response.put("data", statistics);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取统计信息失败: " + e.getMessage());
            response.put("data", null);
            return ResponseEntity.status(500).body(response);
        }
    }
}