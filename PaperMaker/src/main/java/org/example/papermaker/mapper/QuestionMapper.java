package org.example.papermaker.mapper;


import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.example.papermaker.entity.QuestionEntity;


import java.util.List;
import java.util.Map;

/**
 * 题目Mapper接口
 * 使用MyBatis-Plus框架
 *
 * @author System
 * @since 2.0.0
 */
@Mapper
public interface QuestionMapper extends BaseMapper<QuestionEntity> {

    /**
     * 根据条件分页查询题目
     *
     * @param page 分页对象
     * @param type 题目类型
     * @param difficulty 难度等级
     * @param creatorId 创建者ID
     * @param questionGroup 题目分组
     * @param keyword 关键词
     * @return 题目分页数据
     */
    @Select("<script>" +
            "SELECT * FROM questions WHERE 1=1 " +
            "<if test='type != null'> AND type = #{type} </if>" +
            "<if test='difficulty != null'> AND difficulty = #{difficulty} </if>" +
            "<if test='creatorId != null'> AND creator_id = #{creatorId} </if>" +
            "<if test='questionGroup != null and questionGroup != \"\"'> AND question_group = #{questionGroup} </if>" +
            "<if test='keyword != null and keyword != \"\"'> AND title LIKE CONCAT('%', #{keyword}, '%') </if>" +
            "ORDER BY id DESC" +
            "</script>")
    IPage<QuestionEntity> selectQuestionsByConditions(
            Page<QuestionEntity> page,
            @Param("type") String type,
            @Param("difficulty") String difficulty,
            @Param("creatorId") Long creatorId,
            @Param("questionGroup") String questionGroup,
            @Param("keyword") String keyword
    );

    /**
     * 根据知识点ID查询题目
     *
     * @param page 分页对象
     * @param knowledgePointId 知识点ID
     * @return 题目分页数据
     */
    @Select("SELECT q.* FROM questions q " +
            "INNER JOIN question_knowledge_points qkp ON q.id = qkp.question_id " +
            "WHERE qkp.knowledge_point_id = #{knowledgePointId} " +
            "ORDER BY q.created_at DESC")
    IPage<QuestionEntity> selectQuestionsByKnowledgePoint(
            Page<QuestionEntity> page,
            @Param("knowledgePointId") Long knowledgePointId
    );

    /**
     * 根据标签ID查询题目
     *
     * @param page 分页对象
     * @param tagId 标签ID
     * @return 题目分页数据
     */
    @Select("SELECT q.* FROM questions q " +
            "INNER JOIN question_tags qt ON q.id = qt.question_id " +
            "WHERE qt.tag_id = #{tagId} " +
            "ORDER BY q.created_at DESC")
    IPage<QuestionEntity> selectQuestionsByTag(
            Page<QuestionEntity> page,
            @Param("tagId") Long tagId
    );

    /**
     * 根据分类ID查询题目
     *
     * @param page 分页对象
     * @param categoryId 分类ID
     * @return 题目分页数据
     */
    @Select("SELECT q.* FROM questions q " +
            "INNER JOIN question_category_relations qcr ON q.id = qcr.question_id " +
            "WHERE qcr.category_id = #{categoryId} " +
            "ORDER BY q.created_at DESC")
    IPage<QuestionEntity> selectQuestionsByCategory(
            Page<QuestionEntity> page,
            @Param("categoryId") Long categoryId
    );

    /**
     * 查询随机题目
     *
     * @param limit 数量限制
     * @return 题目列表
     */
    @Select("SELECT * FROM questions ORDER BY RAND() LIMIT #{limit}")
    List<QuestionEntity> selectRandomQuestions(@Param("limit") Integer limit);

    /**
     * 根据条件查询随机题目
     *
     * @param type 题目类型
     * @param difficulty 难度等级
     * @param limit 数量限制
     * @return 题目列表
     */
    @Select("<script>" +
            "SELECT * FROM questions WHERE 1=1 " +
            "<if test='type != null'> AND type = #{type} </if>" +
            "<if test='difficulty != null'> AND difficulty = #{difficulty} </if>" +
            "ORDER BY RAND() LIMIT #{limit}" +
            "</script>")
    List<QuestionEntity> selectRandomQuestionsByConditions(
            @Param("type") String type,
            @Param("difficulty") String difficulty,
            @Param("limit") Integer limit
    );

    /**
     * 查询题目统计信息
     *
     * @param creatorId 创建者ID
     * @return 统计信息
     */
    @Select("SELECT " +
            "COUNT(*) as totalCount, " +
            "COUNT(CASE WHEN type = 'SINGLE_CHOICE' THEN 1 END) as singleChoiceCount, " +
            "COUNT(CASE WHEN type = 'MULTIPLE_CHOICE' THEN 1 END) as multipleChoiceCount, " +
            "COUNT(CASE WHEN type = 'FILL_BLANK' THEN 1 END) as fillBlankCount, " +
            "COUNT(CASE WHEN type = 'TRUE_FALSE' THEN 1 END) as trueFalseCount, " +
            "COUNT(CASE WHEN type = 'SHORT_ANSWER' THEN 1 END) as shortAnswerCount, " +
            "COUNT(CASE WHEN type = 'ESSAY' THEN 1 END) as essayCount " +
            "FROM questions WHERE creator_id = #{creatorId}")
    Map<String, Object> selectQuestionStatistics(@Param("creatorId") Long creatorId);

    /**
     * 根据题目分组统计题目数量
     *
     * @return 分组统计信息
     */
    @Select("SELECT question_group, COUNT(*) as count FROM questions " +
            "WHERE question_group IS NOT NULL GROUP BY question_group ORDER BY COUNT(*) DESC")
    List<Map<String, Object>> selectStatisticsByGroup();

    /**
     * 查询指定分组的题目
     *
     * @param questionGroup 题目分组
     * @return 题目列表
     */
    @Select("SELECT * FROM questions WHERE question_group = #{questionGroup} " +
            "ORDER BY question_order")
    List<QuestionEntity> selectQuestionsByGroup(@Param("questionGroup") String questionGroup);

    /**
     * 查询最新题目
     *
     * @param page 分页对象
     * @return 题目分页数据
     */
    @Select("SELECT * FROM questions ORDER BY id DESC")
    IPage<QuestionEntity> selectLatestQuestions(Page<QuestionEntity> page);


    /**
     * 根据当前用户ID查询题目
     *
     * @param creatorId 用户id
     * @return
     */
    @Select("SELECT * FROM questions WHERE creator_id = #{creatorId}")
    List<QuestionEntity> selectLatestQuestionsByCreatorId(Long creatorId);
}

