package org.example.papermaker.vo;

import lombok.Data;
import org.example.papermaker.entity.ExamPaperEntity;

@Data
public class ExamPaperVo extends ExamPaperEntity {
    public String subjectName;
}
