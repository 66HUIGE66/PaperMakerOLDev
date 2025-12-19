/*
 Navicat Premium Data Transfer

 Source Server         : SEPG
 Source Server Type    : MySQL
 Source Server Version : 80034
 Source Host           : localhost:3306
 Source Schema         : sepgdb

 Target Server Type    : MySQL
 Target Server Version : 80034
 File Encoding         : 65001

 Date: 19/12/2025 15:55:12
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for announcements
-- ----------------------------
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '公告ID',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '公告标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '公告内容',
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'SYSTEM' COMMENT '公告类型: SYSTEM/MAINTENANCE/UPDATE/EVENT',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'DRAFT' COMMENT '公告状态: DRAFT/PUBLISHED/ARCHIVED',
  `publisher_id` bigint NULL DEFAULT NULL COMMENT '发布者ID',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `published_at` datetime NULL DEFAULT NULL COMMENT '发布时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `publisher_id`(`publisher_id` ASC) USING BTREE,
  INDEX `idx_announcements_status`(`status` ASC) USING BTREE,
  INDEX `idx_announcements_published_at`(`published_at` ASC) USING BTREE,
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`publisher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '系统公告表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for answer_records
-- ----------------------------
DROP TABLE IF EXISTS `answer_records`;
CREATE TABLE `answer_records`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `exam_record_id` bigint NOT NULL COMMENT '考试记录ID',
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `user_answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '用户答案',
  `is_correct` tinyint(1) NULL DEFAULT 0 COMMENT '是否正确',
  `time_spent` int NULL DEFAULT 0 COMMENT '答题用时（秒）',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `question_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '题目类型',
  `ai_score` int NULL DEFAULT NULL COMMENT 'AI评分(0-100)',
  `ai_feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT 'AI评分反馈',
  `ai_suggestions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT 'AI改进建议',
  `similarity_score` double NULL DEFAULT NULL COMMENT '相似度评分(0-1)',
  `final_score` double NULL DEFAULT NULL COMMENT '最终得分',
  `score_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'SIMILARITY' COMMENT '评分类型: SIMILARITY或AI',
  `user_accepted_ai_score` tinyint(1) NULL DEFAULT 0 COMMENT '用户是否接受AI评分',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_exam_record`(`exam_record_id` ASC) USING BTREE,
  INDEX `idx_question_id`(`question_id` ASC) USING BTREE,
  INDEX `idx_answer_records_qtype`(`question_type` ASC) USING BTREE,
  CONSTRAINT `answer_records_ibfk_1` FOREIGN KEY (`exam_record_id`) REFERENCES `exam_records` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `answer_records_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 627 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '答题记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for exam_paper_questions
-- ----------------------------
DROP TABLE IF EXISTS `exam_paper_questions`;
CREATE TABLE `exam_paper_questions`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `paper_id` bigint NOT NULL COMMENT '试卷ID',
  `question_id` bigint NOT NULL COMMENT '题目ID',
  `question_order` int NOT NULL COMMENT '题目顺序',
  `score` int NULL DEFAULT 1 COMMENT '题目分值',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_paper_id`(`paper_id` ASC) USING BTREE,
  INDEX `idx_question_id`(`question_id` ASC) USING BTREE,
  CONSTRAINT `exam_paper_questions_ibfk_1` FOREIGN KEY (`paper_id`) REFERENCES `exam_papers` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `exam_paper_questions_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1747 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试卷题目关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for exam_papers
-- ----------------------------
DROP TABLE IF EXISTS `exam_papers`;
CREATE TABLE `exam_papers`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '试卷ID',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '试卷标题',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '试卷描述',
  `total_score` int NOT NULL DEFAULT 0 COMMENT '总分',
  `duration` int NOT NULL DEFAULT 120 COMMENT '考试时长（分钟）',
  `subject_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '学科',
  `is_system` tinyint(1) NULL DEFAULT 0 COMMENT '是否为系统试卷',
  `creator_id` bigint NOT NULL COMMENT '创建者ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `rule_id` bigint NULL DEFAULT NULL COMMENT '规则ID，标识该试卷是由哪个规则生成的',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_is_system`(`is_system` ASC) USING BTREE,
  INDEX `idx_creator`(`creator_id` ASC) USING BTREE,
  INDEX `idx_rule_id`(`rule_id` ASC) USING BTREE,
  CONSTRAINT `exam_papers_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 152 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试卷表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for exam_records
-- ----------------------------
DROP TABLE IF EXISTS `exam_records`;
CREATE TABLE `exam_records`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '考试记录ID',
  `paper_id` bigint NOT NULL COMMENT '试卷ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `student_id` bigint NULL DEFAULT NULL COMMENT '学生ID（与用户ID相同）',
  `start_time` datetime NOT NULL COMMENT '开始时间',
  `end_time` datetime NULL DEFAULT NULL COMMENT '结束时间',
  `score` decimal(10, 1) NULL DEFAULT NULL COMMENT '得分',
  `total_score` int NULL DEFAULT NULL COMMENT '总分',
  `answered_questions` int NULL DEFAULT NULL COMMENT '答题数量',
  `total_questions` int NULL DEFAULT NULL COMMENT '总题目数量',
  `correct_answers` int NULL DEFAULT NULL COMMENT '正确答题数量',
  `accuracy` double NULL DEFAULT NULL COMMENT '正确率',
  `exam_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRACTICE' COMMENT '考试类型：PRACTICE-练习模式，EXAM-考试模式',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COMPLETED' COMMENT '考试状态：IN_PROGRESS-进行中，COMPLETED-已完成，TIMEOUT-超时',
  `time_spent` int NULL DEFAULT NULL COMMENT '用时（秒）',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `paper_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '试卷名称',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_student_id`(`student_id` ASC) USING BTREE,
  INDEX `idx_paper_id`(`paper_id` ASC) USING BTREE,
  INDEX `idx_start_time`(`start_time` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_exam_type`(`exam_type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 56 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '考试记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for exam_rules
-- ----------------------------
DROP TABLE IF EXISTS `exam_rules`;
CREATE TABLE `exam_rules`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '规则ID',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '规则名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '规则描述',
  `total_questions` int NOT NULL DEFAULT 10 COMMENT '总题目数',
  `total_score` int NOT NULL DEFAULT 100 COMMENT '总分',
  `duration` int NOT NULL DEFAULT 120 COMMENT '考试时长（分钟）',
  `rule_config` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '规则配置（JSON格式）',
  `creator_id` bigint NOT NULL COMMENT '创建者ID',
  `is_system` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否系统规则',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'ACTIVE' COMMENT '规则状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `subject_id` bigint NULL DEFAULT NULL COMMENT '所属学科ID',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_creator_id`(`creator_id` ASC) USING BTREE,
  INDEX `idx_is_system`(`is_system` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_subject_id`(`subject_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '组卷规则表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for feedbacks
-- ----------------------------
DROP TABLE IF EXISTS `feedbacks`;
CREATE TABLE `feedbacks`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '反馈ID',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '反馈标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '反馈内容',
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'OTHER' COMMENT '反馈类型: BUG/FEATURE/IMPROVEMENT/OTHER',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'PENDING' COMMENT '反馈状态: PENDING/PROCESSING/RESOLVED/REJECTED/CLOSED',
  `submitter_id` bigint NOT NULL COMMENT '提交者ID',
  `admin_reply` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '管理员回复',
  `replier_id` bigint NULL DEFAULT NULL COMMENT '回复者ID',
  `replied_at` datetime NULL DEFAULT NULL COMMENT '回复时间',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `replier_id`(`replier_id` ASC) USING BTREE,
  INDEX `idx_feedbacks_status`(`status` ASC) USING BTREE,
  INDEX `idx_feedbacks_submitter_id`(`submitter_id` ASC) USING BTREE,
  INDEX `idx_feedbacks_type`(`type` ASC) USING BTREE,
  CONSTRAINT `feedbacks_ibfk_1` FOREIGN KEY (`submitter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `feedbacks_ibfk_2` FOREIGN KEY (`replier_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户反馈表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for knowledge_points
-- ----------------------------
DROP TABLE IF EXISTS `knowledge_points`;
CREATE TABLE `knowledge_points`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '知识点ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '知识点名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '知识点描述',
  `subject` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '所属学科',
  `weight` decimal(5, 2) NOT NULL DEFAULT 0.00 COMMENT '权重（百分比，0-100）',
  `difficulty_level` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'MEDIUM' COMMENT '难度等级',
  `creator_id` bigint NOT NULL COMMENT '创建者ID',
  `is_system` tinyint(1) NULL DEFAULT 0 COMMENT '是否系统预设',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'ACTIVE' COMMENT '状态',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序序号',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `subject_id` bigint NULL DEFAULT NULL COMMENT '所属学科ID',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_subject`(`subject` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_creator`(`creator_id` ASC) USING BTREE,
  INDEX `idx_sort`(`sort_order` ASC) USING BTREE,
  INDEX `idx_subject_id`(`subject_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 239 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识点表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for question_image
-- ----------------------------
DROP TABLE IF EXISTS `question_image`;
CREATE TABLE `question_image`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '图片ID',
  `question_id` bigint NOT NULL COMMENT '关联题目ID',
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'OSS图片URL',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图片描述',
  `sort_order` int NULL DEFAULT 0 COMMENT '显示顺序',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_question_id`(`question_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '题目图片表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for questions
-- ----------------------------
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '题目ID',
  `title` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '题目标题',
  `type` enum('SINGLE_CHOICE','MULTIPLE_CHOICE','FILL_BLANK','TRUE_FALSE','SHORT_ANSWER') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '题目类型',
  `difficulty` enum('EASY','MEDIUM','HARD') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '难度等级',
  `options` json NULL COMMENT '选择题选项（JSON格式）',
  `correct_answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '正确答案',
  `explanation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '题目解析',
  `is_system` tinyint(1) NULL DEFAULT 0 COMMENT '是否为系统题目',
  `creator_id` bigint NOT NULL COMMENT '创建者ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `knowledge_point_ids` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '知识点ID列表（JSON格式）',
  `subject_id` bigint NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_difficulty`(`difficulty` ASC) USING BTREE,
  INDEX `idx_is_system`(`is_system` ASC) USING BTREE,
  INDEX `idx_creator`(`creator_id` ASC) USING BTREE,
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 831 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '题目表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for study_plan
-- ----------------------------
DROP TABLE IF EXISTS `study_plan`;
CREATE TABLE `study_plan`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NULL DEFAULT NULL COMMENT 'User ID',
  `subject_id` bigint NULL DEFAULT NULL COMMENT 'Subject ID',
  `target_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT 'Study Goal',
  `deadline` datetime NULL DEFAULT NULL COMMENT 'Deadline',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'Status: ONGOING, COMPLETED',
  `generated_paper_ids` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT 'JSON list of generated paper IDs',
  `ai_suggestion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT 'AI Suggestions',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 34 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for subjects
-- ----------------------------
DROP TABLE IF EXISTS `subjects`;
CREATE TABLE `subjects`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '学科ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '学科名称',
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '学科代码',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '学科描述',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序序号',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_system` tinyint(1) NULL DEFAULT NULL COMMENT '是否系统预设',
  `creator_id` bigint NULL DEFAULT NULL COMMENT '创建者ID',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE,
  UNIQUE INDEX `code`(`code` ASC) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE,
  INDEX `idx_code`(`code` ASC) USING BTREE,
  INDEX `idx_is_active`(`is_active` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 22 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '学科表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_collections
-- ----------------------------
DROP TABLE IF EXISTS `user_collections`;
CREATE TABLE `user_collections`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `target_type` enum('QUESTION','PAPER') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '收藏类型：题目/试卷',
  `target_id` bigint NOT NULL COMMENT '目标ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_target`(`user_id` ASC, `target_type` ASC, `target_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_target_type`(`target_type` ASC) USING BTREE,
  CONSTRAINT `user_collections_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户收藏表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '邮箱',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码',
  `role` enum('ADMIN','STUDENT') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'STUDENT' COMMENT '用户角色：管理员/学生',
  `status` enum('ACTIVE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'ACTIVE' COMMENT '用户状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- View structure for v_subject_keywords
-- ----------------------------
DROP VIEW IF EXISTS `v_subject_keywords`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_subject_keywords` AS select `s`.`id` AS `subject_id`,`s`.`name` AS `subject_name`,`s`.`code` AS `subject_code`,group_concat(distinct `kp`.`name` order by `kp`.`sort_order` ASC separator ',') AS `keywords`,count(distinct `kp`.`id`) AS `keyword_count` from (`subjects` `s` left join `knowledge_points` `kp` on(((`s`.`id` = `kp`.`subject_id`) and (`kp`.`status` = 'ACTIVE')))) where (`s`.`is_active` = true) group by `s`.`id`,`s`.`name`,`s`.`code`;

-- ----------------------------
-- Procedure structure for get_subject_keywords
-- ----------------------------
DROP PROCEDURE IF EXISTS `get_subject_keywords`;
delimiter ;;
CREATE PROCEDURE `get_subject_keywords`(IN subject_id_or_name VARCHAR(100))
BEGIN
    DECLARE v_subject_id BIGINT;
    
    -- 判断输入是ID还是名称
    IF subject_id_or_name REGEXP '^[0-9]+$' THEN
        -- 输入是数字，作为ID处理
        SET v_subject_id = CAST(subject_id_or_name AS UNSIGNED);
    ELSE
        -- 输入是字符串，作为名称查找ID
        SELECT id INTO v_subject_id
        FROM subjects
        WHERE name = subject_id_or_name
        LIMIT 1;
    END IF;
    
    -- 返回学科关键词
    IF v_subject_id IS NOT NULL THEN
        SELECT 
            s.id as subject_id,
            s.name as subject_name,
            s.code as subject_code,
            GROUP_CONCAT(DISTINCT kp.name ORDER BY kp.sort_order SEPARATOR ',') as keywords,
            COUNT(DISTINCT kp.id) as keyword_count
        FROM subjects s
        LEFT JOIN knowledge_points kp ON s.id = kp.subject_id AND kp.status = 'ACTIVE'
        WHERE s.id = v_subject_id
        GROUP BY s.id, s.name, s.code;
    ELSE
        SELECT '学科不存在' as error_message;
    END IF;
END
;;
delimiter ;

SET FOREIGN_KEY_CHECKS = 1;
