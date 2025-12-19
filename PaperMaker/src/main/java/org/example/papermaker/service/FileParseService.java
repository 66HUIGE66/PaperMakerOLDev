package org.example.papermaker.service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.example.papermaker.entity.QuestionEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;

import java.util.List;

/**
 * 文件解析服务
 * 用于解析上传的Word和Excel题目文件
 */
@Service
public class FileParseService {

    private static final Logger log = LoggerFactory.getLogger(FileParseService.class);

    /**
     * 解析Excel文件
     */
    public List<QuestionEntity> parseExcel(MultipartFile file) throws IOException {
        List<QuestionEntity> questions = new ArrayList<>();
        try (InputStream is = file.getInputStream();
                Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            for (Row row : sheet) {
                if (row.getRowNum() == 0)
                    continue; // 跳过表头

                try {
                    QuestionEntity question = new QuestionEntity();
                    // 假设列顺序：标题、类型、难度、选项、答案、解析

                    Cell titleCell = row.getCell(0);
                    if (titleCell == null || getCellValue(titleCell).trim().isEmpty())
                        continue;
                    question.setTitle(getCellValue(titleCell));

                    Cell typeCell = row.getCell(1);
                    if (typeCell != null) {
                        String typeStr = getCellValue(typeCell);
                        if (typeStr.contains("单选"))
                            question.setType(QuestionEntity.QuestionType.SINGLE_CHOICE);
                        else if (typeStr.contains("多选"))
                            question.setType(QuestionEntity.QuestionType.MULTIPLE_CHOICE);
                        else if (typeStr.contains("判断"))
                            question.setType(QuestionEntity.QuestionType.TRUE_FALSE);
                        else if (typeStr.contains("填空"))
                            question.setType(QuestionEntity.QuestionType.FILL_BLANK);
                        else if (typeStr.contains("简答"))
                            question.setType(QuestionEntity.QuestionType.SHORT_ANSWER);
                        else
                            question.setType(QuestionEntity.QuestionType.SINGLE_CHOICE); // 默认类型
                    } else {
                        question.setType(QuestionEntity.QuestionType.SINGLE_CHOICE);
                    }

                    Cell diffCell = row.getCell(2);
                    if (diffCell != null) {
                        String diffStr = getCellValue(diffCell);
                        if (diffStr.contains("简单"))
                            question.setDifficulty(QuestionEntity.DifficultyLevel.EASY);
                        else if (diffStr.contains("困难"))
                            question.setDifficulty(QuestionEntity.DifficultyLevel.HARD);
                        else
                            question.setDifficulty(QuestionEntity.DifficultyLevel.MEDIUM);
                    } else {
                        question.setDifficulty(QuestionEntity.DifficultyLevel.MEDIUM);
                    }

                    Cell optionsCell = row.getCell(3);
                    if (optionsCell != null) {
                        String optionsStr = getCellValue(optionsCell);
                        if (optionsStr != null && !optionsStr.isEmpty()) {
                            String[] opts = optionsStr.split("[|\\n]");
                            List<String> cleanOpts = new ArrayList<>();
                            for (String opt : opts) {
                                if (!opt.trim().isEmpty())
                                    cleanOpts.add(opt.trim());
                            }
                            question.setOptionsList(cleanOpts);
                        }
                    }

                    Cell answerCell = row.getCell(4);
                    if (answerCell != null)
                        question.setCorrectAnswer(getCellValue(answerCell));

                    Cell expCell = row.getCell(5);
                    if (expCell != null)
                        question.setExplanation(getCellValue(expCell));

                    questions.add(question);
                } catch (Exception e) {
                    log.error("Error parsing row " + row.getRowNum(), e);
                }
            }
        }
        return questions;
    }

    @jakarta.annotation.Resource
    private OssService ossService;

    /**
     * 解析Word文件
     */
    public List<QuestionEntity> parseWord(MultipartFile file) throws IOException {
        List<QuestionEntity> questions = new ArrayList<>();
        try (InputStream is = file.getInputStream();
                XWPFDocument document = new XWPFDocument(is)) {

            List<XWPFParagraph> paragraphs = document.getParagraphs();
            QuestionEntity currentQuestion = null;
            List<String> currentOptions = new ArrayList<>();

            for (XWPFParagraph para : paragraphs) {
                StringBuilder textBuilder = new StringBuilder();

                // 遍历段落中的Run，提取文本和图片
                for (org.apache.poi.xwpf.usermodel.XWPFRun run : para.getRuns()) {
                    textBuilder.append(run.getText(0) != null ? run.getText(0) : "");

                    // 处理图片
                    List<org.apache.poi.xwpf.usermodel.XWPFPicture> pictures = run.getEmbeddedPictures();
                    for (org.apache.poi.xwpf.usermodel.XWPFPicture picture : pictures) {
                        org.apache.poi.xwpf.usermodel.XWPFPictureData pictureData = picture.getPictureData();
                        String fileName = pictureData.getFileName();
                        byte[] data = pictureData.getData();

                        String contentType = pictureData.getPackagePart().getContentType();
                        String base64 = java.util.Base64.getEncoder().encodeToString(data);
                        textBuilder.append("\n![image](data:").append(contentType).append(";base64,").append(base64)
                                .append(")\n");
                    }
                }

                String text = textBuilder.toString().trim();
                if (text.isEmpty())
                    continue;

                // 简单的题目开始判断：以数字和点开头 (如 "1. 什么是...")
                // (?s) 开启 DOTALL 模式，允许 . 匹配换行符 (因为图片会引入换行)
                if (text.matches("(?s)^\\d+\\..*") || text.matches("(?s)^(一|二|三|四|五|六|七|八|九|十)+、.*")) {
                    // 保存上一道题目
                    if (currentQuestion != null) {
                        if (!currentOptions.isEmpty())
                            currentQuestion.setOptionsList(new ArrayList<>(currentOptions));
                        questions.add(currentQuestion);
                    }

                    currentQuestion = new QuestionEntity();

                    // 设置默认值
                    currentQuestion.setType(QuestionEntity.QuestionType.SINGLE_CHOICE); // 默认类型
                    currentQuestion.setDifficulty(QuestionEntity.DifficultyLevel.MEDIUM);

                    // 解析标题和标签
                    parseTitleTags(currentQuestion, text);

                    currentOptions.clear();

                } else if (text.matches("(?s)^[A-Z][\\.、].*")) { // 选项如 "A. xxx" 或 "A、 xxx"
                    currentOptions.add(text);
                } else if (text.startsWith("Answer:") || text.startsWith("答案：") || text.startsWith("答案:")) {
                    if (currentQuestion != null) {
                        String ans = text.substring(text.indexOf(":") + 1).trim();
                        if (ans.isEmpty() && text.contains("：")) {
                            ans = text.substring(text.indexOf("：") + 1).trim();
                        }
                        currentQuestion.setCorrectAnswer(cleanAnswer(ans));
                    }
                } else if (text.startsWith("Explanation:") || text.startsWith("解析：") || text.startsWith("解析:")) {
                    if (currentQuestion != null) {
                        String exp = text.substring(text.indexOf(":") + 1).trim();
                        if (exp.isEmpty() && text.contains("：")) {
                            exp = text.substring(text.indexOf("：") + 1).trim();
                        }
                        currentQuestion.setExplanation(cleanExplanation(exp));
                    }
                } else {
                    // 追加到标题或解析或选项？
                    // 目前逻辑：如果已经有题目但还没有选项/答案，可能是多行标题
                    if (currentQuestion != null && currentOptions.isEmpty()
                            && currentQuestion.getCorrectAnswer() == null) {
                        currentQuestion.setTitle(currentQuestion.getTitle() + "\n" + text);
                    }
                }
            }
            // 添加最后一道题目
            if (currentQuestion != null) {
                if (!currentOptions.isEmpty())
                    currentQuestion.setOptionsList(new ArrayList<>(currentOptions));
                questions.add(currentQuestion);
            }
        }
        return questions;
    }

    /**
     * 解析标题中的标签 (如 【单选题】【简单】)
     */
    private void parseTitleTags(QuestionEntity question, String text) {
        String title = text.replaceAll("(?s)^(\\d+\\.|[一二三四五六七八九十]+、)\\s*", "");

        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("【(.*?)】");
        java.util.regex.Matcher matcher = pattern.matcher(title);

        while (matcher.find()) {
            String tag = matcher.group(1);
            if (tag.contains("单选题")) {
                question.setType(QuestionEntity.QuestionType.SINGLE_CHOICE);
            } else if (tag.contains("多选题")) {
                question.setType(QuestionEntity.QuestionType.MULTIPLE_CHOICE);
            } else if (tag.contains("判断题")) {
                question.setType(QuestionEntity.QuestionType.TRUE_FALSE);
            } else if (tag.contains("填空题")) {
                question.setType(QuestionEntity.QuestionType.FILL_BLANK);
            } else if (tag.contains("简答题")) {
                question.setType(QuestionEntity.QuestionType.SHORT_ANSWER);
            } else if (tag.contains("简单")) {
                question.setDifficulty(QuestionEntity.DifficultyLevel.EASY);
            } else if (tag.contains("中等")) {
                question.setDifficulty(QuestionEntity.DifficultyLevel.MEDIUM);
            } else if (tag.contains("困难")) {
                question.setDifficulty(QuestionEntity.DifficultyLevel.HARD);
            } else if (tag.equals("图片")) {
                // 忽略图片标记
            } else {
                // 可能是学科或知识点，暂时设为subject
                // 简单的策略：第一个未知标签设为subject
                if (question.getSubject() == null || question.getSubject().isEmpty()) {
                    question.setSubject(tag);
                }
            }
        }

        // 移除标签作为纯标题
        String cleanTitle = title.replaceAll("【.*?】", "").trim();
        question.setTitle(cleanTitle);
    }

    // 辅助方法：处理答案格式 (去除括号等)
    private String cleanAnswer(String ans) {
        ans = ans.trim();
        if (ans.startsWith("(") && ans.endsWith(")")) {
            return ans.substring(1, ans.length() - 1);
        }
        if (ans.startsWith("（") && ans.endsWith("）")) {
            return ans.substring(1, ans.length() - 1);
        }
        return ans;
    }

    // 辅助方法：处理解析格式 (去除花括号等)
    private String cleanExplanation(String exp) {
        exp = exp.trim();
        if (exp.startsWith("{") && exp.endsWith("}")) {
            return exp.substring(1, exp.length() - 1);
        }
        return exp;
    }

    private String getCellValue(Cell cell) {
        if (cell == null)
            return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                // 检查是否为整数
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toString();
                }
                double val = cell.getNumericCellValue();
                if (val == (long) val)
                    return String.valueOf((long) val);
                return String.valueOf(val);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return "";
        }
    }
}
