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

 Date: 11/11/2025 16:59:13
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'admin', 'admin@example.com', 'admin123', 'ADMIN', 'ACTIVE', '2025-09-22 17:21:02', '2025-09-22 17:21:02');
INSERT INTO `users` VALUES (2, 'student1', 'student1@example.com', 'student123', 'STUDENT', 'ACTIVE', '2025-09-22 17:21:02', '2025-09-22 17:21:02');
INSERT INTO `users` VALUES (3, 'student2', 'student2@example.com', 'student123', 'STUDENT', 'ACTIVE', '2025-09-22 17:21:02', '2025-09-22 17:21:02');
INSERT INTO `users` VALUES (4, 'test1', 'test1@qq.com', '123456', 'STUDENT', 'ACTIVE', '2025-10-05 20:28:07', '2025-10-05 20:28:07');
INSERT INTO `users` VALUES (5, 'aaa', 'aaa@123.cn', '123456', 'STUDENT', 'ACTIVE', '2025-10-05 20:37:15', '2025-10-05 20:37:15');
INSERT INTO `users` VALUES (6, 'ddd', 'ddd@123.dd', '123456', 'STUDENT', 'ACTIVE', '2025-10-05 20:56:59', '2025-10-05 20:56:59');

SET FOREIGN_KEY_CHECKS = 1;
