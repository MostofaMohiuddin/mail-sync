import { useEffect, useState } from 'react';

import parse from 'html-react-parser';
import useSWR from 'swr';

import * as api from '../../../api/Mail';
import { useThemeMode } from '../../../hooks/useThemeMode';

interface SummarizeMailProps {
  text: string;
  onGradient?: boolean;
}

export default function SummarizeMail({ text, onGradient = false }: SummarizeMailProps) {
  const { colors, mode } = useThemeMode();
  const [summary, setSummary] = useState('');

  const { data, isLoading } = useSWR(['/mails/process-with-ai', text, 'SUMMARY'], () =>
    api.processMailWithAI({ data: { message: text, request_type: 'SUMMARY' } }),
  );

  useEffect(() => {
    setSummary(data?.data?.processed_mail || '');
  }, [data]);

  const skeletonColor = onGradient
    ? 'rgba(255,255,255,0.35)'
    : mode === 'dark'
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(15,23,42,0.08)';

  if (isLoading) {
    return (
      <div style={{ paddingTop: 4 }}>
        {[{ width: '92%' }, { width: '78%' }, { width: '60%' }].map((line, i) => (
          <div
            key={i}
            style={{
              width: line.width,
              height: 12,
              borderRadius: 6,
              background: skeletonColor,
              marginBottom: 10,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        fontSize: '0.95rem',
        lineHeight: 1.6,
        color: onGradient ? 'rgba(255,255,255,0.95)' : colors.text,
      }}
    >
      {parse(summary)}
    </div>
  );
}
