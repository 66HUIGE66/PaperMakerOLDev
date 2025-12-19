package org.example.papermaker.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.example.papermaker.annotation.RequireRole;
import org.example.papermaker.context.SimpleUserContext;
import org.example.papermaker.entity.FeedbackEntity;
import org.example.papermaker.entity.UserEntity;
import org.example.papermaker.mapper.FeedbackMapper;
import org.example.papermaker.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 用户反馈控制器
 * 所有用户可提交反馈，仅系统管理员可以查看和回复所有反馈
 * 
 * @author System
 * @since 1.0.0
 */
@RestController
@RequestMapping("/api/feedbacks")
@CrossOrigin(originPatterns = "*")
public class FeedbackController {

    private static final Logger log = LoggerFactory.getLogger(FeedbackController.class);

    @Autowired
    private FeedbackMapper feedbackMapper;

    @Autowired
    private UserMapper userMapper;

    /**
     * 提交反馈（所有用户可用）
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> submitFeedback(@RequestBody FeedbackEntity feedback) {
        try {
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (currentUser == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 401);
                response.put("message", "用户未登录");
                return ResponseEntity.status(401).body(response);
            }

            feedback.setSubmitterId(currentUser.getId());
            feedback.setStatus(FeedbackEntity.FeedbackStatus.PENDING);
            feedback.setCreatedAt(LocalDateTime.now());
            feedback.setUpdatedAt(LocalDateTime.now());

            if (feedback.getType() == null) {
                feedback.setType(FeedbackEntity.FeedbackType.OTHER);
            }

            int result = feedbackMapper.insert(feedback);

            Map<String, Object> response = new HashMap<>();
            if (result > 0) {
                response.put("code", 200);
                response.put("message", "反馈提交成功，感谢您的宝贵意见！");
                response.put("data", feedback);
            } else {
                response.put("code", 500);
                response.put("message", "反馈提交失败");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("提交反馈失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "提交反馈失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取我的反馈列表（当前用户）
     */
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyFeedbacks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (currentUser == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 401);
                response.put("message", "用户未登录");
                return ResponseEntity.status(401).body(response);
            }

            Page<FeedbackEntity> pageParam = new Page<>(page, size);
            LambdaQueryWrapper<FeedbackEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(FeedbackEntity::getSubmitterId, currentUser.getId())
                    .orderByDesc(FeedbackEntity::getCreatedAt);

            Page<FeedbackEntity> result = feedbackMapper.selectPage(pageParam, wrapper);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取我的反馈成功");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取我的反馈失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取我的反馈失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取所有反馈列表（仅管理员）
     */
    @GetMapping("/all")
    @RequireRole(UserEntity.UserRole.ADMIN)
    public ResponseEntity<Map<String, Object>> getAllFeedbacks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {
        try {
            Page<FeedbackEntity> pageParam = new Page<>(page, size);
            LambdaQueryWrapper<FeedbackEntity> wrapper = new LambdaQueryWrapper<>();

            if (status != null && !status.trim().isEmpty()) {
                wrapper.eq(FeedbackEntity::getStatus, status);
            }
            if (type != null && !type.trim().isEmpty()) {
                wrapper.eq(FeedbackEntity::getType, type);
            }
            wrapper.orderByDesc(FeedbackEntity::getCreatedAt);

            Page<FeedbackEntity> result = feedbackMapper.selectPage(pageParam, wrapper);

            // 填充提交者名称
            for (FeedbackEntity feedback : result.getRecords()) {
                if (feedback.getSubmitterId() != null) {
                    UserEntity submitter = userMapper.selectById(feedback.getSubmitterId());
                    if (submitter != null) {
                        feedback.setSubmitterName(submitter.getUsername());
                    }
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取所有反馈成功");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取所有反馈失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取所有反馈失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 回复反馈（仅管理员）
     */
    @PostMapping("/{id}/reply")
    @RequireRole(UserEntity.UserRole.ADMIN)
    public ResponseEntity<Map<String, Object>> replyFeedback(
            @PathVariable Long id,
            @RequestBody Map<String, String> replyData) {
        try {
            FeedbackEntity existing = feedbackMapper.selectById(id);
            if (existing == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "反馈不存在");
                return ResponseEntity.ok(response);
            }

            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            String reply = replyData.get("reply");

            existing.setAdminReply(reply);
            existing.setReplierId(currentUser.getId());
            existing.setRepliedAt(LocalDateTime.now());
            existing.setStatus(FeedbackEntity.FeedbackStatus.RESOLVED);
            existing.setUpdatedAt(LocalDateTime.now());

            int result = feedbackMapper.updateById(existing);

            Map<String, Object> response = new HashMap<>();
            if (result > 0) {
                response.put("code", 200);
                response.put("message", "反馈回复成功");
                response.put("data", existing);
            } else {
                response.put("code", 500);
                response.put("message", "反馈回复失败");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("回复反馈失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "回复反馈失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 更新反馈状态（仅管理员）
     */
    @PutMapping("/{id}/status")
    @RequireRole(UserEntity.UserRole.ADMIN)
    public ResponseEntity<Map<String, Object>> updateFeedbackStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            FeedbackEntity existing = feedbackMapper.selectById(id);
            if (existing == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "反馈不存在");
                return ResponseEntity.ok(response);
            }

            existing.setStatus(FeedbackEntity.FeedbackStatus.valueOf(status));
            existing.setUpdatedAt(LocalDateTime.now());

            int result = feedbackMapper.updateById(existing);

            Map<String, Object> response = new HashMap<>();
            if (result > 0) {
                response.put("code", 200);
                response.put("message", "状态更新成功");
                response.put("data", existing);
            } else {
                response.put("code", 500);
                response.put("message", "状态更新失败");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("更新反馈状态失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "更新反馈状态失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 删除反馈（仅管理员）
     */
    @DeleteMapping("/{id}")
    @RequireRole(UserEntity.UserRole.ADMIN)
    public ResponseEntity<Map<String, Object>> deleteFeedback(@PathVariable Long id) {
        try {
            int result = feedbackMapper.deleteById(id);

            Map<String, Object> response = new HashMap<>();
            if (result > 0) {
                response.put("code", 200);
                response.put("message", "反馈删除成功");
            } else {
                response.put("code", 404);
                response.put("message", "反馈不存在");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("删除反馈失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "删除反馈失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取反馈统计（仅管理员）
     */
    @GetMapping("/statistics")
    @RequireRole(UserEntity.UserRole.ADMIN)
    public ResponseEntity<Map<String, Object>> getFeedbackStatistics() {
        try {
            Map<String, Object> statistics = new HashMap<>();

            // 总数
            long total = feedbackMapper.selectCount(null);
            statistics.put("total", total);

            // 待处理
            LambdaQueryWrapper<FeedbackEntity> pendingWrapper = new LambdaQueryWrapper<>();
            pendingWrapper.eq(FeedbackEntity::getStatus, FeedbackEntity.FeedbackStatus.PENDING);
            long pending = feedbackMapper.selectCount(pendingWrapper);
            statistics.put("pending", pending);

            // 已解决
            LambdaQueryWrapper<FeedbackEntity> resolvedWrapper = new LambdaQueryWrapper<>();
            resolvedWrapper.eq(FeedbackEntity::getStatus, FeedbackEntity.FeedbackStatus.RESOLVED);
            long resolved = feedbackMapper.selectCount(resolvedWrapper);
            statistics.put("resolved", resolved);

            // 按类型统计
            Map<String, Long> byType = new HashMap<>();
            for (FeedbackEntity.FeedbackType type : FeedbackEntity.FeedbackType.values()) {
                LambdaQueryWrapper<FeedbackEntity> typeWrapper = new LambdaQueryWrapper<>();
                typeWrapper.eq(FeedbackEntity::getType, type);
                byType.put(type.name(), feedbackMapper.selectCount(typeWrapper));
            }
            statistics.put("byType", byType);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取反馈统计成功");
            response.put("data", statistics);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取反馈统计失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取反馈统计失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
