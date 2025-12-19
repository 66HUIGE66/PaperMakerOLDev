-- 修改考试记录表的得分为小数类型
ALTER TABLE `exam_records` MODIFY COLUMN `score` DECIMAL(10, 1) COMMENT '得分';

-- 可选：如果总分也支持小数，可以一并修改
-- ALTER TABLE `exam_records` MODIFY COLUMN `total_score` DECIMAL(10, 1) COMMENT '总分';
