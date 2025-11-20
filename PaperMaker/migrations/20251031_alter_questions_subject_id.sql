-- Rename questions.subject -> questions.subject_id (BIGINT)
-- 1) add new column
ALTER TABLE questions
ADD COLUMN subject_id BIGINT NULL;

-- 2) backfill from old string column if possible (numbers stored as text)
-- for MySQL:
UPDATE questions SET subject_id = NULLIF(subject, '') + 0 WHERE subject IS NOT NULL;

-- 3) make it NOT NULL if你需要（当前保持可空，避免导入失败）
-- ALTER TABLE questions MODIFY COLUMN subject_id BIGINT NOT NULL;

-- 4) drop old column
ALTER TABLE questions DROP COLUMN subject;











