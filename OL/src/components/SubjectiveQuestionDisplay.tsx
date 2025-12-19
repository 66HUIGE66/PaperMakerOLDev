import React, { useState } from 'react';
import { Button, Modal, Statistic, Space, Tag, message, Spin } from 'antd';
import { RobotOutlined, CheckCircleOutlined, CloseCircleOutlined, BulbOutlined } from '@ant-design/icons';
import { API_CONFIG } from '../config/api';
import { authService } from '../services/authService';

interface SubjectiveQuestionDisplayProps {
    answerId: number;
    questionType: string;
    userAnswer: string;
    correctAnswer: string;
    similarityScore?: number; // 0-1之间的相似度
    finalScore?: number; // 最终得分
    scoreType?: string; // 'SIMILARITY' 或 'AI'
    aiScore?: number;
    aiFeedback?: string;
    aiSuggestions?: string;
    maxScore?: number;
    onScoreUpdate?: () => void; // 分数更新后的回调
}

const SubjectiveQuestionDisplay: React.FC<SubjectiveQuestionDisplayProps> = ({
    answerId,
    questionType,
    userAnswer,
    correctAnswer,
    similarityScore = 0,
    finalScore = 0,
    scoreType = 'SIMILARITY',
    aiScore,
    aiFeedback,
    aiSuggestions,
    maxScore = 5,
    onScoreUpdate
}) => {
    const [aiModalVisible, setAiModalVisible] = useState(false);
    const [aiGrading, setAiGrading] = useState(false);
    const [aiGradingResult, setAiGradingResult] = useState<any>(null);
    const [accepting, setAccepting] = useState(false);

    // 请求AI重新评分
    const handleAIRegrade = async () => {
        setAiGrading(true);
        try {
            const token = authService.getToken();
            const response = await fetch(`${API_CONFIG.BASE_URL}/answer-record/ai-regrade/${answerId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.code === 200) {
                setAiGradingResult(result.object);
                setAiModalVisible(true);
            } else {
                message.error(result.message || 'AI评分失败');
            }
        } catch (error) {
            console.error('AI评分失败:', error);
            message.error('AI评分失败，请稍后重试');
        } finally {
            setAiGrading(false);
        }
    };

    // 接受AI评分
    const handleAcceptAIScore = async () => {
        setAccepting(true);
        try {
            const token = authService.getToken();
            const response = await fetch(`${API_CONFIG.BASE_URL}/answer-record/accept-ai-score/${answerId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.code === 200) {
                message.success('已接受AI评分');
                setAiModalVisible(false);
                // 通知父组件刷新数据
                if (onScoreUpdate) {
                    onScoreUpdate();
                }
            } else {
                message.error(result.message || '接受AI评分失败');
            }
        } catch (error) {
            console.error('接受AI评分失败:', error);
            message.error('操作失败，请稍后重试');
        } finally {
            setAccepting(false);
        }
    };

    // 拒绝AI评分
    const handleRejectAIScore = () => {
        message.info('已保持原分数');
        setAiModalVisible(false);
    };

    const similarityPercentage = (similarityScore * 100).toFixed(1);
    const isHighSimilarity = similarityScore >= 0.8;

    return (
        <div>
            {/* 用户答案 */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#595959' }}>
                    你的答案：
                </div>
                <div style={{
                    backgroundColor: isHighSimilarity ? '#f6ffed' : '#fff2f0',
                    border: `2px solid ${isHighSimilarity ? '#b7eb8f' : '#ffccc7'}`,
                    borderRadius: '8px',
                    padding: '16px',
                    minHeight: questionType === 'SHORT_ANSWER' ? '100px' : '50px',
                    position: 'relative',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                }}>
                    {userAnswer || '未作答'}
                    {isHighSimilarity && (
                        <CheckCircleOutlined
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                fontSize: '20px',
                                color: '#52c41a'
                            }}
                        />
                    )}
                    {!isHighSimilarity && userAnswer && (
                        <CloseCircleOutlined
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                fontSize: '20px',
                                color: '#ff4d4f'
                            }}
                        />
                    )}
                </div>
            </div>

            {/* 参考答案 */}
            <div style={{
                backgroundColor: '#e6f7ff',
                border: '2px solid #91d5ff',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: 16,
                minHeight: questionType === 'SHORT_ANSWER' ? '100px' : '50px'
            }}>
                <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#1890ff' }}>
                    参考答案：
                </div>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#0050b3' }}>
                    {correctAnswer}
                </div>
            </div>

            {/* AI 改进建议 - 仅在AI评分时显示 */}
            {scoreType === 'AI' && aiSuggestions && (
                <div style={{
                    backgroundColor: '#fff7e6',
                    border: '1px solid #ffd591',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: 16
                }}>
                    <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#fa8c16', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BulbOutlined /> AI 改进建议：
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#d46b08' }}>
                        {aiSuggestions}
                    </div>
                </div>
            )}

            {/* 评分信息 */}
            <div style={{
                backgroundColor: '#fafafa',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: 16
            }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontWeight: 'bold', marginRight: 8 }}>得分:</span>
                            <span style={{ fontSize: '18px', color: '#1890ff', fontWeight: 'bold' }}>
                                {finalScore.toFixed(1)} / {maxScore}
                            </span>
                            {scoreType === 'SIMILARITY' && (
                                <Tag color="orange" style={{ marginLeft: 8 }}>相似度评分</Tag>
                            )}
                            {scoreType === 'AI' && (
                                <Tag color="blue" style={{ marginLeft: 8 }}>AI评分</Tag>
                            )}
                        </div>

                        {scoreType === 'SIMILARITY' && (
                            <div>
                                <span style={{ marginRight: 8, color: '#666' }}>
                                    相似度: {similarityPercentage}%
                                </span>
                            </div>
                        )}
                    </div>

                    {/* AI重新评分按钮 */}
                    {scoreType === 'SIMILARITY' && (
                        <Button
                            type="dashed"
                            icon={<RobotOutlined />}
                            onClick={handleAIRegrade}
                            loading={aiGrading}
                            block
                        >
                            觉得评分有问题，试试AI评分
                        </Button>
                    )}

                    {/* 如果已有AI评分但未接受，显示提示 */}
                    {scoreType === 'SIMILARITY' && aiScore !== undefined && aiScore !== null && (
                        <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#e6f7ff',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#1890ff'
                        }}>
                            💡 已有AI评分结果 ({((aiScore / 100) * maxScore).toFixed(1)}分)，点击上方按钮查看详情
                        </div>
                    )}
                </Space>
            </div>

            {/* AI评分结果模态框 */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RobotOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
                        <span>AI评分结果</span>
                    </div>
                }
                open={aiModalVisible}
                onCancel={() => setAiModalVisible(false)}
                width={600}
                footer={[
                    <Button key="reject" onClick={handleRejectAIScore}>
                        保持原分数
                    </Button>,
                    <Button
                        key="accept"
                        type="primary"
                        onClick={handleAcceptAIScore}
                        loading={accepting}
                    >
                        接受AI评分并更新分数
                    </Button>
                ]}
            >
                {aiGradingResult && (
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        {/* 分数对比 */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-around',
                            padding: '16px',
                            backgroundColor: '#fafafa',
                            borderRadius: '8px'
                        }}>
                            <Statistic
                                title="当前得分"
                                value={aiGradingResult.currentScore}
                                suffix={`/ ${aiGradingResult.maxScore}`}
                            />
                            <Statistic
                                title="AI评分"
                                value={((aiGradingResult.aiScore / 100) * aiGradingResult.maxScore).toFixed(1)}
                                suffix={`/ ${aiGradingResult.maxScore}`}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </div>

                        {/* AI反馈 */}
                        {aiGradingResult.aiFeedback && (
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#595959' }}>
                                    评分反馈：
                                </div>
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#f6ffed',
                                    borderRadius: '4px',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {aiGradingResult.aiFeedback}
                                </div>
                            </div>
                        )}

                        {/* AI建议 */}
                        {aiGradingResult.aiSuggestions && (
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#595959' }}>
                                    改进建议：
                                </div>
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#fff7e6',
                                    borderRadius: '4px',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {aiGradingResult.aiSuggestions}
                                </div>
                            </div>
                        )}
                    </Space>
                )}
            </Modal>
        </div>
    );
};

export default SubjectiveQuestionDisplay;
