-- 添加相似度评分相关字段
-- 用于支持基于相似度的初始评分和可选的AI重新评分功能

ALTER TABLE answer_records 
ADD COLUMN similarity_score DOUBLE COMMENT '相似度评分(0-1)',
ADD COLUMN final_score DOUBLE COMMENT '最终得分',
ADD COLUMN score_type VARCHAR(20) DEFAULT 'SIMILARITY' COMMENT '评分类型: SIMILARITY或AI',
ADD COLUMN user_accepted_ai_score BOOLEAN DEFAULT FALSE COMMENT '用户是否接受AI评分';

-- 更新现有记录：如果已有AI评分，则设置为AI评分类型
UPDATE answer_records 
SET final_score = ai_score, 
    score_type = 'AI',
    user_accepted_ai_score = TRUE
WHERE ai_score IS NOT NULL;

-- 为没有AI评分的记录设置默认值
UPDATE answer_records 
SET final_score = 0,
    score_type = 'SIMILARITY',
    similarity_score = 0
WHERE ai_score IS NULL;
