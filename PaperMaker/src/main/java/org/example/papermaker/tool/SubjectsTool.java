package org.example.papermaker.tool;

import com.baomidou.mybatisplus.core.toolkit.ObjectUtils;
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;

import io.netty.util.internal.ObjectUtil;
import org.example.papermaker.entity.KnowledgePointEntity;
import org.example.papermaker.entity.SubjectEntity;

import org.example.papermaker.service.KnowledgePointService;
import org.example.papermaker.service.impl.SubjectServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class SubjectsTool {
    @Autowired
    private SubjectServiceImpl subjectService;
    @Autowired
    private KnowledgePointService knowledgePointService;

    @Tool("根据学科名称从数据库中获取学科和该学科下的所有知识点，返回结构化结果（提示生成失败和message给用户）")
    public Map<String, Object> getSubjectByName(@P("学科名") String subjectName , @P(value = "知识点" , required = false) List<String> knowledgePoints , @P(value = "当前用户Id") Long userId) {
        SubjectEntity byName = subjectService.getByName(subjectName);
        if (byName == null || (byName.getCreatorId() != userId && !byName.getIsSystem())) {
            // 学科不存在时，返回明确的“不存在”标识
            return Map.of(
                    "exists", false,
                    "message", "生成规则失败,未找到学科：" + subjectName
            );
        }
        List<KnowledgePointEntity> bySubject = knowledgePointService.getBySubject(subjectName);
        if (bySubject == null) {
            // 学科下没有知识点时
            return Map.of(
                    "exists", false,
                    "message", subjectName + "生成规则失败,学科下没有知识点请补充知识点"
            );
        }
        //判断用户是否限定了知识点
        if (ObjectUtils.isNotNull(knowledgePoints) && ObjectUtils.isNotEmpty(knowledgePoints)) {
            //检查用户提及的知识点是否存在
            for (String point : knowledgePoints) {
                String isExit = null;
                for (KnowledgePointEntity knowledgePoint : bySubject) {
                    if (point.equals(knowledgePoint.getName())) {
                        isExit = point;
                        break;
                    }
                }
                if (null == isExit) {
                    // 学科下找不到用户提及的知识点时
                    return Map.of(
                            "exists", false,
                            "message", subjectName + "生成规则失败,学科下没有知识点"+point+"请补充该知识点"
                    );
                }
            }

        }
        knowledgePoints = bySubject.stream().map(KnowledgePointEntity::getName).collect(Collectors.toList());
        //学科存在时，返回学科信息
        return Map.of(
                "exists", true,
                "subject", byName,
                "knowledgePoints" , knowledgePoints
        );
    }
}
