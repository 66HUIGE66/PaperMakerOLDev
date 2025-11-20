package org.example.papermaker.service;

public class CacheKeyBuilder {
    public static String kpListSystemBySubject(String subjectKey) {
        return "v1:kp:list:system:s:" + subjectKey;
    }

    public static String kpListUserBySubject(Long userId, String subjectKey) {
        return "v1:kp:list:user:" + userId + ":s:" + subjectKey;
    }

    public static String qListSystem(Integer page, Integer size, Long subjectId) {
        String subj = subjectId == null ? "all" : String.valueOf(subjectId);
        return "v1:q:list:system:s:" + subj + ":p:" + page + ":s:" + size;
    }

    public static String qListUser(Long userId, Integer page, Integer size, Long subjectId) {
        String subj = subjectId == null ? "all" : String.valueOf(subjectId);
        return "v1:q:list:user:" + userId + ":s:" + subj + ":p:" + page + ":s:" + size;
    }

    public static String lock(String key) {
        return "v1:lock:" + key;
    }

    public static String idxKp(Long kpId) { return "v1:idx:kp:" + kpId; }
    public static String idxQ(Long qId) { return "v1:idx:q:" + qId; }
}