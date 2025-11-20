package org.example.papermaker.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.example.papermaker.entity.ExamPaperEntity;

/**
 * 试卷服务接口
 */
public interface ExamPaperService extends IService<ExamPaperEntity> {
    
    /**
     * 根据创建者ID查询试卷列表
     */
    java.util.List<ExamPaperEntity> getPapersByCreator(Long creatorId);
    
    /**
     * 获取试卷题目列表
     */
    java.util.List<java.util.Map<String, Object>> getPaperQuestions(Long paperId);
    
    /**
     * 添加题目到试卷
     */
    boolean addQuestionToPaper(Long paperId, Long questionId, Integer score);
    
    /**
     * 从试卷中删除题目
     */
    boolean removeQuestionFromPaper(Long paperQuestionId);
    
    /**
     * 根据学科ID筛选试卷（通过试卷题目关联学科）
     */
    java.util.List<ExamPaperEntity> filterPapersBySubject(java.util.List<ExamPaperEntity> papers, Long subjectId);
    
    /**
     * 更新题目分数
     */
    boolean updateQuestionScore(Long paperQuestionId, Integer score);
    
    /**
     * 更新试卷题目顺序
     */
    boolean updateQuestionOrder(Long paperId, java.util.List<java.util.Map<String, Object>> questionOrders);
    
    /**
     * 根据规则ID查询已生成的试卷列表
     */
    java.util.List<ExamPaperEntity> listByRuleId(Long ruleId);
    
    /**
     * 检查题目是否已在试卷中
     */
    boolean isQuestionInPaper(Long paperId, Long questionId);
}
