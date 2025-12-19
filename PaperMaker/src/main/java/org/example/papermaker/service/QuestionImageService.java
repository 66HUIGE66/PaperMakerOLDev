package org.example.papermaker.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.annotation.Resource;
import org.example.papermaker.entity.QuestionImageEntity;
import org.example.papermaker.mapper.QuestionImageMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 题目图片服务
 */
@Service
public class QuestionImageService {

    @Resource
    private QuestionImageMapper questionImageMapper;

    /**
     * 添加图片到题目
     */
    public QuestionImageEntity addImage(Long questionId, String imageUrl, String description) {
        QuestionImageEntity entity = new QuestionImageEntity();
        entity.setQuestionId(questionId);
        entity.setImageUrl(imageUrl);
        entity.setDescription(description);
        entity.setSortOrder(0);
        entity.setCreatedAt(LocalDateTime.now());
        questionImageMapper.insert(entity);
        return entity;
    }

    /**
     * 获取题目的所有图片
     */
    public List<QuestionImageEntity> getImagesByQuestionId(Long questionId) {
        LambdaQueryWrapper<QuestionImageEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuestionImageEntity::getQuestionId, questionId)
                .orderByAsc(QuestionImageEntity::getSortOrder);
        return questionImageMapper.selectList(wrapper);
    }

    /**
     * 删除单张图片
     */
    public void deleteImage(Long imageId) {
        questionImageMapper.deleteById(imageId);
    }

    /**
     * 删除题目的所有图片
     */
    @Transactional
    public void deleteByQuestionId(Long questionId) {
        LambdaQueryWrapper<QuestionImageEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(QuestionImageEntity::getQuestionId, questionId);
        questionImageMapper.delete(wrapper);
    }

    /**
     * 批量保存图片（用于题目创建/更新时）
     */
    @Transactional
    public void saveImages(Long questionId, List<String> imageUrls) {
        // 先删除原有图片
        deleteByQuestionId(questionId);
        // 再添加新图片
        if (imageUrls != null) {
            for (int i = 0; i < imageUrls.size(); i++) {
                QuestionImageEntity entity = new QuestionImageEntity();
                entity.setQuestionId(questionId);
                entity.setImageUrl(imageUrls.get(i));
                entity.setSortOrder(i);
                entity.setCreatedAt(LocalDateTime.now());
                questionImageMapper.insert(entity);
            }
        }
    }
}
