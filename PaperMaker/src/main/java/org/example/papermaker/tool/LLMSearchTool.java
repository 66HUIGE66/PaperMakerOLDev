package org.example.papermaker.tool;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * LLM搜索工具 - 使用远程MCP必应搜索服务
 * 通过ModelScope托管的Bing CN MCP服务进行中文搜索
 */
@Slf4j
@Component("llmSearchTool")

public class LLMSearchTool {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    // MCP Bing搜索服务URL
    private static final String MCP_BING_URL = "https://mcp.api-inference.modelscope.net/846558ba3f8442/mcp";
    private static final String MCP_AUTH_TOKEN = "Bearer ms-d891b702-e8bb-4338-a418-dc1e02ce1cdf";

    public LLMSearchTool() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(60))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 搜索学习资源，包括视频教程和文章
     * 使用MCP必应搜索服务获取中文学习资源
     * 
     * @param query 搜索关键词，例如 "Python编程教程"
     * @return 格式化的学习资源列表
     */
    @Tool("搜索学习资源，包括视频教程和文章，返回相关的学习材料链接。每个学习阶段都必须调用此工具搜索真实的网络学习资源。")
    public String searchLearningResources(@P("搜索关键词，例如'高中数学导数'、'Python入门教程'") String query) {
        try {
            return searchWithMcpBing(query);
        } catch (Exception e) {
            log.error("MCP Bing搜索失败: {}", e.getMessage(), e);
            return String.format("搜索'%s'时出现错误，请稍后重试。", query);
        }
    }

    /**
     * 使用MCP Bing搜索服务
     */
    private String searchWithMcpBing(String query) throws Exception {
        log.info("开始使用MCP Bing搜索学习资源: {}", query);

        // 构建MCP JSON-RPC请求
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("jsonrpc", "2.0");
        requestBody.put("id", System.currentTimeMillis());
        requestBody.put("method", "tools/call");

        ObjectNode params = objectMapper.createObjectNode();
        params.put("name", "bing_search");

        ObjectNode arguments = objectMapper.createObjectNode();
        arguments.put("query", query + " 教程 学习资源");
        arguments.put("num_results", 5);
        params.set("arguments", arguments);

        requestBody.set("params", params);

        String requestJson = objectMapper.writeValueAsString(requestBody);
        log.debug("MCP请求: {}", requestJson);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(MCP_BING_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", MCP_AUTH_TOKEN)
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        log.debug("MCP响应状态: {}, 内容: {}", response.statusCode(), response.body());

        if (response.statusCode() != 200) {
            log.error("MCP Bing搜索请求返回非200状态码: {} - {}", response.statusCode(), response.body());
            throw new RuntimeException("MCP API error: " + response.statusCode());
        }

        // 解析MCP JSON-RPC响应
        JsonNode root = objectMapper.readTree(response.body());

        // 检查错误
        if (root.has("error")) {
            String errorMsg = root.path("error").path("message").asText();
            log.error("MCP返回错误: {}", errorMsg);
            throw new RuntimeException("MCP error: " + errorMsg);
        }

        // 获取结果
        JsonNode result = root.path("result");
        JsonNode content = result.path("content");

        if (!content.isArray() || content.isEmpty()) {
            return String.format("未找到关于'%s'的学习资源，建议尝试更具体的关键词。", query);
        }

        // 解析搜索结果文本
        String resultText = "";
        for (JsonNode item : content) {
            if ("text".equals(item.path("type").asText())) {
                resultText = item.path("text").asText();
                break;
            }
        }

        if (resultText.isEmpty()) {
            return String.format("未找到关于'%s'的学习资源，建议尝试更具体的关键词。", query);
        }

        // 尝试解析为JSON格式的搜索结果
        List<String> resources = new ArrayList<>();
        try {
            JsonNode searchResults = objectMapper.readTree(resultText);
            if (searchResults.isArray()) {
                int count = 0;
                for (JsonNode item : searchResults) {
                    if (count >= 4)
                        break;

                    String title = item.path("title").asText();
                    String url = item.path("link").asText();
                    String snippet = item.path("snippet").asText();

                    if (!title.isEmpty() && !url.isEmpty()) {
                        String icon = getResourceIcon(title, url);
                        String snippetText = snippet.length() > 80 ? snippet.substring(0, 80) + "..." : snippet;
                        resources.add(String.format("%s %s\n   %s\n   链接: %s", icon, title, snippetText, url));
                        count++;
                    }
                }
            }
        } catch (Exception e) {
            // 如果不是JSON，直接返回原始文本
            log.debug("结果不是JSON格式，返回原始文本");
            return resultText;
        }

        if (resources.isEmpty()) {
            return resultText; // 返回原始结果文本
        }

        StringBuilder resultStr = new StringBuilder();
        for (String resource : resources) {
            resultStr.append(resource).append("\n\n");
        }

        log.info("MCP Bing搜索完成，找到 {} 个资源", resources.size());
        return resultStr.toString();
    }

    /**
     * 根据标题和URL判断资源类型图标
     */
    private String getResourceIcon(String title, String url) {
        if (url.contains("bilibili") || url.contains("youtube") ||
                url.contains("video") || title.contains("视频")) {
            return "▶️";
        } else if (url.contains("doc") || url.contains("docs") ||
                title.contains("文档") || title.contains("教程")) {
            return "📝";
        }
        return "📖";
    }
}
