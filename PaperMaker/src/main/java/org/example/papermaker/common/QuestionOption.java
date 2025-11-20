package org.example.papermaker.common;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


/**
 * 题目选项实体类
 * 用于存储选择题的选项信息
 *
 * @author System
 * @since 2.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class QuestionOption {

    /**
     * 选项键（如：A、B、C、D）
     */
    @NotBlank(message = "选项键不能为空")
    @Size(max = 10, message = "选项键长度不能超过10个字符")
    private String key;

    /**
     * 选项内容
     */
    @NotBlank(message = "选项内容不能为空")
    @Size(max = 2000, message = "选项内容长度不能超过2000个字符")
    private String content;

    /**
     * 是否为正确答案
     */
    private Boolean isCorrect = false;

    /**
     * 选项顺序
     */
    private Integer order;

    /**
     * 选项说明（可选）
     */
    @Size(max = 500, message = "选项说明长度不能超过500个字符")
    private String description;

    /**
     * 构造函数
     * @param key 选项键
     * @param content 选项内容
     */
    public QuestionOption(String key, String content) {
        this.key = key;
        this.content = content;
    }

    /**
     * 构造函数
     * @param key 选项键
     * @param content 选项内容
     * @param isCorrect 是否为正确答案
     */
    public QuestionOption(String key, String content, Boolean isCorrect) {
        this.key = key;
        this.content = content;
        this.isCorrect = isCorrect;
    }

    /**
     * 获取格式化的选项显示文本
     * @return 格式化的选项文本
     */
    public String getFormattedText() {
        return this.key + ". " + this.content;
    }

    /**
     * 检查选项是否有效
     * @return 是否有效
     */
    public boolean isValid() {
        return this.key != null && !this.key.trim().isEmpty() &&
                this.content != null && !this.content.trim().isEmpty();
    }
}
