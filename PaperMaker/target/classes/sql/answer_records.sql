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

 Date: 11/11/2025 16:56:55
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_exam_record`(`exam_record_id` ASC) USING BTREE,
  INDEX `idx_question_id`(`question_id` ASC) USING BTREE,
  INDEX `idx_answer_records_qtype`(`question_type` ASC) USING BTREE,
  CONSTRAINT `answer_records_ibfk_1` FOREIGN KEY (`exam_record_id`) REFERENCES `exam_records` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `answer_records_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 302 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '答题记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of answer_records
-- ----------------------------
INSERT INTO `answer_records` VALUES (28, 14, 61, '归并排序', 0, 0, '2025-10-22 14:19:25', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (29, 14, 59, 'implements', 0, 0, '2025-10-22 14:19:25', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (30, 14, 65, '请求成功', 1, 0, '2025-10-22 14:19:25', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (31, 14, 60, '队列', 1, 0, '2025-10-22 14:19:25', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (32, 14, 58, '以上都是', 1, 0, '2025-10-22 14:19:25', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (44, 16, 111, 'A. 折射角大于入射角', 0, 0, '2025-10-22 15:47:48', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (45, 16, 107, 'C. E = kQ/r³', 0, 0, '2025-10-22 15:47:48', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (46, 16, 106, '', 0, 0, '2025-10-22 15:47:48', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (47, 16, 80, '', 0, 0, '2025-10-22 15:47:48', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (48, 16, 77, '', 0, 0, '2025-10-22 15:47:48', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (49, 16, 112, '', 0, 0, '2025-10-22 15:47:48', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (50, 16, 104, '', 0, 0, '2025-10-22 15:47:48', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (51, 16, 105, '', 0, 0, '2025-10-22 15:47:48', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (52, 16, 113, '', 0, 0, '2025-10-22 15:47:48', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (53, 16, 102, 'C. 物体不受力时保持静止或匀速直线运动', 1, 0, '2025-10-22 15:47:48', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (54, 16, 76, '牛顿', 1, 0, '2025-10-22 15:47:48', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (87, 19, 106, '', 0, 0, '2025-10-29 16:01:10', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (88, 19, 102, '', 0, 0, '2025-10-29 16:01:10', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (89, 19, 76, '', 0, 0, '2025-10-29 16:01:10', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (90, 19, 111, '', 0, 0, '2025-10-29 16:01:10', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (91, 19, 112, '', 0, 0, '2025-10-29 16:01:10', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (92, 19, 105, '', 0, 0, '2025-10-29 16:01:10', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (93, 19, 113, '', 0, 0, '2025-10-29 16:01:10', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (94, 19, 77, '', 0, 0, '2025-10-29 16:01:10', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (95, 19, 107, '', 0, 0, '2025-10-29 16:01:10', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (96, 19, 80, '', 0, 0, '2025-10-29 16:01:10', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (97, 19, 103, '', 0, 0, '2025-10-29 16:01:10', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (98, 19, 78, '', 0, 0, '2025-10-29 16:01:10', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (99, 19, 108, '', 0, 0, '2025-10-29 16:01:10', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (100, 19, 110, '', 0, 0, '2025-10-29 16:01:10', 'FILL_BLANK');
INSERT INTO `answer_records` VALUES (101, 19, 109, '电磁感应', 1, 0, '2025-10-29 16:01:10', 'FILL_BLANK');
INSERT INTO `answer_records` VALUES (119, 21, 113, '', 0, 0, '2025-10-29 17:05:55', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (120, 21, 111, '', 0, 0, '2025-10-29 17:05:55', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (121, 21, 105, '', 0, 0, '2025-10-29 17:05:55', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (122, 21, 77, '', 0, 0, '2025-10-29 17:05:55', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (123, 21, 102, '', 0, 0, '2025-10-29 17:05:55', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (124, 21, 80, '', 0, 0, '2025-10-29 17:05:55', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (125, 21, 112, '', 0, 0, '2025-10-29 17:05:55', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (126, 21, 107, '', 0, 0, '2025-10-29 17:05:55', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (127, 21, 104, '', 0, 0, '2025-10-29 17:05:55', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (128, 21, 76, '', 0, 0, '2025-10-29 17:05:55', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (129, 21, 106, '', 0, 0, '2025-10-29 17:05:55', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (130, 21, 108, '', 0, 0, '2025-10-29 17:05:55', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (131, 21, 103, '', 0, 0, '2025-10-29 17:05:55', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (132, 21, 78, '', 0, 0, '2025-10-29 17:05:55', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (133, 21, 110, '', 0, 0, '2025-10-29 17:05:55', 'FILL_BLANK');
INSERT INTO `answer_records` VALUES (134, 21, 109, '', 0, 0, '2025-10-29 17:05:55', 'FILL_BLANK');
INSERT INTO `answer_records` VALUES (135, 21, 79, '惯性是物体保持静止或匀速直线运动状态的性质。', 0, 0, '2025-10-29 17:05:55', 'SHORT_ANSWER');
INSERT INTO `answer_records` VALUES (150, 24, 62, '[\"原子性\",\"一致性\",\"隔离性\",\"持久性\"]', 1, 0, '2025-10-30 09:21:39', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (151, 24, 57, '', 0, 0, '2025-10-30 09:21:39', 'SHORT_ANSWER');
INSERT INTO `answer_records` VALUES (152, 24, 60, '', 0, 0, '2025-10-30 09:21:39', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (153, 24, 59, '', 0, 0, '2025-10-30 09:21:39', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (154, 24, 58, '', 0, 0, '2025-10-30 09:21:39', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (155, 24, 56, '', 0, 0, '2025-10-30 09:21:39', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (156, 24, 67, '', 0, 0, '2025-10-30 09:21:39', 'SHORT_ANSWER');
INSERT INTO `answer_records` VALUES (157, 25, 62, '[\"持久性\",\"隔离性\",\"一致性\",\"原子性\"]', 0, 0, '2025-10-30 16:59:30', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (158, 25, 57, '', 0, 0, '2025-10-30 16:59:30', 'SHORT_ANSWER');
INSERT INTO `answer_records` VALUES (159, 25, 60, '', 0, 0, '2025-10-30 16:59:30', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (160, 25, 59, '', 0, 0, '2025-10-30 16:59:30', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (161, 25, 58, '', 0, 0, '2025-10-30 16:59:30', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (162, 25, 56, '', 0, 0, '2025-10-30 16:59:30', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (163, 25, 67, '', 0, 0, '2025-10-30 16:59:30', 'SHORT_ANSWER');
INSERT INTO `answer_records` VALUES (251, 33, 784, '', 0, 0, '2025-11-05 14:12:16', 'SHORT_ANSWER');
INSERT INTO `answer_records` VALUES (252, 33, 721, 'MyISAM', 1, 0, '2025-11-05 14:12:16', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (253, 33, 736, 'MyISAM', 0, 0, '2025-11-05 14:12:16', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (254, 33, 734, '可重复读', 0, 0, '2025-11-05 14:12:16', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (255, 33, 733, 'REMOVE INDEX', 0, 0, '2025-11-05 14:12:16', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (256, 33, 716, '全文索引', 1, 0, '2025-11-05 14:12:16', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (257, 33, 767, '正确', 0, 0, '2025-11-05 14:12:16', 'TRUE_FALSE');
INSERT INTO `answer_records` VALUES (258, 33, 779, 'redolog', 0, 0, '2025-11-05 14:12:16', 'FILL_BLANK');
INSERT INTO `answer_records` VALUES (259, 33, 774, 'innodb', 0, 0, '2025-11-05 14:12:16', 'FILL_BLANK');
INSERT INTO `answer_records` VALUES (260, 33, 777, '最左匹配', 0, 0, '2025-11-05 14:12:16', 'FILL_BLANK');
INSERT INTO `answer_records` VALUES (261, 33, 744, '[\"B+树索引\",\"位图索引\",\"空间索引\"]', 0, 0, '2025-11-05 14:12:16', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (262, 33, 745, '[\"ALTER TABLE\",\"CREATE TABLE\",\"INSERT\",\"DROP DATABASE\"]', 0, 0, '2025-11-05 14:12:16', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (263, 33, 746, '[\"索引可以提高查询效率，但会降低插入、更新、删除的效率\",\"一个表可以创建多个索引\",\"主键索引一定是唯一索引\"]', 0, 0, '2025-11-05 14:12:16', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (264, 33, 756, '[\"INT\",\"VARCHAR\",\"FLOAT\",\"DATE\",\"DECIMAL\"]', 0, 0, '2025-11-05 14:12:16', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (265, 33, 743, '[\"串行化（SERIALIZABLE）\",\"可重复读（REPEATABLE READ）\"]', 0, 0, '2025-11-05 14:12:16', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (266, 33, 755, '', 0, 0, '2025-11-05 14:12:16', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (267, 33, 790, '', 0, 0, '2025-11-05 14:12:16', 'SHORT_ANSWER');
INSERT INTO `answer_records` VALUES (268, 33, 763, '错误', 1, 0, '2025-11-05 14:12:16', 'TRUE_FALSE');
INSERT INTO `answer_records` VALUES (269, 34, 784, '', 0, 0, '2025-11-07 19:04:45', 'SHORT_ANSWER');
INSERT INTO `answer_records` VALUES (270, 34, 721, '', 0, 0, '2025-11-07 19:04:45', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (271, 34, 736, '', 0, 0, '2025-11-07 19:04:45', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (272, 34, 734, '', 0, 0, '2025-11-07 19:04:45', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (273, 34, 733, '', 0, 0, '2025-11-07 19:04:45', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (274, 34, 716, '', 0, 0, '2025-11-07 19:04:45', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (275, 34, 767, '', 0, 0, '2025-11-07 19:04:45', 'TRUE_FALSE');
INSERT INTO `answer_records` VALUES (276, 34, 779, '', 0, 0, '2025-11-07 19:04:45', 'FILL_BLANK');
INSERT INTO `answer_records` VALUES (277, 34, 774, '', 0, 0, '2025-11-07 19:04:45', 'FILL_BLANK');
INSERT INTO `answer_records` VALUES (278, 34, 777, '', 0, 0, '2025-11-07 19:04:45', 'FILL_BLANK');
INSERT INTO `answer_records` VALUES (279, 34, 744, '', 0, 0, '2025-11-07 19:04:45', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (280, 34, 745, '', 0, 0, '2025-11-07 19:04:45', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (281, 34, 746, '', 0, 0, '2025-11-07 19:04:45', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (282, 34, 756, '', 0, 0, '2025-11-07 19:04:45', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (283, 34, 743, '[\"读已提交（READ COMMITTED）\",\"读未提交（READ UNCOMMITTED）\",\"可重复读（REPEATABLE READ）\"]', 0, 0, '2025-11-07 19:04:45', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (284, 34, 755, '', 0, 0, '2025-11-07 19:04:45', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (285, 34, 790, '', 0, 0, '2025-11-07 19:04:45', 'SHORT_ANSWER');
INSERT INTO `answer_records` VALUES (286, 34, 763, '', 0, 0, '2025-11-07 19:04:45', 'TRUE_FALSE');
INSERT INTO `answer_records` VALUES (287, 35, 665, '[\"封装\",\"继承\",\"多态\"]', 0, 0, '2025-11-11 09:15:27', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (288, 35, 659, '[\"do-while循环\",\"while循环\",\"for循环\"]', 1, 0, '2025-11-11 09:15:27', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (289, 35, 711, '', 0, 0, '2025-11-11 09:15:27', 'SHORT_ANSWER');
INSERT INTO `answer_records` VALUES (290, 35, 686, '', 0, 0, '2025-11-11 09:15:27', 'FILL_BLANK');
INSERT INTO `answer_records` VALUES (291, 35, 691, '', 0, 0, '2025-11-11 09:15:27', 'FILL_BLANK');
INSERT INTO `answer_records` VALUES (292, 35, 645, 'catch块可捕获所有类型的异常（用Exception）', 0, 0, '2025-11-11 09:15:27', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (293, 35, 693, '正确', 1, 0, '2025-11-11 09:15:27', 'TRUE_FALSE');
INSERT INTO `answer_records` VALUES (294, 35, 701, '错误', 0, 0, '2025-11-11 09:15:27', 'TRUE_FALSE');
INSERT INTO `answer_records` VALUES (295, 35, 677, '[\"ConcurrentHashMap是线程安全的HashMap\",\"ConcurrentLinkedQueue是线程安全的队列，基于链表实现\",\"BlockingQueue支持阻塞的插入和移除操作（如take()、put()）\",\"并发集合的效率比普通集合（加同步锁）低\"]', 0, 0, '2025-11-11 09:15:27', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (296, 35, 668, '[\"Map接口用于存储键值对（Key-Value）\",\"List接口的实现类有序、可重复\",\"Set接口的实现类无序、不可重复\"]', 0, 0, '2025-11-11 09:15:27', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (297, 35, 673, '[\"HashMap的默认初始容量为16，Hashtable为11\",\"HashMap的负载因子为0.75，Hashtable为0.75\",\"HashMap底层（JDK8后）是数组+链表+红黑树，Hashtable是数组+链表\"]', 0, 0, '2025-11-11 09:15:27', 'MULTIPLE_CHOICE');
INSERT INTO `answer_records` VALUES (298, 35, 648, 'HashMap是线程安全的', 1, 0, '2025-11-11 09:15:27', 'SINGLE_CHOICE');
INSERT INTO `answer_records` VALUES (299, 35, 685, '', 0, 0, '2025-11-11 09:15:27', 'FILL_BLANK');
INSERT INTO `answer_records` VALUES (300, 35, 704, '错误', 1, 0, '2025-11-11 09:15:27', 'TRUE_FALSE');
INSERT INTO `answer_records` VALUES (301, 35, 653, 'LinkedHashMap是线程安全的', 0, 0, '2025-11-11 09:15:27', 'SINGLE_CHOICE');

SET FOREIGN_KEY_CHECKS = 1;
