-- 创建公告表
-- 用于存储系统公告信息
CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '公告ID',
    title VARCHAR(255) NOT NULL COMMENT '公告标题',
    content TEXT NOT NULL COMMENT '公告内容',
    type VARCHAR(50) DEFAULT 'SYSTEM' COMMENT '公告类型: SYSTEM/MAINTENANCE/UPDATE/EVENT',
    status VARCHAR(50) DEFAULT 'DRAFT' COMMENT '公告状态: DRAFT/PUBLISHED/ARCHIVED',
    publisher_id BIGINT COMMENT '发布者ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    published_at DATETIME COMMENT '发布时间',
    FOREIGN KEY (publisher_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统公告表';

-- 创建反馈表
-- 用于存储用户反馈和建议
CREATE TABLE IF NOT EXISTS feedbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '反馈ID',
    title VARCHAR(255) NOT NULL COMMENT '反馈标题',
    content TEXT NOT NULL COMMENT '反馈内容',
    type VARCHAR(50) DEFAULT 'OTHER' COMMENT '反馈类型: BUG/FEATURE/IMPROVEMENT/OTHER',
    status VARCHAR(50) DEFAULT 'PENDING' COMMENT '反馈状态: PENDING/PROCESSING/RESOLVED/REJECTED/CLOSED',
    submitter_id BIGINT NOT NULL COMMENT '提交者ID',
    admin_reply TEXT COMMENT '管理员回复',
    replier_id BIGINT COMMENT '回复者ID',
    replied_at DATETIME COMMENT '回复时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (submitter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (replier_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈表';

-- 为公告表创建索引
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);

-- 为反馈表创建索引
CREATE INDEX idx_feedbacks_status ON feedbacks(status);
CREATE INDEX idx_feedbacks_submitter_id ON feedbacks(submitter_id);
CREATE INDEX idx_feedbacks_type ON feedbacks(type);
