package org.example.papermaker.service;

import org.example.papermaker.entity.SubjectEntity;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 学科名称与ID的统一映射工具
 * 支持从数据库动态加载学科数据
 */
public final class SubjectMapping {

    private static final Map<Long, String> ID_TO_NAME = new ConcurrentHashMap<>();
    private static final Map<String, Long> NAME_TO_ID = new ConcurrentHashMap<>();
    private static final Map<Long, List<String>> ID_TO_KEYWORDS = new ConcurrentHashMap<>();
    
    private static volatile boolean isInitialized = false;

    static {
        // 初始化默认数据（兜底方案）
        initDefaultMapping();
    }

    private SubjectMapping() {}
    
    /**
     * 初始化默认映射（兜底方案）
     */
    private static void initDefaultMapping() {
        // 清空现有映射
        ID_TO_NAME.clear();
        NAME_TO_ID.clear();
        ID_TO_KEYWORDS.clear();
        
        // 主名称
        ID_TO_NAME.put(1L, "物理");
        ID_TO_NAME.put(2L, "数学");
        ID_TO_NAME.put(3L, "化学");
        ID_TO_NAME.put(4L, "生物");
        ID_TO_NAME.put(5L, "计算机科学");
        ID_TO_NAME.put(6L, "Java编程");
        ID_TO_NAME.put(7L, "Python编程");
        ID_TO_NAME.put(8L, "JavaScript编程");

        // 主名称 -> ID
        for (Map.Entry<Long, String> e : ID_TO_NAME.entrySet()) {
            NAME_TO_ID.put(normalize(e.getValue()), e.getKey());
        }

        // 别名
        addAliases(5L, Arrays.asList("计算机", "计算机学科", "信息技术", "信息学", "Computer", "CS", "计算机基础"));
        addAliases(6L, Arrays.asList("Java", "JAVA", "Java语言", "Java SE", "Java编程语言"));
        addAliases(7L, Arrays.asList("Python", "PY", "Python语言"));
        addAliases(8L, Arrays.asList("JavaScript", "JS", "前端", "ECMAScript"));
        
        // 关键词
        ID_TO_KEYWORDS.put(1L, Arrays.asList("力", "热", "光", "电", "磁", "能量", "速度", "加速度", "质量", "电流", "电压", "电阻", "功率"));
        ID_TO_KEYWORDS.put(2L, Arrays.asList("函数", "方程", "数列", "几何", "概率", "统计", "导数", "积分", "三角", "向量"));
        ID_TO_KEYWORDS.put(3L, Arrays.asList("原子", "分子", "元素", "化合物", "酸", "碱", "氧化", "还原", "浓度", "溶液"));
        ID_TO_KEYWORDS.put(4L, Arrays.asList("细胞", "基因", "遗传", "进化", "生态", "酶", "光合", "呼吸", "代谢", "激素"));
        ID_TO_KEYWORDS.put(5L, Arrays.asList("计算机", "操作系统", "网络", "数据库", "数据结构", "算法", "编译", "内存", "CPU", "线程", "进程", "TCP", "HTTP", "Linux"));
        ID_TO_KEYWORDS.put(6L, Arrays.asList("Java", "JVM", "集合", "泛型", "并发", "Spring", "JDBC", "JPA", "注解"));
        ID_TO_KEYWORDS.put(7L, Arrays.asList("Python", "列表", "字典", "迭代器", "生成器", "装饰器", "Pandas", "NumPy"));
        ID_TO_KEYWORDS.put(8L, Arrays.asList("JavaScript", "DOM", "事件", "ES6", "Promise", "异步", "原型", "闭包"));
    }
    
    /**
     * 从数据库加载学科映射（关键词从知识点表获取）
     */
    public static synchronized void loadFromDatabase(List<SubjectEntity> subjects, 
            org.example.papermaker.service.KnowledgePointService knowledgePointService) {
        if (subjects == null || subjects.isEmpty()) {
            System.out.println("警告: 数据库学科数据为空，使用默认映射");
            return;
        }
        
        // 清空现有映射
        ID_TO_NAME.clear();
        NAME_TO_ID.clear();
        ID_TO_KEYWORDS.clear();
        
        System.out.println("=== 开始从数据库加载学科映射 ===");
        
        for (SubjectEntity subject : subjects) {
            Long id = subject.getId();
            String name = subject.getName();
            
            // 主名称映射
            ID_TO_NAME.put(id, name);
            NAME_TO_ID.put(normalize(name), id);
            System.out.println("加载学科: " + id + " -> " + name);
            
            // 从知识点表获取关键词
            try {
                List<org.example.papermaker.entity.KnowledgePointEntity> knowledgePoints = 
                        knowledgePointService.getBySubject(name);
                List<String> keywords = knowledgePoints.stream()
                        .map(org.example.papermaker.entity.KnowledgePointEntity::getName)
                        .collect(java.util.stream.Collectors.toList());
                
                if (!keywords.isEmpty()) {
                    ID_TO_KEYWORDS.put(id, keywords);
                    System.out.println("  从知识点表加载关键词数量: " + keywords.size());
                } else {
                    // 如果知识点表没有数据，使用默认关键词（兜底）
                    List<String> defaultKeywords = getDefaultKeywords(id);
                    if (!defaultKeywords.isEmpty()) {
                        ID_TO_KEYWORDS.put(id, defaultKeywords);
                        System.out.println("  使用默认关键词数量: " + defaultKeywords.size() + " (知识点表暂无数据)");
                    }
                }
            } catch (Exception e) {
                System.err.println("  警告: 加载知识点关键词失败: " + e.getMessage());
                // 使用默认关键词作为兜底
                List<String> defaultKeywords = getDefaultKeywords(id);
                if (!defaultKeywords.isEmpty()) {
                    ID_TO_KEYWORDS.put(id, defaultKeywords);
                }
            }
        }
        
        isInitialized = true;
        System.out.println("=== 学科映射加载完成，共 " + subjects.size() + " 个学科 ===");
    }
    
    /**
     * 获取默认关键词（兜底方案）
     */
    private static List<String> getDefaultKeywords(Long id) {
        if (id == null) return Collections.emptyList();
        
        switch (id.intValue()) {
            case 1:
                return Arrays.asList("力", "热", "光", "电", "磁", "能量", "速度", "加速度", "质量", "电流", "电压", "电阻", "功率");
            case 2:
                return Arrays.asList("函数", "方程", "数列", "几何", "概率", "统计", "导数", "积分", "三角", "向量");
            case 3:
                return Arrays.asList("原子", "分子", "元素", "化合物", "酸", "碱", "氧化", "还原", "浓度", "溶液");
            case 4:
                return Arrays.asList("细胞", "基因", "遗传", "进化", "生态", "酶", "光合", "呼吸", "代谢", "激素");
            case 5:
                return Arrays.asList("计算机", "操作系统", "网络", "数据库", "数据结构", "算法", "编译", "内存", "CPU", "线程", "进程", "TCP", "HTTP", "Linux");
            case 6:
                return Arrays.asList("Java", "JVM", "集合", "泛型", "并发", "Spring", "JDBC", "JPA", "注解");
            case 7:
                return Arrays.asList("Python", "列表", "字典", "迭代器", "生成器", "装饰器", "Pandas", "NumPy");
            case 8:
                return Arrays.asList("JavaScript", "DOM", "事件", "ES6", "Promise", "异步", "原型", "闭包");
            default:
                return Collections.emptyList();
        }
    }

    private static void addAliases(Long id, List<String> names) {
        for (String n : names) {
            if (n != null && !n.trim().isEmpty()) {
                NAME_TO_ID.put(normalize(n), id);
            }
        }
    }

    private static String normalize(String s) {
        return s == null ? "" : s.trim().toLowerCase(Locale.ROOT);
    }

    /** 名称(含别名) -> ID，找不到返回null */
    public static Long nameToId(String name) {
        if (name == null) return null;
        return NAME_TO_ID.getOrDefault(normalize(name), null);
    }

    /** ID -> 名称，找不到返回null */
    public static String idToName(Long id) {
        if (id == null) return null;
        return ID_TO_NAME.getOrDefault(id, null);
    }
    
    /** ID -> 关键词列表 */
    public static List<String> getKeywords(Long id) {
        if (id == null) return Collections.emptyList();
        return ID_TO_KEYWORDS.getOrDefault(id, Collections.emptyList());
    }
    
    /** 是否已从数据库初始化 */
    public static boolean isInitialized() {
        return isInitialized;
    }
    
    /** 获取所有学科ID */
    public static Set<Long> getAllSubjectIds() {
        return new HashSet<>(ID_TO_NAME.keySet());
    }
    
    /** 获取所有学科名称 */
    public static Collection<String> getAllSubjectNames() {
        return ID_TO_NAME.values();
    }
}


