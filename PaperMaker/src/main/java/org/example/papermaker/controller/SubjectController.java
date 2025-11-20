package org.example.papermaker.controller;

import org.example.papermaker.entity.*;
import org.example.papermaker.service.SubjectService;
import org.example.papermaker.service.SubjectMapping;
import org.example.papermaker.context.SimpleUserContext;
import org.example.papermaker.util.SimplePermissionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 学科管理控制器
 */
@RestController
@RequestMapping("/api/subjects")
public class SubjectController {
    
    @Autowired
    private SubjectService subjectService;
    @Autowired
    private org.example.papermaker.mapper.QuestionMapper questionMapper;
    @Autowired
    private org.example.papermaker.mapper.KnowledgePointMapper knowledgePointMapper;
    @Autowired
    private org.example.papermaker.mapper.ExamPaperMapper examPaperMapper;
    
    /**
     * 获取所有启用的学科
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getAllActiveSubjects(
            @RequestParam(required = false, defaultValue = "false") Boolean includeKeywords,
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
            
            List<SubjectEntity> subjects;
            if (includeKeywords) {
                // 包含关键词信息
                subjects = subjectService.getAllActiveSubjectsWithKeywords();
            } else {
                // 不包含关键词信息
                subjects = subjectService.getAllActiveSubjects();
            }
            
            //  权限控制：非管理员只能看到系统学科或自己创建的学科
            if (!SimplePermissionUtils.isAdmin(currentUser)) {
                subjects = subjects.stream()
                    .filter(s -> {
                        Boolean subjectIsSystem = s.getIsSystem();
                        if (subjectIsSystem == null) {
                            subjectIsSystem = true; // 默认值
                        }
                        // 系统学科或自己创建的学科
                        return subjectIsSystem || currentUser.getId().equals(s.getCreatorId());
                    })
                    .collect(java.util.stream.Collectors.toList());
            }
            
            // 按系统/个人筛选（如果指定了isSystem参数）
            if (isSystem != null) {
                final Boolean finalIsSystem = isSystem;
                subjects = subjects.stream()
                    .filter(s -> {
                        // 处理null值：如果isSystem为null，默认认为是系统学科
                        Boolean subjectIsSystem = s.getIsSystem();
                        if (subjectIsSystem == null) {
                            subjectIsSystem = true; // 默认值
                        }
                        return finalIsSystem.equals(subjectIsSystem);
                    })
                    .collect(java.util.stream.Collectors.toList());
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "获取成功");
            result.put("data", subjects);
            
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
     * 根据ID获取学科
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSubjectById(@PathVariable Long id) {
        try {
            SubjectEntity subject = subjectService.getById(id);
            
            Map<String, Object> result = new HashMap<>();
            if (subject != null) {
                result.put("code", 200);
                result.put("message", "获取成功");
                result.put("data", subject);
            } else {
                result.put("code", 404);
                result.put("message", "学科不存在");
                result.put("data", null);
            }
            
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
     * 创建学科
     */
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createSubject(@RequestBody SubjectEntity subject) {
        try {
            // 获取当前用户
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (currentUser != null) {
                subject.setCreatorId(currentUser.getId());
                // 关键改动：管理员创建系统学科，普通用户创建个人学科
                subject.setIsSystem(SimplePermissionUtils.hasSystemManagePermission(currentUser));
            } else {
                subject.setIsSystem(false);
            }
            
            // 查重验证：检查学科名称是否已存在
            SubjectEntity existingByName = subjectService.getByName(subject.getName());
            if (existingByName != null) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("message", "学科名称【" + subject.getName() + "】已存在");
                result.put("data", null);
                return ResponseEntity.badRequest().body(result);
            }
            
            // 查重验证：检查学科代码是否已存在（如果有代码）
            if (subject.getCode() != null && !subject.getCode().trim().isEmpty()) {
                SubjectEntity existingByCode = subjectService.getByCode(subject.getCode());
                if (existingByCode != null) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("code", 400);
                    result.put("message", "学科代码【" + subject.getCode() + "】已存在");
                    result.put("data", null);
                    return ResponseEntity.badRequest().body(result);
                }
            }
            
            boolean success = subjectService.save(subject);
            
            Map<String, Object> result = new HashMap<>();
            if (success) {
                // 刷新学科映射
                subjectService.refreshSubjectMapping();
                
                result.put("code", 200);
                result.put("message", "创建成功");
                result.put("data", subject);
            } else {
                result.put("code", 500);
                result.put("message", "创建失败");
                result.put("data", null);
            }
            
            return ResponseEntity.ok(result);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // 数据库唯一约束违反（如MySQL的UNIQUE约束）
            Map<String, Object> result = new HashMap<>();
            result.put("code", 400);
            result.put("message", "学科名称或代码已存在");
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
     * 更新学科
     */
    @PutMapping("/update")
    public ResponseEntity<Map<String, Object>> updateSubject(@RequestBody SubjectEntity subject) {
        try {
            // 获取当前用户
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            
            // 获取原学科信息
            SubjectEntity existing = subjectService.getById(subject.getId());
            if (existing == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 404);
                result.put("message", "学科不存在");
                result.put("data", null);
                return ResponseEntity.ok(result);
            }
            
            // 权限检查：使用统一权限工具类
            if (!SimplePermissionUtils.hasContentEditPermission(
                    currentUser, existing.getCreatorId()) 
                || !SimplePermissionUtils.hasSystemContentEditPermission(
                    currentUser, existing.getIsSystem())) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 403);
                result.put("message", "权限不足，无法编辑此学科");
                result.put("data", null);
                return ResponseEntity.status(403).body(result);
            }
            
            // 系统学科不能修改isSystem字段
            if (Boolean.TRUE.equals(existing.getIsSystem())) {
                subject.setIsSystem(true);
                subject.setCreatorId(null);
            }
            
            boolean success = subjectService.updateById(subject);
            
            Map<String, Object> result = new HashMap<>();
            if (success) {
                // 刷新学科映射
                subjectService.refreshSubjectMapping();
                
                result.put("code", 200);
                result.put("message", "更新成功");
                result.put("data", subject);
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
     * 删除学科
     */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Map<String, Object>> deleteSubject(@PathVariable Long id) {
        try {
            // 获取当前用户
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            
            // 获取学科信息
            SubjectEntity existing = subjectService.getById(id);
            if (existing == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 404);
                result.put("message", "学科不存在");
                result.put("data", null);
                return ResponseEntity.ok(result);
            }
            
            // 权限检查：使用统一权限工具类
            if (!SimplePermissionUtils.hasContentEditPermission(
                    currentUser, existing.getCreatorId()) 
                || !SimplePermissionUtils.hasSystemContentEditPermission(
                    currentUser, existing.getIsSystem())) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 403);
                result.put("message", "权限不足，无法删除此学科");
                result.put("data", null);
                return ResponseEntity.status(403).body(result);
            }
            LambdaQueryWrapper<QuestionEntity> qw = new LambdaQueryWrapper<>();
            qw.eq(QuestionEntity::getSubjectId, id);
            Long questionCount = questionMapper.selectCount(qw);
            if (questionCount != null && questionCount > 0) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("message", "该学科下仍有关联题目，无法删除");
                result.put("data", null);
                return ResponseEntity.badRequest().body(result);
            }

            String subjectName = existing.getName();
            com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<KnowledgePointEntity> kpQw = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
            kpQw.eq("status", KnowledgePointEntity.Status.ACTIVE.name())
                .and(w -> w.eq("subject_id", id).or().eq("subject", subjectName));
            Long kpCount = knowledgePointMapper.selectCount(kpQw);
            if (kpCount != null && kpCount > 0) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("message", "该学科下仍有关联知识点，无法删除");
                result.put("data", null);
                return ResponseEntity.badRequest().body(result);
            }

            com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<ExamPaperEntity> paperQw = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<>();
            paperQw.eq("subject_id", String.valueOf(id)).or().eq("subject_id", subjectName);
            Long paperCount = examPaperMapper.selectCount(paperQw);
            if (paperCount != null && paperCount > 0) {
                Map<String, Object> result = new HashMap<>();
                result.put("code", 400);
                result.put("message", "该学科下仍有关联试卷，无法删除");
                result.put("data", null);
                return ResponseEntity.badRequest().body(result);
            }
            
            boolean success = subjectService.removeById(id);
            
            Map<String, Object> result = new HashMap<>();
            if (success) {
                // 刷新学科映射
                subjectService.refreshSubjectMapping();
                
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
     * 刷新学科映射缓存
     */
    @PostMapping("/refresh-mapping")
    public ResponseEntity<Map<String, Object>> refreshMapping() {
        try {
            subjectService.refreshSubjectMapping();
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "刷新成功");
            
            // 返回当前映射状态
            Map<String, Object> mappingInfo = new HashMap<>();
            mappingInfo.put("isInitialized", SubjectMapping.isInitialized());
            mappingInfo.put("subjectCount", SubjectMapping.getAllSubjectIds().size());
            mappingInfo.put("subjectNames", SubjectMapping.getAllSubjectNames());
            
            result.put("data", mappingInfo);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "刷新失败: " + e.getMessage());
            result.put("data", null);
            
            return ResponseEntity.status(500).body(result);
        }
    }
    
    /**
     * 获取学科映射状态
     */
    @GetMapping("/mapping-status")
    public ResponseEntity<Map<String, Object>> getMappingStatus() {
        try {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "获取成功");
            
            Map<String, Object> mappingInfo = new HashMap<>();
            mappingInfo.put("isInitialized", SubjectMapping.isInitialized());
            mappingInfo.put("subjectCount", SubjectMapping.getAllSubjectIds().size());
            mappingInfo.put("subjectIds", SubjectMapping.getAllSubjectIds());
            mappingInfo.put("subjectNames", SubjectMapping.getAllSubjectNames());
            
            result.put("data", mappingInfo);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "获取失败: " + e.getMessage());
            result.put("data", null);
            
            return ResponseEntity.status(500).body(result);
        }
    }
}





