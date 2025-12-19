package org.example.papermaker.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import jakarta.annotation.Resource;
import org.example.papermaker.entity.ExamPaperEntity;
import org.example.papermaker.entity.ExamPaperQuestionEntity;
import org.example.papermaker.entity.QuestionEntity;
import org.example.papermaker.entity.SubjectEntity;
import org.example.papermaker.entity.KnowledgePointEntity;
import org.example.papermaker.mapper.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 试卷服务实现类
 */
@Service
public class ExamPaperServiceImpl extends ServiceImpl<ExamPaperMapper, ExamPaperEntity> implements ExamPaperService {

    @Resource
    private KnowledgePointMapper knowledgePointMapper;

    @Resource
    private ExamPaperMapper examPaperMapper;

    @Resource
    private ExamPaperQuestionMapper examPaperQuestionMapper;

    @Resource
    private QuestionMapper questionMapper;

    @Resource
    private SubjectMapper subjectMapper;

    @Override
    public List<ExamPaperEntity> getPapersByCreator(Long creatorId) {
        LambdaQueryWrapper<ExamPaperEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ExamPaperEntity::getCreatorId, creatorId);
        wrapper.orderByDesc(ExamPaperEntity::getCreatedAt);
        return examPaperMapper.selectList(wrapper);
    }

    @Override
    public List<Map<String, Object>> getPaperQuestions(Long paperId) {
        try {
            // 权限检查：先检查试卷是否存在以及用户是否有权限查看
            ExamPaperEntity paper = examPaperMapper.selectById(paperId);
            if (paper == null) {
                return new ArrayList<>();
            }

            // 注意：权限检查应该在Controller层完成，这里只做数据查询
            // 查询试卷题目关联
            LambdaQueryWrapper<ExamPaperQuestionEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ExamPaperQuestionEntity::getPaperId, paperId);
            wrapper.orderByAsc(ExamPaperQuestionEntity::getQuestionOrder);

            List<ExamPaperQuestionEntity> paperQuestions = examPaperQuestionMapper.selectList(wrapper);
            List<Map<String, Object>> result = new ArrayList<>();

            for (ExamPaperQuestionEntity paperQuestion : paperQuestions) {
                // 查询题目详情
                QuestionEntity question = questionMapper.selectById(paperQuestion.getQuestionId());
                if (question != null) {
                    Map<String, Object> questionData = new HashMap<>();
                    questionData.put("id", paperQuestion.getId());
                    questionData.put("questionId", question.getId());
                    questionData.put("questionOrder", paperQuestion.getQuestionOrder());
                    questionData.put("score", paperQuestion.getScore());
                    questionData.put("title", question.getTitle());
                    questionData.put("type", question.getType());
                    questionData.put("difficulty", question.getDifficulty());
                    questionData.put("options", question.getOptionsList());
                    questionData.put("correctAnswer", question.getCorrectAnswer());
                    questionData.put("explanation", question.getExplanation());
                    questionData.put("subjectId", question.getSubjectId());
                    // 如果题目有学科ID，查询学科名称
                    if (question.getSubjectId() != null) {
                        SubjectEntity subject = subjectMapper.selectById(question.getSubjectId());
                        if (subject != null && subject.getName() != null) {
                            questionData.put("subject", subject.getName());
                        }
                    }
                    questionData.put("isSystem", question.getIsSystem());
                    questionData.put("creatorId", question.getCreatorId());
                    questionData.put("createdAt", question.getCreatedAt());
                    questionData.put("updatedAt", question.getUpdatedAt());

                    // 返回知识点ID和名称列表
                    List<Long> knowledgePointIds = question.getKnowledgePointIdsList();
                    questionData.put("knowledgePointIds", question.getKnowledgePointIds());
                    questionData.put("knowledgePointIdsList", knowledgePointIds);

                    // 查询并返回知识点名称列表
                    List<String> knowledgePointNames = new ArrayList<>();
                    List<Map<String, Object>> knowledgePointDetails = new ArrayList<>();
                    if (knowledgePointIds != null && !knowledgePointIds.isEmpty()) {
                        for (Long kpId : knowledgePointIds) {
                            if (kpId != null) {
                                KnowledgePointEntity kp = knowledgePointMapper.selectById(kpId);
                                if (kp != null && kp.getName() != null) {
                                    knowledgePointNames.add(kp.getName());
                                    Map<String, Object> kpDetail = new HashMap<>();
                                    kpDetail.put("id", kp.getId());
                                    kpDetail.put("name", kp.getName());
                                    knowledgePointDetails.add(kpDetail);
                                }
                            }
                        }
                    }
                    questionData.put("knowledgePoints", knowledgePointNames);
                    questionData.put("knowledgePointDetails", knowledgePointDetails);
                    questionData.put("tags", new ArrayList<>());

                    result.add(questionData);
                }
            }

            return result;
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    @Override
    public boolean addQuestionToPaper(Long paperId, Long questionId, Integer score) {
        try {
            // 获取当前试卷中的最大题目顺序
            LambdaQueryWrapper<ExamPaperQuestionEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ExamPaperQuestionEntity::getPaperId, paperId);
            wrapper.orderByDesc(ExamPaperQuestionEntity::getQuestionOrder);
            wrapper.last("LIMIT 1");

            ExamPaperQuestionEntity lastQuestion = examPaperQuestionMapper.selectOne(wrapper);
            int nextOrder = (lastQuestion != null) ? lastQuestion.getQuestionOrder() + 1 : 1;

            // 创建新的试卷题目关联
            ExamPaperQuestionEntity paperQuestion = new ExamPaperQuestionEntity();
            paperQuestion.setPaperId(paperId);
            paperQuestion.setQuestionId(questionId);
            paperQuestion.setQuestionOrder(nextOrder);
            paperQuestion.setScore(score);
            paperQuestion.setCreatedAt(LocalDateTime.now());

            return examPaperQuestionMapper.insert(paperQuestion) > 0;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean removeQuestionFromPaper(Long paperQuestionId) {
        try {
            return examPaperQuestionMapper.deleteById(paperQuestionId) > 0;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean updateQuestionScore(Long paperQuestionId, Integer score) {
        try {
            LambdaUpdateWrapper<ExamPaperQuestionEntity> wrapper = new LambdaUpdateWrapper<>();
            wrapper.eq(ExamPaperQuestionEntity::getId, paperQuestionId);
            wrapper.set(ExamPaperQuestionEntity::getScore, score);

            return examPaperQuestionMapper.update(null, wrapper) > 0;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean updateQuestionOrder(Long paperId, List<Map<String, Object>> questionOrders) {
        try {
            // 批量更新题目顺序
            for (Map<String, Object> orderData : questionOrders) {
                Long paperQuestionId = Long.valueOf(orderData.get("paperQuestionId").toString());
                Integer newOrder = Integer.valueOf(orderData.get("questionOrder").toString());

                LambdaUpdateWrapper<ExamPaperQuestionEntity> wrapper = new LambdaUpdateWrapper<>();
                wrapper.eq(ExamPaperQuestionEntity::getId, paperQuestionId);
                wrapper.eq(ExamPaperQuestionEntity::getPaperId, paperId);
                wrapper.set(ExamPaperQuestionEntity::getQuestionOrder, newOrder);

                examPaperQuestionMapper.update(null, wrapper);
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public List<ExamPaperEntity> listByRuleId(Long ruleId) {
        try {
            LambdaQueryWrapper<ExamPaperEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ExamPaperEntity::getRuleId, ruleId);
            wrapper.orderByDesc(ExamPaperEntity::getCreatedAt);
            return examPaperMapper.selectList(wrapper);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    @Override
    public boolean isQuestionInPaper(Long paperId, Long questionId) {
        try {
            LambdaQueryWrapper<ExamPaperQuestionEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ExamPaperQuestionEntity::getPaperId, paperId);
            wrapper.eq(ExamPaperQuestionEntity::getQuestionId, questionId);
            return examPaperQuestionMapper.selectCount(wrapper) > 0;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public List<ExamPaperEntity> filterPapersBySubject(List<ExamPaperEntity> papers, Long subjectId) {
        System.out.println("========== filterPapersBySubject 开始 ==========");
        System.out.println("输入试卷数量: " + (papers != null ? papers.size() : 0));
        System.out.println("筛选学科ID: " + subjectId + " (类型: "
                + (subjectId != null ? subjectId.getClass().getName() : "null") + ")");

        if (papers == null || papers.isEmpty()) {
            System.out.println("试卷列表为空，直接返回");
            return papers;
        }

        if (subjectId == null) {
            System.out.println("学科ID为空，直接返回所有试卷");
            return papers;
        }

        List<ExamPaperEntity> filteredPapers = new ArrayList<>();

        for (ExamPaperEntity paper : papers) {
            // 获取试卷的所有题目
            List<Map<String, Object>> questions = getPaperQuestions(paper.getId());

            // 检查是否有题目属于指定学科
            boolean hasSubject = false;
            if (questions == null || questions.isEmpty()) {
                // 如果试卷没有题目，跳过
                System.out.println("试卷 " + paper.getId() + " 没有题目，跳过");
                continue;
            }

            System.out.println("========== 检查试卷 " + paper.getId() + " ==========");
            System.out.println("题目数量: " + questions.size());
            System.out.println("筛选条件 subjectId: " + subjectId + " (类型: " + subjectId.getClass().getName() + ")");

            int matchedCount = 0;
            int nullCount = 0;
            for (Map<String, Object> question : questions) {
                Object qSubjectId = question.get("subjectId");
                System.out.println("  - 题目ID: " + question.get("questionId") + ", subjectId: " + qSubjectId + " (类型: "
                        + (qSubjectId != null ? qSubjectId.getClass().getName() : "null") + ")");

                if (qSubjectId == null) {
                    nullCount++;
                    System.out.println("    警告: 题目subjectId为null，跳过");
                    continue;
                }

                // 支持数字和字符串类型的比较
                try {
                    Long qSubjectIdLong = null;
                    if (qSubjectId instanceof Number) {
                        qSubjectIdLong = ((Number) qSubjectId).longValue();
                    } else {
                        qSubjectIdLong = Long.parseLong(qSubjectId.toString().trim());
                    }

                    System.out.println("    转换后: " + qSubjectIdLong + ", 是否匹配: " + qSubjectIdLong.equals(subjectId));
                    if (qSubjectIdLong != null && qSubjectIdLong.equals(subjectId)) {
                        hasSubject = true;
                        matchedCount++;
                        System.out.println("    ✓ 匹配！试卷 " + paper.getId() + " 包含学科 " + subjectId + " 的题目");
                        break; // 找到一个匹配的题目即可
                    }
                } catch (NumberFormatException e) {
                    System.out.println("    错误: 无法解析subjectId '" + qSubjectId + "', 错误: " + e.getMessage());
                }
            }

            System.out.println("匹配的题目数: " + matchedCount + ", null的题目数: " + nullCount);
            System.out.println("试卷 " + paper.getId() + " 是否包含学科 " + subjectId + ": " + hasSubject);
            System.out.println("==========================================");

            if (hasSubject) {
                filteredPapers.add(paper);
            }
        }

        System.out.println("========== filterPapersBySubject 完成 ==========");
        System.out.println("筛选完成，符合条件的试卷数量: " + filteredPapers.size());
        System.out.println(
                "符合条件的试卷ID: " + filteredPapers.stream().map(ExamPaperEntity::getId).collect(Collectors.toList()));
        System.out.println("================================================");

        return filteredPapers;
    }

    @Override
    public Double getQuestionScore(Long paperId, Long questionId) {
        try {
            LambdaQueryWrapper<ExamPaperQuestionEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ExamPaperQuestionEntity::getPaperId, paperId);
            wrapper.eq(ExamPaperQuestionEntity::getQuestionId, questionId);
            ExamPaperQuestionEntity paperQuestion = examPaperQuestionMapper.selectOne(wrapper);

            if (paperQuestion != null && paperQuestion.getScore() != null) {
                return paperQuestion.getScore().doubleValue();
            }
            return 5.0; // 默认分数
        } catch (Exception e) {
            return 5.0;
        }
    }
}
