package org.example.papermaker.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.example.papermaker.entity.ExamRecordEntity;

/**
 * 考试记录Mapper接口
 */
@Mapper
public interface ExamRecordMapper extends BaseMapper<ExamRecordEntity> {
}
