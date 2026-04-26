import { useEffect, useState } from 'react';

import { EditOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Drawer, FloatButton } from 'antd';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';

import MailViewer from './MailViewer';
import SummarizeMail from './SummarizeMail';
import * as api from '../../../api/Mail';
import type { IEmailFullData } from '../../../common/types';
import GlassCard from '../../../components/ui/GlassCard';
import Loader from '../../../components/Loader';
import SectionHeader from '../../../components/ui/SectionHeader';
import { useThemeMode } from '../../../hooks/useThemeMode';
import ReplyMail from '../ReplyMail';

export default function Mail() {
  const params = useParams();
  const { colors } = useThemeMode();
  const [mail, setMail] = useState<IEmailFullData | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false);

  const onCloseDrawer = () => setOpenDrawer(false);
  const onOpenDrawer = () => setOpenDrawer(true);

  const { data, isLoading } = useSWR(`/mails/${params.address}/${params.id}`, () => {
    if (!params?.id || !params?.address) return Promise.resolve({ data: null });
    return api.getMail({ param: { mail_id: params?.id || '', mail_address: params?.address || '' } });
  });

  useEffect(() => {
    setMail(data?.data);
  }, [data]);

  return isLoading || !mail ? (
    <Loader loading={isLoading} />
  ) : (
    <>
      <div style={{ width: openDrawer ? '50%' : '100%', transition: 'all 0.3s' }}>
        <MailViewer mail={mail} />

        <div style={{ marginTop: 24 }}>
          <SectionHeader
            eyebrow="AI"
            title="Summary"
            description="Quick recap so you don't have to read the whole thread."
          />
          <GlassCard
            variant="solid"
            padding={20}
            style={{
              background: colors.primaryGradientSoft,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: colors.primaryGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                <ThunderboltOutlined />
              </div>
              <div style={{ flex: '1 1 auto' }}>
                <SummarizeMail text={mail?.body?.plain || ''} />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <Drawer
        title="Reply"
        placement="right"
        width={'45%'}
        onClose={onCloseDrawer}
        open={openDrawer}
        mask={false}
      >
        <ReplyMail receivedMail={mail} />
      </Drawer>

      <FloatButton
        tooltip={<div>Reply</div>}
        onClick={onOpenDrawer}
        icon={<EditOutlined />}
        type="primary"
        style={{ right: 40, bottom: '8vh', width: 56, height: 56 }}
      />
    </>
  );
}
