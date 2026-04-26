import { useEffect, useState } from 'react';

import parse from 'html-react-parser';
import useSWR from 'swr';

import * as api from '../../../api/Mail';

interface SummarizeMailProps {
  text: string;
  onGradient?: boolean;
}

const SkeletonLine = ({ width, opacity }: { width: string; opacity: number }) => (
  <div
    style={{
      width,
      height: 12,
      borderRadius: 6,
      background: `rgba(255,255,255,${opacity})`,
      marginBottom: 10,
    }}
  />
);

export default function SummarizeMail({ text, onGradient = false }: SummarizeMailProps) {
  const [summary, setSummary] = useState('');

  const { data, isLoading } = useSWR(['/mails/process-with-ai', text, 'SUMMARY'], () =>
    api.processMailWithAI({ data: { message: text, request_type: 'SUMMARY' } }),
  );

  useEffect(() => {
    setSummary(data?.data?.processed_mail || '');
  }, [data]);

  if (isLoading) {
    return (
      <div style={{ paddingTop: 4 }}>
        <SkeletonLine width="92%" opacity={onGradient ? 0.35 : 0.18} />
        <SkeletonLine width="78%" opacity={onGradient ? 0.3 : 0.14} />
        <SkeletonLine width="60%" opacity={onGradient ? 0.25 : 0.12} />
      </div>
    );
  }

  return (
    <div
      style={{
        fontSize: '0.95rem',
        lineHeight: 1.6,
        color: onGradient ? 'rgba(255,255,255,0.95)' : undefined,
      }}
    >
      {parse(summary)}
    </div>
  );
}
