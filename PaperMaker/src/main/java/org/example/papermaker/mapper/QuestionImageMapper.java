package org.example.papermaker.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.example.papermaker.entity.QuestionImageEntity;

/**
 * 题目图片Mapper接口
 */
@Mapper
public interface QuestionImageMapper extends BaseMapper<QuestionImageEntity> {
}
