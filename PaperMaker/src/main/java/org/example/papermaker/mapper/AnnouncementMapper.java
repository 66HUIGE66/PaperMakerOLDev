package org.example.papermaker.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.example.papermaker.entity.AnnouncementEntity;

/**
 * 公告Mapper接口
 * 
 * @author System
 * @since 1.0.0
 */
@Mapper
public interface AnnouncementMapper extends BaseMapper<AnnouncementEntity> {
}
