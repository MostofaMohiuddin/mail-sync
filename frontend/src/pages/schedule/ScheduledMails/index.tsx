import { useEffect, useState } from 'react';

import { CloseOutlined, InboxOutlined } from '@ant-design/icons';
import { Avatar, Button, Space, Table, Tooltip, type TableProps, notification } from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import useSWR from 'swr';

import * as api from '../../../api/Schedule';
import type { IScheduleMail } from '../../../common/types';
import { generateAvatarText, generateRandomColor } from '../../../common/utility';
import EmptyState from '../../../components/ui/EmptyState';
import GlassCard from '../../../components/ui/GlassCard';
import PageHeader from '../../../components/ui/PageHeader';
import StatusBadge from '../../../components/ui/StatusBadge';

dayjs.extend(utc);
dayjs.extend(timezone);

const statusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  if (status === 'sent' || status === 'success') return 'success';
  if (status === 'pending') return 'info';
  if (status === 'cancelled') return 'neutral';
  if (status === 'failed') return 'error';
  return 'neutral';
};

export default function ScheduledMails() {
  const [scheduleMails, setScheduleMails] = useState<IScheduleMail[]>([]);
  const { data, isLoading } = useSWR('/get-schedule-mails', () => api.getScheduleMails(), {
    refreshInterval: 60000,
    revalidateOnMount: true,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    if (!isLoading && data) setScheduleMails(data.data);
  }, [data, isLoading]);

  const cancelScheduledMail = async (id: string) => {
    const res = await api.updateScheduleMail({ param: { schedule_mail_id: id }, data: { status: 'cancelled' } });
    if (res?.status === 200) {
      notification.success({
        message: 'Scheduled Mail Cancelled',
        description: 'Your scheduled mail has been cancelled successfully.',
      });
      setScheduleMails(scheduleMails.map((mail) => (mail.id === id ? { ...mail, status: 'cancelled' } : mail)));
    }
  };

  const columns: TableProps<IScheduleMail>['columns'] = [
    {
      title: 'Sender',
      dataIndex: 'sender_details',
      key: 'sender',
      ellipsis: true,
      render: (senderDetails) => {
        const email = senderDetails?.email || '';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar size={28} style={{ background: generateRandomColor(email), fontSize: 12, fontWeight: 600 }}>
              {generateAvatarText(email)}
            </Avatar>
            <span style={{ fontSize: 13 }}>{email}</span>
          </div>
        );
      },
    },
    { title: 'Receiver', dataIndex: 'receiver', key: 'receiver', ellipsis: true },
    { title: 'Subject', dataIndex: 'subject', key: 'subject', ellipsis: true },
    {
      title: 'Scheduled at',
      dataIndex: 'scheduled_at',
      key: 'scheduledAt',
      ellipsis: true,
      render: (scheduledAt) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          {dayjs(scheduledAt).utc(true).local().tz('Asia/Dhaka').format('DD MMM YY · hh:mm A')}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      render: (status: string) => <StatusBadge variant={statusVariant(status)}>{status.toUpperCase()}</StatusBadge>,
    },
    {
      title: '',
      key: 'action',
      align: 'right',
      width: 60,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Cancel scheduled mail">
            <Button
              type="text"
              shape="circle"
              disabled={record.status !== 'pending'}
              icon={<CloseOutlined />}
              onClick={() => cancelScheduledMail(record.id)}
              danger
              aria-label="Cancel scheduled mail"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Scheduled Mails" subtitle="Mail you've queued for later — cancel any time before send." />
      <GlassCard variant="solid" padding={0}>
        {scheduleMails.length === 0 && !isLoading ? (
          <div style={{ padding: 40 }}>
            <EmptyState
              icon={<InboxOutlined />}
              title="No scheduled mails"
              description="Use the Compose drawer's Schedule option to queue a mail for later."
            />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={scheduleMails}
            rowKey="id"
            size="middle"
            loading={isLoading}
            pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
          />
        )}
      </GlassCard>
    </>
  );
}
