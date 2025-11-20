package org.example.papermaker.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.example.papermaker.service.SubjectMapping;

import java.util.List;
import java.util.Map;

/**
 * 数据迁移：更新现有规则的 subject_id 字段
 * 根据 ruleConfig JSON 中的 subject 字段进行映射
 */
@Component
@Order(3)  // 在 DatabaseInitializer 和 SubjectMappingInitializer 之后执行
public class SubjectIdMigration implements ApplicationRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        System.out.println("========================================");
        System.out.println("开始迁移规则的 subject_id 字段...");
        System.out.println("========================================");
        
        try {
            // 检查 subject_id 字段是否存在
            String checkColumnSql = "SHOW COLUMNS FROM exam_rules LIKE 'subject_id'";
            var result = jdbcTemplate.queryForList(checkColumnSql);
            
            if (result.isEmpty()) {
                System.out.println("subject_id 字段不存在，先添加字段...");
                String addColumnSql = "ALTER TABLE exam_rules ADD COLUMN subject_id BIGINT COMMENT '所属学科ID', ADD INDEX idx_subject_id (subject_id)";
                jdbcTemplate.execute(addColumnSql);
                System.out.println("subject_id 字段添加成功");
            } else {
                System.out.println("subject_id 字段已存在");
            }
            
            // 查询所有规则
            String selectSql = "SELECT id, name, rule_config FROM exam_rules WHERE rule_config IS NOT NULL";
            List<Map<String, Object>> rules = jdbcTemplate.queryForList(selectSql);
            
            System.out.println("找到 " + rules.size() + " 条规则需要更新");
            
            int updatedCount = 0;
            int skippedCount = 0;
            
            for (Map<String, Object> rule : rules) {
                Long ruleId = ((Number) rule.get("id")).longValue();
                String ruleName = (String) rule.get("name");
                String ruleConfig = (String) rule.get("rule_config");
                
                if (ruleConfig == null || ruleConfig.trim().isEmpty()) {
                    skippedCount++;
                    continue;
                }
                
                // 尝试从 ruleConfig 中提取 subject
                Long subjectId = extractSubjectId(ruleConfig);
                
                if (subjectId != null) {
                    // 更新 subject_id
                    String updateSql = "UPDATE exam_rules SET subject_id = ? WHERE id = ?";
                    jdbcTemplate.update(updateSql, subjectId, ruleId);
                    
                    String subjectName = SubjectMapping.idToName(subjectId);
                    System.out.println("  更新规则 [" + ruleName + "] -> 学科: " + subjectName + " (ID: " + subjectId + ")");
                    updatedCount++;
                } else {
                    System.out.println("  跳过规则 [" + ruleName + "] - 无法识别学科");
                    skippedCount++;
                }
            }
            
            System.out.println("\n迁移完成:");
            System.out.println("  - 成功更新: " + updatedCount + " 条");
            System.out.println("  - 跳过: " + skippedCount + " 条");
            
            // 显示统计信息
            showStatistics();
            
        } catch (Exception e) {
            System.err.println("迁移失败: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("========================================");
    }
    
    /**
     * 从 ruleConfig JSON 中提取学科ID
     */
    private Long extractSubjectId(String ruleConfig) {
        if (ruleConfig == null || ruleConfig.trim().isEmpty()) {
            return null;
        }
        
        String config = ruleConfig.toLowerCase();
        
        // 物理 (id=1)
        if (config.contains("\"subject\":\"物理\"") || 
            config.contains("\"subject\":\"物理学\"") ||
            config.contains("\"subject\":\"physics\"")) {
            return 1L;
        }
        
        // 数学 (id=2)
        if (config.contains("\"subject\":\"数学\"") ||
            config.contains("\"subject\":\"mathematics\"") ||
            config.contains("\"subject\":\"math\"")) {
            return 2L;
        }
        
        // 化学 (id=3)
        if (config.contains("\"subject\":\"化学\"") ||
            config.contains("\"subject\":\"chemistry\"")) {
            return 3L;
        }
        
        // 生物 (id=4)
        if (config.contains("\"subject\":\"生物\"") ||
            config.contains("\"subject\":\"生物学\"") ||
            config.contains("\"subject\":\"biology\"")) {
            return 4L;
        }
        
        // 计算机科学 (id=5)
        if (config.contains("\"subject\":\"计算机科学\"") ||
            config.contains("\"subject\":\"计算机\"") ||
            config.contains("\"subject\":\"计算机学科\"") ||
            config.contains("\"subject\":\"信息技术\"") ||
            config.contains("\"subject\":\"信息学\"") ||
            config.contains("\"subject\":\"computer\"") ||
            config.contains("\"subject\":\"cs\"") ||
            config.contains("\"subject\":\"计算机基础\"")) {
            return 5L;
        }
        
        // Java编程 (id=6)
        if (config.contains("\"subject\":\"java编程\"") ||
            config.contains("\"subject\":\"java\"") ||
            config.contains("\"subject\":\"java语言\"") ||
            config.contains("\"subject\":\"java se\"") ||
            config.contains("\"subject\":\"java编程语言\"")) {
            return 6L;
        }
        
        // Python编程 (id=7)
        if (config.contains("\"subject\":\"python编程\"") ||
            config.contains("\"subject\":\"python\"") ||
            config.contains("\"subject\":\"py\"") ||
            config.contains("\"subject\":\"python语言\"")) {
            return 7L;
        }
        
        // JavaScript编程 (id=8)
        if (config.contains("\"subject\":\"javascript编程\"") ||
            config.contains("\"subject\":\"javascript\"") ||
            config.contains("\"subject\":\"js\"") ||
            config.contains("\"subject\":\"前端\"") ||
            config.contains("\"subject\":\"ecmascript\"")) {
            return 8L;
        }
        
        return null;
    }
    
    /**
     * 显示统计信息
     */
    private void showStatistics() {
        try {
            String statsSql = "SELECT subject_id, COUNT(*) as count FROM exam_rules GROUP BY subject_id";
            List<Map<String, Object>> stats = jdbcTemplate.queryForList(statsSql);
            
            System.out.println("\n学科分布统计:");
            for (Map<String, Object> stat : stats) {
                Object subjectIdObj = stat.get("subject_id");
                Long count = ((Number) stat.get("count")).longValue();
                
                String subjectName;
                if (subjectIdObj == null) {
                    subjectName = "未分类";
                } else {
                    Long subjectId = ((Number) subjectIdObj).longValue();
                    subjectName = SubjectMapping.idToName(subjectId);
                    if (subjectName == null) {
                        subjectName = "未知学科(ID:" + subjectId + ")";
                    }
                }
                
                System.out.println("  - " + subjectName + ": " + count + " 条规则");
            }
        } catch (Exception e) {
            System.err.println("显示统计信息失败: " + e.getMessage());
        }
    }
}





































