import React from 'react';
import { Card, Typography } from 'antd';
import PaperGeneration from '../components/PaperGeneration';

const { Title, Text } = Typography;

const PaperGenerationPage: React.FC = () => {
  return (
    <div className="fade-in">
      <Card className="page-card">
        <div className="page-card-header">
          <div className="page-card-title">智能组卷</div>
        </div>
        <div className="page-card-content">
          <PaperGeneration 
            onPaperGenerated={(paper) => {
              console.log('试卷生成完成:', paper);
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default PaperGenerationPage;















