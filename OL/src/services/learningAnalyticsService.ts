import { practiceRecordService } from './practiceRecordService';

/**
 * 学习分析服务
 * 提供用户学习情况统计和分析功能
 */

/**
 * 用户学科学习概览
 */
export interface SubjectLearningOverview {
  subjectName: string;
  totalPracticeCount: number;
  averageScore: number;
  accuracy: string;
  totalTimeFormatted: string;
  strengths: string[];
  weaknesses: string[];
  lastPracticeDate: string;
}

/**
 * 知识点学习详情
 */
export interface KnowledgePointDetail {
  knowledgePointName: string;
  practiceCount: number;
  questionCount: number;
  correctCount: number;
  accuracy: string;
  masteryLevel: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * 学习进度报告
 */
export interface LearningProgressReport {
  subjectName: string;
  overallProgress: number; // 0-100
  masteredKnowledgePoints: number;
  totalKnowledgePoints: number;
  learningTrend: 'improving' | 'stable' | 'declining';
  suggestion: string;
}

/**
 * 学习分析服务
 */
export const learningAnalyticsService = {
  /**
   * 获取所有学科列表（从数据库动态获取）
   * @returns 学科选项列表
   */
  async getSubjects(): Promise<Array<{label: string; value: string}>> {
    try {
      console.log('开始从数据库获取学科列表');
      
      // 从数据库获取学科统计数据
      const subjectStats = await practiceRecordService.getSubjectStatistics();
      
      if (subjectStats && Array.isArray(subjectStats.subjects)) {
        const subjects = subjectStats.subjects
          .filter(s => s && s.subjectName)
          .map(s => ({
            label: s.subjectName,
            value: s.subjectName
          }));
          
        console.log(`从数据库获取到${subjects.length}个学科`);
        return subjects;
      }
      
      console.log('未找到学科数据');
      return [];
    } catch (error) {
      console.error('获取学科列表失败:', error);
      // 返回空数组而不是抛出错误，避免影响用户体验
      return [];
    }
  },

  /**
   * 获取学科学习概览
   * @param subjectName 学科名称
   * @returns 学科学习概览
   */
  async getSubjectLearningOverview(subjectName: string): Promise<SubjectLearningOverview> {
    try {
      // 获取学科统计数据
      const subjectStats = await practiceRecordService.getSubjectStatistics();
      const targetSubject = subjectStats.subjects.find(s => s.subjectName === subjectName);
      
      if (!targetSubject) {
        return {
          subjectName,
          totalPracticeCount: 0,
          averageScore: 0,
          accuracy: '0%',
          totalTimeFormatted: '0分钟',
          strengths: [],
          weaknesses: [],
          lastPracticeDate: '暂无练习记录'
        };
      }
      
      // 获取知识点详情以分析强项和弱项
      const kpStats = await practiceRecordService.getSubjectKnowledgePointStatistics();
      const subjectKpStats = kpStats.subjects.find(s => s.subjectName === subjectName);
      
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      
      if (subjectKpStats && subjectKpStats.knowledgePoints) {
        // 找出准确度最高的前两个知识点作为强项
        subjectKpStats.knowledgePoints
          .sort((a, b) => parseFloat(b.accuracy) - parseFloat(a.accuracy))
          .slice(0, 2)
          .forEach(kp => strengths.push(kp.knowledgePointName));
        
        // 找出准确度最低的前两个知识点作为弱项
        subjectKpStats.knowledgePoints
          .sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy))
          .slice(0, 2)
          .forEach(kp => weaknesses.push(kp.knowledgePointName));
      }
      
      return {
        subjectName: targetSubject.subjectName,
        totalPracticeCount: targetSubject.practiceCount,
        averageScore: parseFloat(targetSubject.statistics.averageScore),
        accuracy: targetSubject.statistics.averageAccuracy,
        totalTimeFormatted: targetSubject.statistics.totalTimeFormatted,
        strengths,
        weaknesses,
        lastPracticeDate: '最近练习时间'
      };
    } catch (error) {
      console.error('获取学科学习概览失败:', error);
      throw new Error('获取学习情况失败，请稍后重试');
    }
  },
  
  /**
   * 获取知识点学习详情
   * @param subjectName 学科名称
   * @returns 知识点学习详情列表
   */
  async getKnowledgePointDetails(subjectName: string): Promise<KnowledgePointDetail[]> {
    try {
      const kpStats = await practiceRecordService.getSubjectKnowledgePointStatistics();
      const subjectKpStats = kpStats.subjects.find(s => s.subjectName === subjectName);
      
      if (!subjectKpStats || !subjectKpStats.knowledgePoints) {
        return [];
      }
      
      return subjectKpStats.knowledgePoints.map(kp => {
        const accuracy = parseFloat(kp.accuracy);
        let masteryLevel: 'beginner' | 'intermediate' | 'advanced';
        
        if (accuracy >= 80) {
          masteryLevel = 'advanced';
        } else if (accuracy >= 60) {
          masteryLevel = 'intermediate';
        } else {
          masteryLevel = 'beginner';
        }
        
        return {
          knowledgePointName: kp.knowledgePointName,
          practiceCount: kp.practiceCount,
          questionCount: kp.questionCount,
          correctCount: kp.correctCount,
          accuracy: kp.accuracy,
          masteryLevel
        };
      });
    } catch (error) {
      console.error('获取知识点详情失败:', error);
      throw new Error('获取知识点学习详情失败，请稍后重试');
    }
  },
  
  /**
   * 获取学习进度报告
   * @param subjectName 学科名称
   * @returns 学习进度报告
   */
  async getLearningProgressReport(subjectName: string): Promise<LearningProgressReport> {
    try {
      const kpDetails = await this.getKnowledgePointDetails(subjectName);
      const masteredKps = kpDetails.filter(kp => kp.masteryLevel === 'advanced').length;
      const totalKps = kpDetails.length;
      const overallProgress = totalKps > 0 ? (masteredKps / totalKps) * 100 : 0;
      
      // 简化的学习趋势判断，实际应该基于历史数据
      const learningTrend: 'improving' | 'stable' | 'declining' = overallProgress > 70 ? 'improving' : 'stable';
      
      let suggestion = '继续保持良好的学习状态！';
      if (overallProgress < 30) {
        suggestion = '建议加强基础知识学习，多做练习。';
      } else if (overallProgress < 60) {
        suggestion = '建议针对性地复习薄弱知识点。';
      }
      
      return {
        subjectName,
        overallProgress,
        masteredKnowledgePoints: masteredKps,
        totalKnowledgePoints: totalKps,
        learningTrend,
        suggestion
      };
    } catch (error) {
      console.error('获取学习进度报告失败:', error);
      throw new Error('获取学习进度报告失败，请稍后重试');
    }
  },
  
  /**
   * 根据学科获取知识点列表（用于Select组件）
   * @param subjectName 学科名称
   * @returns 知识点选项列表
   */
  async getKnowledgePointsBySubject(subjectName: string): Promise<Array<{label: string; value: string}>> {
    try {
      console.log(`开始获取${subjectName}学科的知识点`);
      
      // 从数据库获取知识点
      const kpStats = await practiceRecordService.getSubjectKnowledgePointStatistics();
      
      if (kpStats && Array.isArray(kpStats.subjects)) {
        const subjectKpStats = kpStats.subjects.find(s => s && s.subjectName === subjectName);
        
        if (subjectKpStats && Array.isArray(subjectKpStats.knowledgePoints)) {
          const realKnowledgePoints = subjectKpStats.knowledgePoints
            .filter(kp => kp && kp.knowledgePointName)
            .map(kp => ({
              label: kp.knowledgePointName,
              value: kp.knowledgePointName
            }));
            
          console.log(`从数据库获取到${subjectName}学科的${realKnowledgePoints.length}个知识点`);
          return realKnowledgePoints;
        }
      }
      
      console.log(`未找到${subjectName}学科的知识点数据`);
      return [];
    } catch (error) {
      console.error('根据学科获取知识点失败:', error);
      // 返回空数组而不是抛出错误，避免影响用户体验
      return [];
    }
  }
};