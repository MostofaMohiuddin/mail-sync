import { useEffect, useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';
import { Table, Tag, type TableProps, Button, Space, notification, Tooltip } from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import useSWR from 'swr';

import * as api from '../../../api/Schedule';
import type { IScheduleMail } from '../../../common/types';

export default function ScheduledMails() {
  const [scheduleMails, setScheduleMails] = useState<IScheduleMail[]>([]);
  const { data, isLoading } = useSWR('/get-schedule-mails', () => api.getScheduleMails(), {
    refreshInterval: 60000,
    revalidateOnMount: true,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    if (!isLoading && data) {
      setScheduleMails(data.data);
    }
  }, [data, isLoading]);

  dayjs.extend(utc);
  dayjs.extend(timezone);

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
        return senderDetails?.email;
      },
    },
    {
      title: 'Receiver',
      dataIndex: 'receiver',
      key: 'receiver',
      ellipsis: true,
      align: 'right',
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      align: 'right',
    },
    {
      title: 'Scheduled At',
      dataIndex: 'scheduled_at',
      key: 'scheduledAt',
      ellipsis: true,
      align: 'right',
      render: (scheduledAt) => {
        return dayjs(scheduledAt).utc(true).local().tz('Asia/Dhaka').format('DD-MM-YY hh:mmA');
      },
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      align: 'right',
      render: (status) => {
        let color = 'green';
        if (status === 'failed' || status === 'cancelled') {
          color = 'volcano';
        } else if (status === 'pending') {
          color = 'geekblue';
        }
        return (
          <>
            <Tag color={color}>{status.toUpperCase()}</Tag>
          </>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Cancel Scheduled Mail">
            <Button
              type="text"
              disabled={record.status !== 'pending'}
              icon={<CloseOutlined />}
              onClick={() => cancelScheduledMail(record.id)}
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return <Table columns={columns} dataSource={scheduleMails} size="small" loading={isLoading} />;
}
