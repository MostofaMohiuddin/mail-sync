/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { createEditorStateWithText } from '@draft-js-plugins/editor';
import type { DateSelectArg, EventClickArg } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { DatePicker, Modal, Select, notification, type SelectProps, Drawer, Flex, Button } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { EditorState } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import parse from 'html-react-parser';
import useSWR, { useSWRConfig } from 'swr';

import * as api from '../../../api/Schedule';
import type { IScheduleAutoReply } from '../../../common/types';
import RichTextEditor from '../../../components/RichTextEditor';
import { useSession } from '../../../hooks/userSession';

export default function CreateSchedule({
  setMailAddresses,
  onRangeChange,
  startDate,
  endDate,
  editorState,
  setEditorState,
  isCreatingSchedule,
  createSchedule,
}: {
  setMailAddresses: (value: string[]) => void;
  onRangeChange: (dates: [Dayjs | null, Dayjs | null]) => void;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  editorState: EditorState;
  setEditorState: (value: EditorState) => void;
  isCreatingSchedule: boolean;
  createSchedule: () => void;
}) {
  const linkedMailAddressesDropdownOptions: SelectProps['options'] = linkedMailAddresses?.map((mail) => {
    return { label: mail.email, value: mail.email };
  });
  return (
    <>
      <Select
        mode="multiple"
        allowClear
        style={{ width: '100%', marginBottom: '0.5rem' }}
        placeholder="Please select"
        onChange={setMailAddresses}
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
