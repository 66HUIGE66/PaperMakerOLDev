package org.example.papermaker.service;

import com.baomidou.mybatisplus.extension.service.IService;
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import org.example.papermaker.entity.SubjectEntity;

import java.util.List;

/**
 * 学科服务接口
 */

public interface SubjectService extends IService<SubjectEntity> {
    
    /**
     * 获取所有启用的学科
     */

    List<SubjectEntity> getAllActiveSubjects();
    
    /**
     * 获取所有启用的学科（包含关键词信息）
     */

    List<SubjectEntity> getAllActiveSubjectsWithKeywords();
    
    /**
     * 根据名称获取学科
     */
    SubjectEntity getByName(String name);
    
    /**
     * 根据代码获取学科
     */
    SubjectEntity getByCode(String code);
    
    /**
     * 根据ID获取学科（包含关键词信息）
     */
    SubjectEntity getByIdWithKeywords(Long id);
    
    /**
     * 刷新学科映射缓存
     */
    void refreshSubjectMapping();
    
    /**
     * 获取学科关键词（从知识点表获取）
     */
    List<String> getSubjectKeywords(String subjectName);
    
    /**
     * 根据学科ID获取关键词列表
     */
    List<String> getSubjectKeywordsByld(Long subjectId);
}

