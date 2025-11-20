package org.example.papermaker.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.example.papermaker.entity.ExamPaperEntity;

/**
 * 试卷Mapper接口
 */
@Mapper
public interface ExamPaperMapper extends BaseMapper<ExamPaperEntity> {
}
