package org.example.papermaker.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.example.papermaker.entity.ExamRuleEntity;
import org.example.papermaker.mapper.ExamRuleMapper;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 组卷规则服务类
 * 提供规则管理的核心业务逻辑
 * 
 * @author System
 * @since 1.0.0
 */
@Service
public class ExamRuleService extends ServiceImpl<ExamRuleMapper, ExamRuleEntity> {

    /**
     * 获取所有启用的规则
     */
    public List<ExamRuleEntity> getAllActiveRules() {
        QueryWrapper<ExamRuleEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", ExamRuleEntity.Status.ACTIVE.name())
                   .orderByDesc("created_at");
        return list(queryWrapper);
    }

    /**
     * 根据ID获取规则
     */
    public ExamRuleEntity getRuleById(Long id) {
        return getById(id);
    }

    /**
     * 创建规则
     */
    public boolean createRule(ExamRuleEntity rule) {
        return save(rule);
    }

    /**
     * 更新规则
     */
    public boolean updateRule(ExamRuleEntity rule) {
        return updateById(rule);
    }

    /**
     * 删除规则
     */
    public boolean deleteRule(Long id) {
        return removeById(id);
    }

    /**
     * 根据名称搜索规则
     */
    public List<ExamRuleEntity> searchRulesByName(String name) {
        QueryWrapper<ExamRuleEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.like("name", name)
                   .eq("status", ExamRuleEntity.Status.ACTIVE.name())
                   .orderByDesc("created_at");
        return list(queryWrapper);
    }

    /**
     * 根据创建者获取规则
     */
    public List<ExamRuleEntity> getRulesByCreator(Long creatorId) {
        QueryWrapper<ExamRuleEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("creator_id", creatorId)
                   .orderByDesc("created_at");
        return list(queryWrapper);
    }

    /**
     * 获取系统规则
     */
    public List<ExamRuleEntity> getSystemRules() {
        QueryWrapper<ExamRuleEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("is_system", true)
                   .eq("status", ExamRuleEntity.Status.ACTIVE.name())
                   .orderByAsc("id");
        return list(queryWrapper);
    }

    /**
     * 获取用户自定义规则
     */
    public List<ExamRuleEntity> getUserRules(Long creatorId) {
        QueryWrapper<ExamRuleEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("creator_id", creatorId)
                   .eq("is_system", false)
                   .orderByDesc("created_at");
        return list(queryWrapper);
    }

    /**
     * 检查规则名称是否已存在
     */
    public boolean isRuleNameExists(String name, Long excludeId) {
        QueryWrapper<ExamRuleEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("name", name);
        if (excludeId != null) {
            queryWrapper.ne("id", excludeId);
        }
        return count(queryWrapper) > 0;
    }

    /**
     * 获取规则统计信息
     */
    public long getTotalRuleCount() {
        return count();
    }

    /**
     * 获取活跃规则数量
     */
    public long getActiveRuleCount() {
        QueryWrapper<ExamRuleEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", ExamRuleEntity.Status.ACTIVE.name());
        return count(queryWrapper);
    }

    /**
     * 获取系统规则数量
     */
    public long getSystemRuleCount() {
        QueryWrapper<ExamRuleEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("is_system", true);
        return count(queryWrapper);
    }

    /**
     * 获取用户规则数量
     */
    public long getUserRuleCount(Long creatorId) {
        QueryWrapper<ExamRuleEntity> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("creator_id", creatorId)
                   .eq("is_system", false);
        return count(queryWrapper);
    }
}