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

 Date: 11/11/2025 16:57:40
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
) ENGINE = InnoDB AUTO_INCREMENT = 147 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试卷表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of exam_papers
-- ----------------------------
INSERT INTO `exam_papers` VALUES (84, '物理基础练习规则', '根据规则自动生成的试卷', 100, 90, '1', 1, 1, '2025-10-11 08:59:02', '2025-10-16 16:42:13', NULL);
INSERT INTO `exam_papers` VALUES (85, '计算机测试', '根据规则自动生成的试卷', 20, 90, '5', 1, 1, '2025-10-11 09:02:17', '2025-10-16 16:42:13', NULL);
INSERT INTO `exam_papers` VALUES (87, '物理基础练习规则', '根据规则自动生成的试卷', 100, 90, '1', 1, 1, '2025-10-11 09:25:15', '2025-10-16 16:42:13', NULL);
INSERT INTO `exam_papers` VALUES (138, '物理基础练习', '根据规则自动生成的试卷', 100, 90, '1', 1, 1, '2025-10-29 16:38:45', '2025-10-29 16:38:45', NULL);
INSERT INTO `exam_papers` VALUES (142, 'Java基础综合测试', '根据规则自动生成的试卷', 100, 60, '17', 1, 1, '2025-10-31 21:33:57', '2025-10-31 21:33:57', NULL);
INSERT INTO `exam_papers` VALUES (145, 'MySQL测试卷', '根据规则自动生成的试卷', 100, 45, '18', 0, 6, '2025-11-05 14:07:44', '2025-11-05 14:56:15', NULL);
INSERT INTO `exam_papers` VALUES (146, 'Java编程基础测试卷', '根据规则自动生成的试卷', 100, 60, '17', 0, 6, '2025-11-11 09:12:12', '2025-11-11 09:12:12', NULL);

SET FOREIGN_KEY_CHECKS = 1;
