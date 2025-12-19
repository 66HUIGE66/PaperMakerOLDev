package org.example.papermaker.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.example.papermaker.annotation.RequireRole;
import org.example.papermaker.context.SimpleUserContext;
import org.example.papermaker.entity.AnnouncementEntity;
import org.example.papermaker.entity.UserEntity;
import org.example.papermaker.mapper.AnnouncementMapper;
import org.example.papermaker.mapper.UserMapper;
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
 * 系统公告控制器
 * 仅系统管理员可以管理公告，所有用户可以查看已发布的公告
 * 
 * @author System
 * @since 1.0.0
 */
@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(originPatterns = "*")
public class AnnouncementController {

    private static final Logger log = LoggerFactory.getLogger(AnnouncementController.class);

    @Autowired
    private AnnouncementMapper announcementMapper;

    @Autowired
    private UserMapper userMapper;

    /**
     * 获取已发布的公告列表（所有用户可见）
     */
    @GetMapping("/published")
    public ResponseEntity<Map<String, Object>> getPublishedAnnouncements(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<AnnouncementEntity> pageParam = new Page<>(page, size);
            LambdaQueryWrapper<AnnouncementEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(AnnouncementEntity::getStatus, AnnouncementEntity.AnnouncementStatus.PUBLISHED)
                    .orderByDesc(AnnouncementEntity::getPublishedAt);

            Page<AnnouncementEntity> result = announcementMapper.selectPage(pageParam, wrapper);

            // 填充发布者名称
            for (AnnouncementEntity announcement : result.getRecords()) {
                if (announcement.getPublisherId() != null) {
                    UserEntity publisher = userMapper.selectById(announcement.getPublisherId());
                    if (publisher != null) {
                        announcement.setPublisherName(publisher.getUsername());
                    }
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取公告列表成功");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取公告列表失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取公告列表失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取所有公告列表（仅管理员）
     */
    @GetMapping("/all")
    @RequireRole(UserEntity.UserRole.ADMIN)
    public ResponseEntity<Map<String, Object>> getAllAnnouncements(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        try {
            Page<AnnouncementEntity> pageParam = new Page<>(page, size);
            LambdaQueryWrapper<AnnouncementEntity> wrapper = new LambdaQueryWrapper<>();

            if (status != null && !status.trim().isEmpty()) {
                wrapper.eq(AnnouncementEntity::getStatus, status);
            }
            wrapper.orderByDesc(AnnouncementEntity::getCreatedAt);

            Page<AnnouncementEntity> result = announcementMapper.selectPage(pageParam, wrapper);

            // 填充发布者名称
            for (AnnouncementEntity announcement : result.getRecords()) {
                if (announcement.getPublisherId() != null) {
                    UserEntity publisher = userMapper.selectById(announcement.getPublisherId());
                    if (publisher != null) {
                        announcement.setPublisherName(publisher.getUsername());
                    }
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "获取所有公告成功");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取所有公告失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "获取所有公告失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 创建公告（仅管理员）
     */
    @PostMapping
    @RequireRole(UserEntity.UserRole.ADMIN)
    public ResponseEntity<Map<String, Object>> createAnnouncement(@RequestBody AnnouncementEntity announcement) {
        try {
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            announcement.setPublisherId(currentUser.getId());
            announcement.setCreatedAt(LocalDateTime.now());
            announcement.setUpdatedAt(LocalDateTime.now());

            if (announcement.getStatus() == null) {
                announcement.setStatus(AnnouncementEntity.AnnouncementStatus.DRAFT);
            }

            if (announcement.getType() == null) {
                announcement.setType(AnnouncementEntity.AnnouncementType.SYSTEM);
            }

            int result = announcementMapper.insert(announcement);

            Map<String, Object> response = new HashMap<>();
            if (result > 0) {
                response.put("code", 200);
                response.put("message", "公告创建成功");
                response.put("data", announcement);
            } else {
                response.put("code", 500);
                response.put("message", "公告创建失败");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("创建公告失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "创建公告失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 更新公告（仅管理员）
     */
    @PutMapping("/{id}")
    @RequireRole(UserEntity.UserRole.ADMIN)
    public ResponseEntity<Map<String, Object>> updateAnnouncement(
            @PathVariable Long id,
            @RequestBody AnnouncementEntity announcement) {
        try {
            AnnouncementEntity existing = announcementMapper.selectById(id);
            if (existing == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "公告不存在");
                return ResponseEntity.ok(response);
            }

            announcement.setId(id);
            announcement.setUpdatedAt(LocalDateTime.now());

            int result = announcementMapper.updateById(announcement);

            Map<String, Object> response = new HashMap<>();
            if (result > 0) {
                response.put("code", 200);
                response.put("message", "公告更新成功");
                response.put("data", announcement);
            } else {
                response.put("code", 500);
                response.put("message", "公告更新失败");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("更新公告失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "更新公告失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 发布公告（仅管理员）
     */
    @PostMapping("/{id}/publish")
    @RequireRole(UserEntity.UserRole.ADMIN)
    public ResponseEntity<Map<String, Object>> publishAnnouncement(@PathVariable Long id) {
        try {
            AnnouncementEntity existing = announcementMapper.selectById(id);
            if (existing == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 404);
                response.put("message", "公告不存在");
                return ResponseEntity.ok(response);
            }

            existing.setStatus(AnnouncementEntity.AnnouncementStatus.PUBLISHED);
            existing.setPublishedAt(LocalDateTime.now());
            existing.setUpdatedAt(LocalDateTime.now());

            int result = announcementMapper.updateById(existing);

            Map<String, Object> response = new HashMap<>();
            if (result > 0) {
                response.put("code", 200);
                response.put("message", "公告发布成功");
                response.put("data", existing);
            } else {
                response.put("code", 500);
                response.put("message", "公告发布失败");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("发布公告失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "发布公告失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 删除公告（仅管理员）
     */
    @DeleteMapping("/{id}")
    @RequireRole(UserEntity.UserRole.ADMIN)
    public ResponseEntity<Map<String, Object>> deleteAnnouncement(@PathVariable Long id) {
        try {
            int result = announcementMapper.deleteById(id);

            Map<String, Object> response = new HashMap<>();
            if (result > 0) {
                response.put("code", 200);
                response.put("message", "公告删除成功");
            } else {
                response.put("code", 404);
                response.put("message", "公告不存在");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("删除公告失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", "删除公告失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
