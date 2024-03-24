import { useState } from 'react';

import { DownOutlined } from '@ant-design/icons';
import { createEditorStateWithText } from '@draft-js-plugins/editor';
import { Dropdown, Flex, Select, notification, type MenuProps, DatePicker, type DatePickerProps } from 'antd';
import type { Dayjs } from 'dayjs';
import type { EditorState } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';

import ReplyDataInput from './ReplyDataInput';
import * as api from '../../../api/Mail';
import RichTextEditor from '../../../components/RichTextEditor';
import { useSession } from '../../../hooks/userSession';

export default function UserReplyMail({
  receiverEmail,
  replySubject,
}: {
  receiverEmail?: string;
  replySubject?: string;
}) {
  const [editorState, setEditorState] = useState<EditorState>(createEditorStateWithText(''));
  const [receiver, setReceiver] = useState(receiverEmail || '');
  const [subject, setSubject] = useState(replySubject || '');
  const [sender, setSender] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sendOption, setSendOption] = useState('SEND');
  const [scheduleDate, setScheduleDate] = useState<Dayjs | null>(null);

  const { linkedMailAddresses } = useSession();

  const resetData = () => {
    setEditorState(createEditorStateWithText(''));
    setSubject('');
    setReceiver('');
    setSender(null);
    setScheduleDate(null);
  };

  const sendMail = async () => {
    setIsLoading(true);
    const plainBody = editorState.getCurrentContent().getPlainText();
    const htmlBody = stateToHTML(editorState.getCurrentContent());
    const res = await api.sendMail({ data: { receiver, subject, body: { html: htmlBody, plain: plainBody }, sender } });
    if (res?.data?.labelIds?.length > 0 && res?.data?.labelIds[0] === 'SENT') {
      notification.success({
        message: 'Mail Sent',
        description: 'Your mail has been sent successfully.',
      });
      resetData();
    }
    setIsLoading(false);
  };

  const scheduleMail = async () => {
    setIsLoading(true);
    const plainBody = editorState.getCurrentContent().getPlainText();
    const htmlBody = stateToHTML(editorState.getCurrentContent());
    try {
      const res = await api.scheduleMail({
        data: {
          receiver,
          subject,
          body: { html: htmlBody, plain: plainBody },
          sender,
          scheduled_at: scheduleDate?.toISOString(),
        },
      });
      if (res?.status === 201) {
        notification.success({
          message: 'Mail Scheduled',
          description: 'Your mail has been scheduled successfully.',
        });
        resetData();
      }
    } catch (_) {
      /* empty */
    }
    setIsLoading(false);
  };

  const isSendButtonDisabled = () => {
    const plainBody = editorState.getCurrentContent().getPlainText();
    const htmlBody = stateToHTML(editorState.getCurrentContent());

    const hasAllCommonFields = htmlBody && plainBody && sender && receiver && subject;
    if (sendOption === 'SEND') {
      return !hasAllCommonFields;
    } else {
      return !(hasAllCommonFields && scheduleDate);
    }
  };

  const onDateChange: DatePickerProps['onChange'] = (date) => {
    setScheduleDate(date);
  };

  const sendOptions: MenuProps['items'] = [
    {
      label: 'Send',
      key: 'SEND',
    },
    {
      label: 'Schedule',
      key: 'SCHEDULE',
    },
  ];

  return (
    <>
      <div
        style={{
          border: '1px solid #ddd',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          padding: '8px 10px',
          backgroundColor: '#f5f5f5',
          fontSize: '0.9rem',
          fontWeight: 'bold',
        }}
      >
        New Mail
      </div>

      <ReplyDataInput value={receiver} setValue={setReceiver} placeholder="Recipient" />
      <ReplyDataInput value={subject} setValue={setSubject} placeholder="Subject" />
      <Flex
        justify="space-between"
        align="center"
        style={{ border: '1px solid #ddd', borderBottom: 'none', padding: '4px 0px' }}
      >
        <Select
          value={sender}
          defaultValue="lucy"
          style={{ width: '100%', fontSize: '0.85rem' }}
          variant="borderless"
          onChange={(value) => {
            setSender(value);
          }}
          placeholder="Sender"
          options={linkedMailAddresses?.map((mail) => ({
            value: mail.email,
            label: `From: ${mail.email_name} <${mail.email}>`,
            email: mail.email,
            name: mail.email_name,
            picture: mail.picture,
          }))}
          optionRender={(option) => (
            <Flex align="center" justify="start">
              <img
                src={option.data.picture}
                alt={option.data.name}
                style={{ width: '24px', height: '24px', borderRadius: '50%' }}
              />
              <span style={{ paddingLeft: '0.5rem' }}>{option.data.email}</span>
            </Flex>
          )}
        />
      </Flex>

      <RichTextEditor setEditorState={setEditorState} editorState={editorState} />

      <Flex justify="flex-end" style={{ marginTop: '8px' }}>
        <span>{sendOption === 'SCHEDULE' && <DatePicker onChange={onDateChange} showTime value={scheduleDate} />}</span>
        <div style={{ marginLeft: '1rem' }}>
          <Dropdown.Button
            menu={{ items: sendOptions, onClick: (e) => setSendOption(e.key) }}
            type="primary"
            icon={<DownOutlined />}
            onClick={() => {
              if (sendOption === 'SEND') {
                sendMail();
              } else {
                scheduleMail();
              }
            }}
            loading={isLoading}
            disabled={isSendButtonDisabled()}
          >
            {sendOption === 'SEND' ? 'Send' : 'Schedule'}
          </Dropdown.Button>
        </div>
      </Flex>
    </>
  );
}
