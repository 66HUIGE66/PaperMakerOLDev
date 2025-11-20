package org.example.papermaker.common;

public enum DifficultyLevel {
    EASY("简单"),
    MEDIUM("中等"),
    HARD("困难"),
    EXPERT("专家");

    private final String description;

    DifficultyLevel(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 获取难度等级数值
     */
    public int getLevel() {
        switch (this) {
            case EASY: return 1;
            case MEDIUM: return 2;
            case HARD: return 3;
            case EXPERT: return 4;
            default: return 2;
        }
    }
}
