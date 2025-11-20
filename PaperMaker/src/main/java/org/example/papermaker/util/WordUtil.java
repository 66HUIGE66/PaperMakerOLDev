package org.example.papermaker.util;

import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class WordUtil {
    /**
     * 读取 Word 文档内容
     * @param filePath 文件路径
     * @return 文档文本内容
     * @throws IOException 当文件不存在或格式不支持时抛出异常
     */
    public static String readWord(String filePath) throws IOException {
        if (filePath.toLowerCase().endsWith(".doc")) {
            return readDocFile(filePath);
        } else if (filePath.toLowerCase().endsWith(".docx")) {
            return readDocxFile(filePath);
        } else {
            throw new IllegalArgumentException("不支持的文件格式: " + filePath);
        }
    }

    /**
     * 读取 .doc 格式文档
     */
    private static String readDocFile(String filePath) throws IOException {
        try (InputStream is = new FileInputStream(filePath);
             HWPFDocument document = new HWPFDocument(is);
             WordExtractor extractor = new WordExtractor(document)) {
            return extractor.getText();
        }
    }

    /**
     * 读取 .docx 格式文档
     */
    private static String readDocxFile(String filePath) throws IOException {
        try (InputStream is = new FileInputStream(filePath);
             XWPFDocument document = new XWPFDocument(is);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }
    /**
     * 提取题目的所有属性(问题 ， 标签 ， 选项 ， 答案 ， 解析)
     */
    public static String[] readAnd(String text) throws IOException {
        String[] split = text.split("\\n");
        int length = split.length;
        String que = split[0];
        ArrayList<String> types = types(que);
        ArrayList<String> options = null;
        String ans = split[length - 2].trim();
        String ansDetail = split[length - 1].trim();

        if (que.contains("单选题") || que.contains("多选题")) {
            options = new ArrayList<>();
            int st = 1;
            int ed = length - 3;
            for (int i = st; i < ed; ++i) {
                options.add(split[i]);
            }
        }

        return split;
    }
    /**
     *  提取题目中的标签(【单选题】【简单】)
     */
    public static ArrayList<String> types(String text) {
        Pattern pattern = Pattern.compile("【.*?】");
        Matcher matcher = pattern.matcher(text);
        ArrayList<String> stringArrayList = new ArrayList<>();
        while (matcher.find()) {
            String group = matcher.group(0);
            stringArrayList.add(group);
        }
        return stringArrayList;
    }
    /**
     * 提取文本中的题目内容
     * @param text
     * @return
     */
//    public static String findQuestion(String text) {
//        int start = text.indexOf(".");
//        int end = text.indexOf("【");
//        String question = text.substring(start + 1, end).trim();
//        return question;
//    }

    /**
     * 获取选择题的选项
     * @param text
     * @return
     */
    public static ArrayList<String> findOptions(String text){
        ArrayList<String> options = new ArrayList<>();
        Pattern pattern = Pattern.compile("[A-Z]\\.\\s*[^\\n]+");//([A-Z])\.\s*([^\n])
        Matcher matcher = pattern.matcher(text);
        while (matcher.find()) {
            String group = matcher.group(0);

            options.add(group);
        }
        return options;
    }

    /**
     * 提取答案
     * @param text
     * @return
     */
//    public static String findAnswer(String text){
//        int end = text.indexOf("答案详解") - 1;
//    }

}
