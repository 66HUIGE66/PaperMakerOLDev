package org.example.papermaker.util;

import org.example.papermaker.entity.SubjectEntity;
import org.example.papermaker.entity.KnowledgePointEntity;
import org.example.papermaker.service.SubjectService;
import org.example.papermaker.service.KnowledgePointService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

/**
 * AI规则生成工具类
 * 为AI提供数据库中的真实学科和知识点信息
 * 
 * @author System
 * @since 1.0.0
 */
@Component
public class AIRuleGenerationTool {
    
    @Autowired
    private SubjectService subjectService;
    
    @Autowired
    private KnowledgePointService knowledgePointService;
    
    /**
     * 获取所有启用的学科信息
     * @return 学科信息列表
     */
    public List<Map<String, Object>> getAllActiveSubjects() {
        try {
            List<SubjectEntity> subjects = subjectService.getAllActiveSubjects();
            return subjects.stream().map(subject -> {
                Map<String, Object> subjectInfo = new HashMap<>();
                subjectInfo.put("id", subject.getId());
                subjectInfo.put("name", subject.getName());
                subjectInfo.put("code", subject.getCode());
                subjectInfo.put("description", subject.getDescription());
                subjectInfo.put("sortOrder", subject.getSortOrder());
                return subjectInfo;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("获取学科信息失败: " + e.getMessage());
            return List.of();
        }
    }
    
    /**
     * 根据学科ID获取该学科的所有知识点
     * @param subjectId 学科ID
     * @return 知识点信息列表
     */
    public List<Map<String, Object>> getKnowledgePointsBySubject(Long subjectId) {
        try {
            // 先根据学科ID查找学科名称
            SubjectEntity subject = subjectService.getById(subjectId);
            if (subject == null) {
                return List.of();
            }
            
            List<KnowledgePointEntity> knowledgePoints = knowledgePointService.getBySubject(subject.getName());
            return knowledgePoints.stream().map(kp -> {
                Map<String, Object> kpInfo = new HashMap<>();
                kpInfo.put("id", kp.getId());
                kpInfo.put("name", kp.getName());
                kpInfo.put("description", kp.getDescription());
                kpInfo.put("weight", kp.getWeight());
                kpInfo.put("difficultyLevel", kp.getDifficultyLevel());
                kpInfo.put("subjectId", kp.getSubjectId());
                return kpInfo;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("获取知识点信息失败: " + e.getMessage());
            return List.of();
        }
    }
    
    /**
     * 根据学科名称获取该学科的所有知识点
     * @param subjectName 学科名称
     * @return 知识点信息列表
     */
    public List<Map<String, Object>> getKnowledgePointsBySubjectName(String subjectName) {
        try {
            List<KnowledgePointEntity> knowledgePoints = knowledgePointService.getBySubject(subjectName);
            return knowledgePoints.stream().map(kp -> {
                Map<String, Object> kpInfo = new HashMap<>();
                kpInfo.put("id", kp.getId());
                kpInfo.put("name", kp.getName());
                kpInfo.put("description", kp.getDescription());
                kpInfo.put("weight", kp.getWeight());
                kpInfo.put("difficultyLevel", kp.getDifficultyLevel());
                kpInfo.put("subjectId", kp.getSubjectId());
                return kpInfo;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("根据学科名称获取知识点失败: " + e.getMessage());
            return List.of();
        }
    }
    
    /**
     * 获取所有学科及其知识点的完整信息
     * @return 学科和知识点的完整信息
     */
    public Map<String, Object> getAllSubjectsWithKnowledgePoints() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            List<Map<String, Object>> subjects = getAllActiveSubjects();
            Map<String, Object> subjectsWithKp = new HashMap<>();
            
            for (Map<String, Object> subject : subjects) {
                Long subjectId = (Long) subject.get("id");
                String subjectName = (String) subject.get("name");
                
                List<Map<String, Object>> knowledgePoints = getKnowledgePointsBySubject(subjectId);
                
                Map<String, Object> subjectInfo = new HashMap<>(subject);
                subjectInfo.put("knowledgePoints", knowledgePoints);
                subjectInfo.put("knowledgePointCount", knowledgePoints.size());
                
                subjectsWithKp.put(subjectName, subjectInfo);
            }
            
            result.put("subjects", subjectsWithKp);
            result.put("totalSubjects", subjects.size());
            result.put("message", "成功获取所有学科和知识点信息");
            
        } catch (Exception e) {
            result.put("error", "获取学科和知识点信息失败: " + e.getMessage());
            result.put("subjects", new HashMap<>());
            result.put("totalSubjects", 0);
        }
        
        return result;
    }
    
    /**
     * 验证学科是否存在
     * @param subjectName 学科名称
     * @return 是否存在
     */
    public boolean validateSubject(String subjectName) {
        try {
            SubjectEntity subject = subjectService.getByName(subjectName);
            return subject != null && subject.getIsActive();
        } catch (Exception e) {
            System.err.println("验证学科失败: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 验证知识点是否存在
     * @param knowledgePointName 知识点名称
     * @param subjectName 学科名称
     * @return 是否存在
     */
    public boolean validateKnowledgePoint(String knowledgePointName, String subjectName) {
        try {
            List<Map<String, Object>> knowledgePoints = getKnowledgePointsBySubjectName(subjectName);
            return knowledgePoints.stream()
                .anyMatch(kp -> knowledgePointName.equals(kp.get("name")));
        } catch (Exception e) {
            System.err.println("验证知识点失败: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 获取学科建议（用于AI生成规则时的参考）
     * @return 学科建议信息
     */
    public Map<String, Object> getSubjectSuggestions() {
        Map<String, Object> suggestions = new HashMap<>();
        
        try {
            List<Map<String, Object>> subjects = getAllActiveSubjects();
            
            // 按知识点数量排序，推荐知识点较多的学科
            subjects.sort((a, b) -> {
                Long aId = (Long) a.get("id");
                Long bId = (Long) b.get("id");
                List<Map<String, Object>> aKp = getKnowledgePointsBySubject(aId);
                List<Map<String, Object>> bKp = getKnowledgePointsBySubject(bId);
                return Integer.compare(bKp.size(), aKp.size());
            });
            
            suggestions.put("recommendedSubjects", subjects.stream()
                .limit(5)
                .map(s -> s.get("name"))
                .collect(Collectors.toList()));
            
            suggestions.put("allSubjects", subjects.stream()
                .map(s -> s.get("name"))
                .collect(Collectors.toList()));
            
            suggestions.put("message", "学科建议获取成功");
            
        } catch (Exception e) {
            suggestions.put("error", "获取学科建议失败: " + e.getMessage());
            suggestions.put("recommendedSubjects", List.of());
            suggestions.put("allSubjects", List.of());
        }
        
        return suggestions;
    }
}
