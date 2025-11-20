package org.example.papermaker.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.example.papermaker.entity.AnswerRecordEntity;
import org.example.papermaker.service.AnswerRecordService;
import org.example.papermaker.vo.RespBean;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/answer-record")
@Tag(name = "答题记录管理")
public class AnswerRecordController {

    @Resource
    private AnswerRecordService answerRecordService;

    public static class SaveAnswersRequest {
        public Long examRecordId;
        public List<AnswerRecordEntity> answers;
    }

    @PostMapping("/save-batch")
    @Operation(summary = "批量保存答题记录")
    public RespBean saveBatch(@RequestBody SaveAnswersRequest req) {
        if (req == null || req.examRecordId == null) {
            return new RespBean(400, "examRecordId 不能为空", null);
        }
        boolean ok = answerRecordService.saveBatchAnswers(req.examRecordId, req.answers);
        return ok ? new RespBean(200, "保存成功", null) : new RespBean(500, "保存失败", null);
    }

    @GetMapping("/by-exam/{examRecordId}")
    @Operation(summary = "根据考试记录ID获取答题记录")
    public RespBean listByExamRecordId(@PathVariable Long examRecordId) {
        List<AnswerRecordEntity> list = answerRecordService.lambdaQuery()
                .eq(AnswerRecordEntity::getExamRecordId, examRecordId)
                .list();
        return new RespBean(200, "查询成功", list);
    }
}


