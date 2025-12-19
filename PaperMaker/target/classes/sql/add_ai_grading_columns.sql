-- 为答题记录表添加AI评分相关字段
-- 执行时间: 2025-12-12

ALTER TABLE answer_records
ADD COLUMN ai_score INT DEFAULT NULL COMMENT 'AI评分(0-100)',
ADD COLUMN ai_feedback TEXT DEFAULT NULL COMMENT 'AI评分反馈',
ADD COLUMN ai_suggestions TEXT DEFAULT NULL COMMENT 'AI改进建议';
