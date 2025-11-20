package org.example.papermaker.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.ObjectUtils;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.example.papermaker.context.SimpleUserContext;
import org.example.papermaker.entity.QuestionEntity;
import org.example.papermaker.entity.UserEntity;
import org.example.papermaker.entity.SubjectEntity;
import org.example.papermaker.entity.KnowledgePointEntity;
import org.example.papermaker.mapper.SubjectMapper;
import org.example.papermaker.mapper.KnowledgePointMapper;
import org.example.papermaker.service.QuestionService;
import org.example.papermaker.util.SimplePermissionUtils;
import org.example.papermaker.vo.RespBean;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 题目管理控制器
 * 提供题目的查询、分页等功能
 * 
 * @author System
 * @since 1.0.0
 */
@RestController
@RequestMapping("/question")
@Tag(name = "题目管理", description = "题目的查询、分页等操作")
public class QuestionController {
    
    private static final Logger logger = LoggerFactory.getLogger(QuestionController.class);


    @Resource
    private QuestionService questionService;
    
    @Resource
    private SubjectMapper subjectMapper;
    
    @Resource
    private KnowledgePointMapper knowledgePointMapper;
    @org.springframework.beans.factory.annotation.Autowired
    private org.example.papermaker.service.RedisCacheService redisCacheService;
    /**
     * 根据题目ID获取题目
     */
    @GetMapping("/{id}")
    @Operation(summary = "根据题目ID查询题目" , description = "根据题目ID查询题目")
    @ApiResponses(
        value = {
                @ApiResponse(responseCode = "200", description = "查询成功"),
                @ApiResponse(responseCode = "400", description = "请求参数错误"),
                @ApiResponse(responseCode = "500", description = "服务器内部错误")
        }
    )
    public RespBean getQuestionById(@PathVariable String id) {
        RespBean respBean = new RespBean();
        try {
            //  权限检查：获取当前用户
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (currentUser == null) {
                respBean.setCode(401);
                respBean.setMessage("用户未登录");
                return respBean;
            }
            
            QuestionEntity question = questionService.getById(id);
            if (ObjectUtils.isNotNull(question)) {
                //  权限控制：非管理员只能查看系统题目或自己创建的题目
                if (!SimplePermissionUtils.isAdmin(currentUser)) {
                    boolean isSystemQuestion = SimplePermissionUtils.isSystemContent(question.getIsSystem());
                    boolean isOwner = currentUser.getId().equals(question.getCreatorId());
                    
                    if (!isSystemQuestion && !isOwner) {
                        respBean.setCode(403);
                        respBean.setMessage("权限不足，无法查看此题目");
                        return respBean;
                    }
                }
                //  构建返回数据，包含知识点名称
                Map<String, Object> questionData = new HashMap<>();
                questionData.put("id", question.getId());
                questionData.put("title", question.getTitle());
                questionData.put("type", question.getType());
                questionData.put("difficulty", question.getDifficulty());
                questionData.put("options", question.getOptionsList());
                questionData.put("correctAnswer", question.getCorrectAnswer());
                questionData.put("explanation", question.getExplanation());
                questionData.put("subjectId", question.getSubjectId());
                questionData.put("isSystem", question.getIsSystem());
                questionData.put("creatorId", question.getCreatorId());
                questionData.put("createdAt", question.getCreatedAt());
                questionData.put("updatedAt", question.getUpdatedAt());
                questionData.put("knowledgePointIds", question.getKnowledgePointIds());
                questionData.put("knowledgePointIdsList", question.getKnowledgePointIdsList());
                
                //  查询并返回知识点名称列表
                List<String> knowledgePointNames = new ArrayList<>();
                List<Map<String, Object>> knowledgePointDetails = new ArrayList<>();
                List<Long> knowledgePointIds = question.getKnowledgePointIdsList();
                if (knowledgePointIds != null && !knowledgePointIds.isEmpty()) {
                    for (Long kpId : knowledgePointIds) {
                        if (kpId != null) {
                            KnowledgePointEntity kp = knowledgePointMapper.selectById(kpId);
                            if (kp != null && kp.getName() != null) {
                                knowledgePointNames.add(kp.getName());
                                Map<String, Object> kpDetail = new HashMap<>();
                                kpDetail.put("id", kp.getId());
                                kpDetail.put("name", kp.getName());
                                knowledgePointDetails.add(kpDetail);
                            }
                        }
                    }
                }
                questionData.put("knowledgePoints", knowledgePointNames);
                questionData.put("knowledgePointDetails", knowledgePointDetails);
                
                // 如果题目有学科ID，查询学科名称
                if (question.getSubjectId() != null) {
                    SubjectEntity subject = subjectMapper.selectById(question.getSubjectId());
                    if (subject != null && subject.getName() != null) {
                        questionData.put("subject", subject.getName());
                    }
                }
                
                respBean.setCode(200);
                respBean.setMessage("获取题目成功");
                respBean.setObject(questionData);
                return respBean;
            }
        }catch (Exception e){
            respBean.setCode(500);
            respBean.setMessage("获取题目出错");
            logger.error(e.getMessage());
            return respBean;
        }
        respBean.setCode(400);
        respBean.setMessage("找不到该id为"+id+"的题目");
        return respBean;
    }
    /**
     * 根据创建者ID分页查询问题列表
     *
     * @param creatorId 创建者ID
     * @param current    当前页码，默认为1
     * @param size       每页大小，默认为10
     * @return 分页结果
     */
    @GetMapping("/by-creator")
    @Operation(summary = "根据创建者ID分页查询题目", description = "根据创建者ID分页查询题目列表")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "400", description = "请求参数错误"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getQuestionsByCreator(
            @Parameter(description = "创建者ID", required = true, example = "1")
            @RequestParam Long creatorId,
            @Parameter(description = "当前页码", example = "1")
            @RequestParam(defaultValue = "1") Long current,
            @Parameter(description = "每页大小", example = "10")
            @RequestParam(defaultValue = "10") Long size) {

        // 创建分页参数对象
        Page<QuestionEntity> pageParam = new Page<>(current, size);

        // 调用Service方法并返回结果
        IPage<QuestionEntity> questionsByCreator = questionService.getQuestionsByCreator(creatorId, pageParam);
        return new RespBean(200, "查询成功", questionsByCreator);
    }

    /**
     * 测试分页功能 - 查询所有问题
     */
    @GetMapping("/test-pagination")
    @Operation(summary = "测试分页功能", description = "测试分页功能，查询所有题目")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "分页测试成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean testPagination(
            @Parameter(description = "当前页码", example = "1")
            @RequestParam(defaultValue = "1") Long current,
            @Parameter(description = "每页大小", example = "10")
            @RequestParam(defaultValue = "10") Long size) {
        
        // 创建分页参数对象
        Page<QuestionEntity> pageParam = new Page<>(current, size);
        
        // 直接使用MyBatis-Plus的分页查询
        IPage<QuestionEntity> result = questionService.page(pageParam);
        
        return new RespBean(200, "分页测试成功", result);
    }

    /**
     * 获取系统题目列表
     */
    @GetMapping("/system")
    @Operation(summary = "获取系统题目列表", description = "获取所有系统题目，所有用户都可以查看")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getSystemQuestions(
            @Parameter(description = "当前页码", example = "1")
            @RequestParam(defaultValue = "1") Long current,
            @Parameter(description = "每页大小", example = "10")
            @RequestParam(defaultValue = "10") Long size) {
        
        // 检查查看权限
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
            return new RespBean(403, "权限不足", null);
        }
        
        // 创建分页参数对象
        Page<QuestionEntity> pageParam = new Page<>(current, size);
        
        // 查询系统题目
        LambdaQueryWrapper<QuestionEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuestionEntity::getIsSystem, true);
        wrapper.orderByDesc(QuestionEntity::getCreatedAt);
        
        IPage<QuestionEntity> result = questionService.page(pageParam, wrapper);
        
        // 为每个题目补充学科名称
        List<Map<String, Object>> enrichedRecords = result.getRecords().stream().map(question -> {
            Map<String, Object> questionMap = new HashMap<>();
            questionMap.put("id", question.getId());
            questionMap.put("title", question.getTitle());
            questionMap.put("type", question.getType());
            questionMap.put("difficulty", question.getDifficulty());
            questionMap.put("options", question.getOptions());
            questionMap.put("correctAnswer", question.getCorrectAnswer());
            questionMap.put("explanation", question.getExplanation());
            questionMap.put("subjectId", question.getSubjectId());
            questionMap.put("knowledgePointIds", question.getKnowledgePointIds());
            questionMap.put("creatorId", question.getCreatorId());
            questionMap.put("isSystem", question.getIsSystem());
            questionMap.put("createdAt", question.getCreatedAt());
            questionMap.put("updatedAt", question.getUpdatedAt());
            
            // 查询并设置学科名称
            if (question.getSubjectId() != null) {
                try {
                    SubjectEntity subject = subjectMapper.selectById(question.getSubjectId());
                    if (subject != null && subject.getName() != null) {
                        questionMap.put("subject", subject.getName());
                    }
                } catch (Exception e) {
                    logger.warn("查询学科信息失败，subjectId: {}", question.getSubjectId());
                }
            }
            
            return questionMap;
        }).collect(Collectors.toList());
        
        // 构建分页响应
        Map<String, Object> pageData = new HashMap<>();
        pageData.put("records", enrichedRecords);
        pageData.put("total", result.getTotal());
        pageData.put("size", result.getSize());
        pageData.put("current", result.getCurrent());
        pageData.put("pages", result.getPages());
        
        return new RespBean(200, "查询成功", pageData);
    }

    /**
     * 按学科和知识点查询题目
     */
    @GetMapping("/search")
    @Operation(summary = "按学科和知识点查询题目", description = "支持按学科、知识点、难度等条件查询题目")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean searchQuestions(
            @Parameter(description = "学科ID", example = "1")
            @RequestParam(required = false) Long subjectId,
            @Parameter(description = "知识点ID列表", example = "1,2,3")
            @RequestParam(required = false) String knowledgePointIds,
            @Parameter(description = "难度等级", example = "EASY")
            @RequestParam(required = false) String difficulty,
            @Parameter(description = "题目类型", example = "SINGLE_CHOICE")
            @RequestParam(required = false) String type,
            @Parameter(description = "关键词搜索", example = "Java")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "当前页码", example = "1")
            @RequestParam(defaultValue = "1") Long current,
            @Parameter(description = "每页大小", example = "10")
            @RequestParam(defaultValue = "10") Long size) {
        
        try {
            // 检查查看权限
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
                return new RespBean(403, "权限不足", null);
            }
            
            // 创建分页参数对象
            Page<QuestionEntity> pageParam = new Page<>(current, size);
            
            // 构建查询条件
            LambdaQueryWrapper<QuestionEntity> wrapper = new LambdaQueryWrapper<>();
            
            // 学科筛选（按ID）
            if (subjectId != null) {
                wrapper.eq(QuestionEntity::getSubjectId, subjectId);
            }
            
            // 难度筛选
            if (difficulty != null && !difficulty.trim().isEmpty()) {
                wrapper.eq(QuestionEntity::getDifficulty, difficulty.trim());
            }
            
            // 题目类型筛选
            if (type != null && !type.trim().isEmpty()) {
                wrapper.eq(QuestionEntity::getType, type.trim());
            }
            
            // 关键词搜索
            if (keyword != null && !keyword.trim().isEmpty()) {
                wrapper.and(w -> w.like(QuestionEntity::getTitle, keyword.trim())
                        .or().like(QuestionEntity::getExplanation, keyword.trim()));
            }
            
            // 知识点筛选
            if (knowledgePointIds != null && !knowledgePointIds.trim().isEmpty()) {
                String[] ids = knowledgePointIds.split(",");
                for (String id : ids) {
                    if (id.trim().matches("\\d+")) {
                        wrapper.like(QuestionEntity::getKnowledgePointIds, id.trim());
                    }
                }
            }
            
            // 权限控制：非管理员只能看到系统题目和自己的题目
            if (currentUser == null || !UserEntity.UserRole.ADMIN.equals(currentUser.getRole())) {
                wrapper.and(w -> w.eq(QuestionEntity::getIsSystem, true)
                        .or().eq(QuestionEntity::getCreatorId, currentUser != null ? currentUser.getId() : 0));
            }
            
            wrapper.orderByDesc(QuestionEntity::getCreatedAt);
            
            IPage<QuestionEntity> result = questionService.page(pageParam, wrapper);
            
            return new RespBean(200, "查询成功", result);
            
        } catch (Exception e) {
            logger.error("查询题目失败", e);
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取所有题目（用于题目选择器）
     */
    @GetMapping("")
    @Operation(summary = "获取所有题目", description = "获取所有题目，包括系统题目和个人题目，用于题目选择器")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getAllQuestions(
            @Parameter(description = "当前页码", example = "1")
            @RequestParam(defaultValue = "1") Long current,
            @Parameter(description = "每页大小", example = "1000")
            @RequestParam(defaultValue = "1000") Long size,
            @Parameter(description = "学科ID", example = "1")
            @RequestParam(required = false) Long subjectId) {
        
        try {
            //  权限控制：获取当前用户
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (currentUser == null) {
                return new RespBean(401, "用户未登录", null);
            }
            
            //  权限控制：非管理员只能看到系统题目或自己创建的题目
            IPage<QuestionEntity> page;
            if (SimplePermissionUtils.isAdmin(currentUser)) {
                // 管理员：可以看到所有题目
                page = questionService.getAllQuestions(current, size, subjectId);
            } else {
                // 普通用户：只能看到系统题目或自己创建的题目
                page = questionService.getQuestionsForUser(currentUser.getId(), current, size, subjectId);
            }
            
            // 构建分页结果
            Map<String, Object> result = new HashMap<>();
            result.put("records", page.getRecords());
            result.put("total", page.getTotal());
            result.put("size", page.getSize());
            result.put("current", page.getCurrent());
            result.put("pages", page.getPages());
            
            return new RespBean(200, "查询成功", result);
        } catch (Exception e) {
            logger.error("获取所有题目失败", e);
            return new RespBean(500, "获取题目失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取用户个人题目列表
     */
    @GetMapping("/my")
    @Operation(summary = "获取用户个人题目列表", description = "获取当前用户的个人题目，支持筛选")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getMyQuestions(
            @Parameter(description = "当前页码", example = "1")
            @RequestParam(defaultValue = "1") Long current,
            @Parameter(description = "每页大小", example = "10")
            @RequestParam(defaultValue = "10") Long size,
            @Parameter(description = "学科ID", example = "1")
            @RequestParam(required = false) Long subjectId,
            @Parameter(description = "难度等级", example = "EASY")
            @RequestParam(required = false) String difficulty,
            @Parameter(description = "题目类型", example = "SINGLE_CHOICE")
            @RequestParam(required = false) String type,
            @Parameter(description = "关键词搜索", example = "Java")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "开始创建时间", example = "2024-01-01")
            @RequestParam(required = false) String startDate,
            @Parameter(description = "结束创建时间", example = "2024-12-31")
            @RequestParam(required = false) String endDate) {
        
        try {
            // 检查查看权限
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
                return new RespBean(403, "权限不足", null);
            }
            
            // 创建分页参数对象
            Page<QuestionEntity> pageParam = new Page<>(current, size);
            
            // 查询用户个人题目
            LambdaQueryWrapper<QuestionEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(QuestionEntity::getCreatorId, currentUser.getId());
            wrapper.eq(QuestionEntity::getIsSystem, false);
            
            // 学科筛选（按ID）
            if (subjectId != null) {
                wrapper.eq(QuestionEntity::getSubjectId, subjectId);
            }
            
            // 难度筛选
            if (difficulty != null && !difficulty.trim().isEmpty()) {
                wrapper.eq(QuestionEntity::getDifficulty, difficulty.trim());
            }
            
            // 题目类型筛选
            if (type != null && !type.trim().isEmpty()) {
                wrapper.eq(QuestionEntity::getType, type.trim());
            }
            
            // 关键词搜索
            if (keyword != null && !keyword.trim().isEmpty()) {
                wrapper.and(w -> w.like(QuestionEntity::getTitle, keyword.trim())
                        .or().like(QuestionEntity::getExplanation, keyword.trim()));
            }
            
            // 创建时间范围筛选
            if (startDate != null && !startDate.trim().isEmpty()) {
                try {
                    LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
                    wrapper.ge(QuestionEntity::getCreatedAt, start);
                } catch (Exception e) {
                    logger.warn("解析开始时间失败: {}", startDate);
                }
            }
            if (endDate != null && !endDate.trim().isEmpty()) {
                try {
                    LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
                    wrapper.le(QuestionEntity::getCreatedAt, end);
                } catch (Exception e) {
                    logger.warn("解析结束时间失败: {}", endDate);
                }
            }
            
            wrapper.orderByDesc(QuestionEntity::getCreatedAt);
            
            IPage<QuestionEntity> result = questionService.page(pageParam, wrapper);
            
            // 为每个题目补充学科名称
            List<Map<String, Object>> enrichedRecords = result.getRecords().stream().map(question -> {
                Map<String, Object> questionMap = new HashMap<>();
                questionMap.put("id", question.getId());
                questionMap.put("title", question.getTitle());
                questionMap.put("type", question.getType());
                questionMap.put("difficulty", question.getDifficulty());
                questionMap.put("options", question.getOptions());
                questionMap.put("correctAnswer", question.getCorrectAnswer());
                questionMap.put("explanation", question.getExplanation());
                questionMap.put("subjectId", question.getSubjectId());
                questionMap.put("knowledgePointIds", question.getKnowledgePointIds());
                questionMap.put("creatorId", question.getCreatorId());
                questionMap.put("isSystem", question.getIsSystem());
                questionMap.put("createdAt", question.getCreatedAt());
                questionMap.put("updatedAt", question.getUpdatedAt());
                
                // 查询并设置学科名称
                if (question.getSubjectId() != null) {
                    try {
                        SubjectEntity subject = subjectMapper.selectById(question.getSubjectId());
                        if (subject != null && subject.getName() != null) {
                            questionMap.put("subject", subject.getName());
                        }
                    } catch (Exception e) {
                        logger.warn("查询学科信息失败，subjectId: {}", question.getSubjectId());
                    }
                }
                
                return questionMap;
            }).collect(Collectors.toList());
            
            // 构建分页响应
            Map<String, Object> pageData = new HashMap<>();
            pageData.put("records", enrichedRecords);
            pageData.put("total", result.getTotal());
            pageData.put("size", result.getSize());
            pageData.put("current", result.getCurrent());
            pageData.put("pages", result.getPages());
            
            return new RespBean(200, "查询成功", pageData);
        } catch (Exception e) {
            logger.error("获取个人题目列表失败", e);
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }

    /**
     * 创建系统题目（仅管理员）
     */
    @PostMapping("/system/create")
    @Operation(summary = "创建系统题目", description = "创建系统题目，仅管理员可以操作")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "创建成功"),
            @ApiResponse(responseCode = "403", description = "权限不足"),
            @ApiResponse(responseCode = "500", description = "创建失败")
    })
    public RespBean createSystemQuestion(
            @Parameter(description = "题目信息", required = true)
            @RequestBody QuestionEntity question) {
        
        try {
            // 检查权限
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (!SimplePermissionUtils.hasSystemManagePermission(currentUser)) {
                return new RespBean(403, "权限不足，只有管理员可以创建系统题目", null);
            }
            
            // 验证必填字段
            if (question.getTitle() == null || question.getTitle().trim().isEmpty()) {
                return new RespBean(400, "题目标题不能为空", null);
            }
            if (question.getType() == null) {
                return new RespBean(400, "题目类型不能为空", null);
            }
            if (question.getDifficulty() == null) {
                return new RespBean(400, "难度等级不能为空", null);
            }
            if (question.getCorrectAnswer() == null || question.getCorrectAnswer().trim().isEmpty()) {
                return new RespBean(400, "正确答案不能为空", null);
            }
            if (question.getSubjectId() == null) {
                return new RespBean(400, "学科ID不能为空", null);
            }
            // 知识点校验：必须至少选择一个知识点，且需存在
            List<Long> kpIds = question.getKnowledgePointIdsList();
            if (kpIds == null || kpIds.isEmpty()) {
                return new RespBean(400, "知识点不能为空，请至少选择一个知识点", null);
            }
            for (Long kpId : kpIds) {
                if (kpId == null) {
                    return new RespBean(400, "知识点ID不能为空", null);
                }
                KnowledgePointEntity kp = knowledgePointMapper.selectById(kpId);
                if (kp == null) {
                    return new RespBean(400, "知识点不存在: " + kpId, null);
                }
                if (kp.getSubjectId() != null && !kp.getSubjectId().equals(question.getSubjectId())) {
                    return new RespBean(400, "知识点与选择的学科不匹配: " + kp.getName(), null);
                }
            }
            
            // 设置系统题目标识和创建者
            question.setIsSystem(true);
            question.setCreatorId(currentUser.getId());
            
            // 设置创建时间
            question.setCreatedAt(LocalDateTime.now());
            question.setUpdatedAt(LocalDateTime.now());
            
            boolean success = questionService.save(question);
            if (success) {
                try { redisCacheService.evictByQuestion(question.getId()); } catch (Exception ignored) {}
                return new RespBean(200, "系统题目创建成功", question);
            } else {
                return new RespBean(500, "创建失败", null);
            }
    } catch (Exception e) {
        e.printStackTrace();
        return new RespBean(500, "创建失败: " + e.getMessage(), null);
    }
}

/**
 * 批量导入系统题目
 */
@PostMapping("/system/batch-import")
public RespBean batchImportSystemQuestions(@RequestBody List<QuestionEntity> questions) {
    try {
        // 权限检查
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (currentUser == null) {
            return new RespBean(401, "用户未登录", null);
        }
        if (currentUser.getRole() != UserEntity.UserRole.ADMIN) {
            return new RespBean(403, "权限不足", null);
        }

        if (questions == null || questions.isEmpty()) {
            return new RespBean(400, "题目列表不能为空", null);
        }

        List<QuestionEntity> successQuestions = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (int i = 0; i < questions.size(); i++) {
            QuestionEntity question = questions.get(i);
            try {
                // 验证必填字段
                if (question.getTitle() == null || question.getTitle().trim().isEmpty()) {
                    errors.add("题目" + (i + 1) + ": 题目标题不能为空");
                    continue;
                }
                if (question.getType() == null) {
                    errors.add("题目" + (i + 1) + ": 题目类型不能为空");
                    continue;
                }
                if (question.getDifficulty() == null) {
                    errors.add("题目" + (i + 1) + ": 难度等级不能为空");
                    continue;
                }
                if (question.getCorrectAnswer() == null || question.getCorrectAnswer().trim().isEmpty()) {
                    errors.add("题目" + (i + 1) + ": 正确答案不能为空");
                    continue;
                }
                if (question.getSubjectId() == null) {
                    errors.add("题目" + (i + 1) + ": 学科ID不能为空");
                    continue;
                }

                // 设置系统题目属性
                question.setIsSystem(true);
                question.setCreatorId(currentUser.getId());
                question.setCreatedAt(LocalDateTime.now());
                question.setUpdatedAt(LocalDateTime.now());

                boolean success = questionService.save(question);
                if (success) {
                    successQuestions.add(question);
                } else {
                    errors.add("题目" + (i + 1) + ": 保存失败");
                }
            } catch (Exception e) {
                errors.add("题目" + (i + 1) + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("successCount", successQuestions.size());
        result.put("failedCount", errors.size());
        result.put("errors", errors);
        result.put("successQuestions", successQuestions);

        return new RespBean(200, "批量导入完成", result);
    } catch (Exception e) {
        e.printStackTrace();
        return new RespBean(500, "批量导入失败: " + e.getMessage(), null);
    }
}

/**
 * 批量导入个人题目
 */
@PostMapping("/my/batch-import")
public RespBean batchImportMyQuestions(@RequestBody List<QuestionEntity> questions) {
    try {
        // 权限检查
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (currentUser == null) {
            return new RespBean(401, "用户未登录", null);
        }

        if (questions == null || questions.isEmpty()) {
            return new RespBean(400, "题目列表不能为空", null);
        }

        List<QuestionEntity> successQuestions = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (int i = 0; i < questions.size(); i++) {
            QuestionEntity question = questions.get(i);
            try {
                // 验证必填字段
                if (question.getTitle() == null || question.getTitle().trim().isEmpty()) {
                    errors.add("题目" + (i + 1) + ": 题目标题不能为空");
                    continue;
                }
                if (question.getType() == null) {
                    errors.add("题目" + (i + 1) + ": 题目类型不能为空");
                    continue;
                }
                if (question.getDifficulty() == null) {
                    errors.add("题目" + (i + 1) + ": 难度等级不能为空");
                    continue;
                }
                if (question.getCorrectAnswer() == null || question.getCorrectAnswer().trim().isEmpty()) {
                    errors.add("题目" + (i + 1) + ": 正确答案不能为空");
                    continue;
                }
                if (question.getSubjectId() == null) {
                    errors.add("题目" + (i + 1) + ": 学科ID不能为空");
                    continue;
                }

                // 设置个人题目属性
                question.setIsSystem(false);
                question.setCreatorId(currentUser.getId());
                question.setCreatedAt(LocalDateTime.now());
                question.setUpdatedAt(LocalDateTime.now());

                boolean success = questionService.save(question);
                if (success) {
                    successQuestions.add(question);
                } else {
                    errors.add("题目" + (i + 1) + ": 保存失败");
                }
            } catch (Exception e) {
                errors.add("题目" + (i + 1) + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("successCount", successQuestions.size());
        result.put("failedCount", errors.size());
        result.put("errors", errors);
        result.put("successQuestions", successQuestions);

        return new RespBean(200, "批量导入完成", result);
    } catch (Exception e) {
        e.printStackTrace();
        return new RespBean(500, "批量导入失败: " + e.getMessage(), null);
    }
}

    /**
     * 创建个人题目
     */
    @PostMapping("/my/create")
    @Operation(summary = "创建个人题目", description = "创建个人题目，管理员和教师可以操作")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "创建成功"),
            @ApiResponse(responseCode = "403", description = "权限不足"),
            @ApiResponse(responseCode = "500", description = "创建失败")
    })
    public RespBean createMyQuestion(
            @Parameter(description = "题目信息", required = true)
            @RequestBody QuestionEntity question) {
        
        // 检查权限
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (!SimplePermissionUtils.hasContentCreatePermission(currentUser)) {
            return new RespBean(403, "权限不足，只有管理员和教师可以创建题目", null);
        }
        
        // 设置个人题目标识和创建者
        question.setIsSystem(false);
        question.setCreatorId(currentUser.getId());
        if (question.getSubjectId() == null) {
            return new RespBean(400, "学科ID不能为空", null);
        }
        // 知识点校验：必须至少选择一个知识点，且需存在
        List<Long> kpIds = question.getKnowledgePointIdsList();
        if (kpIds == null || kpIds.isEmpty()) {
            return new RespBean(400, "知识点不能为空，请至少选择一个知识点", null);
        }
        for (Long kpId : kpIds) {
            if (kpId == null) {
                return new RespBean(400, "知识点ID不能为空", null);
            }
            KnowledgePointEntity kp = knowledgePointMapper.selectById(kpId);
            if (kp == null) {
                return new RespBean(400, "知识点不存在: " + kpId, null);
            }
            if (kp.getSubjectId() != null && !kp.getSubjectId().equals(question.getSubjectId())) {
                return new RespBean(400, "知识点与选择的学科不匹配: " + kp.getName(), null);
            }
        }
        
        boolean success = questionService.save(question);
        if (success) {
            try { redisCacheService.evictByQuestion(question.getId()); } catch (Exception ignored) {}
            return new RespBean(200, "个人题目创建成功", question);
        } else {
            return new RespBean(500, "创建失败", null);
        }
    }

    /**
     * 复制系统题目到个人题库
     */
    @PostMapping("/copy/{questionId}")
    @Operation(summary = "复制系统题目到个人题库", description = "将系统题目复制到个人题库")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "复制成功"),
            @ApiResponse(responseCode = "403", description = "权限不足"),
            @ApiResponse(responseCode = "404", description = "题目不存在"),
            @ApiResponse(responseCode = "500", description = "复制失败")
    })
    public RespBean copySystemQuestion(
            @Parameter(description = "题目ID", required = true, example = "1")
            @PathVariable Long questionId) {
        
        // 检查权限
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (!SimplePermissionUtils.hasCopyPermission(currentUser)) {
            return new RespBean(403, "权限不足", null);
        }
        
        // 获取原题目
        QuestionEntity originalQuestion = questionService.getById(questionId);
        if (originalQuestion == null) {
            return new RespBean(404, "题目不存在", null);
        }
        
        // 检查是否为系统题目
        if (!SimplePermissionUtils.isSystemContent(originalQuestion.getIsSystem())) {
            return new RespBean(400, "只能复制系统题目", null);
        }
        
        // 创建复制的题目
        QuestionEntity copiedQuestion = new QuestionEntity();
        copiedQuestion.setTitle(originalQuestion.getTitle() + " (复制)");
        copiedQuestion.setType(originalQuestion.getType());
        copiedQuestion.setDifficulty(originalQuestion.getDifficulty());
        copiedQuestion.setOptions(originalQuestion.getOptions());
        copiedQuestion.setCorrectAnswer(originalQuestion.getCorrectAnswer());
        copiedQuestion.setExplanation(originalQuestion.getExplanation());
        copiedQuestion.setSubjectId(originalQuestion.getSubjectId());
        copiedQuestion.setIsSystem(false);
        copiedQuestion.setCreatorId(currentUser.getId());
        
        boolean success = questionService.save(copiedQuestion);
        if (success) {
            return new RespBean(200, "题目复制成功", copiedQuestion);
        } else {
            return new RespBean(500, "复制失败", null);
        }
    }

    /**
     * 更新题目（需要权限检查）
     */
    @PutMapping("/update/{id}")
    @Operation(summary = "更新题目", description = "更新题目信息，需要相应权限")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "更新成功"),
            @ApiResponse(responseCode = "403", description = "权限不足"),
            @ApiResponse(responseCode = "404", description = "题目不存在"),
            @ApiResponse(responseCode = "500", description = "更新失败")
    })
    public RespBean updateQuestion(
            @Parameter(description = "题目ID", required = true, example = "1")
            @PathVariable Long id,
            @Parameter(description = "题目信息", required = true)
            @RequestBody QuestionEntity question) {
        
        // 检查权限
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
            return new RespBean(403, "权限不足", null);
        }
        
        // 获取原题目
        QuestionEntity existingQuestion = questionService.getById(id);
        if (existingQuestion == null) {
            return new RespBean(404, "题目不存在", null);
        }
        
        // 检查修改权限
        if (!SimplePermissionUtils.hasContentEditPermission(currentUser, existingQuestion.getCreatorId()) ||
            !SimplePermissionUtils.hasSystemContentEditPermission(currentUser, existingQuestion.getIsSystem())) {
            return new RespBean(403, "权限不足，无法修改此题目", null);
        }
        
        // 更新题目
        question.setId(id);
        boolean success = questionService.updateById(question);
        if (success) {
            try { redisCacheService.evictByQuestion(id); } catch (Exception ignored) {}
            return new RespBean(200, "题目更新成功", question);
        } else {
            return new RespBean(500, "更新失败", null);
        }
    }

    /**
     * 删除题目（需要权限检查）
     */
    @DeleteMapping("/delete/{id}")
    @Operation(summary = "删除题目", description = "删除题目，需要相应权限")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "删除成功"),
            @ApiResponse(responseCode = "403", description = "权限不足"),
            @ApiResponse(responseCode = "404", description = "题目不存在"),
            @ApiResponse(responseCode = "500", description = "删除失败")
    })
    public RespBean deleteQuestion(
            @Parameter(description = "题目ID", required = true, example = "1")
            @PathVariable Long id) {
        
        // 检查权限
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
            return new RespBean(403, "权限不足", null);
        }
        
        // 获取原题目
        QuestionEntity existingQuestion = questionService.getById(id);
        if (existingQuestion == null) {
            return new RespBean(404, "题目不存在", null);
        }
        
        // 检查删除权限
        if (!SimplePermissionUtils.hasContentEditPermission(currentUser, existingQuestion.getCreatorId()) ||
            !SimplePermissionUtils.hasSystemContentEditPermission(currentUser, existingQuestion.getIsSystem())) {
            return new RespBean(403, "权限不足，无法删除此题目", null);
        }
        
        // 删除题目
        boolean success = questionService.removeById(id);
        if (success) {
            try { redisCacheService.evictByQuestion(id); } catch (Exception ignored) {}
            return new RespBean(200, "题目删除成功", null);
        } else {
            return new RespBean(500, "删除失败", null);
        }
    }
    
    /**
     * 获取题目的统计信息（按学科和题型）
     */
    @GetMapping("/statistics")
    @Operation(summary = "获取题目统计信息", description = "获取指定学科的题目统计信息")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getQuestionStatistics(
            @Parameter(description = "学科ID", example = "1")
            @RequestParam Long subjectId) {
        
        try {
            LambdaQueryWrapper<QuestionEntity> wrapper = new LambdaQueryWrapper<>();
            
            //  按学科ID筛选
            if (subjectId != null) {
                wrapper.eq(QuestionEntity::getSubjectId, subjectId);
            }
            
            // 获取所有题目
            List<QuestionEntity> questions = questionService.list(wrapper);
            
            // 按题型统计
            Map<String, Integer> statistics = new HashMap<>();
            Map<String, Long> typeCount = questions.stream()
                    .collect(Collectors.groupingBy(
                            q -> q.getType() != null ? q.getType().toString() : "UNKNOWN",
                            Collectors.counting()
                    ));
            
            // 转换为Integer
            for (Map.Entry<String, Long> entry : typeCount.entrySet()) {
                statistics.put(entry.getKey(), entry.getValue().intValue());
            }
            
            // 总题目数
            statistics.put("TOTAL", questions.size());
            
            Map<String, Object> result = new HashMap<>();
            result.put("subjectId", subjectId);
            result.put("statistics", statistics);
            result.put("total", questions.size());
            
            return new RespBean(200, "查询成功", result);
        } catch (Exception e) {
            logger.error("获取题目统计信息失败", e);
            return new RespBean(500, "获取统计信息失败: " + e.getMessage(), null);
        }
    }
}
