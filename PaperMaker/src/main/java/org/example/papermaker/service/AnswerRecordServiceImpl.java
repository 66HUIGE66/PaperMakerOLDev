package org.example.papermaker.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import jakarta.annotation.Resource;
import org.example.papermaker.entity.AnswerRecordEntity;
import org.example.papermaker.mapper.AnswerRecordMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AnswerRecordServiceImpl extends ServiceImpl<AnswerRecordMapper, AnswerRecordEntity>
        implements AnswerRecordService {

    @Resource
    private AnswerRecordMapper answerRecordMapper;

    @Override
    public boolean saveBatchAnswers(Long examRecordId, List<AnswerRecordEntity> answers) {
        if (answers == null || answers.isEmpty()) {
            return true;
        }
        for (AnswerRecordEntity a : answers) {
            a.setExamRecordId(examRecordId);
            if (a.getCreatedAt() == null) {
                a.setCreatedAt(LocalDateTime.now());
            }
        }
        return saveBatch(answers);
    }
}



























