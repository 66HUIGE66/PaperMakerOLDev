package org.example.papermaker.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import org.example.papermaker.entity.SubjectEntity;
import org.example.papermaker.entity.KnowledgePointEntity;
import org.example.papermaker.mapper.SubjectMapper;
import org.example.papermaker.service.SubjectService;
import org.example.papermaker.service.SubjectMapping;
import org.example.papermaker.service.KnowledgePointService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 学科服务实现类
 */
@Service
public class SubjectServiceImpl extends ServiceImpl<SubjectMapper, SubjectEntity> implements SubjectService {
    
    @Autowired
    private KnowledgePointService knowledgePointService;

    @Override
    public List<SubjectEntity> getAllActiveSubjects() {
        return baseMapper.selectAllActive();
    }

    @Override
    public List<SubjectEntity> getAllActiveSubjectsWithKeywords() {
        List<SubjectEntity> subjects = getAllActiveSubjects();
        // 为每个学科填充关键词信息
        subjects.forEach(subject -> {
            List<String> keywords = getSubjectKeywordsByld(subject.getId());
            subject.setKeywords(keywords);
            subject.setKeywordCount(keywords.size());
        });
        return subjects;
    }
    
    @Override
    @Tool("根据名称获取学科")
    public SubjectEntity getByName(@P("学科名") String name) {
        return baseMapper.selectByName(name);
    }
    
    @Override
    public SubjectEntity getByCode(String code) {
        return baseMapper.selectByCode(code);
    }
    
    @Override
    public SubjectEntity getByIdWithKeywords(Long id) {
        SubjectEntity subject = getById(id);
        if (subject != null) {
            List<String> keywords = getSubjectKeywordsByld(id);
            subject.setKeywords(keywords);
            subject.setKeywordCount(keywords.size());
        }
        return subject;
    }
    
    @Override
    public void refreshSubjectMapping() {
        // 从数据库加载学科数据并刷新映射
        List<SubjectEntity> subjects = getAllActiveSubjects();
        SubjectMapping.loadFromDatabase(subjects, knowledgePointService);
        System.out.println("学科映射已刷新，共加载 " + subjects.size() + " 个学科");
    }
    
    @Override
    public List<String> getSubjectKeywords(String subjectName) {
        // 从知识点表获取该学科的所有知识点名称作为关键词
        List<KnowledgePointEntity> knowledgePoints = knowledgePointService.getBySubject(subjectName);
        return knowledgePoints.stream()
                .map(KnowledgePointEntity::getName)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<String> getSubjectKeywordsByld(Long subjectId) {
        // 获取学科名称
        SubjectEntity subject = getById(subjectId);
        if (subject == null) {
            return List.of();
        }
        
        // 根据学科名称从知识点表获取关键词
        // 注意：知识点表使用subject字段（学科名称）而不是subject_id
        List<KnowledgePointEntity> knowledgePoints = knowledgePointService.getBySubject(subject.getName());
        return knowledgePoints.stream()
                .map(KnowledgePointEntity::getName)
                .distinct()
                .collect(Collectors.toList());
    }
}

