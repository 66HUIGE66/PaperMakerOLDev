
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { ExamPaper, Question, QuestionType } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const exportService = {
    /**
     * 导出PDF
     */
    async exportToPDF(elementId: string, fileName: string) {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error('找不到要导出的元素');
            }

            const canvas = await html2canvas(element, {
                scale: 2, // 提高清晰度
                useCORS: true, // 允许跨域图片
                logging: false
            });

            const contentWidth = canvas.width;
            const contentHeight = canvas.height;

            // A4纸尺寸 (mm)
            const pageWidth = 210;
            const pageHeight = 297;
            const position = 0;

            // 页面内容在A4纸上的宽高
            const imgWidth = pageWidth;
            const imgHeight = (pageWidth / contentWidth) * contentHeight;

            const pdf = new jsPDF('p', 'mm', 'a4');

            if (imgHeight < pageHeight) {
                // 如果内容不超过一页
                pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, imgWidth, imgHeight);
            } else {
                // 分页处理
                let remainingHeight = imgHeight;
                let currentPosition = 0;

                while (remainingHeight > 0) {
                    pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, currentPosition, imgWidth, imgHeight);
                    remainingHeight -= pageHeight;
                    currentPosition -= 297; // 移动y坐标到下一页

                    if (remainingHeight > 0) {
                        pdf.addPage();
                    }
                }
            }

            pdf.save(`${fileName}.pdf`);
            return true;
        } catch (error) {
            console.error('导出PDF失败:', error);
            throw error;
        }
    },
    /**
     * 导出试卷为Word文档
     * @param paper 试卷对象
     * @param questions 题目列表
     */
    async exportToWord(paper: ExamPaper, questions: Question[]) {
        try {
            // 创建文档
            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: [
                            // 标题
                            new Paragraph({
                                text: paper.title,
                                heading: HeadingLevel.HEADING_1,
                                alignment: AlignmentType.CENTER,
                                spacing: {
                                    after: 200,
                                },
                            }),

                            // 试卷信息
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({
                                        text: `总分: ${paper.totalScore}分    时长: ${paper.duration}分钟`,
                                        bold: true,
                                        size: 24, // 12pt
                                    }),
                                ],
                                spacing: {
                                    after: 400,
                                },
                            }),

                            // 描述
                            ...(paper.description ? [
                                new Paragraph({
                                    children: [new TextRun({ text: paper.description, italics: true })],
                                    spacing: { after: 400 }
                                })
                            ] : []),

                            // 分割线
                            new Paragraph({
                                border: {
                                    bottom: {
                                        color: "auto",
                                        space: 1,
                                        style: BorderStyle.SINGLE,
                                        size: 6,
                                    },
                                },
                                spacing: {
                                    after: 400,
                                },
                            }),

                            // 题目内容
                            ...this.generateQuestionConfent(questions)
                        ],
                    },
                ],
            });

            // 生成并下载
            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${paper.title}.docx`);
            return true;
        } catch (error) {
            console.error('导出Word失败:', error);
            throw error;
        }
    },

    /**
     * 生成题目内容
     */
    generateQuestionConfent(questions: Question[]): Paragraph[] {
        const paragraphs: Paragraph[] = [];

        // 按类型分组
        const typeMap: Record<string, string> = {
            [QuestionType.SINGLE_CHOICE]: '一、单选题',
            [QuestionType.MULTIPLE_CHOICE]: '二、多选题',
            [QuestionType.TRUE_FALSE]: '三、判断题',
            [QuestionType.FILL_BLANK]: '四、填空题',
            [QuestionType.SHORT_ANSWER]: '五、简答题',
        };

        const groupedQuestions: Record<string, Question[]> = {};
        Object.keys(typeMap).forEach(type => {
            groupedQuestions[type] = questions.filter(q => q.type === type);
        });

        // 遍历生成
        Object.entries(typeMap).forEach(([type, typeName]) => {
            const typeQuestions = groupedQuestions[type];
            if (!typeQuestions || typeQuestions.length === 0) return;

            // 类型标题
            paragraphs.push(
                new Paragraph({
                    text: typeName,
                    heading: HeadingLevel.HEADING_2,
                    spacing: {
                        before: 400,
                        after: 200,
                    },
                })
            );

            // 题目列表
            typeQuestions.forEach((q, index) => {
                // 题干
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${index + 1}. ${q.title}`,
                                bold: true
                            })
                        ],
                        spacing: {
                            before: 200,
                            after: 100,
                        },
                    })
                );

                // 选项（针对选择题）
                if ((type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTIPLE_CHOICE) && q.options) {
                    const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
                    q.options.forEach((opt, optIndex) => {
                        paragraphs.push(
                            new Paragraph({
                                text: `${optionLabels[optIndex] || (optIndex + 1)}. ${opt}`,
                                indent: {
                                    left: 400
                                },
                                spacing: {
                                    after: 50
                                }
                            })
                        );
                    });
                }

                paragraphs.push(new Paragraph({ text: '' })); // 空行
            });
        });

        return paragraphs;
    }
};
