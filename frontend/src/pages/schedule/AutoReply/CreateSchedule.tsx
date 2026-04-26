import { useState } from 'react';

import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
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
import { DatePicker, Select, notification, Flex, Button } from 'antd';
import type { Dayjs } from 'dayjs';
import type { EditorState } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { useSWRConfig } from 'swr';

import * as api from '../../../api/Schedule';
import RichTextEditor, { RichTextToolbar } from '../../../components/RichTextEditor';
import { useSession } from '../../../hooks/userSession';
import { useThemeMode } from '../../../hooks/useThemeMode';

interface CreateScheduleProps {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  setStartDate: (date: Dayjs | null) => void;
  setEndDate: (date: Dayjs | null) => void;
  closePanel: () => void;
  formRef: React.RefObject<HTMLDivElement>;
  createButtonRef: React.RefObject<HTMLButtonElement>;
}

const ROW_LABEL_STYLE = {
  width: 72,
  flexShrink: 0,
  fontSize: 12,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
};

export default function CreateSchedule({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  closePanel,
  formRef,
  createButtonRef,
}: CreateScheduleProps) {
  const { colors } = useThemeMode();
  const [editorState, setEditorState] = useState<EditorState>(createEditorStateWithText(''));
  const [mailAddresses, setMailAddresses] = useState<string[]>([]);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const { linkedMailAddresses } = useSession();
  const { mutate } = useSWRConfig();

  const onRangeChange = (dates: null | (Dayjs | null)[]) => {
    if (dates && dates[0] && dates[1]) {
      setStartDate(dates[0]);
      setEndDate(dates[1]);
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  };

  const senderOptions = linkedMailAddresses?.map((mail) => ({
    value: mail.email,
    label: `${mail.email_name} <${mail.email}>`,
    email: mail.email,
    name: mail.email_name,
    picture: mail.picture,
  }));

  const isCreateDisabled = () => {
    const plainBody = editorState.getCurrentContent().getPlainText();
    const htmlBody = stateToHTML(editorState.getCurrentContent());
    return !startDate || !endDate || mailAddresses.length === 0 || !plainBody || !htmlBody;
  };

  const isClearDisabled = () => {
    const plainBody = editorState.getCurrentContent().getPlainText();
    return !startDate && !endDate && mailAddresses.length === 0 && !plainBody;
  };

  const resetData = () => {
    setEditorState(createEditorStateWithText(''));
    setMailAddresses([]);
    setStartDate(null);
    setEndDate(null);
  };

  const createSchedule = async () => {
    const plainBody = editorState.getCurrentContent().getPlainText();
    const htmlBody = stateToHTML(editorState.getCurrentContent());
    if (!startDate || !endDate || mailAddresses.length === 0 || !plainBody || !htmlBody) {
      return;
    }
    try {
      setIsCreatingSchedule(true);
      const res = await api.createScheduleAutoReply({
        data: {
          mail_addresses: mailAddresses,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          body: { html: htmlBody, plain: plainBody },
        },
      });
      if (res?.status === 200) {
        notification.success({
          message: 'Schedule Auto Reply Created',
          description: 'Your schedule auto reply has been created successfully.',
        });
        mutate('/get-schedule-auto-reply');
        resetData();
        closePanel();
      }
    } catch (_) {
      /* empty */
    } finally {
      setIsCreatingSchedule(false);
    }
  };

  return (
    <div
      ref={formRef}
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 14px',
          borderBottom: `1px solid ${colors.border}`,
          background: colors.surfaceMuted,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>New auto reply</span>
        <Flex align="center" gap={4}>
          <Button type="text" size="small" onClick={resetData} disabled={isClearDisabled()}>
            Clear
          </Button>
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={closePanel} aria-label="Close panel" />
        </Flex>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <span style={{ ...ROW_LABEL_STYLE, color: colors.textSecondary }}>Senders</span>
        <Select
          mode="multiple"
          allowClear
          variant="borderless"
          style={{ width: '100%', fontSize: '0.9rem' }}
          placeholder="Choose linked addresses"
          onChange={setMailAddresses}
          value={mailAddresses}
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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <span style={{ ...ROW_LABEL_STYLE, color: colors.textSecondary }}>When</span>
        <DatePicker.RangePicker
          showTime
          variant="borderless"
          style={{ width: '100%', fontSize: '0.9rem', padding: 0 }}
          onChange={onRangeChange}
          value={[startDate, endDate]}
        />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <RichTextEditor
          editorState={editorState}
          setEditorState={setEditorState}
          height="100%"
          hideToolbar
          placeholder="Write your auto reply…"
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 12px',
          borderTop: `1px solid ${colors.border}`,
          background: colors.surfaceMuted,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, minWidth: 0 }}>
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
        <Button
          ref={createButtonRef}
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={createSchedule}
          loading={isCreatingSchedule}
          disabled={isCreateDisabled()}
        >
          Create
        </Button>
      </div>
    </div>
  );
}
