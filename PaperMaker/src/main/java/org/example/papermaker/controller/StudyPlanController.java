package org.example.papermaker.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.example.papermaker.context.SimpleUserContext;
import org.example.papermaker.entity.ExamPaperEntity;
import org.example.papermaker.entity.StudyPlanEntity;
import org.example.papermaker.entity.UserEntity;
import org.example.papermaker.service.StudyPlanService;
import org.example.papermaker.vo.RespBean;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/study-plan")
@Tag(name = "学习计划管理", description = "学习计划的创建、查询与AI生成")
public class StudyPlanController {

    @Resource
    private StudyPlanService studyPlanService;

    @Resource
    private org.example.papermaker.tool.LLMSearchTool llmSearchTool;

    @PostMapping("/search-resources")
    @Operation(summary = "搜索学习资源", description = "根据关键词搜索相关学习资源")
    public RespBean searchResources(@RequestParam String keyword) {
        try {
            String resources = llmSearchTool.searchLearningResources(keyword);
            return new RespBean(200, "搜索成功", resources);
        } catch (Exception e) {
            return new RespBean(500, "搜索失败: " + e.getMessage(), null);
        }
    }

    @PostMapping("/create")
    @Operation(summary = "创建学习计划", description = "手动创建学习计划")
    public RespBean createPlan(@RequestBody StudyPlanEntity plan) {
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        plan.setUserId(currentUser.getId());
        return new RespBean(200, "创建成功", studyPlanService.createPlan(plan));
    }

    @PostMapping("/ai-generate")
    @Operation(summary = "AI生成学习计划", description = "根据学科和目标自动生成学习计划")
    public RespBean generatePlanByAI(@RequestParam Long subjectId,
            @RequestParam String target,
            @RequestParam String deadline) {
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        StudyPlanEntity plan = studyPlanService.generatePlanByAI(currentUser.getId(), subjectId, target, deadline);
        return new RespBean(200, "生成成功", plan);
    }

    @PostMapping("/{id}/generate-paper")
    @Operation(summary = "根据计划生成试卷", description = "AI根据学习计划进度生成试卷")
    public RespBean generatePaperFromPlan(@PathVariable Long id) {
        ExamPaperEntity paper = studyPlanService.generatePaperFromPlan(id);
        return new RespBean(200, "试卷生成成功", paper);
    }

    @GetMapping("/my")
    @Operation(summary = "获取我的学习计划", description = "获取当前用户的所有学习计划")
    public RespBean getMyPlans() {
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        List<StudyPlanEntity> plans = studyPlanService.getUserPlans(currentUser.getId());
        return new RespBean(200, "获取成功", plans);
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取学习计划详情", description = "根据ID获取学习计划详情")
    public RespBean getPlan(@PathVariable Long id) {
        StudyPlanEntity plan = studyPlanService.getById(id);
        return new RespBean(200, "获取成功", plan);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除学习计划", description = "根据ID删除学习计划")
    public RespBean deletePlan(@PathVariable Long id) {
        UserEntity currentUser = SimpleUserContext.getCurrentUser();
        StudyPlanEntity plan = studyPlanService.getById(id);

        if (plan == null) {
            return new RespBean(404, "计划不存在", null);
        }

        if (!plan.getUserId().equals(currentUser.getId())) {
            return new RespBean(403, "无权删除此计划", null);
        }

        boolean success = studyPlanService.removeById(id);
        return new RespBean(200, success ? "删除成功" : "删除失败", null);
    }
}
