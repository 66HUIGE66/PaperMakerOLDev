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

 Date: 11/11/2025 16:58:56
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
) ENGINE = InnoDB AUTO_INCREMENT = 20 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '学科表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of subjects
-- ----------------------------
INSERT INTO `subjects` VALUES (1, '物理', 'PHYSICS', '物理学科', 1, 1, '2025-10-09 13:29:42', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (2, '数学', 'MATH', '数学学科', 2, 1, '2025-10-09 13:29:42', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (3, '化学', 'CHEMISTRY', '化学学科', 3, 1, '2025-10-09 13:29:42', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (4, '生物', 'BIOLOGY', '生物学科', 4, 1, '2025-10-09 13:29:42', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (5, '计算机', 'CS', '计算机科学', 5, 1, '2025-10-09 13:29:42', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (7, 'Python编程', 'PYTHON', 'Python编程语言', 7, 1, '2025-10-09 13:29:42', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (8, 'JavaScript编程', 'JS', 'JavaScript编程语言', 8, 1, '2025-10-09 13:29:42', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (9, '数据库', 'DATABASE', '数据库技术', 9, 1, '2025-10-11 10:03:45', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (10, 'Web开发', 'WEB', 'Web开发技术', 10, 1, '2025-10-11 10:03:45', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (11, '算法', 'ALGORITHM', '算法与数据结构', 11, 1, '2025-10-11 10:03:45', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (12, '编程基础', 'PROGRAMMING', '编程基础', 12, 1, '2025-10-11 10:03:45', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (13, 'Linux系统', 'LINUX', 'Linux操作系统', 13, 1, '2025-10-11 10:03:45', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (14, '地理', 'GEOGRAPHY', '地理学科', 14, 1, '2025-10-11 10:03:45', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (15, '英语', 'ENGLISH', '英语', 9, 1, '2025-10-11 10:19:28', '2025-10-27 11:52:23', 1, 1);
INSERT INTO `subjects` VALUES (17, 'Java', 'JAVA', 'Java学科', 100, 1, '2025-10-30 14:29:22', '2025-10-30 14:29:22', 1, 1);
INSERT INTO `subjects` VALUES (18, 'MySQL', 'MYSQL', 'MySQL学科', 100, 1, '2025-11-04 14:23:18', '2025-11-04 14:23:18', 0, 6);

SET FOREIGN_KEY_CHECKS = 1;
