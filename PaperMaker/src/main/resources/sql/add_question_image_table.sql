-- 题目图片关联表
-- 用于存储题目相关的图片，支持多图片管理

CREATE TABLE IF NOT EXISTS question_image (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '图片ID',
    question_id BIGINT NOT NULL COMMENT '关联题目ID',
    image_url VARCHAR(500) NOT NULL COMMENT 'OSS图片URL',
    description VARCHAR(255) COMMENT '图片描述',
    sort_order INT DEFAULT 0 COMMENT '显示顺序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目图片表';
