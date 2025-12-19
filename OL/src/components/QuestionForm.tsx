import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  Card,
  Divider,
  message,
  Row,
  Col,
  Upload
} from 'antd';
import { Question, QuestionType, DifficultyLevel, KnowledgePoint } from '../types';
import { generateId } from '../utils';
import { knowledgePointApi, commonApi, questionApi } from '../services/api';
import { authService } from '../services/authService';
import QuestionOptions from './QuestionOptions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Option } = Select;
const { TextArea } = Input;

interface QuestionFormProps {
  question?: Question | null;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ question, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.SINGLE_CHOICE);
  const [options, setOptions] = useState<string[]>([]);
  const [availableKnowledgePoints, setAvailableKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loadingKnowledgePoints, setLoadingKnowledgePoints] = useState(false);
  const [pendingImages, setPendingImages] = useState<Map<string, File>>(new Map());
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handleTitleBlur = async () => {
    const title = form.getFieldValue('title');
    if (!title || !title.trim()) {
      setDuplicateWarning(null);
      return;
    }
    // 编辑模式下，如果标题未修改，则不检查
    if (question && question.title === title.trim()) {
      setDuplicateWarning(null);
      return;
    }

    try {
      const res = await questionApi.checkDuplicates([title.trim()]);
      if (res.data && res.data.code === 200 && res.data.object && res.data.object.length > 0) {
        setDuplicateWarning('该题目内容已存在于题库中');
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {
      console.error('检查重复失败:', e);
    }
  };

  // 监听字段以实现实时预览
  const titleValue = Form.useWatch('title', form);
  const explanationValue = Form.useWatch('explanation', form);

  // Markdown 预览组件
  const MarkdownPreview = ({ content, label }: { content: string; label: string }) => {
    if (!content) return null;
    return (
      <div style={{
        marginTop: 8,
        padding: '8px 12px',
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
        border: '1px solid #d9d9d9'
      }}>
        <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>{label} 预览：</div>
        <div className="markdown-preview" style={{
          maxWidth: '100%',
          overflow: 'hidden',
          lineHeight: '1.6'
        }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            urlTransform={(uri) => uri.startsWith('blob:') ? uri : uri}
            components={{
              img: ({ node, ...props }) => (
                <img {...props} style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '8px 0' }} alt="预览图片" />
              )
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (question) {
      form.setFieldsValue(question);
      setQuestionType(question.type);
      setOptions(question.options || []);
    } else {
      form.resetFields();
      setQuestionType(QuestionType.SINGLE_CHOICE);
      setOptions([]);
    }
  }, [question, form]);

  // 加载知识点
  useEffect(() => {
    loadKnowledgePoints();
  }, []);

  // 监听表单选项变化
  const formOptions = Form.useWatch('options', form);
  useEffect(() => {
    if (formOptions && Array.isArray(formOptions)) {
      setOptions(formOptions);
    }
  }, [formOptions]);

  // 加载知识点列表
  const loadKnowledgePoints = async () => {
    try {
      setLoadingKnowledgePoints(true);
      const response = await knowledgePointApi.getKnowledgePoints();
      if (response && response.data && response.data.data) {
        setAvailableKnowledgePoints(response.data.data);
      }
    } catch (error) {
      console.error('加载知识点失败:', error);
      message.error('加载知识点失败');
    } finally {
      setLoadingKnowledgePoints(false);
    }
  };

  const isChoiceQuestion = questionType === QuestionType.SINGLE_CHOICE ||
    questionType === QuestionType.MULTIPLE_CHOICE;

  const isFillBlankQuestion = questionType === QuestionType.FILL_BLANK;

  // 当选项变化时，清空正确答案选择
  useEffect(() => {
    if (isChoiceQuestion && options.length > 0) {
      const currentAnswer = form.getFieldValue('correctAnswer');
      if (currentAnswer) {
        // 检查当前答案是否仍然有效
        if (Array.isArray(currentAnswer)) {
          // 多选题
          const validAnswers = currentAnswer.filter(answer => {
            const index = answer.charCodeAt(0) - 65;
            return index >= 0 && index < options.length;
          });
          if (validAnswers.length !== currentAnswer.length) {
            form.setFieldsValue({ correctAnswer: validAnswers.length > 0 ? validAnswers : undefined });
          }
        } else {
          // 单选题
          const index = currentAnswer.charCodeAt(0) - 65;
          if (index < 0 || index >= options.length) {
            form.setFieldsValue({ correctAnswer: undefined });
          }
        }
      }
    }
  }, [options, isChoiceQuestion, form]);

  const uploadAndReplaceImages = async (content: string) => {
    if (!content) return content;
    let newContent = content;
    const urlPattern = /!\[.*?\]\((blob:.*?)\)/g;
    const matches = Array.from(content.matchAll(urlPattern));

    for (const match of matches) {
      const tempUrl = match[1];
      const file = pendingImages.get(tempUrl);
      if (file) {
        try {
          const res = await commonApi.uploadImage(file);
          const responseData = res.data?.object;
          const finalUrl = typeof responseData === 'string' ? responseData : responseData?.url;
          if (finalUrl) {
            newContent = newContent.replace(tempUrl, finalUrl);
          }
        } catch (error) {
          console.error('图片上传失败:', error);
          throw new Error('部分图片上传失败，请稍后重试');
        }
      }
    }
    return newContent;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      try {
        // 处理图片上传
        let finalTitle = values.title;
        let finalExplanation = values.explanation || '';

        finalTitle = await uploadAndReplaceImages(finalTitle);
        finalExplanation = await uploadAndReplaceImages(finalExplanation);

        let finalOptions = values.options;
        if (Array.isArray(finalOptions)) {
          finalOptions = await Promise.all(finalOptions.map(async (opt) => {
            return await uploadAndReplaceImages(opt);
          }));
        }

        const currentUser = authService.getCurrentUser();
        const questionData: Question = {
          id: question?.id || generateId(),
          title: finalTitle,
          type: values.type,
          difficulty: values.difficulty,
          knowledgePoints: values.knowledgePoints || [],
          tags: values.tags || [],
          options: finalOptions || undefined,
          correctAnswer: values.correctAnswer,
          explanation: finalExplanation,
          source: values.source,
          creatorId: question?.creatorId || currentUser?.id || 0,
          createTime: question?.createTime || new Date().toISOString(),
          updateTime: new Date().toISOString(),
        };

        onSave(questionData);
      } catch (uploadError: any) {
        message.error(uploadError.message || '图片上传失败');
      } finally {
        setLoading(false);
      }
    } catch (error) {
      message.error('请检查表单填写是否完整');
    }
  };

  const handleTypeChange = (type: QuestionType) => {
    setQuestionType(type);
    // 清空选项和答案
    setOptions([]);
    form.setFieldsValue({
      options: undefined,
      correctAnswer: undefined,
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        type: QuestionType.SINGLE_CHOICE,
        difficulty: DifficultyLevel.MEDIUM,
        knowledgePoints: [],
        tags: [],
      }}
    >
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="type"
              label="题型"
              rules={[{ required: true, message: '请选择题型' }]}
            >
              <Select onChange={handleTypeChange}>
                <Option value={QuestionType.SINGLE_CHOICE}>单选题</Option>
                <Option value={QuestionType.MULTIPLE_CHOICE}>多选题</Option>
                <Option value={QuestionType.FILL_BLANK}>填空题</Option>
                <Option value={QuestionType.TRUE_FALSE}>判断题</Option>
                <Option value={QuestionType.SHORT_ANSWER}>简答题</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="difficulty"
              label="难度"
              rules={[{ required: true, message: '请选择难度' }]}
            >
              <Select>
                <Option value={DifficultyLevel.EASY}>简单</Option>
                <Option value={DifficultyLevel.MEDIUM}>中等</Option>
                <Option value={DifficultyLevel.HARD}>困难</Option>
                <Option value={DifficultyLevel.EXPERT}>专家</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="题目内容" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="title"
          label={
            <Space>
              <span>题目</span>
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error('请上传图片文件');
                    return false;
                  }
                  const tempUrl = URL.createObjectURL(file);
                  setPendingImages(prev => new Map(prev).set(tempUrl, file));
                  const current = form.getFieldValue('title') || '';
                  form.setFieldsValue({ title: current + `\n![图片](${tempUrl})\n` });
                  return false;
                }}
              >
                <Button size="small" type="link">插入图片</Button>
              </Upload>
            </Space>
          }
          rules={[{ required: true, message: '请输入题目内容' }]}
        >
          <TextArea
            rows={4}
            placeholder="请输入题目内容..."
            showCount
            maxLength={1000}
            onBlur={handleTitleBlur}
          />
          {duplicateWarning && (
            <div style={{ color: '#faad14', marginTop: 8 }}>
              ⚠️ {duplicateWarning}
            </div>
          )}
          <MarkdownPreview content={titleValue} label="题目" />
        </Form.Item>

        <QuestionOptions
          questionType={questionType}
          value={options}
          onChange={(newOpts) => {
            setOptions(newOpts);
            form.setFieldsValue({ options: newOpts });
          }}
          onImageSelect={(file) => {
            const tempUrl = URL.createObjectURL(file);
            setPendingImages(prev => new Map(prev).set(tempUrl, file));
            return tempUrl;
          }}
        />

        {isFillBlankQuestion && (
          <Form.Item
            name="correctAnswer"
            label="正确答案"
            rules={[{ required: true, message: '请输入正确答案' }]}
          >
            <Input placeholder="请输入正确答案，多个答案用逗号分隔" />
          </Form.Item>
        )}

        {questionType === QuestionType.TRUE_FALSE && (
          <Form.Item
            name="correctAnswer"
            label="正确答案"
            rules={[{ required: true, message: '请选择正确答案' }]}
          >
            <Select placeholder="请选择正确答案">
              <Option value="true">正确</Option>
              <Option value="false">错误</Option>
            </Select>
          </Form.Item>
        )}

        {isChoiceQuestion && (
          <Form.Item
            name="correctAnswer"
            label="正确答案"
            rules={[{ required: true, message: '请选择正确答案' }]}
          >
            <Select
              mode={questionType === QuestionType.MULTIPLE_CHOICE ? 'multiple' : undefined}
              placeholder={questionType === QuestionType.MULTIPLE_CHOICE ? '请选择多个正确答案' : '请选择正确答案'}
              disabled={options.length === 0}
            >
              {options.map((option: string, index: number) => (
                <Option key={index} value={String.fromCharCode(65 + index)}>
                  {String.fromCharCode(65 + index)}. {option}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {questionType === QuestionType.SHORT_ANSWER && (
          <Form.Item
            name="correctAnswer"
            label="参考答案"
            rules={[{ required: true, message: '请输入参考答案' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入参考答案..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        )}
      </Card>

      <Card title="分类信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="knowledgePoints"
              label="知识点"
              rules={[{ required: true, message: '请选择至少一个知识点' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择知识点"
                style={{ width: '100%' }}
                loading={loadingKnowledgePoints}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={availableKnowledgePoints.map(kp => ({
                  value: kp.id,
                  label: kp.name,
                  subject: kp.subject
                }))}
                optionRender={(option) => (
                  <div>
                    <div>{option.label}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {option.data.subject}
                    </div>
                  </div>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="tags"
              label="标签"
            >
              <Select
                mode="tags"
                placeholder="输入标签，按回车添加"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="其他信息" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          name="explanation"
          label={
            <Space>
              <span>解析</span>
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error('请上传图片文件');
                    return false;
                  }
                  const tempUrl = URL.createObjectURL(file);
                  setPendingImages(prev => new Map(prev).set(tempUrl, file));
                  const current = form.getFieldValue('explanation') || '';
                  form.setFieldsValue({ explanation: current + `\n![解析图片](${tempUrl})\n` });
                  return false;
                }}
              >
                <Button size="small" type="link">插入图片</Button>
              </Upload>
            </Space>
          }
        >
          <TextArea
            rows={3}
            placeholder="请输入题目解析..."
            showCount
            maxLength={500}
          />
          <MarkdownPreview content={explanationValue} label="解析" />
        </Form.Item>

        <Form.Item
          name="source"
          label="来源"
        >
          <Input placeholder="请输入题目来源..." />
        </Form.Item>
      </Card >

      <Divider />

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {question ? '更新' : '保存'}
          </Button>
        </Space>
      </div>
    </Form >
  );
};

export default QuestionForm;
