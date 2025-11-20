import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Space, Typography, message, Spin, Empty, Tag, Row, Col, Select, Form, Radio, Divider } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ReloadOutlined, FileTextOutlined, CalendarOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiAssistantService, readStream, ChatMessage } from '../services/aiAssistantService';
import { practiceRecordService } from '../services/practiceRecordService';
import { learningAnalyticsService } from '../services/learningAnalyticsService';
import './AIAssistantPage.css';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;
const { Option } = Select;

/**
 * 简化的Markdown格式修复函数，只处理表格格式问题
 */
const normalizeMarkdown = (content: string): string => {
  if (!content) return '';
  
  // 增强的Markdown格式处理
  return content
    .replace(/\n\s*\n/g, '\n\n') // 标准化空行
    .replace(/\|\s*\|\s*\|/g, '| | |') // 处理表格中的多余分隔符
    .replace(/\|(\s+)/g, '| ') // 标准化表格分隔符前的空格
    .replace(/(\s+)\|/g, ' |') // 标准化表格分隔符后的空格
    .replace(/^##\s+([^\n]+)/gm, '## $1') // 确保二级标题格式正确
    .replace(/^###\s+([^\n]+)/gm, '### $1') // 确保三级标题格式正确
    .replace(/\*\*([^*]+)\*\*/g, '**$1**') // 确保粗体格式正确
    .replace(/^-\s+([^\n]+)/gm, '- $1') // 确保列表项格式正确
    .trim();
};

/**
 * 将Markdown格式转换为HTML格式作为备用方案
 */
const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  try {
    // 先处理表格
    let html = markdown;
    
    // 检测并转换Markdown表格
    const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;
    html = html.replace(tableRegex, (match, header, rows) => {
      const headers = header.split('|').map((h: string) => h.trim()).filter((h: string) => h);
      const headerHtml = '<tr>' + headers.map((h: string) => 
        `<th>${h}</th>`
      ).join('') + '</tr>';
      
      const rowLines = rows.trim().split('\n').filter((line: string) => line.trim());
      const rowsHtml = rowLines.map((row: string) => {
        const cells = row.split('|').map((c: string) => c.trim()).filter((c: string) => c);
        return '<tr>' + cells.map((c: string) => 
          `<td>${c}</td>`
        ).join('') + '</tr>';
      }).join('');
      
      return `<table><thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody></table>`;
    });
    
    // 转换标题
    html = html.replace(/^##\s+([^\n]+)/gm, '<h2>$1</h2>');
    html = html.replace(/^###\s+([^\n]+)/gm, '<h3>$1</h3>');
    
    // 转换粗体
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 转换列表项
    const listItems = html.match(/^-\s+([^\n]+)/gm);
    if (listItems) {
      const uniqueListItems = [...new Set(listItems)];
      uniqueListItems.forEach(item => {
        const content = item.replace(/^-\s+/, '');
        html = html.replace(new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
          `<li>${content}</li>`);
      });
      
      // 包装列表
      html = html.replace(/(<li[^>]*>.*?<\/li>)/gs, '<ul>$1</ul>');
    }
    
    // 转换段落（排除已经处理的元素）
    html = html.replace(/^(?!<[h2|h3|li|table|ul])([^\n<]+)/gm, '<p>$1</p>');
    
    // 处理剩余的换行
    html = html.replace(/\n/g, '');
    
    return html;
  } catch (error) {
    console.error('Markdown转换失败:', error);
    // 转换失败时返回转义后的纯文本
    return markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }
}

/**
 * 检测内容是否为Markdown表格格式
 */
const isMarkdownTable = (content: string): boolean => {
  if (!content) return false;
  
  // 按行分割
  const lines = content.trim().split('\n');
  if (lines.length < 2) return false;
  
  // 检查是否有表格分隔行（包含|---或|===）
  const hasSeparatorLine = lines.some(line => 
    line.trim().startsWith('|') && 
    (line.includes('---') || line.includes('==='))
  );
  
  // 检查是否有多行以|开头
  const tableLines = lines.filter(line => line.trim().startsWith('|'));
  
  return hasSeparatorLine && tableLines.length >= 2;
};

const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<'available' | 'unavailable' | 'checking'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [goal, setGoal] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [subjects, setSubjects] = useState<Array<{label: string; value: string}>>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  // 新增：知识点相关状态
  const [knowledgePoints, setKnowledgePoints] = useState<Array<{label: string; value: string}>>([]);
  const [selectedKnowledgePoints, setSelectedKnowledgePoints] = useState<string[]>([]);
  const [isLoadingKnowledgePoints, setIsLoadingKnowledgePoints] = useState(false);
  // 新增：时间范围选项
  const [timeRange, setTimeRange] = useState<string>('1'); // 1: 一周, 2: 一个月, 3: 三个月

  useEffect(() => {
    // 检查AI服务状态
    checkAIStatus();
    // 获取用户练习过的学科列表
    fetchUserSubjects();
    
    // 添加欢迎消息
    setMessages([{
      role: 'assistant',
      content: `你好！我是你的智能学习助手。我可以帮你：

<h2 style="font-size: 22px; font-weight: 700; color: #262626; margin: 32px 0 20px 0; padding: 16px 0 12px 0; border-bottom: 2px solid #1890ff; background: #fff;">功能介绍</h2>

<table style="border-collapse: collapse; width: 100%; margin: 20px 0; border: 1px solid #e8e8e8; border-radius: 0; overflow: hidden; box-shadow: none; background: white; display: table;">
  <thead>
    <tr>
      <th style="border: 1px solid #e8e8e8; padding: 12px 16px; text-align: center; background: #f5f5f5; font-weight: 600; color: #262626; border-bottom: 2px solid #e8e8e8;">功能</th>
      <th style="border: 1px solid #e8e8e8; padding: 12px 16px; text-align: center; background: #f5f5f5; font-weight: 600; color: #262626; border-bottom: 2px solid #e8e8e8;">描述</th>
      <th style="border: 1px solid #e8e8e8; padding: 12px 16px; text-align: center; background: #f5f5f5; font-weight: 600; color: #262626; border-bottom: 2px solid #e8e8e8;">状态</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background: #fff;">
      <td style="border: 1px solid #e8e8e8; padding: 12px 16px; text-align: left; color: #333; line-height: 1.6;">问答系统</td>
      <td style="border: 1px solid #e8e8e8; padding: 12px 16px; text-align: left; color: #333; line-height: 1.6;">回答学习相关问题</td>
      <td style="border: 1px solid #e8e8e8; padding: 12px 16px; text-align: left; color: #333; line-height: 1.6;">✅ 可用</td>
    </tr>
    <tr style="background: #fafafa;">
      <td style="border: 1px solid #e8e8e8; padding: 12px 16px; text-align: left; color: #333; line-height: 1.6;">学习计划</td>
      <td style="border: 1px solid #e8e8e8; padding: 12px 16px; text-align: left; color: #333; line-height: 1.6;">生成个性化学习计划</td>
      <td style="border: 1px solid #e8e8e8; padding: 12px 16px; text-align: left; color: #333; line-height: 1.6;">✅ 可用</td>
    </tr>
    <tr style="background: #fff;">
      <td style="border: 1px solid #e8e8e8; padding: 12px 16px; text-align: left; color: #333; line-height: 1.6;">学习总结</td>
      <td style="border: 1px solid #e8e8e8; padding: 12px 16px; text-align: left; color: #333; line-height: 1.6;">生成学习总结报告</td>
      <td style="border: 1px solid #e8e8e8; padding: 12px 16px; text-align: left; color: #333; line-height: 1.6;">✅ 可用</td>
    </tr>
  </tbody>
</table>

<h3 style="font-size: 18px; font-weight: 600; color: #262626; margin: 24px 0 12px 0;">使用说明</h3>

<ol style="margin: 16px 0; padding-left: 20px; line-height: 1.8; color: #333;">
  <li style="margin: 10px 0; font-size: 15px; padding: 8px 0;"><strong>直接对话</strong>：在下方输入框中输入你的问题</li>
  <li style="margin: 10px 0; font-size: 15px; padding: 8px 0;"><strong>生成计划</strong>：填写学习目标和时间，点击"生成学习计划"</li>
  <li style="margin: 10px 0; font-size: 15px; padding: 8px 0;"><strong>生成总结</strong>：选择学科后点击"生成学习总结"按钮</li>
</ol>

<p style="margin: 12px 0; line-height: 1.8; color: #333; font-size: 15px;"><strong>示例问题</strong>：</p>
<ul style="margin: 16px 0; padding-left: 0; line-height: 1.8; background: #fff; border-left: none; list-style: none;">
  <li style="padding: 10px 0; font-size: 15px; line-height: 1.8; color: #333; border-bottom: 1px solid #f0f0f0; list-style: none; margin-left: 0; padding-left: 0;">- 如何学习编程语言？</li>
  <li style="padding: 10px 0; font-size: 15px; line-height: 1.8; color: #333; border-bottom: 1px solid #f0f0f0; list-style: none; margin-left: 0; padding-left: 0;">- 帮我制定一个3个月的编程学习计划</li>
  <li style="padding: 10px 0; font-size: 15px; line-height: 1.8; color: #333; border-bottom: none; list-style: none; margin-left: 0; padding-left: 0;">- 总结我今天学过的内容</li>
</ul>

<p style="margin: 12px 0; line-height: 1.8; color: #333; font-size: 15px;">请告诉我你需要什么帮助？</p>`,
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    // 自动滚动到底部
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAIStatus = async () => {
    try {
      setAiStatus('checking');
      const status = await aiAssistantService.checkStatus();
      setAiStatus(status.status === 'available' ? 'available' : 'unavailable');
    } catch (error) {
      console.error('检查AI服务状态失败:', error);
      setAiStatus('unavailable');
    }
  };
  
  const fetchUserSubjects = async () => {
    try {
      setIsLoadingSubjects(true);
      // 使用学习分析服务从数据库获取学科列表
      const subjectOptions = await learningAnalyticsService.getSubjects();
      setSubjects(subjectOptions);
    } catch (error) {
      console.error('获取学科列表失败:', error);
      // 不显示错误提示，允许用户继续使用其他功能
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  // 新增：根据选择的学科获取知识点
  const fetchKnowledgePoints = async (subjectName: string) => {
    if (!subjectName) {
      setKnowledgePoints([]);
      setSelectedKnowledgePoints([]);
      return;
    }
    
    try {
      setIsLoadingKnowledgePoints(true);
      console.log(`开始获取${subjectName}学科的知识点数据`);
      // 使用学习分析服务从数据库获取真实的知识点
      const knowledgePointOptions = await learningAnalyticsService.getKnowledgePointsBySubject(subjectName);
      
      console.log(`成功获取${subjectName}学科的${knowledgePointOptions.length}个知识点`);
      // 直接使用从服务获取的知识点，不做任何额外处理
      setKnowledgePoints(knowledgePointOptions);
      setSelectedKnowledgePoints([]); // 重置知识点选择
    } catch (error) {
      console.error('获取知识点失败:', error);
      setKnowledgePoints([]);
      setSelectedKnowledgePoints([]);
    } finally {
      setIsLoadingKnowledgePoints(false);
    }
  };

  // 新增：处理学科选择变化
  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    fetchKnowledgePoints(value);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const stream = await aiAssistantService.chat(inputValue);
      
      // 先添加空的助手消息
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      await readStream(
        stream,
        (chunk) => {
          // 直接更新状态，确保快速响应
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessageIndex = newMessages.length - 1;
            if (lastMessageIndex >= 0) {
              const lastMessage = newMessages[lastMessageIndex];
              if (lastMessage && lastMessage.role === 'assistant') {
                newMessages[lastMessageIndex] = {
                  ...lastMessage,
                  content: lastMessage.content + chunk
                };
              }
            }
            return newMessages;
          });
        },
        () => {
          // 流读取完成
          setLoading(false);
        },
        (error) => {
          console.error('读取流失败:', error);
          message.error('AI响应失败，请稍后重试');
          setLoading(false);
        }
      );
    } catch (error: any) {
      console.error('发送消息失败:', error);
      message.error(error.message || '发送消息失败，请稍后重试');
      setLoading(false);
    }
  };

  const handleGenerateStudyPlan = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    // 根据时间范围计算目标日期
    let calculatedTargetDate = targetDate;
    if (!targetDate && timeRange) {
      const now = new Date();
      const daysToAdd = parseInt(timeRange) === 1 ? 7 : 
                       parseInt(timeRange) === 2 ? 30 : 90;
      now.setDate(now.getDate() + daysToAdd);
      calculatedTargetDate = now.toISOString().split('T')[0]; // YYYY-MM-DD格式
    }

    // 构建用户消息
    let content = '生成学习计划';
    if (goal) content += `，目标：${goal}`;
    if (selectedSubject) content += `，学科：${selectedSubject}`;
    if (selectedKnowledgePoints.length > 0) content += `，知识点：${selectedKnowledgePoints.join('、')}`;
    if (calculatedTargetDate) {
      const timeRangeText = timeRange === '1' ? '一周内' : 
                           timeRange === '2' ? '一个月内' : '三个月内';
      content += `，计划时间：${timeRangeText}（目标日期：${calculatedTargetDate}）`;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setGoal('');
    setTargetDate('');

    try {
      // 获取学科学习情况
      let learningSituation = '';
      if (selectedSubject) {
        try {
          const overview = await learningAnalyticsService.getSubjectLearningOverview(selectedSubject);
          learningSituation = JSON.stringify({
            subject: overview.subjectName,
            averageScore: overview.averageScore,
            accuracy: overview.accuracy,
            strengths: overview.strengths,
            weaknesses: overview.weaknesses,
            totalPracticeCount: overview.totalPracticeCount
          });
        } catch (error) {
          console.error('获取学习情况失败:', error);
        }
      }

      // 调用API时传递所有参数
      // 对于多选的知识点，将数组转为逗号分隔的字符串
      const knowledgePointsParam = selectedKnowledgePoints.length > 0 
        ? selectedKnowledgePoints.join(',') 
        : undefined;
        
      const stream = await aiAssistantService.generateStudyPlan(
        goal || undefined, 
        calculatedTargetDate || undefined,
        selectedSubject || undefined,
        knowledgePointsParam,
        learningSituation // 传递学习情况
      );
      
      // 先添加空的助手消息
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      await readStream(
        stream,
        (chunk) => {
          // 使用函数式更新确保正确累加内容，实时显示
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessageIndex = newMessages.length - 1;
            if (lastMessageIndex >= 0) {
              const lastMessage = newMessages[lastMessageIndex];
              if (lastMessage && lastMessage.role === 'assistant') {
                // 累加内容而不是替换，确保实时显示
                newMessages[lastMessageIndex] = {
                  ...lastMessage,
                  content: lastMessage.content + chunk
                };
              }
            }
            return newMessages;
          });
        },
        () => {
          setLoading(false);
        },
        (error) => {
          console.error('生成学习计划失败:', error);
          message.error('生成学习计划失败，请稍后重试');
          setLoading(false);
        }
      );
    } catch (error: any) {
      console.error('生成学习计划失败:', error);
      message.error(error.message || '生成学习计划失败，请稍后重试');
      setLoading(false);
    }
  };

  const handleGenerateStudySummary = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    // 构建用户消息内容
    const userMessageContent = selectedSubject ? 
      `生成${selectedSubject}学科的学习总结` : 
      '生成学习总结';

    const userMessage: ChatMessage = {
      role: 'user',
      content: userMessageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const stream = await aiAssistantService.generateStudySummary(selectedSubject);
      
      // 先添加空的助手消息
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      await readStream(
        stream,
        (chunk) => {
          // 使用函数式更新确保正确累加内容，实时显示
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessageIndex = newMessages.length - 1;
            if (lastMessageIndex >= 0) {
              const lastMessage = newMessages[lastMessageIndex];
              if (lastMessage && lastMessage.role === 'assistant') {
                // 累加内容而不是替换，确保实时显示
                newMessages[lastMessageIndex] = {
                  ...lastMessage,
                  content: lastMessage.content + chunk
                };
              }
            }
            return newMessages;
          });
        },
        () => {
          setLoading(false);
        },
        (error) => {
          console.error('生成学习总结失败:', error);
          message.error('生成学习总结失败，请稍后重试');
          setLoading(false);
        }
      );
    } catch (error: any) {
      console.error('生成学习总结失败:', error);
      message.error(error.message || '生成学习总结失败，请稍后重试');
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([{
      role: 'assistant',
      content: '你好！我是你的智能学习助手。我可以帮你：\n1. 回答学习相关问题\n2. 生成个性化学习计划\n3. 生成学习总结报告\n\n请告诉我你需要什么帮助？',
      timestamp: new Date()
    }]);
  };

  return (
    <div className="ai-assistant-page">
      <Card>
        <div className="ai-assistant-header">
          <Space>
            <RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>AI学习助手</Title>
            {aiStatus === 'available' && <Tag color="green">服务可用</Tag>}
            {aiStatus === 'unavailable' && <Tag color="red">服务不可用</Tag>}
            {aiStatus === 'checking' && <Tag color="blue">检查中...</Tag>}
          </Space>
          <Button icon={<ReloadOutlined />} onClick={checkAIStatus} size="small">
            刷新状态
          </Button>
        </div>

        {/* 快捷操作 */}
        <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
          <Col span={24}>
            <Card className="mb-4" size="small" title="快捷操作（基于学习统计的数据生成）">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12} lg={8}>
                  <Input
                    placeholder="学习目标（可选）"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Select
                    placeholder="选择学科"
                    style={{ width: '100%' }}
                    value={selectedSubject}
                    onChange={handleSubjectChange}
                    allowClear
                    loading={isLoadingSubjects}
                    disabled={loading}
                    options={subjects}
                  />
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Select
                    placeholder="知识点（先选择学科，可多选）"
                    style={{ width: '100%' }}
                    value={selectedKnowledgePoints}
                    onChange={setSelectedKnowledgePoints}
                    allowClear
                    mode="multiple"
                    loading={isLoadingKnowledgePoints}
                    disabled={!selectedSubject || isLoadingKnowledgePoints || loading}
                    options={knowledgePoints}
                    maxTagCount="responsive"
                  />
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Radio.Group
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="1">一周内</Radio.Button>
                    <Radio.Button value="2">一个月内</Radio.Button>
                    <Radio.Button value="3">三个月内</Radio.Button>
                  </Radio.Group>
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Input
                    placeholder="目标日期（YYYY-MM-DD，可选）"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={24} md={12} lg={8}>
                  <Button
                    type="primary"
                    icon={<CalendarOutlined />}
                    onClick={handleGenerateStudyPlan}
                    loading={loading}
                    disabled={loading}
                    block
                  >
                    生成学习计划
                  </Button>
                </Col>
              </Row>
              <Divider />
              <Row gutter={16}>
                <Col span={24}>
                  <Button
                    type="default"
                    icon={<FileTextOutlined />}
                    onClick={handleGenerateStudySummary}
                    loading={loading}
                    disabled={loading}
                    block
                  >
                    {selectedSubject ? `生成${selectedSubject}学科总结` : '生成学习总结'}
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* 聊天区域 */}
        <div className="chat-container">
          {messages.length === 0 ? (
            <Empty description="开始与AI助手对话吧" />
          ) : (
            <div className="messages-list">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message-item ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
                >
                  <div className="message-avatar">
                    {message.role === 'user' ? (
                      <UserOutlined style={{ fontSize: 20 }} />
                    ) : (
                      <RobotOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                    )}
                  </div>
                  <div className="message-content">
                    {message.role === 'assistant' ? (
                      <div>
                        {message.content ? (
                          /<\/?[a-z][\s\S]*>/i.test(message.content) || message.content.includes('&lt;') ? (
                            <div 
                              className="markdown-content"
                              dangerouslySetInnerHTML={{ 
                                __html: message.content
                                  .replace(/&lt;/g, '<')
                                  .replace(/&gt;/g, '>')
                                  .replace(/&amp;/g, '&')
                                  .replace(/&quot;/g, '"')
                                  .replace(/&#39;/g, "'")
                                  .replace(/<\w*style='([^']*)'>([\s\S]*?)<\/\w*style='([^']*)'>/g, '<div style="$1">$2</div>')
                                  .replace(/(\w+)style=/g, '$1 style=')
                                  .replace(/<table/g, '<table')
                                  .replace(/<thead/g, '<thead')
                                  .replace(/<\/thead/g, '</thead')
                                  .replace(/<tbody/g, '<tbody')
                                  .replace(/<\/tbody/g, '</tbody')
                                  .replace(/<tr/g, '<tr')
                                  .replace(/<\/tr/g, '</tr')
                                  .replace(/<th([^>]*?)>([^<]*?)(?=<\/?t[dhr]|<\/table|<t[dhr]|<table|$)/g, '<th$1>$2</th>')
                                  .replace(/<td([^>]*?)>([^<]*?)(?=<\/?t[dhr]|<\/table|<t[dhr]|<table|$)/g, '<td$1>$2</td>')
                                  .replace(/style='([^']*)'/g, (match) => {
                                    return match.replace(/(\w+):([\d#a-zA-Z]+)/g, '$1: $2');
                                  })
                                  .replace(/<h2>(.*?)<\/h2>/g, '<h2>$1</h2>')
                                  .replace(/<h3>(.*?)<\/h3>/g, '<h3>$1</h3>')
                              }} 
                              style={{ lineHeight: '1.8', fontSize: '14px' }}
                            />
                          ) : (
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              className="markdown-content"
                              style={{ lineHeight: '1.8', fontSize: '14px' }}
                            >
                              {normalizeMarkdown(message.content)}
                            </ReactMarkdown>
                          )
                        ) : (
                          <div style={{ color: '#999' }}>暂无内容</div>
                        )}
                      </div>
                    ) : (
                      <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                        {message.content}
                      </Paragraph>
                    )}
                    {message.timestamp && (
                      <div className="message-time">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message-item assistant-message">
                  <div className="message-avatar">
                    <RobotOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                  </div>
                  <div className="message-content">
                    <Spin size="small" />
                    <span style={{ marginLeft: 8 }}>AI正在思考...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="input-container">
          <Space.Compact style={{ width: '100%' }}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="输入你的问题或需求..."
              autoSize={{ minRows: 2, maxRows: 4 }}
              disabled={loading || aiStatus === 'unavailable'}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              disabled={!inputValue.trim() || loading || aiStatus === 'unavailable'}
              style={{ height: 'auto' }}
            >
              发送
            </Button>
          </Space.Compact>
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <Button size="small" onClick={handleClear} disabled={loading}>
              清空对话
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIAssistantPage;

