/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { createEditorStateWithText } from '@draft-js-plugins/editor';
import { DatePicker, Select, notification, type SelectProps, Flex, Button } from 'antd';
import type { Dayjs } from 'dayjs';
import type { EditorState } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { useSWRConfig } from 'swr';

import * as api from '../../../api/Schedule';
import RichTextEditor from '../../../components/RichTextEditor';
import { useSession } from '../../../hooks/userSession';

export default function CreateSchedule({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  isDrawerOpen,
  closeDrawer,
}: {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  setStartDate: (date: Dayjs | null) => void;
  setEndDate: (date: Dayjs | null) => void;
  closeDrawer: () => void;
  isDrawerOpen: boolean;
}) {
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
      console.log('Clear');
    }
  };
  const linkedMailAddressesDropdownOptions: SelectProps['options'] = linkedMailAddresses?.map((mail) => {
    return { label: mail.email, value: mail.email };
  });

  const isSendButtonDisabled = () => {
    const plainBody = editorState.getCurrentContent().getPlainText();
    const htmlBody = stateToHTML(editorState.getCurrentContent());
    return !startDate || !endDate || mailAddresses.length === 0 || !plainBody || !htmlBody;
  };

  const resetData = () => {
    setEditorState(createEditorStateWithText(''));
    setMailAddresses([]);
    setStartDate(null);
    setEndDate(null);
  };

  useEffect(() => {
    if (!isDrawerOpen) resetData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen]);

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
          body: {
            html: htmlBody,
            plain: plainBody,
          },
        },
      });
      if (res?.status === 200) {
        notification.success({
          message: 'Schedule Auto Reply Created',
          description: 'Your schedule auto reply has been created successfully.',
        });

        mutate('/get-schedule-auto-reply');
        closeDrawer();
      }
    } catch (_) {
      /* empty */
    } finally {
      setIsCreatingSchedule(false);
    }
  };

  return (
    <>
      <Select
        mode="multiple"
        allowClear
        style={{ width: '100%', marginBottom: '0.5rem' }}
        placeholder="Please select"
        onChange={setMailAddresses}
        value={mailAddresses}
        options={linkedMailAddressesDropdownOptions}
      />
      <DatePicker.RangePicker
        showTime
        onChange={onRangeChange}
        value={[startDate, endDate]}
        style={{ width: '100%', marginBottom: '1rem' }}
      />
      <RichTextEditor editorState={editorState} setEditorState={setEditorState} />
      <Flex justify="flex-end" style={{ marginTop: '8px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={createSchedule}
          loading={isCreatingSchedule}
          disabled={isSendButtonDisabled()}
        >
          Create
        </Button>
      </Flex>
    </>
  );
}
