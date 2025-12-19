import React, { useState, useEffect, useRef } from 'react';
import {
  Input,
  Button,
  Typography,
  message,
  Spin,
  Select,
  Row,
  Col,
  Radio,
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  ReloadOutlined,
  RocketOutlined,
  CloseOutlined,
  BulbOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiAssistantService, readStream, ChatMessage } from '../services/aiAssistantService';
import { learningAnalyticsService } from '../services/learningAnalyticsService';
import './AIAssistantPage.css';

const { TextArea } = Input;
const { Title, Text } = Typography;
// const { Option } = Select;

// Helper function to format HTML content to Markdown
const formatMessageContent = (content: string) => {
  if (!content) return '';

  let formatted = content;

  // 1. Handle Tables
  // Match full table blocks
  formatted = formatted.replace(/<table[\s\S]*?>([\s\S]*?)<\/table>/gi, (_match, tableContent) => {
    const rows: string[] = [];
    let isHeader = true;

    // Extract rows
    const rowMatches = tableContent.match(/<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi);

    if (rowMatches) {
      rowMatches.forEach((row: string) => {
        // Extract cells
        const cells = row.match(/<(?:td|th)[\s\S]*?>([\s\S]*?)<\/(?:td|th)>/gi);
        if (cells) {
          const cellContents = cells.map((cell: string) => {
            return cell.replace(/<(?:td|th)[\s\S]*?>([\s\S]*?)<\/(?:td|th)>/i, '$1').trim();
          });

          rows.push(`| ${cellContents.join(' | ')} |`);

          // If this was a header row (checked by looking for 'th' in the original row string), add separator
          if (isHeader && /<th/i.test(row)) {
            const separator = cellContents.map(() => '---').join(' | ');
            rows.push(`| ${separator} |`);
            isHeader = false;
          }
        }
      });
    }

    return '\n' + rows.join('\n') + '\n';
  });

  // 2. Handle Lists
  formatted = formatted.replace(/<ul[\s\S]*?>/gi, '\n');
  formatted = formatted.replace(/<\/ul>/gi, '\n');
  formatted = formatted.replace(/<li[\s\S]*?>([\s\S]*?)<\/li>/gi, '- $1\n');

  // 3. Handle Headers
  formatted = formatted.replace(/<h([1-6])[\s\S]*?>([\s\S]*?)<\/h\1>/gi, (_match, level, text) => {
    return '\n' + '#'.repeat(Number(level)) + ' ' + text + '\n';
  });

  // 4. Handle other tags
  formatted = formatted.replace(/<p[\s\S]*?>([\s\S]*?)<\/p>/gi, '\n$1\n');
  formatted = formatted.replace(/<div[\s\S]*?>([\s\S]*?)<\/div>/gi, '\n$1\n');
  formatted = formatted.replace(/<blockquote[\s\S]*?>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n');
  formatted = formatted.replace(/<strong[\s\S]*?>([\s\S]*?)<\/strong>/gi, '**$1**');
  formatted = formatted.replace(/<b[\s\S]*?>([\s\S]*?)<\/b>/gi, '**$1**');
  formatted = formatted.replace(/<em[\s\S]*?>([\s\S]*?)<\/em>/gi, '*$1*');
  formatted = formatted.replace(/<i[\s\S]*?>([\s\S]*?)<\/i>/gi, '*$1*');
  formatted = formatted.replace(/<br\s*\/?>/gi, '\n');

  // Clean up extra newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  return formatted;
};

const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<'available' | 'unavailable' | 'checking'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tools Panel State
  const [showTools, setShowTools] = useState(false);
  const [toolMode, setToolMode] = useState<'plan' | 'summary'>('plan');

  // Form State
  const [goal, setGoal] = useState('');
  const [targetDate] = useState('');
  const [subjects, setSubjects] = useState<Array<{ label: string; value: string }>>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [knowledgePoints, setKnowledgePoints] = useState<Array<{ label: string; value: string }>>([]);
  const [selectedKnowledgePoints, setSelectedKnowledgePoints] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<string>('1');

  useEffect(() => {
    checkAIStatus();
    fetchUserSubjects();
    setMessages([{
      role: 'assistant',
      content: `你好！我是你的智能学习助手。我可以帮你制定学习计划、解答疑难问题，或者生成学习总结。点击下方的快捷工具开始吧！`,
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
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
    } catch {
      setAiStatus('unavailable');
    }
  };

  const fetchUserSubjects = async () => {
    try {
      const subjectOptions = await learningAnalyticsService.getSubjects();
      setSubjects(subjectOptions);
    } catch (e) { console.error(e); }
  };

  const handleSubjectChange = async (value: string) => {
    setSelectedSubject(value);
    if (!value) {
      setKnowledgePoints([]);
      setSelectedKnowledgePoints([]);
      return;
    }
    try {
      const kpOptions = await learningAnalyticsService.getKnowledgePointsBySubject(value);
      setKnowledgePoints(kpOptions);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const stream = await aiAssistantService.chat(userMsg.content);
      await processStreamResponse(stream);
    } catch (error: any) {
      message.error(error.message || '发送失败');
      setLoading(false);
    }
  };

  const processStreamResponse = async (stream: any) => {
    setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);

    await readStream(stream,
      (chunk) => {
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastIdx = newMsgs.length - 1;
          if (lastIdx >= 0) {
            newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: newMsgs[lastIdx].content + chunk };
          }
          return newMsgs;
        });
      },
      () => setLoading(false),
      () => { setLoading(false); message.error('响应中断'); }
    );
  };

  const handleGeneratePlan = async () => {
    if (loading) return;
    setLoading(true);
    setShowTools(false);

    let calculatedDate = targetDate;
    if (!targetDate && timeRange) {
      const now = new Date();
      now.setDate(now.getDate() + (timeRange === '1' ? 7 : timeRange === '2' ? 30 : 90));
      calculatedDate = now.toISOString().split('T')[0];
    }

    const prompt = `生成学习计划，目标：${goal || '无'}，学科：${selectedSubject || '综合'}，时间：${calculatedDate}`;
    setMessages(prev => [...prev, { role: 'user', content: prompt, timestamp: new Date() }]);

    try {
      // Get basic analytics first
      let analytics = '';
      if (selectedSubject) {
        try {
          const overview = await learningAnalyticsService.getSubjectLearningOverview(selectedSubject);
          analytics = JSON.stringify(overview);
        } catch { }
      }

      const stream = await aiAssistantService.generateStudyPlan(
        goal, calculatedDate, selectedSubject, selectedKnowledgePoints.join(','), analytics
      );
      await processStreamResponse(stream);
    } catch (e) {
      setLoading(false);
      message.error('生成失败');
    }
  };

  const handleGenerateSummary = async () => {
    if (loading) return;
    setLoading(true);
    setShowTools(false);

    const prompt = selectedSubject ? `生成${selectedSubject}学科总结` : '生成学习总结';
    setMessages(prev => [...prev, { role: 'user', content: prompt, timestamp: new Date() }]);

    try {
      const stream = await aiAssistantService.generateStudySummary(selectedSubject);
      await processStreamResponse(stream);
    } catch (e) {
      setLoading(false);
      message.error('生成失败');
    }
  };

  return (
    <div className="ai-container">
      <div className="ai-glass-card">
        {/* Header */}
        <div className="ai-header">
          <div className="ai-title-group">
            <RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>AI 学习助手</Title>
            <span className={`ai-status-badge ${aiStatus}`}>
              {aiStatus === 'available' ? '在线' : aiStatus === 'checking' ? '连接中...' : '离线'}
            </span>
          </div>
          <Button icon={<ReloadOutlined />} type="text" onClick={checkAIStatus} loading={aiStatus === 'checking'} />
        </div>

        {/* Messages Area */}
        <div className="chat-messages-area">
          <div className="messages-wrapper">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message-bubble ${msg.role}`}>
                <div className={`avatar-wrapper ${msg.role === 'user' ? 'user-avatar' : 'bot-avatar'}`}>
                  {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                </div>
                <div className="message-content-wrapper">
                  <div className={`message-content-box ${msg.role === 'assistant' ? 'ai-content' : ''}`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {formatMessageContent(msg.content)}
                      </ReactMarkdown>
                    ) : (
                      <Text style={{ color: 'inherit' }}>{msg.content}</Text>
                    )}
                  </div>
                  <div className="message-timestamp">
                    {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="message-bubble assistant">
                <div className="avatar-wrapper bot-avatar"><RobotOutlined /></div>
                <div className="message-content-box">
                  <Spin size="small" /> <span style={{ marginLeft: 8 }}>思考中...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input & Tools Area */}
        <div className="input-section">

          {/* Collapsible Tools Panel */}
          {showTools && (
            <div className="tools-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Radio.Group value={toolMode} onChange={e => setToolMode(e.target.value)} buttonStyle="solid">
                  <Radio.Button value="plan">制定计划</Radio.Button>
                  <Radio.Button value="summary">生成总结</Radio.Button>
                </Radio.Group>
                <Button type="text" icon={<CloseOutlined />} onClick={() => setShowTools(false)} />
              </div>

              {toolMode === 'plan' ? (
                <Row gutter={[12, 12]}>
                  <Col span={8}><Input placeholder="学习目标" value={goal} onChange={e => setGoal(e.target.value)} /></Col>
                  <Col span={8}>
                    <Select placeholder="选择学科" style={{ width: '100%' }} value={selectedSubject} onChange={handleSubjectChange} options={subjects} />
                  </Col>
                  <Col span={8}>
                    <Select placeholder="知识点" mode="multiple" style={{ width: '100%' }} value={selectedKnowledgePoints} onChange={setSelectedKnowledgePoints} options={knowledgePoints} disabled={!selectedSubject} />
                  </Col>
                  <Col span={12}>
                    <Radio.Group value={timeRange} onChange={e => setTimeRange(e.target.value)}>
                      <Radio value="1">1周</Radio>
                      <Radio value="2">1月</Radio>
                      <Radio value="3">3月</Radio>
                    </Radio.Group>
                  </Col>
                  <Col span={24}>
                    <Button type="primary" block onClick={handleGeneratePlan} icon={<RocketOutlined />}>立即生成计划</Button>
                  </Col>
                </Row>
              ) : (
                <Row gutter={[12, 12]}>
                  <Col span={24}>
                    <Select placeholder="选择学科 (可选)" style={{ width: '100%' }} value={selectedSubject} onChange={setSelectedSubject} options={subjects} />
                  </Col>
                  <Col span={24}>
                    <Button type="primary" block onClick={handleGenerateSummary} icon={<BulbOutlined />}>生成学习总结</Button>
                  </Col>
                </Row>
              )}
            </div>
          )}

          {/* Quick Actions Bar */}
          {!showTools && (
            <div className="quick-actions-bar">
              <Button className="quick-action-btn" icon={<RocketOutlined />} onClick={() => { setShowTools(true); setToolMode('plan'); }}>
                制定学习计划
              </Button>
              <Button className="quick-action-btn" icon={<BulbOutlined />} onClick={() => { setShowTools(true); setToolMode('summary'); }}>
                生成学习总结
              </Button>
            </div>
          )}

          {/* Main Input */}
          <div className="chat-input-wrapper">
            <TextArea
              className="custom-textarea"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="输入您的问题..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              onPressEnter={e => {
                if (!e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
            <Button
              type="primary"
              className="send-btn"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!inputValue.trim()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
