package org.example.papermaker.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.example.papermaker.entity.UserEntity;

/**
 * 用户Mapper接口
 */
@Mapper
public interface UserMapper extends BaseMapper<UserEntity> {
}
