import { useEffect, useRef, useState } from 'react';

import { Modal, Drawer, Button, notification, type TourProps, Tour } from 'antd';
import type { Dayjs } from 'dayjs';
import useSWR, { useSWRConfig } from 'swr';

import Calendar from './Calendar';
import CreateSchedule from './CreateSchedule';
import ViewSchedule from './ViewSchedule';
import * as api from '../../../api/Schedule';
import type { IScheduleAutoReply } from '../../../common/types';

export default function ScheduleAutoReply() {
  const calendarRef = useRef(null);
  const formRef = useRef(null);
  const createButtonRef = useRef(null);
  const [schedules, setSchedules] = useState<IScheduleAutoReply[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<IScheduleAutoReply | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const { mutate } = useSWRConfig();
  const { data, isLoading } = useSWR('/get-schedule-auto-reply', () => api.getScheduleAutoReply(), {
    revalidateOnMount: true,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    if (!isLoading && data) {
      setSchedules(data.data);
    }
  }, [data, isLoading]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };
  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const [openTour, setOpenTour] = useState<boolean>(localStorage.getItem('scheduleAutoReplyTour') !== 'completed');

  const deleteScheduleAutoReply = async () => {
    if (!selectedSchedule) return;
    try {
      const res = await api.deleteScheduleAutoReply({ param: { schedule_auto_reply_id: selectedSchedule.id } });
      if (res?.status === 204) {
        notification.success({
          message: 'Scheduled auto reply deleted',
          description: 'Your scheduled auto reply is deleted',
        });
        mutate('/get-schedule-auto-reply');
        closeModal();
      }
    } catch (_) {
      /* empty */
    }
  };

  const steps: TourProps['steps'] = [
    {
      title: 'Select date',
      description: 'Select your date range. You can drag to select multiple days.',
      target: () => calendarRef.current,
      nextButtonProps: {
        onClick() {
          openDrawer();
        },
      },
      placement: 'bottom',
    },
    {
      title: 'Input details',
      description: 'Select your mail addresses and input your auto reply message. You can also update your date range.',
      target: () => formRef.current,
    },
    {
      title: 'Create Your Schedule',
      description: 'Create your schedule auto reply by clicking the button.',
      target: () => createButtonRef.current,
      nextButtonProps: {
        onClick() {
          localStorage.setItem('scheduleAutoReplyTour', 'completed');
        },
      },
    },
  ];

  return (
    <>
      <div style={{ width: isDrawerOpen ? '50%' : '100%' }} ref={calendarRef}>
        <Calendar
          schedules={schedules}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          openDrawer={openDrawer}
          showModal={showModal}
          setSelectedSchedule={setSelectedSchedule}
        />
      </div>

      <Modal
        title="Schedule Auto Reply"
        open={isModalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="delete" danger onClick={deleteScheduleAutoReply}>
            Delete
          </Button>,
          <Button key="back" type="primary" onClick={closeModal}>
            Close
          </Button>,
        ]}
      >
        {selectedSchedule ? <ViewSchedule schedule={selectedSchedule} /> : null}
      </Modal>

      <Drawer
        title="Create Schedule Auto Reply"
        placement="right"
        width={'45%'}
        onClose={closeDrawer}
        open={isDrawerOpen}
        mask={false}
      >
        <CreateSchedule
          setEndDate={setEndDate}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          closeDrawer={closeDrawer}
          isDrawerOpen={isDrawerOpen}
          formRef={formRef}
          createButtonRef={createButtonRef}
        />
      </Drawer>

      <Tour
        disabledInteraction
        open={openTour}
        onClose={() => {
          localStorage.setItem('scheduleAutoReplyTour', 'completed');
          setOpenTour(false);
        }}
        steps={steps}
      />
    </>
  );
}
