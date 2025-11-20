package org.example.papermaker.common;

public enum QuestionType {
    SINGLE_CHOICE("单选题"),
    MULTIPLE_CHOICE("多选题"),
    JUDGMENT("判断题"),
    FILL_BLANK("填空题"),
    SHORT_ANSWER("简答题");

    private final String displayName;

    QuestionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static QuestionType fromDisplayName(String displayName) {
        for (QuestionType type : values()) {
            if (type.displayName.equals(displayName)) {
                return type;
            }
        }
        return SINGLE_CHOICE; // 默认返回单选题
    }
}
