import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Table,
  message,
  Progress,
  Space,
  Tag,
  Typography,
  Alert,
  Divider,
  Row,
  Col,
  Statistic,
  Collapse
} from 'antd';
import {
  UploadOutlined,
  FileWordOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { parseWordDocument, parseExcelDocument, validateQuestions, ParsedQuestion } from '../utils/documentParser';
import { questionService } from '../services/questionService';
import { subjectApi, knowledgePointApi, commonApi, questionApi } from '../services/api';

const { Title, Text } = Typography;
const { Dragger } = Upload;

// Base64转File对象
const base64ToFile = (base64Data: string, filename: string) => {
  const arr = base64Data.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// 处理文本中的Base64图片并上传
const uploadAndReplaceImages = async (text: string): Promise<string> => {
  if (!text) return text;

  // 正则匹配markdown图片，捕获alt文本和Base64 Data URI
  const imgRegex = /!\[(.*?)\]\((data:image\/[^;]+;base64,[^)]+)\)/g;
  const matches = Array.from(text.matchAll(imgRegex));

  if (matches.length === 0) return text;

  let newText = text;
  const replacements: { old: string, new: string }[] = [];

  for (const match of matches) {
    const fullMatch = match[0];
    const altText = match[1];
    const base64Url = match[2];

    try {
      // 生成随机文件名
      const ext = base64Url.substring(base64Url.indexOf('/') + 1, base64Url.indexOf(';'));
      const filename = `import_img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;

      const file = base64ToFile(base64Url, filename);
      const response = await commonApi.uploadImage(file);

      if (response.data && response.data.code === 200) {
        const uploadedUrl = response.data.data.url;
        replacements.push({
          old: fullMatch,
          new: `![${altText}](${uploadedUrl})`
        });
      }
    } catch (e) {
      console.error('Image upload failed', e);
    }
  }

  // 执行替换
  for (const rep of replacements) {
    newText = newText.replace(rep.old, rep.new);
  }
  return newText;
};

// 题干截断组件
const TruncatedText: React.FC<{ text: string; maxLength?: number }> = ({ text, maxLength = 80 }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text || typeof text !== 'string') {
    return <span>-</span>;
  }

  // 解码HTML实体
  const decodeHtml = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  const decodedText = decodeHtml(text);
  const plainText = decodedText.replace(/<[^>]*>/g, '');
  const textLength = plainText.length;

  if (textLength <= maxLength) {
    return <span>{decodedText}</span>;
  }

  return (
    <span>
      {expanded ? (
        <>
          <span>{decodedText}</span>
          <Button
            type="link"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
            style={{ padding: 0, height: 'auto', fontSize: '12px' }}
          >
            收起
          </Button>
        </>
      ) : (
        <>
          <span>{decodedText.substring(0, maxLength)}...</span>
          <Button
            type="link"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
            style={{ padding: 0, height: 'auto', fontSize: '12px' }}
          >
            展开
          </Button>
        </>
      )}
    </span>
  );
};

interface DocumentImportProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  isSystem?: boolean; // 是否为系统题目导入
}

const DocumentImport: React.FC<DocumentImportProps> = ({
  visible,
  onCancel,
  onSuccess,
  isSystem = false
}) => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [invalidMessages, setInvalidMessages] = useState<string[]>([]); // 解析阶段的无效项提示
  const [showSubjectCheckModal, setShowSubjectCheckModal] = useState(false);
  const [missingSubjects, setMissingSubjects] = useState<Set<string>>(new Set());
  const [missingKnowledgePoints, setMissingKnowledgePoints] = useState<Map<string, Set<string>>>(new Map()); // 学科 -> 知识点集合
  const [subjectMap, setSubjectMap] = useState<Map<string, number>>(new Map()); // 学科名称 -> 学科ID
  const [knowledgePointMap, setKnowledgePointMap] = useState<Map<string, number>>(new Map()); // 学科+知识点 -> 知识点ID
  const [userConfirmedCreation, setUserConfirmedCreation] = useState(false); // 用户已确认自动创建
  // no-op

  // 重置状态
  const resetState = () => {
    setFileList([]);
    setParsedQuestions([]);
    setImporting(false);
    setImportProgress(0);
    setImportResult(null);
    setInvalidMessages([]);
    setShowSubjectCheckModal(false);
    setMissingSubjects(new Set());
    setMissingKnowledgePoints(new Map());
    setSubjectMap(new Map());
    setKnowledgePointMap(new Map());
    setUserConfirmedCreation(false);
  };

  // 名称标准化：去掉首尾空格并小写，解决 'Java' 与 'JAVA' 不匹配问题
  const normalize = (name?: string) => {
    // 统一空白：去除普通空格、NBSP、窄空格、全角空格、零宽空格
    const s = (name || '')
      .replace(/[\u00A0\u200B\u202F\u3000]/g, ' ')
      .trim()
      .toLowerCase()
      // 移除所有空白，避免“Java ”、“ Ja va”导致不匹配
      .replace(/\s+/g, '')
      // 统一全角字母为半角
      .replace(/[Ａ-Ｚａ-ｚ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 65248));
    return s;
  };

  // 将知识点字符串拆分为名称数组（保留原始大小写用于展示与创建）
  const splitKnowledgePointNames = (raw?: string): string[] => {
    if (!raw) return [];
    return raw
      .split(/[\n,，;；、|\/]+/)
      .map(s => s.replace(/[\u00A0\u200B\u202F\u3000]/g, ' ').trim())
      .filter(Boolean);
  };

  // 检查学科和知识点是否存在
  const checkSubjectsAndKnowledgePoints = async (questions: ParsedQuestion[]) => {
    try {
      // 获取所有学科和知识点
      const subjectsSet = new Set<string>();
      const knowledgePointsMap = new Map<string, Set<string>>(); // 学科 -> 知识点集合

      questions.forEach(q => {
        if (q.subject) {
          subjectsSet.add(q.subject);
          const kpNames = splitKnowledgePointNames(q.knowledgePoint);
          if (kpNames.length > 0) {
            if (!knowledgePointsMap.has(q.subject)) {
              knowledgePointsMap.set(q.subject, new Set());
            }
            kpNames.forEach(name => knowledgePointsMap.get(q.subject)!.add(name));
          }
        }
      });

      // 获取数据库中所有学科
      const subjectsResponse = await subjectApi.getAllActiveSubjects(true);
      const existingSubjects: any[] = subjectsResponse.data?.data || subjectsResponse.data || [];

      // 检查缺失的学科
      const missingSubjectsSet = new Set<string>();
      const subjectIdMap = new Map<string, number>();

      existingSubjects.forEach((subj: any) => {
        subjectIdMap.set(normalize(subj.name), subj.id);
      });

      subjectsSet.forEach(subjectName => {
        if (!subjectIdMap.has(normalize(subjectName))) {
          missingSubjectsSet.add(subjectName);
        }
      });

      // 检查缺失的知识点
      const missingKnowledgePointsMap = new Map<string, Set<string>>();

      for (const [subjectName, knowledgePoints] of knowledgePointsMap.entries()) {
        const subjectId = subjectIdMap.get(normalize(subjectName));
        if (!subjectId) {
          // 如果学科不存在，所有知识点都缺失
          missingKnowledgePointsMap.set(subjectName, knowledgePoints);
        } else {
          // 获取该学科的所有知识点
          const kpResponse = await knowledgePointApi.getKnowledgePoints(subjectName);
          const existingKnowledgePoints: any[] = kpResponse.data?.data || kpResponse.data || [];
          const existingKpNames = new Set(existingKnowledgePoints.map((kp: any) => normalize(kp.name)));
          // 记录已存在的知识点到全局映射，便于后续直接取ID
          const kpIdMap = new Map<string, number>(knowledgePointMap);
          existingKnowledgePoints.forEach((kp: any) => {
            if (kp && kp.id && kp.name) {
              kpIdMap.set(`${normalize(subjectName)}:${normalize(kp.name)}`, kp.id);
            }
          });
          setKnowledgePointMap(kpIdMap);

          const missingKps = new Set<string>();
          knowledgePoints.forEach(kp => {
            if (!existingKpNames.has(normalize(kp))) {
              missingKps.add(kp);
            }
          });

          if (missingKps.size > 0) {
            missingKnowledgePointsMap.set(subjectName, missingKps);
          }
        }
      }

      setMissingSubjects(missingSubjectsSet);
      setMissingKnowledgePoints(missingKnowledgePointsMap);
      setSubjectMap(subjectIdMap);

      // 如果有缺失的学科或知识点，显示确认对话框
      if (missingSubjectsSet.size > 0 || missingKnowledgePointsMap.size > 0) {
        setShowSubjectCheckModal(true);
      }
    } catch (error: any) {
      console.error('检查学科和知识点失败:', error);
      message.error('检查学科和知识点失败: ' + error.message);
    }
  };

  // 处理文件上传
  const handleFileChange = async (info: any) => {
    const { fileList: newFileList } = info;
    setFileList(newFileList);

    if (newFileList.length > 0) {
      const file = newFileList[0].originFileObj;
      if (file) {
        await parseDocument(file);
      }
    }
  };

  // 解析文档
  const parseDocument = async (file: File) => {
    try {
      let result;

      if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        result = await parseWordDocument(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        result = await parseExcelDocument(file);
      } else {
        message.error('不支持的文件格式，请上传Word或Excel文件');
        return;
      }

      if (result.success) {
        const { valid, invalid } = validateQuestions(result.questions);
        setParsedQuestions(valid);

        if (invalid.length > 0) {
          setInvalidMessages(invalid);
          message.warning(`解析完成，但有${invalid.length}处无效内容，请按提示修改后重新导入`);
          console.log('无效题目:', invalid);
        } else {
          setInvalidMessages([]);

          // 检查重复题目
          let hasDuplicates = false;
          try {
            const titles = valid.map(q => q.title);
            if (titles.length > 0) {
              const res = await questionApi.checkDuplicates(titles);
              if (res.data && res.data.code === 200) {
                const dupTitles = new Set(res.data.object as string[]);
                const dupMsgs: string[] = [];
                valid.forEach((q, i) => {
                  if (dupTitles.has(q.title)) {
                    dupMsgs.push(`⚠️ 第${i + 1}题可能已存在: ${q.title.substring(0, 20)}...`);
                  }
                });
                if (dupMsgs.length > 0) {
                  hasDuplicates = true;
                  setInvalidMessages(dupMsgs);
                  message.warning(`发现 ${dupMsgs.length} 个可能的重复题目，建议修改`);
                }
              }
            }
          } catch (e) {
            console.error("Duplicate check failed", e);
          }

          if (!hasDuplicates) {
            message.success(`成功解析${valid.length}道题目`);
          }

          // 解析完成后，检查学科和知识点
          await checkSubjectsAndKnowledgePoints(valid);
        }
      } else {
        message.error('文档解析失败');
        console.error('解析错误:', result.errors);
      }
    } catch (error: any) {
      message.error(`解析失败: ${error.message}`);
    }
  };

  // 创建缺失的学科和知识点
  const createMissingSubjectsAndKnowledgePoints = async () => {
    const newSubjectIdMap = new Map<string, number>(subjectMap);
    const newKnowledgePointIdMap = new Map<string, number>(knowledgePointMap);

    // 创建缺失的学科
    // 二次校验：拉取最新学科，避免重复创建
    let latestSubjects: any[] = [];
    try {
      const subjectsResponse = await subjectApi.getAllActiveSubjects(true);
      latestSubjects = subjectsResponse.data?.data || subjectsResponse.data || [];
    } catch { }
    const latestSubjectNameToId = new Map<string, number>();
    latestSubjects.forEach((s: any) => latestSubjectNameToId.set(normalize(s.name), s.id));

    for (const subjectName of missingSubjects) {
      try {
        // 若已存在则直接记录ID
        const existedId = latestSubjectNameToId.get(normalize(subjectName));
        if (existedId) {
          newSubjectIdMap.set(normalize(subjectName), existedId);
        } else {
          const subjectCode = subjectName.toUpperCase().replace(/\s+/g, '_');
          const response = await subjectApi.createSubject({
            name: subjectName,
            code: subjectCode,
            description: `${subjectName}学科`,
            sortOrder: 100,
            isActive: true
          });
          const newSubject = response.data?.data || response.data;
          if (newSubject && newSubject.id) {
            newSubjectIdMap.set(normalize(subjectName), newSubject.id);
            message.success(`已创建学科: ${subjectName}`);
          }
        }
      } catch (error: any) {
        console.error(`创建学科失败: ${subjectName}`, error);
        message.error(`创建学科失败: ${subjectName} - ${error.message}`);
        throw error;
      }
    }

    // 创建缺失的知识点
    for (const [subjectName, knowledgePoints] of missingKnowledgePoints.entries()) {
      const subjectId = newSubjectIdMap.get(normalize(subjectName));
      if (!subjectId) {
        message.error(`学科 ${subjectName} 不存在，无法创建知识点`);
        continue;
      }

      for (const kpName of knowledgePoints) {
        try {
          // 获取该学科现有的知识点数量来计算sortOrder
          const kpResponse = await knowledgePointApi.getKnowledgePoints(subjectName);
          const existingKps: any[] = kpResponse.data?.data || kpResponse.data || [];
          const existingKpNames = new Set(existingKps.map((kp: any) => normalize(kp.name)));
          if (existingKpNames.has(normalize(kpName))) {
            const existed = existingKps.find((kp: any) => normalize(kp.name) === normalize(kpName));
            if (existed?.id) {
              newKnowledgePointIdMap.set(`${normalize(subjectName)}:${normalize(kpName)}`, existed.id);
            }
            continue; // 已存在则跳过创建
          }

          const response = await knowledgePointApi.createKnowledgePoint({
            name: kpName,
            description: `${kpName}知识点`,
            subject: subjectName,
            subjectId: subjectId,
            weight: 0, // 权重已弃用，默认为0
            difficultyLevel: 'MEDIUM',
            status: 'ACTIVE',
            sortOrder: existingKps.length + 1,
            isSystem: isSystem || false
          });

          const newKp = response.data?.data || response.data;
          if (newKp && newKp.id) {
            newKnowledgePointIdMap.set(`${normalize(subjectName)}:${normalize(kpName)}`, newKp.id);
            message.success(`已创建知识点: ${subjectName} - ${kpName}`);
          }
        } catch (error: any) {
          console.error(`创建知识点失败: ${subjectName} - ${kpName}`, error);
          message.error(`创建知识点失败: ${subjectName} - ${kpName} - ${error.message}`);
        }
      }
    }

    setSubjectMap(newSubjectIdMap);
    setKnowledgePointMap(newKnowledgePointIdMap);
    return { newSubjectIdMap, newKnowledgePointIdMap };
  };

  // 处理确认创建学科和知识点
  const handleConfirmCreate = async () => {
    try {
      setUserConfirmedCreation(true);
      setShowSubjectCheckModal(false);
      // 先创建缺失项
      const { newSubjectIdMap, newKnowledgePointIdMap } = await createMissingSubjectsAndKnowledgePoints();
      setSubjectMap(newSubjectIdMap);
      setKnowledgePointMap(newKnowledgePointIdMap);
      // 清空缺失集合，避免再次拦截
      setMissingSubjects(new Set());
      setMissingKnowledgePoints(new Map());
    } catch (e) {
      // 创建失败已在内部提示
      return;
    }
    await handleImport();
  };

  // 实际执行导入
  const performImport = async () => {
    if (parsedQuestions.length === 0) {
      message.warning('没有可导入的题目');
      return;
    }
    // 若尚未做过学科/知识点检查（例如存在无效项时之前未检查），这里补做一次
    if (subjectMap.size === 0) {
      await checkSubjectsAndKnowledgePoints(parsedQuestions);
      // 若触发了缺失项提示，将在对话框确认后继续
      if (missingSubjects.size > 0 || missingKnowledgePoints.size > 0) return;
    }

    // 如果有缺失的学科或知识点，需要先创建
    if ((missingSubjects.size > 0 || missingKnowledgePoints.size > 0) && !userConfirmedCreation) {
      if (!showSubjectCheckModal) {
        setShowSubjectCheckModal(true);
      }
      return; // 等待用户确认后再继续
    }

    setImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      // 二次防护：若用户已确认且缺失仍存在，创建后再导入
      let finalSubjectMap = subjectMap;
      let finalKnowledgePointMap = knowledgePointMap;

      if (userConfirmedCreation && (missingSubjects.size > 0 || missingKnowledgePoints.size > 0)) {
        const result = await createMissingSubjectsAndKnowledgePoints();
        finalSubjectMap = result.newSubjectIdMap;
        finalKnowledgePointMap = result.newKnowledgePointIdMap;
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // 基于已知映射构建“学科 -> 知识点(nameNorm,id)”索引，便于标题匹配兜底
      const subjectToKpIndex = new Map<string, Array<{ nameNorm: string; id: number }>>();
      finalKnowledgePointMap.forEach((id, key) => {
        const [sj, kp] = key.split(':');
        if (!sj || !kp) return;
        const list = subjectToKpIndex.get(sj) || [];
        list.push({ nameNorm: kp, id });
        subjectToKpIndex.set(sj, list);
      });

      // 确保存在并返回“未分类”知识点ID（如无则创建）
      const ensureFallbackKnowledgePoint = async (subjectName: string, subjectIdVal: number): Promise<number | null> => {
        const key = `${normalize(subjectName)}:${normalize('未分类')}`;
        const existed = finalKnowledgePointMap.get(key);
        if (existed) return existed;
        try {
          const kpResp = await knowledgePointApi.createKnowledgePoint({
            name: '未分类',
            description: '自动创建的占位知识点，用于暂未归类的题目',
            subject: subjectName,
            subjectId: subjectIdVal,
            weight: 0, // 权重已弃用，默认为0
            difficultyLevel: 'MEDIUM',
            status: 'ACTIVE',
            sortOrder: 9999,
            isSystem: !!isSystem
          });
          const kp = kpResp.data?.data || kpResp.data;
          if (kp && kp.id) {
            finalKnowledgePointMap.set(key, kp.id);
            const list = subjectToKpIndex.get(normalize(subjectName)) || [];
            list.push({ nameNorm: normalize('未分类'), id: kp.id });
            subjectToKpIndex.set(normalize(subjectName), list);
            return kp.id;
          }
        } catch { }
        return null;
      };

      for (let i = 0; i < parsedQuestions.length; i++) {
        const question = parsedQuestions[i];

        // 先处理图片上传 (Deferred Upload)
        try {
          question.title = await uploadAndReplaceImages(question.title);
          if (question.explanation) {
            question.explanation = await uploadAndReplaceImages(question.explanation);
          }
          if (question.options && question.options.length > 0) {
            for (let j = 0; j < question.options.length; j++) {
              question.options[j] = await uploadAndReplaceImages(question.options[j]);
            }
          }
        } catch (e) {
          console.error("Failed to process images for question", i, e);
        }

        try {
          // 处理选项数据
          let optionsData = null;
          if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') {
            if (question.options && question.options.length > 0) {
              optionsData = JSON.stringify(question.options);
            }
          }

          // 获取学科ID
          const subjectId = finalSubjectMap.get(normalize(question.subject || ''));
          if (!subjectId) {
            throw new Error(`学科 "${question.subject}" 不存在`);
          }

          // 获取知识点ID
          const kpNames = splitKnowledgePointNames(question.knowledgePoint);
          let knowledgePointIds: number[] = [];
          kpNames.forEach(name => {
            const id = finalKnowledgePointMap.get(`${normalize(question.subject)}:${normalize(name)}`);
            if (id) knowledgePointIds.push(id);
          });
          // 兜底：未显式填写知识点时，尝试按标题关键词匹配
          if (knowledgePointIds.length === 0) {
            const subjectKey = normalize(question.subject);
            const kpList = subjectToKpIndex.get(subjectKey) || [];
            const haystack = normalize(question.title + ' ' + (question.explanation || ''));
            // 选择匹配到的“最长名称”，尽量避免过短词误匹配
            let bestId: number | null = null;
            let bestLen = 0;
            kpList.forEach(({ nameNorm, id }) => {
              if (nameNorm && haystack.includes(nameNorm)) {
                const ln = nameNorm.length;
                if (ln > bestLen) {
                  bestLen = ln;
                  bestId = id;
                }
              }
            });
            if (bestId !== null) knowledgePointIds = [bestId];
          }

          // 仍未匹配到，则使用“未分类”兜底（自动创建一次并复用）
          if (knowledgePointIds.length === 0) {
            const fallbackId = await ensureFallbackKnowledgePoint(question.subject, subjectId);
            if (fallbackId) knowledgePointIds = [fallbackId];
          }

          const questionData: any = {
            title: question.title,
            type: question.type,
            difficulty: question.difficulty,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || '',
            subjectId: subjectId,
            knowledgePointIds: JSON.stringify(knowledgePointIds) // 知识点ID数组
          };

          if (optionsData !== null) {
            questionData.options = optionsData;
          }

          if (isSystem) {
            await questionService.createSystemQuestion(questionData);
          } else {
            await questionService.createMyQuestion(questionData);
          }

          successCount++;
        } catch (error: any) {
          failedCount++;
          errors.push(`题目"${question.title}": ${error.message}`);
        }

        // 更新进度
        const progress = Math.round(((i + 1) / parsedQuestions.length) * 100);
        setImportProgress(progress);
      }

      setImportResult({
        success: successCount,
        failed: failedCount,
        errors
      });

      if (successCount > 0) {
        message.success(`成功导入${successCount}道题目`);
        setShowSubjectCheckModal(false);
        onSuccess();
      }

      if (failedCount > 0) {
        message.error(`导入失败${failedCount}道题目`);
      }

    } catch (error: any) {
      message.error(`导入过程中发生错误: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  // 批量导入题目（带无效项确认）
  const handleImport = async () => {
    if (invalidMessages.length > 0) {
      Modal.confirm({
        title: '发现无效内容，是否继续导入有效题目？',
        icon: <ExclamationCircleOutlined />,
        content: `共有 ${invalidMessages.length} 处无效内容，这些题目将不会被导入。是否继续导入其余有效题目？`,
        okText: '继续导入',
        cancelText: '取消',
        onOk: async () => {
          await performImport();
        }
      });
      return;
    }
    await performImport();
  };

  // 表格列定义
  const columns = [
    {
      title: '题目标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      render: (title: string) => <TruncatedText text={title || ''} maxLength={60} />,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: { [key: string]: string } = {
          'SINGLE_CHOICE': '单选题',
          'MULTIPLE_CHOICE': '多选题',
          'FILL_BLANK': '填空题',
          'TRUE_FALSE': '判断题',
          'SHORT_ANSWER': '简答题'
        };
        return <Tag color="blue">{typeMap[type] || type}</Tag>;
      }
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: string) => {
        const colorMap: { [key: string]: string } = {
          'EASY': 'green',
          'MEDIUM': 'orange',
          'HARD': 'red'
        };
        const textMap: { [key: string]: string } = {
          'EASY': '简单',
          'MEDIUM': '中等',
          'HARD': '困难'
        };
        return <Tag color={colorMap[difficulty]}>{textMap[difficulty] || difficulty}</Tag>;
      }
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 100,
    },
    {
      title: '知识点',
      dataIndex: 'knowledgePoint',
      key: 'knowledgePoint',
      width: 150,
      render: (kp: string) => <TruncatedText text={kp || ''} maxLength={30} />,
    },
    {
      title: '选项',
      dataIndex: 'options',
      key: 'options',
      width: 180,
      render: (options: string[]) => {
        if (!options || options.length === 0) return '-';
        return (
          <div>
            {options.map((option, index) => (
              <div key={index} style={{ fontSize: '12px', marginBottom: '4px' }}>
                {String.fromCharCode(65 + index)}. <TruncatedText text={option} maxLength={40} />
              </div>
            ))}
          </div>
        );
      }
    },
    {
      title: '正确答案',
      dataIndex: 'correctAnswer',
      key: 'correctAnswer',
      width: 250,
      render: (answer: string) => {
        if (!answer) return '-';
        return <TruncatedText text={answer} maxLength={80} />;
      }
    }
  ];

  return (
    <>
      {/* 学科和知识点检查确认对话框 */}
      <Modal
        title="学科和知识点检查"
        open={showSubjectCheckModal}
        onCancel={() => setShowSubjectCheckModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowSubjectCheckModal(false)}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmCreate}>
            确认创建并导入
          </Button>
        ]}
        width={700}
      >
        <div>
          {missingSubjects.size > 0 && (
            <Alert
              message="发现缺失的学科"
              description={
                <div>
                  <p>以下学科在数据库中不存在，是否自动创建？</p>
                  <ul>
                    {Array.from(missingSubjects).map(subject => (
                      <li key={subject}>{subject}</li>
                    ))}
                  </ul>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {missingKnowledgePoints.size > 0 && (
            <Alert
              message="发现缺失的知识点"
              description={
                <div>
                  <p>以下知识点在数据库中不存在，是否自动创建？</p>
                  {Array.from(missingKnowledgePoints.entries()).map(([subject, kps]) => (
                    <div key={subject} style={{ marginTop: 8 }}>
                      <strong>{subject}:</strong>
                      <ul>
                        {Array.from(kps).map(kp => (
                          <li key={kp}>{kp}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              }
              type="info"
              showIcon
            />
          )}

          <Alert
            message="提示"
            description="确认后将自动创建上述学科和知识点，然后继续导入题目。每道题目都会关联对应的学科和知识点。"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      </Modal>

      <Modal
        title="导入题目"
        open={visible}
        onCancel={() => {
          resetState();
          onCancel();
        }}
        width={1200}
        footer={[
          <Button key="cancel" onClick={() => {
            resetState();
            onCancel();
          }}>
            取消
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={importing}
            disabled={parsedQuestions.length === 0}
            onClick={handleImport}
          >
            {importing ? '导入中...' : `导入${parsedQuestions.length}道题目`}
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            message="支持的文件格式"
            description="Word文档(.docx, .doc) 和 Excel表格(.xlsx, .xls)"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Alert
            message="关于图片导入"
            description="系统已支持直接导入Word文档中的嵌入图片！图片将自动上传至云存储。同时也支持Markdown格式图片。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          {invalidMessages.length > 0 && (
            <Alert
              message={`发现 ${invalidMessages.length} 处无效内容，需要修改后再导入`}
              description={
                <div style={{ maxHeight: 220, overflow: 'auto' }}>
                  <div style={{ marginBottom: 8, color: '#8c8c8c' }}>
                    示例：题目编号、正确答案、学科/知识点缺失、选项不完整等。
                  </div>
                  {invalidMessages.map((m, i) => (
                    <div key={i} style={{ fontSize: '12px', marginBottom: 4 }}>{m}</div>
                  ))}
                </div>
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Alert
            message="文档格式要求"
            description="请按照指定格式准备文档，点击下方查看详细格式说明"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Collapse
            size="small"
            items={[
              {
                key: '1',
                label: '📋 查看详细格式说明',
                children: (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Title level={5}>Word文档格式要求</Title>
                      <div style={{
                        background: '#f5f5f5',
                        padding: '12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        marginBottom: '12px',
                        whiteSpace: 'pre-line',
                        border: '1px solid #d9d9d9'
                      }}>
                        {`1.Java程序的入口方法名是？【单选题】【简单】【Java】【程序入口方法】
A. run
B. main
C. start
D. init
答案：（B）
答案解析：{Java程序需通过特定方法启动，main方法是唯一的入口方法，固定格式为\`public static void main(String[] args)\`，其他选项均非入口方法。}

2.Java程序的入口方法完整声明是______。【填空题】【简单】【Java】【程序入口方法】
答案：（public static void main(String[] args)）
答案解析：{Java程序需通过固定格式的main方法启动，访问修饰符为public，静态修饰符static（无需实例化类），无返回值（void），参数为String数组（接收命令行参数）。}

3.Java是一种面向对象的编程语言。【判断题】【简单】【Java】【Java语言特性】
答案：（√）
答案解析：{Java是纯面向对象的编程语言，支持封装、继承、多态、抽象等面向对象核心特性，一切事物皆对象（除基本数据类型，可通过包装类转为对象）。}

4.以下属于Java基本数据类型的有？【多选题】【简单】【Java】【基本数据类型与引用数据类型】
A. int
B. char
C. String
D. boolean
E. Double
答案：（ABD）
答案解析：{Java基本数据类型包括int（整数）、char（字符）、boolean（布尔）等8种；String是引用数据类型（类），Double是包装类（引用类型），均不属于基本数据类型。}

5.简述Java中重载（Overload）和重写（Override）的区别。【简答题】【简单】【Java】【面向对象】
答案：(重载（Overload）和重写（Override）是Java中实现多态的两种方式，核心区别如下：
1. 发生位置：重载发生在同一个类中，重写发生在父子类之间（或接口与实现类之间）；
2. 方法签名：重载要求方法名相同，参数列表（参数类型、个数、顺序）不同，返回值类型、访问修饰符可不同；重写要求方法名、参数列表、返回值类型（子类返回值可兼容父类）完全相同；
3. 访问修饰符：重载对访问修饰符无限制；重写时子类方法的访问修饰符不能比父类更严格**（如父类为public，子类不能为private）；
4. 异常处理：重载对异常抛出无限制；重写时子类方法抛出的异常不能比父类更宽泛（可抛出子类异常或不抛出）；
5. 多态类型：重载是编译时多态（编译器根据参数列表确定调用的方法）；重写是运行时多态（JVM根据对象实际类型确定调用的方法）。)
答案解析：{
重载（Overload）和重写（Override）是Java中实现多态的两种方式，核心区别如下：
1. 发生位置：重载发生在同一个类中，重写发生在父子类之间（或接口与实现类之间）；
2. 方法签名：重载要求方法名相同，参数列表（参数类型、个数、顺序）不同，返回值类型、访问修饰符可不同；重写要求方法名、参数列表、返回值类型（子类返回值可兼容父类）完全相同；
3. 访问修饰符：重载对访问修饰符无限制；重写时子类方法的访问修饰符不能比父类更严格**（如父类为public，子类不能为private）；
4. 异常处理：重载对异常抛出无限制；重写时子类方法抛出的异常不能比父类更宽泛（可抛出子类异常或不抛出）；
5. 多态类型：重载是编译时多态（编译器根据参数列表确定调用的方法）；重写是运行时多态（JVM根据对象实际类型确定调用的方法）。
}

6.看图识物：下图展示的Logo属于哪种编程语言？【单选题】【简单】【Java】【Java文化】【图片】
(这里直接插入图片)
A. Python
B. Java
C. C++
D. JavaScript
答案：（B）
答案解析：{图中的咖啡杯Logo是Java语言的标志性符号。}`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        <strong>格式说明：</strong>
                        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                          <li>题目编号：以数字开头，如"1." 或 "1."</li>
                          <li>题目标题：在编号后面，到第一个【】之前</li>
                          <li>题目类型：【单选题】【多选题】【填空题】【判断题】【简答题】</li>
                          <li>难度等级：【简单】【中等】【困难】</li>
                          <li>学科：【学科名称】- 必填，如果学科不存在会提示创建</li>
                          <li>知识点：【知识点名称】- 必填，如果知识点不存在会提示创建并与学科关联</li>
                          <li>选项：A. B. C. D. 格式（选择题），每行一个选项，选项内容可以包含括号</li>
                          <li>正确答案：<strong>答案：（答案内容）</strong> 格式</li>
                          <li>单选题/多选题：<strong>答案：（B）</strong> 或 <strong>答案：（ABD）</strong>（多个选项字母）</li>
                          <li>填空题：<strong>答案：（答案文本）</strong>，支持多行和括号</li>
                          <li>判断题：<strong>答案：（√）</strong> 表示正确，<strong>答案：（×）</strong> 表示错误</li>
                          <li>简答题：<strong>答案：（多行答案内容）</strong>，支持包含括号和多行文本</li>
                          <li>答案详解：<strong>答案解析：{'{解析内容}'}</strong> 格式，使用大括号{ }包裹，支持多行和括号</li>
                          <li>简答题的答案和解析分别提取，答案在"答案："后面，解析在"答案解析："后面</li>
                          <li><strong style={{ color: '#ff4d4f' }}>⚠️ 重要：</strong></li>
                          <ul style={{ paddingLeft: 20 }}>
                            <li>每道题都必须有学科和知识点，缺失将无法导入</li>
                            <li>答案格式必须包含"答案："前缀，如"答案：（B）"</li>
                            <li>解析格式必须包含"答案解析："前缀，如"答案解析：{'{解析内容}'}"</li>
                            <li>选项内容可以包含括号，不会被误判为答案区域</li>
                          </ul>
                          <li><strong style={{ color: '#1890ff' }}>🖼️ 图片导入说明：</strong></li>
                          <ul style={{ paddingLeft: 20 }}>
                            <li>支持直接导入Word文档中的嵌入图片！系统会自动上传并关联。</li>
                            <li>格式：在文字后直接插入图片，或者添加 <strong>【图片】</strong> 标签后紧跟图片。</li>
                            <li>示例：1.题目内容...【单选题】【简单】【图片】(此处插入图片)</li>
                            <li>也支持Markdown格式引用网络图片：![图片描述](图片URL)</li>
                          </ul>
                        </ul>
                      </div>
                    </div>

                    <Divider />

                    <div style={{ marginBottom: 16 }}>
                      <Title level={5}>Excel表格格式要求</Title>
                      <div style={{
                        background: '#f5f5f5',
                        padding: '12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        marginBottom: '12px',
                        border: '1px solid #d9d9d9'
                      }}>
                        <div>列A：题目标题</div>
                        <div>列B：题目类型（单选题、多选题、填空题、判断题、简答题）</div>
                        <div>列C：难度（简单、中等、困难）</div>
                        <div>列D：学科（必填，如果学科不存在会提示创建）</div>
                        <div>列E：知识点（必填，如果知识点不存在会提示创建）</div>
                        <div>列F：正确答案</div>
                        <div>列G：答案详解（简答题的答案详解即为参考答案）</div>
                        <div>列H：选项（用|分隔，如：选项1|选项2|选项3，选择题必填）</div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        <strong>注意事项：</strong>
                        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                          <li>第一行必须是标题行</li>
                          <li>选择题必须提供选项，非选择题选项列可以为空</li>
                          <li>多选题答案用逗号分隔，如：A,C</li>
                          <li>填空题和简答题的正确答案就是答案内容</li>
                        </ul>
                      </div>
                    </div>

                    <Divider />

                    <div>
                      <Title level={5}>支持的题目类型和难度</Title>
                      <Row gutter={16}>
                        <Col span={12}>
                          <div style={{ marginBottom: 8 }}>
                            <strong>题目类型：</strong>
                          </div>
                          <Space wrap>
                            <Tag color="blue">单选题</Tag>
                            <Tag color="green">多选题</Tag>
                            <Tag color="orange">填空题</Tag>
                            <Tag color="purple">判断题</Tag>
                            <Tag color="red">简答题</Tag>
                          </Space>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 8 }}>
                            <strong>难度等级：</strong>
                          </div>
                          <Space wrap>
                            <Tag color="green">简单</Tag>
                            <Tag color="orange">中等</Tag>
                            <Tag color="red">困难</Tag>
                          </Space>
                        </Col>
                      </Row>
                    </div>
                  </div>
                )
              }
            ]}
            style={{ marginBottom: 16 }}
          />

          <Dragger
            accept=".docx,.doc,.xlsx,.xls"
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={() => false}
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持单个文件上传，支持Word和Excel格式
            </p>
          </Dragger>
        </div>

        {importing && (
          <div style={{ marginBottom: 16 }}>
            <Progress percent={importProgress} status="active" />
            <Text type="secondary">正在导入题目...</Text>
          </div>
        )}

        {importResult && (
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="成功导入"
                  value={importResult.success}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="导入失败"
                  value={importResult.failed}
                  prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="总计"
                  value={importResult.success + importResult.failed}
                  prefix={<FileWordOutlined />}
                />
              </Col>
            </Row>

            {importResult.errors.length > 0 && (
              <Alert
                message="导入错误详情"
                description={
                  <div style={{ maxHeight: 200, overflow: 'auto' }}>
                    {importResult.errors.map((error, index) => (
                      <div key={index} style={{ marginBottom: 4, fontSize: '12px' }}>
                        {error}
                      </div>
                    ))}
                  </div>
                }
                type="error"
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}

        {parsedQuestions.length > 0 && (
          <div>
            <Divider />
            <Title level={5}>解析结果预览</Title>
            <Table
              columns={columns}
              dataSource={parsedQuestions}
              rowKey={(_, index) => index?.toString() || ''}
              pagination={{ pageSize: 5 }}
              size="small"
              scroll={{ x: 800 }}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default DocumentImport;
