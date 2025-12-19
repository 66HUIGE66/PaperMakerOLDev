package org.example.papermaker.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.example.papermaker.entity.AnswerRecordEntity;

import java.util.List;

public interface AnswerRecordService extends IService<AnswerRecordEntity> {

    boolean saveBatchAnswers(Long examRecordId, List<AnswerRecordEntity> answers);
}
