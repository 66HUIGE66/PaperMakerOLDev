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

 Date: 11/11/2025 16:57:32
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
) ENGINE = InnoDB AUTO_INCREMENT = 1700 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '试卷题目关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of exam_paper_questions
-- ----------------------------
INSERT INTO `exam_paper_questions` VALUES (1272, 84, 112, 2, 6, '2025-10-11 08:59:03');
INSERT INTO `exam_paper_questions` VALUES (1273, 84, 77, 1, 6, '2025-10-11 08:59:03');
INSERT INTO `exam_paper_questions` VALUES (1274, 84, 106, 3, 6, '2025-10-11 08:59:03');
INSERT INTO `exam_paper_questions` VALUES (1277, 84, 111, 4, 5, '2025-10-11 08:59:03');
INSERT INTO `exam_paper_questions` VALUES (1278, 84, 105, 5, 5, '2025-10-11 08:59:03');
INSERT INTO `exam_paper_questions` VALUES (1281, 84, 107, 6, 5, '2025-10-11 08:59:03');
INSERT INTO `exam_paper_questions` VALUES (1283, 84, 76, 7, 5, '2025-10-11 08:59:03');
INSERT INTO `exam_paper_questions` VALUES (1284, 84, 80, 8, 5, '2025-10-11 08:59:03');
INSERT INTO `exam_paper_questions` VALUES (1286, 84, 102, 9, 5, '2025-10-11 08:59:03');
INSERT INTO `exam_paper_questions` VALUES (1287, 84, 113, 10, 5, '2025-10-11 08:59:03');
INSERT INTO `exam_paper_questions` VALUES (1289, 84, 104, 11, 5, '2025-10-11 08:59:03');
INSERT INTO `exam_paper_questions` VALUES (1290, 85, 61, 1, 4, '2025-10-11 09:02:18');
INSERT INTO `exam_paper_questions` VALUES (1291, 85, 59, 2, 4, '2025-10-11 09:02:18');
INSERT INTO `exam_paper_questions` VALUES (1292, 85, 65, 3, 4, '2025-10-11 09:02:18');
INSERT INTO `exam_paper_questions` VALUES (1293, 85, 60, 4, 4, '2025-10-11 09:02:18');
INSERT INTO `exam_paper_questions` VALUES (1294, 85, 58, 5, 4, '2025-10-11 09:02:18');
INSERT INTO `exam_paper_questions` VALUES (1314, 87, 105, 1, 6, '2025-10-11 09:25:16');
INSERT INTO `exam_paper_questions` VALUES (1319, 87, 80, 3, 6, '2025-10-11 09:25:16');
INSERT INTO `exam_paper_questions` VALUES (1321, 87, 102, 4, 6, '2025-10-11 09:25:16');
INSERT INTO `exam_paper_questions` VALUES (1329, 87, 113, 8, 5, '2025-10-11 09:25:16');
INSERT INTO `exam_paper_questions` VALUES (1331, 87, 76, 9, 5, '2025-10-11 09:25:16');
INSERT INTO `exam_paper_questions` VALUES (1339, 87, 107, 13, 5, '2025-10-11 09:25:16');
INSERT INTO `exam_paper_questions` VALUES (1341, 87, 104, 14, 5, '2025-10-11 09:25:16');
INSERT INTO `exam_paper_questions` VALUES (1343, 87, 111, 15, 5, '2025-10-11 09:25:16');
INSERT INTO `exam_paper_questions` VALUES (1345, 87, 106, 16, 5, '2025-10-11 09:25:16');
INSERT INTO `exam_paper_questions` VALUES (1347, 87, 112, 17, 5, '2025-10-11 09:25:16');
INSERT INTO `exam_paper_questions` VALUES (1351, 87, 77, 19, 5, '2025-10-11 09:25:16');
INSERT INTO `exam_paper_questions` VALUES (1598, 138, 113, 2, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1599, 138, 111, 1, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1600, 138, 105, 3, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1601, 138, 77, 4, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1602, 138, 102, 5, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1603, 138, 80, 6, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1604, 138, 112, 7, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1605, 138, 107, 8, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1606, 138, 104, 9, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1607, 138, 76, 10, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1608, 138, 106, 11, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1609, 138, 108, 12, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1610, 138, 103, 13, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1611, 138, 78, 14, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1612, 138, 110, 15, 6, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1613, 138, 109, 16, 5, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1614, 138, 79, 17, 5, '2025-10-29 16:38:46');
INSERT INTO `exam_paper_questions` VALUES (1646, 142, 710, 1, 10, '2025-10-31 21:33:57');
INSERT INTO `exam_paper_questions` VALUES (1647, 142, 711, 2, 9, '2025-10-31 21:33:57');
INSERT INTO `exam_paper_questions` VALUES (1648, 142, 624, 3, 9, '2025-10-31 21:33:57');
INSERT INTO `exam_paper_questions` VALUES (1649, 142, 645, 4, 9, '2025-10-31 21:33:57');
INSERT INTO `exam_paper_questions` VALUES (1650, 142, 693, 5, 9, '2025-10-31 21:33:57');
INSERT INTO `exam_paper_questions` VALUES (1651, 142, 668, 6, 9, '2025-10-31 21:33:57');
INSERT INTO `exam_paper_questions` VALUES (1652, 142, 665, 7, 9, '2025-10-31 21:33:57');
INSERT INTO `exam_paper_questions` VALUES (1653, 142, 691, 8, 9, '2025-10-31 21:33:57');
INSERT INTO `exam_paper_questions` VALUES (1654, 142, 686, 9, 9, '2025-10-31 21:33:57');
INSERT INTO `exam_paper_questions` VALUES (1655, 142, 685, 10, 9, '2025-10-31 21:33:57');
INSERT INTO `exam_paper_questions` VALUES (1656, 142, 701, 11, 9, '2025-10-31 21:33:57');
INSERT INTO `exam_paper_questions` VALUES (1667, 145, 784, 1, 6, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1668, 145, 721, 2, 6, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1669, 145, 736, 3, 6, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1670, 145, 734, 4, 6, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1671, 145, 733, 5, 6, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1672, 145, 716, 6, 6, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1673, 145, 767, 7, 6, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1674, 145, 779, 8, 6, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1675, 145, 774, 9, 6, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1676, 145, 777, 10, 6, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1677, 145, 744, 11, 5, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1678, 145, 745, 12, 5, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1679, 145, 746, 13, 5, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1680, 145, 756, 14, 5, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1681, 145, 743, 15, 5, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1682, 145, 755, 16, 5, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1683, 145, 790, 17, 5, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1684, 145, 763, 18, 5, '2025-11-05 14:07:45');
INSERT INTO `exam_paper_questions` VALUES (1685, 146, 665, 1, 7, '2025-11-11 09:12:12');
INSERT INTO `exam_paper_questions` VALUES (1686, 146, 659, 2, 7, '2025-11-11 09:12:12');
INSERT INTO `exam_paper_questions` VALUES (1687, 146, 711, 4, 7, '2025-11-11 09:12:12');
INSERT INTO `exam_paper_questions` VALUES (1688, 146, 686, 5, 7, '2025-11-11 09:12:12');
INSERT INTO `exam_paper_questions` VALUES (1689, 146, 691, 6, 7, '2025-11-11 09:12:12');
INSERT INTO `exam_paper_questions` VALUES (1690, 146, 645, 3, 7, '2025-11-11 09:12:12');
INSERT INTO `exam_paper_questions` VALUES (1691, 146, 693, 7, 7, '2025-11-11 09:12:12');
INSERT INTO `exam_paper_questions` VALUES (1692, 146, 701, 8, 7, '2025-11-11 09:12:12');
INSERT INTO `exam_paper_questions` VALUES (1693, 146, 677, 9, 7, '2025-11-11 09:12:12');
INSERT INTO `exam_paper_questions` VALUES (1694, 146, 668, 10, 7, '2025-11-11 09:12:13');
INSERT INTO `exam_paper_questions` VALUES (1695, 146, 673, 11, 6, '2025-11-11 09:12:13');
INSERT INTO `exam_paper_questions` VALUES (1696, 146, 648, 12, 6, '2025-11-11 09:12:13');
INSERT INTO `exam_paper_questions` VALUES (1697, 146, 685, 13, 6, '2025-11-11 09:12:13');
INSERT INTO `exam_paper_questions` VALUES (1698, 146, 704, 14, 6, '2025-11-11 09:12:13');
INSERT INTO `exam_paper_questions` VALUES (1699, 146, 653, 15, 6, '2025-11-11 09:12:13');

SET FOREIGN_KEY_CHECKS = 1;
