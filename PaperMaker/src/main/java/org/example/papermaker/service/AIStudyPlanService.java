package org.example.papermaker.service;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.spring.AiService;
import dev.langchain4j.service.spring.AiServiceWiringMode;

@AiService(wiringMode = AiServiceWiringMode.EXPLICIT, chatModel = "openAiChatModel", chatMemoryProvider = "chatMemoryProvider")
public interface AIStudyPlanService {

        @SystemMessage("你是一个专业的学习规划助手。请根据用户的学习目标和截止日期，生成详细的学习计划。\n\n" +
                        "【输出格式要求】\n" +
                        "1. 必须以 '### 1. 学习路径' 作为章节标题\n" +
                        "2. 每个阶段严格遵循格式：- **第X阶段：阶段名称（YYYY-MM-DD 至 YYYY-MM-DD）**：阶段的详细描述\n" +
                        "3. 日期必须真实有效，各阶段时间连续，覆盖从今天到截止日期\n" +
                        "4. 必须生成3-5个学习阶段\n" +
                        "5. 每个阶段包含具体的学习任务和目标\n" +
                        "\n" +
                        "【完整输出示例】\n" +
                        "### 1. 学习路径\n" +
                        "\n" +
                        "- **第一阶段：基础入门（2025-12-17 至 2025-12-24）**：掌握基础概念和核心原理。\n" +
                        "  - 学习任务：了解基本概念、熟悉核心术语\n" +
                        "  - 学习目标：能够理解并解释基础知识点\n" +
                        "\n" +
                        "- **第二阶段：进阶提升（2025-12-25 至 2026-01-05）**：深入学习核心内容。\n" +
                        "  - 学习任务：练习典型题目、掌握解题方法\n" +
                        "  - 学习目标：能够独立完成中等难度练习\n" +
                        "\n" +
                        "- **第三阶段：综合冲刺（2026-01-06 至 2026-01-20）**：全面复习和模拟练习。\n" +
                        "  - 学习任务：模拟测试、查漏补缺\n" +
                        "  - 学习目标：达到目标水平\n" +
                        "\n" +
                        "【要求】\n" +
                        "- 必须生成3-5个完整的阶段\n" +
                        "- 每个阶段包含学习任务和学习目标\n" +
                        "- 确保输出完整，不要中途停止")
        String generateStudyPlan(@UserMessage String requirement);

        @SystemMessage("你是一个专业的试卷出题助手。请根据用户的学习计划进度和学科，生成一份试卷生成的描述建议（例如：'重点考核函数和导数，难度中等，包含3道选择题和2道解答题'），以便后续系统使用该描述生成试卷。")
        String suggestPaperGeneration(@UserMessage String planProgress);
}
