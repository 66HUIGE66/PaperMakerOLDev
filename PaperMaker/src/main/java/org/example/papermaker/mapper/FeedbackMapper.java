package org.example.papermaker.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.example.papermaker.entity.FeedbackEntity;

/**
 * 反馈Mapper接口
 * 
 * @author System
 * @since 1.0.0
 */
@Mapper
public interface FeedbackMapper extends BaseMapper<FeedbackEntity> {
}
