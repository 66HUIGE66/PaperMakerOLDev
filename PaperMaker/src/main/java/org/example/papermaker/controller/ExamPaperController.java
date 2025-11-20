package org.example.papermaker.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.example.papermaker.context.SimpleUserContext;
import org.example.papermaker.entity.ExamPaperEntity;
import org.example.papermaker.entity.UserEntity;
import org.example.papermaker.entity.SubjectEntity;
import org.example.papermaker.entity.QuestionEntity;
import org.example.papermaker.mapper.UserMapper;
import org.example.papermaker.mapper.SubjectMapper;
import org.example.papermaker.service.ExamPaperService;
import org.example.papermaker.service.QuestionService;
import org.example.papermaker.mapper.ExamRuleMapper;
import org.example.papermaker.entity.ExamRuleEntity;
import org.example.papermaker.util.SimplePermissionUtils;
import org.example.papermaker.vo.RespBean;
import org.example.papermaker.vo.ExamPaperVo;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 试卷控制器
 * 提供试卷的增删改查功能
 * 
 * @author System
 * @since 1.0.0
 */
@RestController
@RequestMapping("/exam-paper")
@Tag(name = "试卷管理", description = "试卷的增删改查操作")
public class ExamPaperController {
    
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(ExamPaperController.class);
    
    @Resource
    private ExamPaperService examPaperService;
    
    @Resource
    private QuestionService questionService;
    
    @Resource
    private ExamRuleMapper examRuleMapper;
    
    @Resource
    private UserMapper userMapper;
    
    @Resource
    private SubjectMapper subjectMapper;
    
    /**
     * 获取所有试卷
     */
    @GetMapping("/list")
    @Operation(summary = "获取所有试卷", description = "获取系统中所有的试卷列表")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getAllPapers() {
        List<ExamPaperEntity> papers = examPaperService.list();
        return new RespBean(200, "查询成功", papers);
    }
    
    /**
     * 分页获取试卷列表
     */
    @GetMapping("/page")
    @Operation(summary = "分页获取试卷列表", description = "分页获取试卷列表，用于练习页面")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getPapersPage(
            @Parameter(description = "当前页码", example = "1") @RequestParam(defaultValue = "1") Long current,
            @Parameter(description = "每页大小", example = "10") @RequestParam(defaultValue = "10") Long size,
            @Parameter(description = "搜索关键词") @RequestParam(required = false) String searchText,
            @Parameter(description = "试卷类型") @RequestParam(required = false) String type,
            @Parameter(description = "学科ID") @RequestParam(required = false) Long subjectId) {
        
        System.out.println("========== 接收到试卷列表请求 ==========");
        System.out.println("参数 - current: " + current + ", size: " + size + ", searchText: " + searchText + ", type: " + type + ", subjectId: " + subjectId);
        System.out.println("subjectId类型: " + (subjectId != null ? subjectId.getClass().getName() : "null"));
        try {
            // 检查权限
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            System.out.println("当前用户信息: " + (currentUser != null ? 
                "ID=" + currentUser.getId() + ", 用户名=" + currentUser.getUsername() + ", 角色=" + currentUser.getRole() : "null"));
            
            if (currentUser == null) {
                System.out.println("错误：当前用户为null，无法获取试卷列表");
                return new RespBean(401, "用户未登录", null);
            }
            
            if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
                System.out.println("权限检查失败：用户没有查看权限");
                return new RespBean(403, "权限不足", null);
            }
            
            // 创建分页对象
            Page<ExamPaperEntity> page = new Page<>(current, size);
            
            // 查询条件：获取所有试卷，按创建时间倒序
            LambdaQueryWrapper<ExamPaperEntity> wrapper = new LambdaQueryWrapper<>();
            
            //  权限控制：开始练习页面显示所有系统试卷和用户自己创建的试卷
            // 注意：这里是练习页面，应该允许所有用户看到系统试卷用于练习
            if (!SimplePermissionUtils.isAdmin(currentUser)) {
                System.out.println("普通用户权限过滤 - 用户ID: " + currentUser.getId());
                System.out.println("查询条件：系统试卷（isSystem=true）或用户创建的试卷（isSystem=false AND creatorId=" + currentUser.getId() + "）");
                
                // 普通用户：可以看到所有系统试卷（用于练习）或自己创建的试卷
                // 修复：使用正确的OR逻辑 (isSystem=true) OR (isSystem=false AND creatorId=当前用户ID)
                // MyBatis Plus的.and()和.or()组合：使用or方法嵌套条件
                wrapper.and(w -> w
                    .eq(ExamPaperEntity::getIsSystem, true)  // 系统试卷（所有用户都可以看到用于练习）
                    .or(w2 -> w2
                        .eq(ExamPaperEntity::getIsSystem, false)  // 非系统试卷
                        .eq(ExamPaperEntity::getCreatorId, currentUser.getId())  // 且是当前用户创建的
                    )
                );
            } else {
                System.out.println("管理员权限 - 查询所有试卷");
            }
            // 管理员可以看到所有试卷，不需要额外过滤
            
            // 搜索关键词筛选（试卷标题或描述）
            if (searchText != null && !searchText.trim().isEmpty()) {
                wrapper.and(w -> w.like(ExamPaperEntity::getTitle, searchText.trim())
                    .or().like(ExamPaperEntity::getDescription, searchText.trim()));
            }
            
            // 类型筛选
            if (type != null && !type.isEmpty() && !type.equals("ALL")) {
                wrapper.eq(ExamPaperEntity::getGenerationType, type);
            }
            
            wrapper.orderByDesc(ExamPaperEntity::getCreatedAt);
            
            // 打印SQL查询条件（用于调试）
            System.out.println("SQL查询条件: " + wrapper.getTargetSql());
            System.out.println("查询参数: " + wrapper.getParamNameValuePairs());
            
            // 执行分页查询
            IPage<ExamPaperEntity> result = examPaperService.page(page, wrapper);
            
            System.out.println("查询结果 - 总记录数: " + result.getTotal() + ", 当前页记录数: " + result.getRecords().size());
            if (!result.getRecords().isEmpty()) {
                ExamPaperEntity firstPaper = result.getRecords().get(0);
                System.out.println("第一条试卷 - ID: " + firstPaper.getId() + ", 标题: " + firstPaper.getTitle() + 
                    ", isSystem: " + firstPaper.getIsSystem() + ", creatorId: " + firstPaper.getCreatorId());
            } else {
                System.out.println("警告：查询结果为空！");
            }
            
            // 如果指定了学科ID，需要在内存中进一步筛选（因为试卷表没有直接关联学科）
            List<ExamPaperEntity> filteredRecords = new ArrayList<>(result.getRecords());
            long filteredTotal = result.getTotal();
            
            if (subjectId != null) {
                System.out.println("========== 开始筛选学科 ==========");
                System.out.println("筛选学科ID: " + subjectId + " (类型: " + subjectId.getClass().getName() + ")");
                System.out.println("筛选前的试卷数量: " + result.getRecords().size());
                System.out.println("筛选前的试卷ID列表: " + result.getRecords().stream().map(ExamPaperEntity::getId).collect(Collectors.toList()));
                
                // 通过试卷题目关联查询学科
                filteredRecords = examPaperService.filterPapersBySubject(result.getRecords(), subjectId);
                filteredTotal = filteredRecords.size();
                
                System.out.println("筛选后的试卷数量: " + filteredRecords.size());
                System.out.println("筛选后的试卷ID列表: " + filteredRecords.stream().map(ExamPaperEntity::getId).collect(Collectors.toList()));
                System.out.println("========== 筛选完成 ==========");
                
                if (filteredRecords.size() == result.getRecords().size()) {
                    System.out.println("警告: 筛选后数量与筛选前相同，可能筛选未生效！");
                }
            } else {
                System.out.println("未指定学科筛选，返回所有试卷");
            }
            
            // 为每个试卷补充创建者用户名和学科名称
            List<Map<String, Object>> enrichedRecords = filteredRecords.stream().map(paper -> {
                Map<String, Object> paperMap = new HashMap<>();
                paperMap.put("id", paper.getId());
                paperMap.put("title", paper.getTitle());
                paperMap.put("description", paper.getDescription());
                paperMap.put("totalScore", paper.getTotalScore());
                paperMap.put("duration", paper.getDuration());
                paperMap.put("creatorId", paper.getCreatorId());
                paperMap.put("createdAt", paper.getCreatedAt());
                paperMap.put("ruleId", paper.getRuleId());
                paperMap.put("generationType", paper.getGenerationType());
                paperMap.put("isSystem", paper.getIsSystem());
                
                // 获取题目列表（用于计算数量和获取学科）
                List<Map<String, Object>> questions = examPaperService.getPaperQuestions(paper.getId());
                int questionCount = questions != null ? questions.size() : 0;
                paperMap.put("totalQuestions", questionCount);
                
                // 查询并设置创建者用户名
                String creatorName = "未知用户";
                if (paper.getCreatorId() != null) {
                    try {
                        UserEntity creator = userMapper.selectById(paper.getCreatorId());
                        if (creator != null && creator.getUsername() != null) {
                            creatorName = creator.getUsername();
                        } else {
                            System.out.println("未找到创建者，creatorId: " + paper.getCreatorId());
                        }
                    } catch (Exception e) {
                        System.out.println("查询创建者失败，creatorId: " + paper.getCreatorId() + ", 错误: " + e.getMessage());
                    }
                }
                // 确保creatorName不为null
                if (creatorName == null || creatorName.trim().isEmpty()) {
                    creatorName = paper.getCreatorId() != null ? "用户" + paper.getCreatorId() : "未知用户";
                }
                paperMap.put("creatorName", creatorName);
                System.out.println("试卷ID: " + paper.getId() + ", creatorId: " + paper.getCreatorId() + ", creatorName: " + creatorName);
                
                // 调试：打印paperMap的所有键和creatorName的值
                System.out.println("paperMap的键: " + paperMap.keySet());
                System.out.println("paperMap.get('creatorName'): " + paperMap.get("creatorName"));
                
                // 查询并设置学科名称（如果试卷有subject字段且是数字ID，则查询学科名称）
                String paperSubject = paper.getSubjectId();
                if (paperSubject != null && !paperSubject.trim().isEmpty()) {
                    // 检查是否是数字ID
                    try {
                        Long subjectIdNum = Long.parseLong(paperSubject.trim());
                        SubjectEntity subject = subjectMapper.selectById(subjectIdNum);
                        if (subject != null && subject.getName() != null) {
                            paperMap.put("subject", subject.getName());
                        } else {
                            paperMap.put("subject", paperSubject); // 保持原值
                        }
                    } catch (NumberFormatException e) {
                        // 不是数字，直接使用
                        paperMap.put("subject", paperSubject);
                    }
                } else {
                    // 如果没有subject字段，尝试通过题目获取学科
                    String foundSubject = null;
                    // questions已经在上面获取了，直接使用
                    if (questions != null && !questions.isEmpty()) {
                        // 获取第一个题目的学科
                        Object firstSubjectId = questions.get(0).get("subjectId");
                        if (firstSubjectId != null) {
                            try {
                                Long sid = firstSubjectId instanceof Number 
                                    ? ((Number)firstSubjectId).longValue() 
                                    : Long.parseLong(firstSubjectId.toString());
                                SubjectEntity subject = subjectMapper.selectById(sid);
                                if (subject != null && subject.getName() != null) {
                                    foundSubject = subject.getName();
                                }
                            } catch (Exception ex) {
                                // 忽略错误
                            }
                        }
                    }
                    paperMap.put("subject", foundSubject);
                }
                
                return paperMap;
            }).collect(Collectors.toList());
            
            // 如果指定了subjectId，需要重新分页
            if (subjectId != null) {
                int start = (int) ((current - 1) * size);
                int end = Math.min(start + size.intValue(), enrichedRecords.size());
                enrichedRecords = enrichedRecords.subList(start, end);
            }
            
            // 构建分页响应
            Map<String, Object> pageData = new HashMap<>();
            pageData.put("records", enrichedRecords);
            pageData.put("total", filteredTotal);
            pageData.put("size", size);
            pageData.put("current", current);
            pageData.put("pages", (filteredTotal + size - 1) / size);
            
            // 调试：打印第一个enrichedRecord的详细信息
            if (!enrichedRecords.isEmpty()) {
                Map<String, Object> firstRecord = enrichedRecords.get(0);
                System.out.println("========== 第一个enrichedRecord ==========");
                System.out.println("所有键: " + firstRecord.keySet());
                System.out.println("creatorName值: " + firstRecord.get("creatorName"));
                System.out.println("creatorId值: " + firstRecord.get("creatorId"));
                System.out.println("subject值: " + firstRecord.get("subject"));
                System.out.println("完整数据: " + firstRecord);
                System.out.println("==========================================");
            }
            
            System.out.println("返回的记录数量: " + enrichedRecords.size());
            
            return new RespBean(200, "查询成功", pageData);
        } catch (Exception e) {
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 根据ID获取试卷
     */
    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取试卷", description = "根据试卷ID获取试卷详情")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "404", description = "试卷不存在"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getPaperById(
            @Parameter(description = "试卷ID", required = true, example = "1")
            @PathVariable Long id) {
        //  权限检查：获取当前用户
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
            return new RespBean(403, "权限不足", null);
        }
        
        ExamPaperEntity paper = examPaperService.getById(id);
        if (paper != null) {
            //  权限控制：非管理员只能查看系统试卷或自己创建的试卷
            if (!SimplePermissionUtils.isAdmin(currentUser)) {
                boolean isSystemPaper = SimplePermissionUtils.isSystemContent(paper.getIsSystem());
                boolean isOwner = currentUser.getId().equals(paper.getCreatorId());
                
                if (!isSystemPaper && !isOwner) {
                    return new RespBean(403, "权限不足，无法查看此试卷", null);
                }
            }
            // 转换为ExamPaperVo并填充学科名
            ExamPaperVo vo = new ExamPaperVo();
            vo.setId(paper.getId());
            vo.setTitle(paper.getTitle());
            vo.setDescription(paper.getDescription());
            vo.setTotalScore(paper.getTotalScore());
            vo.setDuration(paper.getDuration());
            vo.setSubjectId(paper.getSubjectId());
            vo.setCreatorId(paper.getCreatorId());
            vo.setRuleId(paper.getRuleId());
            vo.setQuestionIds(paper.getQuestionIds());
            vo.setDifficultyScore(paper.getDifficultyScore());
            vo.setGenerationType(paper.getGenerationType());
            vo.setIsSystem(paper.getIsSystem()); //  复制isSystem字段
            vo.setCreatedAt(paper.getCreatedAt());
            vo.setUpdatedAt(paper.getUpdatedAt());
            
            // 查询并设置学科名称
            String paperSubjectId = paper.getSubjectId();
            if (paperSubjectId != null && !paperSubjectId.trim().isEmpty()) {
                try {
                    Long subjectIdNum = Long.parseLong(paperSubjectId.trim());
                    SubjectEntity subject = subjectMapper.selectById(subjectIdNum);
                    if (subject != null && subject.getName() != null) {
                        vo.setSubjectName(subject.getName());
                    } else {
                        vo.setSubjectName(paperSubjectId); // 保持原值
                    }
                } catch (NumberFormatException e) {
                    // 不是数字，直接使用
                    vo.setSubjectName(paperSubjectId);
                }
            }
            
            return new RespBean(200, "查询成功", vo);
        } else {
            return new RespBean(404, "试卷不存在", null);
        }
    }
    
    /**
     * 根据创建者ID获取试卷列表
     */
    @GetMapping("/by-creator/{creatorId}")
    @Operation(summary = "根据创建者ID获取试卷列表", description = "根据创建者ID获取该用户创建的所有试卷")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getPapersByCreator(
            @Parameter(description = "创建者ID", required = true, example = "1")
            @PathVariable Long creatorId) {
        List<ExamPaperEntity> papers = examPaperService.getPapersByCreator(creatorId);
        return new RespBean(200, "查询成功", papers);
    }
    
    /**
     * 创建试卷
     */
    @PostMapping("/create")
    @Operation(summary = "创建试卷", description = "创建新的试卷")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "创建成功"),
            @ApiResponse(responseCode = "400", description = "请求参数错误"),
            @ApiResponse(responseCode = "500", description = "创建失败")
    })
    public RespBean createPaper(
            @Parameter(description = "试卷信息", required = true)
            @RequestBody ExamPaperEntity paper) {
        org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(ExamPaperController.class);
        
        //  记录接收到的数据（调试用）
        logger.info("创建试卷 - 标题: {}, questionIds: {}, totalScore: {}, duration: {}, subjectId: {}", 
            paper.getTitle(), paper.getQuestionIds(), paper.getTotalScore(), paper.getDuration(), paper.getSubjectId());
        
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (!SimplePermissionUtils.hasContentCreatePermission(currentUser)) {
            return new RespBean(403, "权限不足", null);
        }

        // 设置创建者
        paper.setCreatorId(currentUser.getId());
        
        //  处理学科ID：如果subjectId为空，尝试从题目中推断学科
        if (paper.getSubjectId() == null || paper.getSubjectId().trim().isEmpty()) {
            try {
                // 如果试卷有题目ID列表，尝试从第一个题目获取学科ID
                if (paper.getQuestionIds() != null && !paper.getQuestionIds().trim().isEmpty()) {
                    String[] questionIds = paper.getQuestionIds().split(",");
                    if (questionIds.length > 0) {
                        try {
                            Long firstQuestionId = Long.parseLong(questionIds[0].trim());
                            QuestionEntity firstQuestion = questionService.getById(firstQuestionId);
                            if (firstQuestion != null && firstQuestion.getSubjectId() != null) {
                                paper.setSubjectId(firstQuestion.getSubjectId().toString());
                                logger.info("从题目ID {} 推断学科ID: {}", firstQuestionId, firstQuestion.getSubjectId());
                            }
                        } catch (Exception e) {
                            logger.debug("无法从题目推断学科: {}", e.getMessage());
                        }
                    }
                }
                
                // 如果仍然没有学科ID，尝试从规则ID获取（如果试卷是由规则生成的）
                if ((paper.getSubjectId() == null || paper.getSubjectId().trim().isEmpty()) && paper.getRuleId() != null) {
                    try {
                        ExamRuleEntity rule = examRuleMapper.selectById(paper.getRuleId());
                        if (rule != null && rule.getSubjectId() != null) {
                            paper.setSubjectId(rule.getSubjectId().toString());
                            logger.info("从规则ID {} 获取学科ID: {}", paper.getRuleId(), rule.getSubjectId());
                        }
                    } catch (Exception e) {
                        logger.debug("无法从规则获取学科: {}", e.getMessage());
                    }
                }
            } catch (Exception e) {
                logger.warn("处理学科信息时出错: {}", e.getMessage());
            }
        }
        
        // 关键改动：管理员创建的试卷自动标记为系统试卷
        if (SimplePermissionUtils.hasSystemManagePermission(currentUser)) {
            // 管理员：创建系统试卷
            paper.setIsSystem(true);
        } else {
            // 普通用户：创建个人试卷
            paper.setIsSystem(false);
        }

        boolean success = examPaperService.save(paper);
        if (success) {
            //  如果试卷包含questionIds，自动添加题目关联
            if (paper.getQuestionIds() != null && !paper.getQuestionIds().trim().isEmpty()) {
                logger.info("检测到questionIds，开始添加题目关联: {}", paper.getQuestionIds());
                int successCount = 0;
                int failCount = 0;
                int skipCount = 0;
                
                try {
                    String[] questionIdArray = paper.getQuestionIds().split(",");
                    int totalQuestions = questionIdArray.length;
                    int totalScore = paper.getTotalScore() != null ? paper.getTotalScore() : 100;
                    int baseScore = totalQuestions > 0 ? totalScore / totalQuestions : 1;
                    int remainder = totalQuestions > 0 ? totalScore % totalQuestions : 0;
                    
                    logger.info("开始添加题目到试卷，试卷ID: {}, 题目总数: {}", paper.getId(), totalQuestions);
                    
                    // 添加每个题目到试卷
                    for (int i = 0; i < questionIdArray.length; i++) {
                        String questionIdStr = questionIdArray[i].trim();
                        if (questionIdStr.isEmpty()) {
                            skipCount++;
                            continue;
                        }
                        
                        try {
                            Long questionId = Long.parseLong(questionIdStr);
                            
                            //  检查题目是否已存在于试卷中（避免重复添加）
                            if (examPaperService.isQuestionInPaper(paper.getId(), questionId)) {
                                logger.debug("题目 {} 已在试卷中，跳过", questionId);
                                skipCount++;
                                continue;
                            }
                            
                            // 前remainder道题多分配1分
                            int questionScore = baseScore + (i < remainder ? 1 : 0);
                            boolean added = examPaperService.addQuestionToPaper(paper.getId(), questionId, questionScore);
                            
                            if (added) {
                                successCount++;
                            } else {
                                failCount++;
                                logger.warn("添加题目 {} 到试卷 {} 失败", questionId, paper.getId());
                            }
                        } catch (NumberFormatException e) {
                            logger.warn("无效的题目ID格式: {}", questionIdStr);
                            skipCount++;
                        } catch (Exception e) {
                            logger.error("添加题目 {} 时发生异常: {}", questionIdStr, e.getMessage(), e);
                            failCount++;
                        }
                    }
                    
                    logger.info("题目添加完成 - 试卷ID: {}, 成功: {}, 失败: {}, 跳过: {}, 总计: {}", 
                        paper.getId(), successCount, failCount, skipCount, totalQuestions);
                } catch (Exception e) {
                    logger.error("处理题目ID列表时发生异常: {}", e.getMessage(), e);
                }
            }
            
            String message = paper.getIsSystem() ? "系统试卷创建成功" : "个人试卷创建成功";
            return new RespBean(200, message, paper);
        } else {
            return new RespBean(500, "创建失败", null);
        }
    }
    
    /**
     * 更新试卷
     */
    @PutMapping("/update")
    @Operation(summary = "更新试卷", description = "更新现有试卷信息")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "更新成功"),
            @ApiResponse(responseCode = "400", description = "请求参数错误"),
            @ApiResponse(responseCode = "500", description = "更新失败")
    })
    public RespBean updatePaper(
            @Parameter(description = "试卷信息", required = true)
            @RequestBody ExamPaperEntity paper) {
        
        // 获取当前用户
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        
        // 获取原试卷信息
        ExamPaperEntity existingPaper = examPaperService.getById(paper.getId());
        if (existingPaper == null) {
            return new RespBean(404, "试卷不存在", null);
        }
        
        // 权限检查：使用统一权限工具类
        if (!SimplePermissionUtils.hasContentEditPermission(currentUser, existingPaper.getCreatorId()) 
            || !SimplePermissionUtils.hasSystemContentEditPermission(currentUser, existingPaper.getIsSystem())) {
            return new RespBean(403, "权限不足，无法编辑此试卷", null);
        }
        
        org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(ExamPaperController.class);
        logger.info("更新试卷 - 试卷ID: {}, 标题: {}, questionIds: {}", 
            paper.getId(), paper.getTitle(), paper.getQuestionIds());
        
        boolean success = examPaperService.updateById(paper);
        if (success) {
            // 获取更新后的试卷并转换为ExamPaperVo（包含学科名）
            ExamPaperEntity updatedPaper = examPaperService.getById(paper.getId());
            ExamPaperVo vo = new ExamPaperVo();
            vo.setId(updatedPaper.getId());
            vo.setTitle(updatedPaper.getTitle());
            vo.setDescription(updatedPaper.getDescription());
            vo.setTotalScore(updatedPaper.getTotalScore());
            vo.setDuration(updatedPaper.getDuration());
            vo.setSubjectId(updatedPaper.getSubjectId());
            vo.setCreatorId(updatedPaper.getCreatorId());
            vo.setRuleId(updatedPaper.getRuleId());
            vo.setQuestionIds(updatedPaper.getQuestionIds());
            vo.setDifficultyScore(updatedPaper.getDifficultyScore());
            vo.setGenerationType(updatedPaper.getGenerationType());
            vo.setIsSystem(updatedPaper.getIsSystem()); //  复制isSystem字段
            vo.setCreatedAt(updatedPaper.getCreatedAt());
            vo.setUpdatedAt(updatedPaper.getUpdatedAt());
            
            // 查询并设置学科名称
            String paperSubjectId = updatedPaper.getSubjectId();
            if (paperSubjectId != null && !paperSubjectId.trim().isEmpty()) {
                try {
                    Long subjectIdNum = Long.parseLong(paperSubjectId.trim());
                    SubjectEntity subject = subjectMapper.selectById(subjectIdNum);
                    if (subject != null && subject.getName() != null) {
                        vo.setSubjectName(subject.getName());
                    } else {
                        vo.setSubjectName(paperSubjectId); // 保持原值
                    }
                } catch (NumberFormatException e) {
                    // 不是数字，直接使用
                    vo.setSubjectName(paperSubjectId);
                }
            }
            
            //  如果试卷包含questionIds，更新题目关联
            if (paper.getQuestionIds() != null && !paper.getQuestionIds().trim().isEmpty()) {
                try {
                    logger.info("检测到questionIds，开始更新题目关联: {}", paper.getQuestionIds());
                    
                    // 1. 先删除所有旧的题目关联
                    List<Map<String, Object>> existingQuestions = examPaperService.getPaperQuestions(paper.getId());
                    for (Map<String, Object> question : existingQuestions) {
                        Long paperQuestionId = ((Number) question.get("id")).longValue();
                        examPaperService.removeQuestionFromPaper(paperQuestionId);
                    }
                    logger.info("已删除旧的题目关联，共{}道题目", existingQuestions.size());
                    
                    // 2. 添加新的题目关联
                    String[] questionIdArray = paper.getQuestionIds().split(",");
                    int totalQuestions = questionIdArray.length;
                    int totalScore = paper.getTotalScore() != null ? paper.getTotalScore() : 100;
                    int baseScore = totalQuestions > 0 ? totalScore / totalQuestions : 1;
                    int remainder = totalQuestions > 0 ? totalScore % totalQuestions : 0;
                    
                    int successCount = 0;
                    int failCount = 0;
                    int skipCount = 0;
                    
                    for (int i = 0; i < questionIdArray.length; i++) {
                        String questionIdStr = questionIdArray[i].trim();
                        if (questionIdStr.isEmpty()) {
                            skipCount++;
                            continue;
                        }
                        
                        try {
                            Long questionId = Long.parseLong(questionIdStr);
                            // 前remainder道题多分配1分
                            int questionScore = baseScore + (i < remainder ? 1 : 0);
                            boolean added = examPaperService.addQuestionToPaper(paper.getId(), questionId, questionScore);
                            
                            if (added) {
                                successCount++;
                            } else {
                                failCount++;
                                logger.warn("添加题目 {} 到试卷 {} 失败", questionId, paper.getId());
                            }
                        } catch (NumberFormatException e) {
                            logger.warn("无效的题目ID格式: {}", questionIdStr);
                            skipCount++;
                        } catch (Exception e) {
                            logger.error("添加题目 {} 时发生异常: {}", questionIdStr, e.getMessage(), e);
                            failCount++;
                        }
                    }
                    
                    logger.info("题目关联更新完成 - 试卷ID: {}, 成功: {}, 失败: {}, 跳过: {}, 总计: {}", 
                        paper.getId(), successCount, failCount, skipCount, totalQuestions);
                } catch (Exception e) {
                    logger.error("更新题目关联时发生异常: {}", e.getMessage(), e);
                }
            }
            
            return new RespBean(200, "更新成功", vo);
        } else {
            return new RespBean(500, "更新失败", null);
        }
    }
    
    /**
     * 删除试卷
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除试卷", description = "根据试卷ID删除试卷")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "删除成功"),
            @ApiResponse(responseCode = "404", description = "试卷不存在"),
            @ApiResponse(responseCode = "500", description = "删除失败")
    })
    public RespBean deletePaper(
            @Parameter(description = "试卷ID", required = true, example = "1")
            @PathVariable Long id) {
        
        // 获取当前用户
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        
        // 获取试卷信息
        ExamPaperEntity paper = examPaperService.getById(id);
        if (paper == null) {
            return new RespBean(404, "试卷不存在", null);
        }
        
        // 权限检查：使用统一权限工具类
        if (!SimplePermissionUtils.hasContentEditPermission(currentUser, paper.getCreatorId()) 
            || !SimplePermissionUtils.hasSystemContentEditPermission(currentUser, paper.getIsSystem())) {
            return new RespBean(403, "权限不足，无法删除此试卷", null);
        }
        
        boolean success = examPaperService.removeById(id);
        if (success) {
            return new RespBean(200, "删除成功", null);
        } else {
            return new RespBean(500, "删除失败", null);
        }
    }

    /**
     * 获取系统试卷列表
     */
    @GetMapping("/system")
    @Operation(summary = "获取系统试卷列表", description = "获取所有系统试卷，所有用户都可以查看")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getSystemPapers() {
        try {
            // 检查查看权限
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
                return new RespBean(403, "权限不足", null);
            }
            
            // 查询系统试卷
            LambdaQueryWrapper<ExamPaperEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ExamPaperEntity::getIsSystem, true);
            wrapper.orderByDesc(ExamPaperEntity::getCreatedAt);

            List<ExamPaperEntity> papers = examPaperService.list(wrapper);
            
            // 为每个试卷补充学科名称
            List<Map<String, Object>> enrichedPapers = papers.stream().map(paper -> {
                Map<String, Object> paperMap = new HashMap<>();
                paperMap.put("id", paper.getId());
                paperMap.put("title", paper.getTitle());
                paperMap.put("description", paper.getDescription());
                paperMap.put("totalScore", paper.getTotalScore());
                paperMap.put("duration", paper.getDuration());
                paperMap.put("creatorId", paper.getCreatorId());
                paperMap.put("createdAt", paper.getCreatedAt());
                paperMap.put("updatedAt", paper.getUpdatedAt());
                paperMap.put("ruleId", paper.getRuleId());
                paperMap.put("generationType", paper.getGenerationType());
                paperMap.put("isSystem", paper.getIsSystem());
                
                // 获取题目列表（用于计算数量和获取学科）
                List<Map<String, Object>> questions = examPaperService.getPaperQuestions(paper.getId());
                int questionCount = questions != null ? questions.size() : 0;
                paperMap.put("totalQuestions", questionCount);
                
                // 查询并设置学科名称
                String paperSubject = paper.getSubjectId();
                if (paperSubject != null && !paperSubject.trim().isEmpty()) {
                    // 检查是否是数字ID
                    try {
                        Long subjectIdNum = Long.parseLong(paperSubject.trim());
                        SubjectEntity subject = subjectMapper.selectById(subjectIdNum);
                        if (subject != null && subject.getName() != null) {
                            paperMap.put("subject", subject.getName());
                        } else {
                            paperMap.put("subject", paperSubject); // 保持原值
                        }
                    } catch (NumberFormatException e) {
                        // 不是数字，直接使用
                        paperMap.put("subject", paperSubject);
                    }
                } else {
                    // 如果没有subject字段，尝试通过题目获取学科
                    String foundSubject = null;
                    if (questions != null && !questions.isEmpty()) {
                        // 获取第一个题目的学科
                        Object firstSubjectId = questions.get(0).get("subjectId");
                        if (firstSubjectId != null) {
                            try {
                                Long sid = firstSubjectId instanceof Number 
                                    ? ((Number)firstSubjectId).longValue() 
                                    : Long.parseLong(firstSubjectId.toString());
                                SubjectEntity subject = subjectMapper.selectById(sid);
                                if (subject != null && subject.getName() != null) {
                                    foundSubject = subject.getName();
                                }
                            } catch (Exception ex) {
                                // 忽略错误
                            }
                        }
                    }
                    paperMap.put("subject", foundSubject);
                }
                
                return paperMap;
            }).collect(Collectors.toList());
            
            return new RespBean(200, "查询成功", enrichedPapers);
        } catch (Exception e) {
            logger.error("获取系统试卷列表失败", e);
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }

    /**
     * 获取用户个人试卷列表
     */
    @GetMapping("/my")
    @Operation(summary = "获取用户个人试卷列表", description = "获取当前用户的个人试卷")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getMyPapers() {
        try {
            // 检查查看权限
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
                return new RespBean(403, "权限不足", null);
            }
            
            // 查询用户个人试卷
            LambdaQueryWrapper<ExamPaperEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ExamPaperEntity::getCreatorId, currentUser.getId());
            wrapper.eq(ExamPaperEntity::getIsSystem, false);
            wrapper.orderByDesc(ExamPaperEntity::getCreatedAt);
            
            List<ExamPaperEntity> papers = examPaperService.list(wrapper);
            
            // 为每个试卷补充学科名称
            List<Map<String, Object>> enrichedPapers = papers.stream().map(paper -> {
                Map<String, Object> paperMap = new HashMap<>();
                paperMap.put("id", paper.getId());
                paperMap.put("title", paper.getTitle());
                paperMap.put("description", paper.getDescription());
                paperMap.put("totalScore", paper.getTotalScore());
                paperMap.put("duration", paper.getDuration());
                paperMap.put("creatorId", paper.getCreatorId());
                paperMap.put("createdAt", paper.getCreatedAt());
                paperMap.put("updatedAt", paper.getUpdatedAt());
                paperMap.put("ruleId", paper.getRuleId());
                paperMap.put("generationType", paper.getGenerationType());
                paperMap.put("isSystem", paper.getIsSystem());
                
                // 获取题目列表（用于计算数量和获取学科）
                List<Map<String, Object>> questions = examPaperService.getPaperQuestions(paper.getId());
                int questionCount = questions != null ? questions.size() : 0;
                paperMap.put("totalQuestions", questionCount);
                
                // 查询并设置学科名称
                String paperSubject = paper.getSubjectId();
                if (paperSubject != null && !paperSubject.trim().isEmpty()) {
                    // 检查是否是数字ID
                    try {
                        Long subjectIdNum = Long.parseLong(paperSubject.trim());
                        SubjectEntity subject = subjectMapper.selectById(subjectIdNum);
                        if (subject != null && subject.getName() != null) {
                            paperMap.put("subject", subject.getName());
                        } else {
                            paperMap.put("subject", paperSubject); // 保持原值
                        }
                    } catch (NumberFormatException e) {
                        // 不是数字，直接使用
                        paperMap.put("subject", paperSubject);
                    }
                } else {
                    // 如果没有subject字段，尝试通过题目获取学科
                    String foundSubject = null;
                    if (questions != null && !questions.isEmpty()) {
                        // 获取第一个题目的学科
                        Object firstSubjectId = questions.get(0).get("subjectId");
                        if (firstSubjectId != null) {
                            try {
                                Long sid = firstSubjectId instanceof Number 
                                    ? ((Number)firstSubjectId).longValue() 
                                    : Long.parseLong(firstSubjectId.toString());
                                SubjectEntity subject = subjectMapper.selectById(sid);
                                if (subject != null && subject.getName() != null) {
                                    foundSubject = subject.getName();
                                }
                            } catch (Exception ex) {
                                // 忽略错误
                            }
                        }
                    }
                    paperMap.put("subject", foundSubject);
                }
                
                return paperMap;
            }).collect(Collectors.toList());
            
            return new RespBean(200, "查询成功", enrichedPapers);
        } catch (Exception e) {
            logger.error("获取个人试卷列表失败", e);
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }

    /**
     * 创建系统试卷（仅管理员）
     */
    @PostMapping("/system/create")
    @Operation(summary = "创建系统试卷", description = "创建系统试卷，仅管理员可以操作")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "创建成功"),
            @ApiResponse(responseCode = "403", description = "权限不足"),
            @ApiResponse(responseCode = "500", description = "创建失败")
    })
    public RespBean createSystemPaper(
            @Parameter(description = "试卷信息", required = true)
            @RequestBody ExamPaperEntity paper) {
        
        // 检查权限
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (!SimplePermissionUtils.hasSystemManagePermission(currentUser)) {
            return new RespBean(403, "权限不足，只有管理员可以创建系统试卷", null);
        }
        
        // 设置系统试卷标识和创建者（双重保证）
        paper.setIsSystem(true);
        paper.setCreatorId(currentUser.getId());
        
        boolean success = examPaperService.save(paper);
        if (success) {
            return new RespBean(200, "系统试卷创建成功", paper);
        } else {
            return new RespBean(500, "创建失败", null);
        }
    }

    /**
     * 创建个人试卷
     */
    @PostMapping("/my/create")
    @Operation(summary = "创建个人试卷", description = "创建个人试卷，所有用户都可以操作")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "创建成功"),
            @ApiResponse(responseCode = "403", description = "权限不足"),
            @ApiResponse(responseCode = "500", description = "创建失败")
    })
    public RespBean createMyPaper(
            @Parameter(description = "试卷信息", required = true)
            @RequestBody ExamPaperEntity paper) {
        
        // 检查权限
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (!SimplePermissionUtils.hasContentCreatePermission(currentUser)) {
            return new RespBean(403, "权限不足", null);
        }
        
        // 设置个人试卷标识和创建者
        paper.setIsSystem(false);
        paper.setCreatorId(currentUser.getId());
        
        boolean success = examPaperService.save(paper);
        if (success) {
            return new RespBean(200, "个人试卷创建成功", paper);
        } else {
            return new RespBean(500, "创建失败", null);
        }
    }

    /**
     * 复制系统试卷到个人题库
     */
    @PostMapping("/copy/{paperId}")
    @Operation(summary = "复制系统试卷到个人题库", description = "将系统试卷复制到个人题库")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "复制成功"),
            @ApiResponse(responseCode = "403", description = "权限不足"),
            @ApiResponse(responseCode = "404", description = "试卷不存在"),
            @ApiResponse(responseCode = "500", description = "复制失败")
    })
    public RespBean copySystemPaper(
            @Parameter(description = "试卷ID", required = true, example = "1")
            @PathVariable Long paperId) {
        
        // 检查权限
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        if (!SimplePermissionUtils.hasCopyPermission(currentUser)) {
            return new RespBean(403, "权限不足", null);
        }
        
        // 获取原试卷
        ExamPaperEntity originalPaper = examPaperService.getById(paperId);
        if (originalPaper == null) {
            return new RespBean(404, "试卷不存在", null);
        }
        
        // 检查是否为系统试卷
        if (!SimplePermissionUtils.isSystemContent(originalPaper.getIsSystem())) {
            return new RespBean(400, "只能复制系统试卷", null);
        }
        
        // 创建复制的试卷
        ExamPaperEntity copiedPaper = new ExamPaperEntity();
        copiedPaper.setTitle(originalPaper.getTitle() + " (复制)");
        copiedPaper.setDescription(originalPaper.getDescription());
        copiedPaper.setTotalScore(originalPaper.getTotalScore());
        copiedPaper.setDuration(originalPaper.getDuration());
        copiedPaper.setSubjectId(originalPaper.getSubjectId());
        copiedPaper.setIsSystem(false);
        copiedPaper.setCreatorId(currentUser.getId());
        
        boolean success = examPaperService.save(copiedPaper);
        if (success) {
            return new RespBean(200, "试卷复制成功", copiedPaper);
        } else {
            return new RespBean(500, "复制失败", null);
        }
    }
    
    /**
     * 获取试卷题目列表
     */
    @GetMapping("/{paperId}/questions")
    @Operation(summary = "获取试卷题目列表", description = "获取指定试卷中的所有题目")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "查询成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean getPaperQuestions(@Parameter(description = "试卷ID") @PathVariable Long paperId) {
        try {
            // 检查权限
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
                return new RespBean(403, "权限不足", null);
            }
            
            //  权限控制：检查用户是否有权限查看此试卷
            ExamPaperEntity paper = examPaperService.getById(paperId);
            if (paper == null) {
                return new RespBean(404, "试卷不存在", null);
            }
            
            //  权限控制：非管理员只能查看系统试卷或自己创建的试卷
            if (!SimplePermissionUtils.isAdmin(currentUser)) {
                boolean isSystemPaper = SimplePermissionUtils.isSystemContent(paper.getIsSystem());
                boolean isOwner = currentUser.getId().equals(paper.getCreatorId());
                
                if (!isSystemPaper && !isOwner) {
                    return new RespBean(403, "权限不足，无法查看此试卷的题目", null);
                }
            }
            
            // 获取试卷题目列表
            List<Map<String, Object>> questions = examPaperService.getPaperQuestions(paperId);
            return new RespBean(200, "查询成功", questions);
        } catch (Exception e) {
            return new RespBean(500, "查询失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 添加题目到试卷
     */
    @PostMapping("/{paperId}/questions")
    @Operation(summary = "添加题目到试卷", description = "将指定题目添加到试卷中")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "添加成功"),
            @ApiResponse(responseCode = "400", description = "参数错误"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean addQuestionToPaper(
            @Parameter(description = "试卷ID") @PathVariable Long paperId,
            @Parameter(description = "题目ID") @RequestParam Long questionId,
            @Parameter(description = "题目分值") @RequestParam Integer score) {
        
        try {
            // 检查权限
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
                return new RespBean(403, "权限不足", null);
            }
            
            // 添加题目到试卷
            boolean success = examPaperService.addQuestionToPaper(paperId, questionId, score);
            if (success) {
                return new RespBean(200, "题目添加成功", null);
            } else {
                return new RespBean(500, "添加失败", null);
            }
        } catch (Exception e) {
            return new RespBean(500, "添加失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 从试卷中删除题目
     */
    @DeleteMapping("/{paperId}/questions/{paperQuestionId}")
    @Operation(summary = "从试卷中删除题目", description = "从试卷中删除指定的题目")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "删除成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean removeQuestionFromPaper(
            @Parameter(description = "试卷ID") @PathVariable Long paperId,
            @Parameter(description = "试卷题目关联ID") @PathVariable Long paperQuestionId) {
        
        try {
            // 检查权限
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
                return new RespBean(403, "权限不足", null);
            }
            
            // 从试卷中删除题目
            boolean success = examPaperService.removeQuestionFromPaper(paperQuestionId);
            if (success) {
                return new RespBean(200, "题目删除成功", null);
            } else {
                return new RespBean(500, "删除失败", null);
            }
        } catch (Exception e) {
            return new RespBean(500, "删除失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 更新题目分数
     */
    @PutMapping("/{paperId}/questions/{paperQuestionId}")
    @Operation(summary = "更新题目分数", description = "更新试卷中题目的分值")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "更新成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean updateQuestionScore(
            @Parameter(description = "试卷ID") @PathVariable Long paperId,
            @Parameter(description = "试卷题目关联ID") @PathVariable Long paperQuestionId,
            @Parameter(description = "新的分值") @RequestParam Integer score) {
        
        try {
            // 检查权限
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
                return new RespBean(403, "权限不足", null);
            }
            
            // 更新题目分数
            boolean success = examPaperService.updateQuestionScore(paperQuestionId, score);
            if (success) {
                return new RespBean(200, "分数更新成功", null);
            } else {
                return new RespBean(500, "更新失败", null);
            }
        } catch (Exception e) {
            return new RespBean(500, "更新失败: " + e.getMessage(), null);
        }
    }
    
    /**
     * 更新试卷题目顺序
     */
    @PutMapping("/{paperId}/questions/order")
    @Operation(summary = "更新试卷题目顺序", description = "批量更新试卷中题目的顺序")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "更新成功"),
            @ApiResponse(responseCode = "500", description = "服务器内部错误")
    })
    public RespBean updateQuestionOrder(
            @Parameter(description = "试卷ID") @PathVariable Long paperId,
            @Parameter(description = "题目顺序列表") @RequestBody List<Map<String, Object>> questionOrders) {
        
        try {
            // 检查权限
            UserEntity currentUser = SimpleUserContext.getCurrentUser();
            if (!SimplePermissionUtils.hasViewPermission(currentUser)) {
                return new RespBean(403, "权限不足", null);
            }
            
            // 更新题目顺序
            boolean success = examPaperService.updateQuestionOrder(paperId, questionOrders);
            if (success) {
                return new RespBean(200, "题目顺序更新成功", null);
            } else {
                return new RespBean(500, "更新失败", null);
            }
        } catch (Exception e) {
            return new RespBean(500, "更新失败: " + e.getMessage(), null);
        }
    }
}
