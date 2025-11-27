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

 Date: 11/11/2025 16:58:29
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
) ENGINE = InnoDB AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '组卷规则表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of exam_rules
-- ----------------------------
INSERT INTO `exam_rules` VALUES (8, '物理基础练习规则', '适合物理基础学习的练习规则，包含力学、热学、电学基础概念', 20, 100, 90, '{\r\n  \"subject\": \"物理\",\r\n  \"difficulty\": \"EASY\",\r\n  \"questionTypeDistribution\": {\r\n    \"SINGLE_CHOICE\": 15,\r\n    \"MULTIPLE_CHOICE\": 3,\r\n    \"FILL_BLANK\": 2\r\n  },\r\n  \"difficultyDistribution\": {\r\n    \"EASY\": 0.7,\r\n    \"MEDIUM\": 0.3\r\n  },\r\n  \"knowledgePoints\": {\r\n    \"力学基础\": 0.4,\r\n    \"热学基础\": 0.3,\r\n    \"电学基础\": 0.3\r\n  },\r\n  \"scoreDistribution\": {\r\n    \"SINGLE_CHOICE\": 4,\r\n    \"MULTIPLE_CHOICE\": 6,\r\n    \"FILL_BLANK\": 5\r\n  }\r\n}', 1, 1, 'ACTIVE', '2025-10-09 10:48:29', '2025-10-09 15:51:35', 1);
INSERT INTO `exam_rules` VALUES (9, '物理中等测试规则', '适合物理中等水平测试的规则，涵盖力学、热学、电学、光学', 25, 100, 120, '{\r\n  \"subject\": \"物理\",\r\n  \"difficulty\": \"MEDIUM\",\r\n  \"questionTypeDistribution\": {\r\n    \"SINGLE_CHOICE\": 18,\r\n    \"MULTIPLE_CHOICE\": 4,\r\n    \"FILL_BLANK\": 2,\r\n    \"SHORT_ANSWER\": 1\r\n  },\r\n  \"difficultyDistribution\": {\r\n    \"EASY\": 0.4,\r\n    \"MEDIUM\": 0.5,\r\n    \"HARD\": 0.1\r\n  },\r\n  \"knowledgePoints\": {\r\n    \"力学\": 0.35,\r\n    \"热学\": 0.25,\r\n    \"电学\": 0.25,\r\n    \"光学\": 0.15\r\n  },\r\n  \"scoreDistribution\": {\r\n    \"SINGLE_CHOICE\": 3,\r\n    \"MULTIPLE_CHOICE\": 5,\r\n    \"FILL_BLANK\": 6,\r\n    \"SHORT_ANSWER\": 10\r\n  }\r\n}', 1, 1, 'ACTIVE', '2025-10-09 10:48:29', '2025-10-09 15:43:09', 1);
INSERT INTO `exam_rules` VALUES (10, '物理综合测试规则', '物理学科综合测试规则，包含所有主要知识点', 30, 100, 150, '{\r\n  \"subject\": \"物理\",\r\n  \"difficulty\": \"MEDIUM\",\r\n  \"questionTypeDistribution\": {\r\n    \"SINGLE_CHOICE\": 20,\r\n    \"MULTIPLE_CHOICE\": 5,\r\n    \"FILL_BLANK\": 3,\r\n    \"SHORT_ANSWER\": 2\r\n  },\r\n  \"difficultyDistribution\": {\r\n    \"EASY\": 0.3,\r\n    \"MEDIUM\": 0.5,\r\n    \"HARD\": 0.2\r\n  },\r\n  \"knowledgePoints\": {\r\n    \"力学\": 0.3,\r\n    \"热学\": 0.2,\r\n    \"电学\": 0.25,\r\n    \"光学\": 0.15,\r\n    \"原子物理\": 0.1\r\n  },\r\n  \"scoreDistribution\": {\r\n    \"SINGLE_CHOICE\": 2.5,\r\n    \"MULTIPLE_CHOICE\": 4,\r\n    \"FILL_BLANK\": 5,\r\n    \"SHORT_ANSWER\": 8\r\n  }\r\n}', 1, 1, 'ACTIVE', '2025-10-09 10:48:29', '2025-10-09 15:43:01', 1);
INSERT INTO `exam_rules` VALUES (11, '物理高考模拟规则', '模拟高考物理试卷的组卷规则', 35, 100, 180, '{\r\n  \"subject\": \"物理\",\r\n  \"difficulty\": \"MEDIUM\",\r\n  \"questionTypeDistribution\": {\r\n    \"SINGLE_CHOICE\": 24,\r\n    \"MULTIPLE_CHOICE\": 6,\r\n    \"FILL_BLANK\": 3,\r\n    \"SHORT_ANSWER\": 2\r\n  },\r\n  \"difficultyDistribution\": {\r\n    \"EASY\": 0.25,\r\n    \"MEDIUM\": 0.55,\r\n    \"HARD\": 0.2\r\n  },\r\n  \"knowledgePoints\": {\r\n    \"力学\": 0.35,\r\n    \"热学\": 0.15,\r\n    \"电学\": 0.3,\r\n    \"光学\": 0.1,\r\n    \"原子物理\": 0.1\r\n  },\r\n  \"scoreDistribution\": {\r\n    \"SINGLE_CHOICE\": 2,\r\n    \"MULTIPLE_CHOICE\": 3,\r\n    \"FILL_BLANK\": 4,\r\n    \"SHORT_ANSWER\": 10\r\n  }\r\n}', 1, 1, 'ACTIVE', '2025-10-09 10:48:29', '2025-10-09 15:43:00', 1);
INSERT INTO `exam_rules` VALUES (12, '物理竞赛练习规则', '适合物理竞赛练习的高难度规则', 40, 100, 200, '{\r\n  \"subject\": \"物理\",\r\n  \"difficulty\": \"HARD\",\r\n  \"questionTypeDistribution\": {\r\n    \"SINGLE_CHOICE\": 25,\r\n    \"MULTIPLE_CHOICE\": 8,\r\n    \"FILL_BLANK\": 4,\r\n    \"SHORT_ANSWER\": 3\r\n  },\r\n  \"difficultyDistribution\": {\r\n    \"EASY\": 0.1,\r\n    \"MEDIUM\": 0.4,\r\n    \"HARD\": 0.5\r\n  },\r\n  \"knowledgePoints\": {\r\n    \"力学\": 0.3,\r\n    \"热学\": 0.15,\r\n    \"电学\": 0.25,\r\n    \"光学\": 0.15,\r\n    \"原子物理\": 0.15\r\n  },\r\n  \"scoreDistribution\": {\r\n    \"SINGLE_CHOICE\": 1.5,\r\n    \"MULTIPLE_CHOICE\": 2.5,\r\n    \"FILL_BLANK\": 3,\r\n    \"SHORT_ANSWER\": 8\r\n  }\r\n}', 1, 1, 'ACTIVE', '2025-10-09 10:48:29', '2025-10-09 15:42:59', 1);
INSERT INTO `exam_rules` VALUES (17, '计算机测试卷', '计算机测试卷，包含选择题和简答题', 5, 100, 60, '{\"title\":\"计算机测试卷\",\"description\":\"计算机测试卷，包含选择题和简答题\",\"subject\":\"计算机\",\"totalScore\":100,\"duration\":60,\"questionTypeDistribution\":{\"SINGLE_CHOICE\":1,\"MULTIPLE_CHOICE\":1,\"TRUE_FALSE\":1,\"FILL_BLANK\":1,\"SHORT_ANSWER\":1},\"difficultyDistribution\":{\"EASY\":0.3,\"MEDIUM\":0.5,\"HARD\":0.2},\"knowledgePoints\":[{\"name\":\"计算机基础\",\"weight\":30},{\"name\":\"操作系统\",\"weight\":20},{\"name\":\"计算机网络\",\"weight\":20},{\"name\":\"信息技术应用\",\"weight\":20},{\"name\":\"数据库\",\"weight\":10}],\"specialRequirements\":\"\"}', 1, 1, 'ACTIVE', '2025-10-29 17:33:46', '2025-11-05 17:16:16', 5);
INSERT INTO `exam_rules` VALUES (19, 'Java基础综合测试', '全面检验Java基础知识点，考察学生掌握情况。', 17, 100, 60, '{\"title\":\"Java基础综合测试\",\"description\":\"全面检验Java基础知识点，考察学生掌握情况。\",\"subject\":\"Java\",\"totalScore\":100,\"duration\":60,\"questionTypeDistribution\":{\"SINGLE_CHOICE\":5,\"MULTIPLE_CHOICE\":4,\"TRUE_FALSE\":2,\"FILL_BLANK\":3,\"SHORT_ANSWER\":3},\"difficultyDistribution\":{\"EASY\":0.3,\"MEDIUM\":0.5,\"HARD\":0.2},\"knowledgePoints\":[{\"name\":\"基本数据类型与引用数据类型\",\"weight\":10},{\"name\":\"类的定义\",\"weight\":10},{\"name\":\"算术运算符\",\"weight\":10},{\"name\":\"分支结构\",\"weight\":10},{\"name\":\"方法定义\",\"weight\":10},{\"name\":\"面向对象\",\"weight\":10},{\"name\":\"异常处理\",\"weight\":10},{\"name\":\"集合框架\",\"weight\":10}],\"specialRequirements\":\"全题型覆盖，每题计分合理，考试时间为60分钟。\"}', 1, 1, 'ACTIVE', '2025-10-31 14:18:13', '2025-11-05 17:16:18', 6);
INSERT INTO `exam_rules` VALUES (21, 'MySQL测试卷', '测试学生的MySQL数据库知识', 15, 100, 45, '{\"title\":\"MySQL测试卷\",\"description\":\"测试学生的MySQL数据库知识\",\"subject\":\"MySQL\",\"totalScore\":100,\"duration\":45,\"questionTypeDistribution\":{\"SINGLE_CHOICE\":5,\"MULTIPLE_CHOICE\":5,\"TRUE_FALSE\":1,\"FILL_BLANK\":3,\"SHORT_ANSWER\":1},\"difficultyDistribution\":{\"EASY\":0.2,\"MEDIUM\":0.5,\"HARD\":0.3},\"knowledgePoints\":[{\"name\":\"数据库操作\",\"weight\":30},{\"name\":\"数据类型\",\"weight\":10},{\"name\":\"索引\",\"weight\":20},{\"name\":\"事务\",\"weight\":20},{\"name\":\"查询语句\",\"weight\":10}],\"specialRequirements\":\"确保题目与MySQL数据库特性相关\"}', 6, 0, 'ACTIVE', '2025-11-05 10:11:34', '2025-11-05 10:11:34', NULL);
INSERT INTO `exam_rules` VALUES (22, 'MySQL笔试卷', 'MySQL基础知识与应用测试', 10, 100, 60, '{\"title\":\"MySQL笔试卷\",\"description\":\"MySQL基础知识与应用测试\",\"subject\":\"MySQL\",\"totalScore\":100,\"duration\":60,\"questionTypeDistribution\":{\"SINGLE_CHOICE\":4,\"MULTIPLE_CHOICE\":2,\"TRUE_FALSE\":1,\"FILL_BLANK\":2,\"SHORT_ANSWER\":1},\"difficultyDistribution\":{\"EASY\":0.4,\"MEDIUM\":0.4,\"HARD\":0.2},\"knowledgePoints\":[{\"name\":\"数据库操作\",\"weight\":25},{\"name\":\"查询语句\",\"weight\":25},{\"name\":\"事务\",\"weight\":20},{\"name\":\"索引\",\"weight\":15},{\"name\":\"备份恢复\",\"weight\":15}],\"specialRequirements\":\"无\"}', 6, 0, 'ACTIVE', '2025-11-05 15:35:12', '2025-11-05 15:35:12', NULL);
INSERT INTO `exam_rules` VALUES (23, 'Java笔试卷', 'Java编程能力评估', 15, 100, 60, '{\"title\":\"Java笔试卷\",\"description\":\"Java编程能力评估\",\"subject\":\"Java\",\"totalScore\":100,\"duration\":60,\"questionTypeDistribution\":{\"SINGLE_CHOICE\":5,\"MULTIPLE_CHOICE\":5,\"TRUE_FALSE\":2,\"FILL_BLANK\":2,\"SHORT_ANSWER\":1},\"difficultyDistribution\":{\"EASY\":0.4,\"MEDIUM\":0.4,\"HARD\":0.2},\"knowledgePoints\":[{\"name\":\"基本数据类型与引用数据类型\",\"weight\":20},{\"name\":\"类的定义\",\"weight\":15},{\"name\":\"方法定义\",\"weight\":15},{\"name\":\"数组特性\",\"weight\":15},{\"name\":\"面向对象\",\"weight\":15}],\"specialRequirements\":\"无特殊要求\"}', 5, 0, 'ACTIVE', '2025-11-05 17:20:54', '2025-11-05 22:37:01', 6);
INSERT INTO `exam_rules` VALUES (24, 'Java编程基础测试卷', '测试参与者对于Java编程的基础掌握情况。', 13, 100, 60, '{\"title\":\"Java编程基础测试卷\",\"description\":\"测试参与者对于Java编程的基础掌握情况。\",\"subject\":\"Java\",\"totalScore\":100,\"duration\":60,\"questionTypeDistribution\":{\"SINGLE_CHOICE\":5,\"MULTIPLE_CHOICE\":3,\"TRUE_FALSE\":2,\"FILL_BLANK\":2,\"SHORT_ANSWER\":1},\"difficultyDistribution\":{\"EASY\":0.4,\"MEDIUM\":0.4,\"HARD\":0.2},\"knowledgePoints\":[{\"name\":\"基本数据类型与引用数据类型\",\"weight\":20},{\"name\":\"类的定义\",\"weight\":15},{\"name\":\"循环结构\",\"weight\":15},{\"name\":\"面向对象\",\"weight\":15},{\"name\":\"异常处理\",\"weight\":15}],\"specialRequirements\":\"请确保每道题解释清楚题意，避免歧义。\"}', 6, 0, 'ACTIVE', '2025-11-10 20:40:17', '2025-11-10 21:15:02', 6);

SET FOREIGN_KEY_CHECKS = 1;
