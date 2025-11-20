package org.example.papermaker.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.example.papermaker.entity.ExamRecordEntity;

import java.util.List;
import java.util.Map;

/**
 * 考试记录服务接口
 */
public interface ExamRecordService extends IService<ExamRecordEntity> {
    
    /**
     * 根据学生ID获取练习记录
     */
    List<ExamRecordEntity> getRecordsByUserId(Long userId);
    
    /**
     * 根据学生ID和状态获取练习记录
     */
    List<ExamRecordEntity> getRecordsByUserIdAndStatus(Long userId, ExamRecordEntity.ExamStatus status);
    
    /**
     * 根据学生ID和类型获取练习记录
     */
    List<ExamRecordEntity> getRecordsByUserIdAndType(Long userId, ExamRecordEntity.ExamType type);
    
    /**
     * 根据学生ID获取统计信息
     */
    Map<String, Object> getStatisticsByUserId(Long userId);
    
    /**
     * 获取总体练习情况统计
     */
    Map<String, Object> getOverallStatistics(Long userId);
    
    /**
     * 获取学科分类练习情况统计
     */
    Map<String, Object> getSubjectStatistics(Long userId);
    
    /**
     * 获取学科知识点学习情况统计
     */
    Map<String, Object> getSubjectKnowledgePointStatistics(Long userId);
    /**
     * 创建练习记录
     */
    boolean createRecord(ExamRecordEntity record);
    
    /**
     * 更新练习记录
     */
    boolean updateRecord(ExamRecordEntity record);
    
    /**
     * 删除练习记录
     */
    boolean deleteRecord(Long recordId);
    
    /**
     * 根据条件搜索练习记录
     */
    List<ExamRecordEntity> searchRecords(Long userId, String paperTitle, 
                                       ExamRecordEntity.ExamStatus status, 
                                       ExamRecordEntity.ExamType type,
                                       String subjectId,
                                       String startDate,
                                       String endDate);
}



