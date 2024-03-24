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

export default function ScheduleAutoReply() {
  const [editorState, setEditorState] = useState<EditorState>(createEditorStateWithText(''));
  const [mailAddresses, setMailAddresses] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<IScheduleAutoReply[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<IScheduleAutoReply | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const { linkedMailAddresses } = useSession();
  const { mutate } = useSWRConfig();
  const { data, isLoading } = useSWR('/get-schedule-auto-reply', () => api.getScheduleAutoReply(), {
    revalidateOnMount: true,
    revalidateOnFocus: true,
  });
  const schedulesMapById = schedules.reduce(
    (acc, schedule) => {
      acc[schedule.id] = schedule;
      return acc;
    },
    {} as Record<string, IScheduleAutoReply>,
  );

  useEffect(() => {
    if (!isLoading && data) {
      setSchedules(data.data);
    }
  }, [data, isLoading]);
  const getEvents = () =>
    schedules.map((schedule) => {
      return {
        id: schedule.id,
        start: schedule.start_time,
        end: schedule.end_time,
      };
    });

  const handleCalendarDateSelect = (selectInfo: DateSelectArg) => {
    const calendarApi = selectInfo.view.calendar;
    setStartDate(dayjs(selectInfo.startStr));
    setEndDate(dayjs(selectInfo.endStr));
    calendarApi.unselect(); // clear date selection
    openDrawer();
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
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
        setIsModalOpen(false);
        setIsCreatingSchedule(false);
      }
    } catch (_) {
      /* empty */
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const onRangeChange = (dates: null | (Dayjs | null)[]) => {
    if (dates && dates[0] && dates[1]) {
      setStartDate(dates[0]);
      setEndDate(dates[1]);
    } else {
      console.log('Clear');
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedSchedule(schedulesMapById[clickInfo.event.id] || null);
    showModal();
  };
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };
  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const linkedMailAddressesDropdownOptions: SelectProps['options'] = linkedMailAddresses?.map((mail) => {
    return { label: mail.email, value: mail.email };
  });

  const isSendButtonDisabled = () => {
    const plainBody = editorState.getCurrentContent().getPlainText();
    const htmlBody = stateToHTML(editorState.getCurrentContent());
    return !startDate || !endDate || mailAddresses.length === 0 || !plainBody || !htmlBody;
  };
  console.log(selectedSchedule);

  const getModalContent = ({ schedule }: { schedule: IScheduleAutoReply }) => {
    const { start_time, end_time, sender_details, body } = schedule;
    return (
      <>
        <p>
          <strong>Start Time:</strong> {dayjs(start_time).format('DD MMMM,YYYY hh:mmA')}
        </p>
        <p>
          <strong>End Time:</strong> {dayjs(end_time).format('DD MMMM,YYYY hh:mmA')}
        </p>
        <p>
          <strong>Mail Address:</strong> {sender_details.email}
        </p>
        <p>
          <strong>Body:</strong> {parse(body.html)}
        </p>
      </>
    );
  };

  return (
    <>
      <div style={{ width: isDrawerOpen ? '50%' : '100%' }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={getEvents()}
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          editable={true}
          selectable={true}
          selectMirror={true}
          select={handleCalendarDateSelect}
          eventClick={handleEventClick}
          dayMaxEvents={true}
          weekends={true}
          height={'80vh'}
        />
      </div>

      <Modal
        title="Schedule Auto Reply"
        open={isModalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="delete" danger>
            Delete
          </Button>,
          <Button key="back" type="primary" onClick={closeModal}>
            Close
          </Button>,
        ]}
        confirmLoading={isCreatingSchedule}
      >
        {selectedSchedule ? getModalContent({ schedule: selectedSchedule }) : null}
      </Modal>

      <Drawer
        title="Create Schedule Auto Reply"
        placement="right"
        width={'45%'}
        onClose={closeDrawer}
        open={isDrawerOpen}
        mask={false}
      >
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
      </Drawer>
    </>
  );
}
