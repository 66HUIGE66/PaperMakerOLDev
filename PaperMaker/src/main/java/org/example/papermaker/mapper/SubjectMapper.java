package org.example.papermaker.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.example.papermaker.entity.SubjectEntity;

import java.util.List;

/**
 * 学科Mapper接口
 */
@Mapper
public interface SubjectMapper extends BaseMapper<SubjectEntity> {
    
    /**
     * 查询所有启用的学科
     */
    @Select("SELECT * FROM subjects WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC")
    List<SubjectEntity> selectAllActive();
    
    /**
     * 根据名称查询学科
     */
    @Select("SELECT * FROM subjects WHERE name = #{name} LIMIT 1")
    SubjectEntity selectByName(String name);
    
    /**
     * 根据代码查询学科
     */
    @Select("SELECT * FROM subjects WHERE code = #{code} LIMIT 1")
    SubjectEntity selectByCode(String code);
}






































