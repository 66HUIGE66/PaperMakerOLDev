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

 Date: 11/11/2025 16:58:37
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
) ENGINE = InnoDB AUTO_INCREMENT = 232 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '知识点表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of knowledge_points
-- ----------------------------
INSERT INTO `knowledge_points` VALUES (1, '基础概念', '学科基础概念和定义', '计算机科学', 30.00, 'EASY', 1, 1, 'ACTIVE', 1, '2025-09-26 13:44:45', '2025-10-09 15:40:15', 5);
INSERT INTO `knowledge_points` VALUES (2, '核心理论', '学科核心理论和原理', '计算机科学', 40.00, 'MEDIUM', 1, 1, 'ACTIVE', 2, '2025-09-26 13:44:45', '2025-10-09 15:40:15', 5);
INSERT INTO `knowledge_points` VALUES (3, '应用实践', '理论知识的实际应用', '计算机科学', 30.00, 'HARD', 1, 1, 'ACTIVE', 3, '2025-09-26 13:44:45', '2025-10-09 15:40:15', 5);
INSERT INTO `knowledge_points` VALUES (4, '基础概念', '学科基础概念和定义', '数学', 25.00, 'EASY', 1, 1, 'ACTIVE', 1, '2025-09-26 13:44:45', '2025-10-09 15:40:15', 2);
INSERT INTO `knowledge_points` VALUES (5, '核心理论', '学科核心理论和原理', '数学', 50.00, 'MEDIUM', 1, 1, 'ACTIVE', 2, '2025-09-26 13:44:45', '2025-10-09 15:40:15', 2);
INSERT INTO `knowledge_points` VALUES (6, '应用实践', '理论知识的实际应用', '数学', 25.00, 'HARD', 1, 1, 'ACTIVE', 3, '2025-09-26 13:44:45', '2025-10-09 15:40:15', 2);
INSERT INTO `knowledge_points` VALUES (7, '基础概念', '学科基础概念和定义', '物理', 20.00, 'EASY', 1, 1, 'ACTIVE', 1, '2025-09-26 13:44:45', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (8, '核心理论', '学科核心理论和原理', '物理', 60.00, 'MEDIUM', 1, 1, 'ACTIVE', 2, '2025-09-26 13:44:45', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (9, '应用实践', '理论知识的实际应用', '物理', 20.00, 'HARD', 1, 1, 'ACTIVE', 3, '2025-09-26 13:44:45', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (10, '基础概念', '计算机科学基础概念和原理', '计算机科学', 25.00, 'MEDIUM', 1, 1, 'ACTIVE', 1, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 5);
INSERT INTO `knowledge_points` VALUES (11, '数据结构', '数据结构与算法基础', '计算机科学', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 2, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 5);
INSERT INTO `knowledge_points` VALUES (12, '算法设计', '算法设计与分析', '计算机科学', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 3, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 5);
INSERT INTO `knowledge_points` VALUES (13, '编程语言', '编程语言基础与应用', '计算机科学', 15.00, 'MEDIUM', 1, 1, 'ACTIVE', 4, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 5);
INSERT INTO `knowledge_points` VALUES (14, '软件工程', '软件工程理论与实践', '计算机科学', 10.00, 'MEDIUM', 1, 1, 'ACTIVE', 5, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 5);
INSERT INTO `knowledge_points` VALUES (15, '数据库技术', '数据库设计与应用', '计算机科学', 10.00, 'MEDIUM', 1, 1, 'ACTIVE', 6, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 5);
INSERT INTO `knowledge_points` VALUES (16, '基础概念', '数学基础概念和定理', '数学', 30.00, 'MEDIUM', 1, 1, 'ACTIVE', 1, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 2);
INSERT INTO `knowledge_points` VALUES (17, '代数', '代数学基础与应用', '数学', 25.00, 'MEDIUM', 1, 1, 'ACTIVE', 2, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 2);
INSERT INTO `knowledge_points` VALUES (18, '几何', '几何学基础与应用', '数学', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 3, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 2);
INSERT INTO `knowledge_points` VALUES (19, '微积分', '微积分基础与应用', '数学', 15.00, 'MEDIUM', 1, 1, 'ACTIVE', 4, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 2);
INSERT INTO `knowledge_points` VALUES (20, '概率统计', '概率论与数理统计', '数学', 10.00, 'MEDIUM', 1, 1, 'ACTIVE', 5, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 2);
INSERT INTO `knowledge_points` VALUES (21, '基础概念', '物理学基础概念和定律', '物理', 25.00, 'MEDIUM', 1, 1, 'ACTIVE', 1, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (22, '力学', '经典力学基础', '物理', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 2, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (23, '电磁学', '电磁学基础与应用', '物理', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 3, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (24, '热学', '热力学基础', '物理', 15.00, 'MEDIUM', 1, 1, 'ACTIVE', 4, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (25, '光学', '光学基础与应用', '物理', 10.00, 'MEDIUM', 1, 1, 'ACTIVE', 5, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (26, '现代物理', '现代物理学基础', '物理', 10.00, 'MEDIUM', 1, 1, 'ACTIVE', 6, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (27, '基础概念', '化学基础概念和原理', '化学', 25.00, 'MEDIUM', 1, 1, 'ACTIVE', 1, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 3);
INSERT INTO `knowledge_points` VALUES (28, '无机化学', '无机化学基础', '化学', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 2, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 3);
INSERT INTO `knowledge_points` VALUES (29, '有机化学', '有机化学基础', '化学', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 3, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 3);
INSERT INTO `knowledge_points` VALUES (30, '物理化学', '物理化学基础', '化学', 15.00, 'MEDIUM', 1, 1, 'ACTIVE', 4, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 3);
INSERT INTO `knowledge_points` VALUES (31, '分析化学', '分析化学基础', '化学', 10.00, 'MEDIUM', 1, 1, 'ACTIVE', 5, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 3);
INSERT INTO `knowledge_points` VALUES (32, '生物化学', '生物化学基础', '化学', 10.00, 'MEDIUM', 1, 1, 'ACTIVE', 6, '2025-09-26 15:11:42', '2025-10-09 15:40:15', 3);
INSERT INTO `knowledge_points` VALUES (33, '基础词汇', '英语基础词汇', '英语', 30.00, 'MEDIUM', 1, 1, 'ACTIVE', 1, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (34, '语法', '英语语法基础', '英语', 25.00, 'MEDIUM', 1, 1, 'ACTIVE', 2, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (35, '阅读理解', '英语阅读理解', '英语', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 3, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (36, '写作', '英语写作技巧', '英语', 15.00, 'MEDIUM', 1, 1, 'ACTIVE', 4, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (37, '听力', '英语听力理解', '英语', 10.00, 'MEDIUM', 1, 1, 'ACTIVE', 5, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (38, '基础概念', '语文基础概念', '语文', 25.00, 'MEDIUM', 1, 1, 'ACTIVE', 1, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (39, '现代文阅读', '现代文阅读理解', '语文', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 2, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (40, '古文阅读', '古文阅读理解', '语文', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 3, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (41, '作文', '作文写作技巧', '语文', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 4, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (42, '语言运用', '语言运用能力', '语文', 15.00, 'MEDIUM', 1, 1, 'ACTIVE', 5, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (43, '基础概念', '数据库基础概念', '数据库', 25.00, 'MEDIUM', 1, 1, 'ACTIVE', 1, '2025-09-26 15:11:42', '2025-10-11 10:04:23', 9);
INSERT INTO `knowledge_points` VALUES (44, 'SQL语言', 'SQL语言基础与应用', '数据库', 25.00, 'MEDIUM', 1, 1, 'ACTIVE', 2, '2025-09-26 15:11:42', '2025-10-11 10:04:23', 9);
INSERT INTO `knowledge_points` VALUES (45, '数据库设计', '数据库设计与建模', '数据库', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 3, '2025-09-26 15:11:42', '2025-10-11 10:04:23', 9);
INSERT INTO `knowledge_points` VALUES (46, '数据库管理', '数据库管理与维护', '数据库', 15.00, 'MEDIUM', 1, 1, 'ACTIVE', 4, '2025-09-26 15:11:42', '2025-10-11 10:04:23', 9);
INSERT INTO `knowledge_points` VALUES (47, '数据库安全', '数据库安全与保护', '数据库', 10.00, 'MEDIUM', 1, 1, 'ACTIVE', 5, '2025-09-26 15:11:42', '2025-10-11 10:04:23', 9);
INSERT INTO `knowledge_points` VALUES (48, 'NoSQL数据库', 'NoSQL数据库基础', '数据库', 5.00, 'MEDIUM', 1, 1, 'ACTIVE', 6, '2025-09-26 15:11:42', '2025-10-11 10:04:23', 9);
INSERT INTO `knowledge_points` VALUES (49, '基础概念', '算法设计基础概念', '算法设计', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 1, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (50, '排序算法', '排序算法设计与分析', '算法设计', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 2, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (51, '搜索算法', '搜索算法设计与分析', '算法设计', 15.00, 'MEDIUM', 1, 1, 'ACTIVE', 3, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (52, '图算法', '图算法设计与分析', '算法设计', 15.00, 'MEDIUM', 1, 1, 'ACTIVE', 4, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (53, '动态规划', '动态规划算法', '算法设计', 15.00, 'MEDIUM', 1, 1, 'ACTIVE', 5, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (54, '贪心算法', '贪心算法设计', '算法设计', 10.00, 'MEDIUM', 1, 1, 'ACTIVE', 6, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (55, '分治算法', '分治算法设计', '算法设计', 5.00, 'MEDIUM', 1, 1, 'ACTIVE', 7, '2025-09-26 15:11:42', '2025-09-26 15:11:42', NULL);
INSERT INTO `knowledge_points` VALUES (56, '牛顿运动定律', '牛顿第一、二、三定律及其应用', '物理', 25.00, 'MEDIUM', 1, 1, 'ACTIVE', 1, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (57, '动量守恒定律', '动量守恒定律及其在碰撞问题中的应用', '物理', 20.00, 'HARD', 1, 1, 'ACTIVE', 2, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (58, '机械能守恒', '机械能守恒定律及其应用', '物理', 20.00, 'MEDIUM', 1, 1, 'ACTIVE', 3, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (59, '圆周运动', '匀速圆周运动、向心力、离心力', '物理', 15.00, 'MEDIUM', 1, 1, 'ACTIVE', 4, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (60, '简谐运动', '简谐运动的特征和规律', '物理', 10.00, 'HARD', 1, 1, 'ACTIVE', 5, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (61, '万有引力', '万有引力定律及其在天体运动中的应用', '物理', 10.00, 'MEDIUM', 1, 1, 'ACTIVE', 6, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (62, '分子动理论', '分子动理论基本内容', '物理', 30.00, 'EASY', 1, 1, 'ACTIVE', 7, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (63, '热力学第一定律', '热力学第一定律及其应用', '物理', 25.00, 'MEDIUM', 1, 1, 'ACTIVE', 8, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (64, '理想气体状态方程', '理想气体状态方程及其应用', '物理', 25.00, 'MEDIUM', 1, 1, 'ACTIVE', 9, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (65, '热力学第二定律', '热力学第二定律和熵的概念', '物理', 20.00, 'HARD', 1, 1, 'ACTIVE', 10, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (66, '静电场', '电场强度、电势、电势能', '物理', 25.00, 'MEDIUM', 1, 1, 'ACTIVE', 11, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (67, '恒定电流', '欧姆定律、电功率、电阻', '物理', 20.00, 'EASY', 1, 1, 'ACTIVE', 12, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (68, '磁场', '磁感应强度、安培力、洛伦兹力', '物理', 25.00, 'MEDIUM', 1, 1, 'ACTIVE', 13, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (69, '电磁感应', '法拉第电磁感应定律、楞次定律', '物理', 20.00, 'HARD', 1, 1, 'ACTIVE', 14, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (70, '交流电', '交流电的产生、有效值、变压器', '物理', 10.00, 'MEDIUM', 1, 1, 'ACTIVE', 15, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (71, '几何光学', '光的反射、折射、全反射', '物理', 40.00, 'MEDIUM', 1, 1, 'ACTIVE', 16, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (72, '物理光学', '光的干涉、衍射、偏振', '物理', 35.00, 'HARD', 1, 1, 'ACTIVE', 17, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (73, '光的粒子性', '光电效应、康普顿效应', '物理', 25.00, 'HARD', 1, 1, 'ACTIVE', 18, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (74, '原子结构', '原子核外电子排布、能级', '物理', 30.00, 'MEDIUM', 1, 1, 'ACTIVE', 19, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (75, '原子核', '原子核的组成、放射性衰变', '物理', 35.00, 'MEDIUM', 1, 1, 'ACTIVE', 20, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (76, '核反应', '核裂变、核聚变、核能', '物理', 35.00, 'HARD', 1, 1, 'ACTIVE', 21, '2025-10-09 10:48:29', '2025-10-09 15:40:15', 1);
INSERT INTO `knowledge_points` VALUES (170, '程序入口方法', '程序入口方法知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 1, '2025-10-31 11:42:43', '2025-10-31 11:42:43', 17);
INSERT INTO `knowledge_points` VALUES (171, '基本数据类型与引用数据类型', '基本数据类型与引用数据类型知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 2, '2025-10-31 11:42:43', '2025-10-31 11:42:43', 17);
INSERT INTO `knowledge_points` VALUES (172, '类的定义', '类的定义知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 3, '2025-10-31 11:42:43', '2025-10-31 11:42:43', 17);
INSERT INTO `knowledge_points` VALUES (173, '注释语法', '注释语法知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 4, '2025-10-31 11:42:43', '2025-10-31 11:42:43', 17);
INSERT INTO `knowledge_points` VALUES (174, '变量声明与赋值', '变量声明与赋值知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 5, '2025-10-31 11:42:43', '2025-10-31 11:42:43', 17);
INSERT INTO `knowledge_points` VALUES (175, '算术运算符', '算术运算符知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 6, '2025-10-31 11:42:43', '2025-10-31 11:42:43', 17);
INSERT INTO `knowledge_points` VALUES (176, '分支结构', '分支结构知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 7, '2025-10-31 11:42:43', '2025-10-31 11:42:43', 17);
INSERT INTO `knowledge_points` VALUES (177, '循环结构', '循环结构知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 8, '2025-10-31 11:42:43', '2025-10-31 11:42:43', 17);
INSERT INTO `knowledge_points` VALUES (178, '控制台输入输出', '控制台输入输出知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 9, '2025-10-31 11:42:43', '2025-10-31 11:42:43', 17);
INSERT INTO `knowledge_points` VALUES (179, '修饰符', '修饰符知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 10, '2025-10-31 11:42:43', '2025-10-31 11:42:43', 17);
INSERT INTO `knowledge_points` VALUES (180, '数据类型', '数据类型知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 11, '2025-10-31 11:42:43', '2025-10-31 11:42:43', 17);
INSERT INTO `knowledge_points` VALUES (181, '方法定义', '方法定义知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 12, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (182, '基本数据类型与包装类', '基本数据类型与包装类知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 13, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (183, '包', '包知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 14, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (184, '数组特性', '数组特性知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 15, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (185, '面向对象', '面向对象知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 16, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (186, '异常处理', '异常处理知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 17, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (187, '多线程', '多线程知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 18, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (188, '集合框架', '集合框架知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 19, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (189, '泛型', '泛型知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 20, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (190, 'IO流', 'IO流知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 21, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (191, '字符串类', '字符串类知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 22, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (192, 'Java关键字', 'Java关键字知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 23, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (193, '数组声明', '数组声明知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 24, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (194, '字符串比较', '字符串比较知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 25, '2025-10-31 11:42:44', '2025-10-31 11:42:44', 17);
INSERT INTO `knowledge_points` VALUES (195, '基本数据类型', '基本数据类型知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 26, '2025-10-31 11:42:45', '2025-10-31 11:42:45', 17);
INSERT INTO `knowledge_points` VALUES (196, 'Java内存模型', 'Java内存模型知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 27, '2025-10-31 11:42:45', '2025-10-31 11:42:45', 17);
INSERT INTO `knowledge_points` VALUES (197, 'Java语言特性', 'Java语言特性知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 28, '2025-10-31 11:42:45', '2025-10-31 11:42:45', 17);
INSERT INTO `knowledge_points` VALUES (198, '垃圾回收', '垃圾回收知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 29, '2025-10-31 11:42:45', '2025-10-31 11:42:45', 17);
INSERT INTO `knowledge_points` VALUES (199, '方法参数传递', '方法参数传递知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 30, '2025-10-31 11:42:45', '2025-10-31 11:42:45', 17);
INSERT INTO `knowledge_points` VALUES (200, '包装类', '包装类知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 31, '2025-10-31 17:26:30', '2025-10-31 17:26:30', 17);
INSERT INTO `knowledge_points` VALUES (201, '方法定义与调用', '方法定义与调用知识点', 'Java', 0.00, 'MEDIUM', 1, 1, 'ACTIVE', 32, '2025-10-31 17:26:30', '2025-10-31 17:26:30', 17);
INSERT INTO `knowledge_points` VALUES (202, '数据库操作', '数据库操作知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 1, '2025-11-04 14:23:18', '2025-11-04 14:23:18', 18);
INSERT INTO `knowledge_points` VALUES (203, '数据类型', '数据类型知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 2, '2025-11-04 14:23:18', '2025-11-04 14:23:18', 18);
INSERT INTO `knowledge_points` VALUES (204, '约束', '约束知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 3, '2025-11-04 14:23:18', '2025-11-04 14:23:18', 18);
INSERT INTO `knowledge_points` VALUES (205, '数据操作', '数据操作知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 4, '2025-11-04 14:23:18', '2025-11-04 14:23:18', 18);
INSERT INTO `knowledge_points` VALUES (206, '索引', '索引知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 5, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (207, '事务', '事务知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 6, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (208, '事务隔离级别', '事务隔离级别知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 7, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (209, '索引优化', '索引优化知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 8, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (210, '存储引擎', '存储引擎知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 9, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (211, '查询语句', '查询语句知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 10, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (212, '联合索引', '联合索引知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 11, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (213, '聚合函数', '聚合函数知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 12, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (214, '锁机制', '锁机制知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 13, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (215, '配置优化', '配置优化知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 14, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (216, '视图', '视图知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 15, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (217, '性能优化', '性能优化知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 16, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (218, '索引操作', '索引操作知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 17, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (219, 'SQL语言分类', 'SQL语言分类知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 18, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (220, '字符串函数', '字符串函数知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 19, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (221, '表操作', '表操作知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 20, '2025-11-04 14:23:19', '2025-11-04 14:23:19', 18);
INSERT INTO `knowledge_points` VALUES (222, '日志', '日志知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 21, '2025-11-04 14:23:20', '2025-11-04 14:23:20', 18);
INSERT INTO `knowledge_points` VALUES (223, '备份恢复', '备份恢复知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 22, '2025-11-04 14:23:20', '2025-11-04 14:23:20', 18);
INSERT INTO `knowledge_points` VALUES (224, '主从复制', '主从复制知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 23, '2025-11-04 14:23:20', '2025-11-04 14:23:20', 18);
INSERT INTO `knowledge_points` VALUES (225, '数据库类型', '数据库类型知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 24, '2025-11-04 14:23:20', '2025-11-04 14:23:20', 18);
INSERT INTO `knowledge_points` VALUES (226, 'NULL值', 'NULL值知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 25, '2025-11-04 14:23:20', '2025-11-04 14:23:20', 18);
INSERT INTO `knowledge_points` VALUES (227, '并发控制', '并发控制知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 26, '2025-11-04 14:23:20', '2025-11-04 14:23:20', 18);
INSERT INTO `knowledge_points` VALUES (228, '存储过程', '存储过程知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 27, '2025-11-04 14:23:20', '2025-11-04 14:23:20', 18);
INSERT INTO `knowledge_points` VALUES (229, '日期函数', '日期函数知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 28, '2025-11-04 14:23:20', '2025-11-04 14:23:20', 18);
INSERT INTO `knowledge_points` VALUES (230, '分库分表', '分库分表知识点', 'MySQL', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 29, '2025-11-04 14:23:20', '2025-11-04 14:23:20', 18);
INSERT INTO `knowledge_points` VALUES (231, 'test1', NULL, '算法', 0.00, 'MEDIUM', 6, 0, 'ACTIVE', 1, '2025-11-11 11:45:43', '2025-11-11 11:45:43', NULL);

SET FOREIGN_KEY_CHECKS = 1;
