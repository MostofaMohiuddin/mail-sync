import { useEffect, useState } from 'react';

import { ThunderboltOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';

import MailViewer from './MailViewer';
import SummarizeMail from './SummarizeMail';
import * as api from '../../../api/Mail';
import type { IEmailFullData } from '../../../common/types';
import Loader from '../../../components/Loader';
import { useThemeMode } from '../../../hooks/useThemeMode';
import ReplyMail from '../ReplyMail';
import ComposerSheet from '../ReplyMail/ComposerSheet';

export default function Mail() {
  const params = useParams();
  const { colors } = useThemeMode();
  const [mail, setMail] = useState<IEmailFullData | null>(null);

  const { data, isLoading } = useSWR(
    params?.id && params?.address ? `/mails/${params.address}/${params.id}` : null,
    () => api.getMail({ param: { mail_id: params.id!, mail_address: params.address! } }),
  );

  useEffect(() => {
    setMail(data?.data ?? null);
  }, [data]);

  if (isLoading || !mail) {
    return <Loader loading={isLoading} />;
  }

  const senderLabel = mail.sender.name || mail.sender.email;

  return (
    <>
      <div style={{ width: '100%' }}>
        <div
          style={{
            marginBottom: 20,
            padding: 18,
            borderRadius: 14,
            background: colors.primaryGradientSoft,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
              color: colors.primary,
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            <ThunderboltOutlined />
            <span>AI Summary</span>
          </div>
          <SummarizeMail text={mail?.body?.plain || ''} />
        </div>

        <MailViewer mail={mail} />
      </div>

      <ComposerSheet recipientLabel={senderLabel} subject={mail.subject ? `RE: ${mail.subject}` : 'New message'}>
        {({ editorHeight }) => <ReplyMail receivedMail={mail} editorHeight={editorHeight} />}
      </ComposerSheet>
    </>
  );
}
