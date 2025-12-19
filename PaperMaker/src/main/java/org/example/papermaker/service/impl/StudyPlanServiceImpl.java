package org.example.papermaker.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import jakarta.annotation.Resource;
import org.example.papermaker.entity.ExamPaperEntity;
import org.example.papermaker.entity.StudyPlanEntity;
import org.example.papermaker.mapper.StudyPlanMapper;
import org.example.papermaker.service.AIStudyPlanService;
import org.example.papermaker.service.ExamPaperService;
import org.example.papermaker.service.StudyPlanService;
import org.example.papermaker.service.SubjectService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class StudyPlanServiceImpl extends ServiceImpl<StudyPlanMapper, StudyPlanEntity> implements StudyPlanService {

    @Resource
    private AIStudyPlanService aiStudyPlanService;

    @Resource
    private ExamPaperService examPaperService;

    @Resource
    private SubjectService subjectService;

    @Override
    public StudyPlanEntity createPlan(StudyPlanEntity plan) {
        plan.setCreatedAt(LocalDateTime.now());
        plan.setUpdatedAt(LocalDateTime.now());
        plan.setStatus("ONGOING");
        save(plan);
        return plan;
    }

    @Override
    public StudyPlanEntity generatePlanByAI(Long userId, Long subjectId, String target, String deadlineStr) {
        // 1. 获取学科名称
        String subjectName = "未知学科";
        try {
            // 获取学科名称
            if (subjectId != null) {
                subjectName = subjectService.getById(subjectId).getName();
            }
        } catch (Exception e) {
            log.warn("获取学科名称失败", e);
        }

        // 2. 构建Prompt
        String currentDate = LocalDateTime.now().toLocalDate().toString();
        String requirement = String.format("当前日期：%s。学科：%s，目标：%s，截止时间：%s", currentDate, subjectName, target,
                deadlineStr);

        // 3. 调用AI
        String aiSuggestion = aiStudyPlanService.generateStudyPlan(requirement);

        // 4. 保存计划
        StudyPlanEntity plan = new StudyPlanEntity();
        plan.setUserId(userId);
        plan.setSubjectId(subjectId);
        plan.setTargetDescription(target);
        // 解析日期字符串为LocalDateTime
        try {
            plan.setDeadline(LocalDateTime.parse(deadlineStr));
        } catch (Exception e) {
            log.warn("日期解析失败，使用默认1个月后", e);
            plan.setDeadline(LocalDateTime.now().plusMonths(1));
        }
        plan.setAiSuggestion(aiSuggestion);
        plan.setStatus("ONGOING");
        plan.setCreatedAt(LocalDateTime.now());
        plan.setUpdatedAt(LocalDateTime.now());

        save(plan);
        return plan;
    }

    @Override
    public ExamPaperEntity generatePaperFromPlan(Long planId) {
        StudyPlanEntity plan = getById(planId);
        if (plan == null) {
            throw new RuntimeException("计划不存在");
        }

        // 1. 让AI根据计划生成出题建议
        String suggestion = aiStudyPlanService.suggestPaperGeneration("计划目标：" + plan.getTargetDescription());

        // 2. 创建试卷 (这里模拟AI生成的试卷逻辑，实际应结合PaperGenerationService)
        // 为了简化，这里创建一个新的试卷，并调用AI生成规则
        // TODO: 集成 RuleEngine 或 PaperGenerationService

        ExamPaperEntity paper = new ExamPaperEntity();
        paper.setTitle("基于计划生成的试卷 - " + LocalDateTime.now().toString());
        paper.setCreatorId(plan.getUserId());
        paper.setSubjectId(plan.getSubjectId().toString());
        paper.setDescription("AI根据学习计划自动生成: " + suggestion);
        // ... 其他属性

        // 暂时返回空对象，需要完善试卷生成逻辑
        // examPaperService.save(paper);
        return paper;
    }

    @Override
    public List<StudyPlanEntity> getUserPlans(Long userId) {
        return lambdaQuery().eq(StudyPlanEntity::getUserId, userId).list();
    }
}
