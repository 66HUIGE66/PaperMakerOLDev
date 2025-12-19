-- Fix for 500 Internal Server Error: Missing Tables (Study Plan & Feedback)

CREATE TABLE IF NOT EXISTS study_plan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT COMMENT 'User ID',
    subject_id BIGINT COMMENT 'Subject ID',
    target_description TEXT COMMENT 'Study Goal',
    deadline DATETIME COMMENT 'Deadline',
    status VARCHAR(50) COMMENT 'Status: ONGOING, COMPLETED',
    generated_paper_ids TEXT COMMENT 'JSON list of generated paper IDs',
    ai_suggestion TEXT COMMENT 'AI Suggestions',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS feedbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT 'Feedback Title',
    content TEXT NOT NULL COMMENT 'Feedback Content',
    type VARCHAR(50) COMMENT 'Type: BUG, FEATURE, IMPROVEMENT, OTHER',
    status VARCHAR(50) DEFAULT 'PENDING' COMMENT 'Status: PENDING, RESOLVED, etc.',
    submitter_id BIGINT COMMENT 'Submitter User ID',
    admin_reply TEXT COMMENT 'Admin Reply',
    replier_id BIGINT COMMENT 'Replier Admin ID',
    replied_at DATETIME COMMENT 'Reply Time',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
