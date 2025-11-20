package org.example.papermaker.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;

import org.example.papermaker.entity.QuestionEntity;


import java.util.List;


public interface QuestionService extends IService<QuestionEntity> {

    /**
     * 根据创建者查询题目
     *
     * @param creatorId 创建者ID
     * @param page      分页参数
     * @return 题目分页数据
     */
    IPage<QuestionEntity> getQuestionsByCreator(Long creatorId, Page<QuestionEntity> page);

    /**
     * 获取所有题目（系统题目 + 个人题目）
     *
     * @param current 当前页码
     * @param size    每页大小
     * @return 题目分页数据
     */
    IPage<QuestionEntity> getAllQuestions(Long current, Long size, Long subjectId);
    
    /**
     * 获取用户可见的题目（系统题目 + 用户自己创建的题目）
     *
     * @param userId 用户ID
     * @param current 当前页码
     * @param size    每页大小
     * @param subjectId 学科ID（可选）
     * @return 题目分页数据
     */
    IPage<QuestionEntity> getQuestionsForUser(Long userId, Long current, Long size, Long subjectId);
}
