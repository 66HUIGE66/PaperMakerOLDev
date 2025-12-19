package org.example.papermaker.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.example.papermaker.entity.StudyPlanEntity;
import org.example.papermaker.entity.ExamPaperEntity;

import java.util.List;

public interface StudyPlanService extends IService<StudyPlanEntity> {

    /**
     * 创建学习计划
     */
    StudyPlanEntity createPlan(StudyPlanEntity plan);

    /**
     * AI生成学习计划
     */
    StudyPlanEntity generatePlanByAI(Long userId, Long subjectId, String target, String deadline);

    /**
     * 根据计划生成试卷
     */
    ExamPaperEntity generatePaperFromPlan(Long planId);

    /**
     * 获取用户的学习计划
     */
    List<StudyPlanEntity> getUserPlans(Long userId);
}
