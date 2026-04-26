import { useEffect, useRef, useState } from 'react';

import { DownOutlined, ThunderboltOutlined, UndoOutlined } from '@ant-design/icons';
import {
  BoldButton,
  ItalicButton,
  UnderlineButton,
  CodeButton,
  UnorderedListButton,
  OrderedListButton,
  BlockquoteButton,
  CodeBlockButton,
} from '@draft-js-plugins/buttons';
import { createEditorStateWithText } from '@draft-js-plugins/editor';
import {
  Button,
  DatePicker,
  Dropdown,
  Flex,
  Select,
  Space,
  Spin,
  Tag,
  notification,
  type DatePickerProps,
  type MenuProps,
} from 'antd';
import type { Dayjs } from 'dayjs';
import { ContentState, EditorState, convertFromHTML } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';

import ReplyDataInput from './ReplyDataInput';
import * as api from '../../../api/Mail';
import { IProcessEmailType, IProcessMailTone } from '../../../common/types';
import RichTextEditor, { RichTextToolbar } from '../../../components/RichTextEditor';
import { useSession } from '../../../hooks/userSession';
import { useThemeMode } from '../../../hooks/useThemeMode';

interface UserReplyMailProps {
  receiverEmail?: string;
  replySubject?: string;
  receivedMailBody?: string;
  editorHeight?: number | string;
}

const TONE_PRESETS: { tone: IProcessMailTone; label: string }[] = [
  { tone: IProcessMailTone.FRIENDLY, label: 'Friendly' },
  { tone: IProcessMailTone.CONCISE, label: 'Concise' },
  { tone: IProcessMailTone.FORMAL, label: 'Formal' },
  { tone: IProcessMailTone.DECLINE, label: 'Decline politely' },
  { tone: IProcessMailTone.ENTHUSIASTIC, label: 'Enthusiastic' },
];

const normalizeHtml = (html: string): string => html.replace(/<div[^>]*>/gi, '<p>').replace(/<\/div>/gi, '</p>');

const editorStateFromHtml = (html: string): EditorState => {
  if (!html) return createEditorStateWithText('');
  const blocksFromHTML = convertFromHTML(normalizeHtml(html));
  if (!blocksFromHTML.contentBlocks?.length) return createEditorStateWithText('');
  const content = ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap);
  return EditorState.createWithContent(content);
};

export default function UserReplyMail({
  receiverEmail,
  replySubject,
  receivedMailBody,
  editorHeight = '25rem',
}: UserReplyMailProps) {
  const { colors } = useThemeMode();
  const [editorState, setEditorState] = useState<EditorState>(createEditorStateWithText(''));
  const [receiver, setReceiver] = useState(receiverEmail || '');
  const [subject, setSubject] = useState(replySubject || '');
  const [sender, setSender] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendOption, setSendOption] = useState('SEND');
  const [scheduleDate, setScheduleDate] = useState<Dayjs | null>(null);
  const [activeTone, setActiveTone] = useState<IProcessMailTone | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const previousEditorStateRef = useRef<EditorState | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { linkedMailAddresses } = useSession();

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const resetData = () => {
    setEditorState(createEditorStateWithText(''));
    setSubject('');
    setReceiver('');
    setSender(null);
    setScheduleDate(null);
  };

  const sendMail = async () => {
    setIsSending(true);
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
    setIsSending(false);
  };

  const scheduleMail = async () => {
    setIsSending(true);
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
    setIsSending(false);
  };

  const generateWithTone = async (tone: IProcessMailTone) => {
    if (!receivedMailBody || activeTone) return;
    const snapshot = editorState;
    setActiveTone(tone);
    try {
      const res = await api.processMailWithAI({
        data: {
          message: receivedMailBody,
          request_type: IProcessEmailType.REPLY,
          tone,
        },
      });
      const draftHtml = res?.data?.processed_mail || '';
      if (draftHtml) {
        previousEditorStateRef.current = snapshot;
        setEditorState(editorStateFromHtml(draftHtml));
        setShowUndo(true);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(() => setShowUndo(false), 5000);
      }
    } catch (_) {
      notification.error({
        message: 'AI draft failed',
        description: 'Could not generate a reply. Try again.',
      });
    } finally {
      setActiveTone(null);
    }
  };

  const undoAiDraft = () => {
    if (previousEditorStateRef.current) {
      setEditorState(previousEditorStateRef.current);
      previousEditorStateRef.current = null;
    }
    setShowUndo(false);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const isSendButtonDisabled = () => {
    const plainBody = editorState.getCurrentContent().getPlainText();
    const htmlBody = stateToHTML(editorState.getCurrentContent());
    const hasAllCommonFields = htmlBody && plainBody && sender && receiver && subject;
    if (sendOption === 'SEND') {
      return !hasAllCommonFields;
    }
    return !(hasAllCommonFields && scheduleDate);
  };

  const onDateChange: DatePickerProps['onChange'] = (date) => {
    setScheduleDate(date);
  };

  const sendOptions: MenuProps['items'] = [
    { label: 'Send', key: 'SEND' },
    { label: 'Schedule', key: 'SCHEDULE' },
  ];

  const senderOptions = linkedMailAddresses?.map((mail) => ({
    value: mail.email,
    label: `${mail.email_name} <${mail.email}>`,
    email: mail.email,
    name: mail.email_name,
    picture: mail.picture,
  }));

  const showToneChips = !!receivedMailBody;

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      <ReplyDataInput label="To" value={receiver} setValue={setReceiver} placeholder="recipient@example.com" />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <span
          style={{
            width: 64,
            flexShrink: 0,
            fontSize: 12,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          From
        </span>
        <Select
          value={sender}
          variant="borderless"
          style={{ width: '100%', fontSize: '0.9rem' }}
          onChange={(value) => setSender(value)}
          placeholder="Choose a linked address"
          options={senderOptions}
          optionRender={(option) => (
            <Flex align="center" justify="start">
              <img
                src={option.data.picture}
                alt={option.data.name}
                style={{ width: 24, height: 24, borderRadius: '50%' }}
              />
              <span style={{ paddingLeft: 8 }}>{option.data.email}</span>
            </Flex>
          )}
        />
      </div>

      <ReplyDataInput label="Subject" value={subject} setValue={setSubject} placeholder="Subject" />

      {showToneChips && (
        <div
          style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${colors.border}`,
            background: colors.surfaceMuted,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            <ThunderboltOutlined style={{ color: colors.primary }} />
            <span>Reply with AI</span>
            {showUndo && (
              <Button
                type="link"
                size="small"
                icon={<UndoOutlined />}
                onClick={undoAiDraft}
                style={{ marginLeft: 'auto', padding: 0, height: 'auto' }}
              >
                Undo AI draft
              </Button>
            )}
          </div>
          <Space size={[6, 6]} wrap>
            {TONE_PRESETS.map((preset) => {
              const isActive = activeTone === preset.tone;
              const disabled = activeTone !== null && !isActive;
              return (
                <Tag.CheckableTag
                  key={preset.tone}
                  checked={isActive}
                  onChange={() => !disabled && generateWithTone(preset.tone)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    border: `1px solid ${colors.border}`,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {isActive ? <Spin size="small" style={{ marginRight: 6 }} /> : null}
                  {preset.label}
                </Tag.CheckableTag>
              );
            })}
          </Space>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <RichTextEditor editorState={editorState} setEditorState={setEditorState} height={editorHeight} hideToolbar />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '8px 12px',
          borderTop: `1px solid ${colors.border}`,
          background: colors.surfaceMuted,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RichTextToolbar>
            {(externalProps) => (
              <>
                <BoldButton {...externalProps} />
                <ItalicButton {...externalProps} />
                <UnderlineButton {...externalProps} />
                <CodeButton {...externalProps} />
                <UnorderedListButton {...externalProps} />
                <OrderedListButton {...externalProps} />
                <BlockquoteButton {...externalProps} />
                <CodeBlockButton {...externalProps} />
              </>
            )}
          </RichTextToolbar>
        </div>
        <Flex align="center" gap={8}>
          {sendOption === 'SCHEDULE' && <DatePicker onChange={onDateChange} showTime value={scheduleDate} />}
          <Dropdown.Button
            menu={{ items: sendOptions, onClick: (e) => setSendOption(e.key) }}
            type="primary"
            icon={<DownOutlined />}
            onClick={() => (sendOption === 'SEND' ? sendMail() : scheduleMail())}
            loading={isSending}
            disabled={isSendButtonDisabled()}
          >
            {sendOption === 'SEND' ? 'Send' : 'Schedule'}
          </Dropdown.Button>
        </Flex>
      </div>
    </div>
  );
}
