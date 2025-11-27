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

 Date: 11/11/2025 16:57:49
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
  `score` int NULL DEFAULT NULL COMMENT '得分',
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
) ENGINE = InnoDB AUTO_INCREMENT = 36 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '考试记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of exam_records
-- ----------------------------
INSERT INTO `exam_records` VALUES (14, 85, 1, 1, '2025-10-22 06:19:03', '2025-10-22 06:19:25', 12, 20, 5, 5, 3, 60, 'PRACTICE', 'COMPLETED', 22, '2025-10-22 14:19:25', '2025-10-22 14:19:25', '计算机测试');
INSERT INTO `exam_records` VALUES (16, 106, 1, 1, '2025-10-22 07:47:38', '2025-10-22 07:47:47', 18, 100, 4, 11, 2, 18.181818181818183, 'PRACTICE', 'COMPLETED', 9, '2025-10-22 15:47:47', '2025-10-22 15:47:47', '物理基础练习规则');
INSERT INTO `exam_records` VALUES (19, 135, 1, 1, '2025-10-29 08:00:57', '2025-10-29 08:01:10', 6, 85, 1, 15, 1, 6.666666666666667, 'PRACTICE', 'COMPLETED', 13, '2025-10-29 16:01:10', '2025-10-29 16:01:10', '物理基础练习');
INSERT INTO `exam_records` VALUES (21, 138, 1, 1, '2025-10-29 09:05:48', '2025-10-29 09:05:55', 0, 100, 1, 17, 0, 0, 'PRACTICE', 'COMPLETED', 7, '2025-10-29 17:05:55', '2025-10-29 17:05:55', '物理基础练习');
INSERT INTO `exam_records` VALUES (24, 139, 1, 1, '2025-10-30 01:21:34', '2025-10-30 01:21:39', 14, 100, 1, 7, 1, 14.285714285714285, 'PRACTICE', 'COMPLETED', 5, '2025-10-30 09:21:39', '2025-10-30 09:21:39', '计算机测试卷');
INSERT INTO `exam_records` VALUES (25, 139, 1, 1, '2025-10-30 08:59:25', '2025-10-30 08:59:30', 0, 100, 1, 7, 0, 0, 'PRACTICE', 'COMPLETED', 5, '2025-10-30 16:59:30', '2025-10-30 16:59:30', '计算机测试卷');
INSERT INTO `exam_records` VALUES (33, 145, 6, 6, '2025-11-05 06:08:22', '2025-11-05 06:12:16', 17, 100, 15, 18, 3, 16.666666666666664, 'PRACTICE', 'COMPLETED', 234, '2025-11-05 14:12:16', '2025-11-05 14:12:16', 'MySQL测试卷');
INSERT INTO `exam_records` VALUES (34, 145, 6, 6, '2025-11-07 11:04:33', '2025-11-07 11:04:45', 0, 100, 1, 18, 0, 0, 'PRACTICE', 'COMPLETED', 12, '2025-11-07 19:04:45', '2025-11-07 19:04:45', 'MySQL测试卷');
INSERT INTO `exam_records` VALUES (35, 146, 6, 6, '2025-11-11 01:12:21', '2025-11-11 01:15:27', 27, 100, 11, 15, 4, 26.666666666666668, 'PRACTICE', 'COMPLETED', 186, '2025-11-11 09:15:27', '2025-11-11 09:15:27', 'Java编程基础测试卷');

SET FOREIGN_KEY_CHECKS = 1;
