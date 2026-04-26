import { useEffect, useMemo, useRef, useState } from 'react';

import { Modal, Button, notification, type TourProps, Tour } from 'antd';
import type { Dayjs } from 'dayjs';
import useSWR, { useSWRConfig } from 'swr';

import Calendar from './Calendar';
import CreateSchedule from './CreateSchedule';
import ViewSchedule from './ViewSchedule';
import * as api from '../../../api/Schedule';
import type { IScheduleAutoReply } from '../../../common/types';
import GlassCard from '../../../components/ui/GlassCard';
import PageHeader from '../../../components/ui/PageHeader';

const PANEL_WIDTH = 480;
const PANEL_TRANSITION = 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)';

export default function ScheduleAutoReply() {
  const calendarRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [schedules, setSchedules] = useState<IScheduleAutoReply[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<IScheduleAutoReply | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [openTour, setOpenTour] = useState<boolean>(localStorage.getItem('scheduleAutoReplyTour') !== 'completed');

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

  const showModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openPanel = () => setIsPanelOpen(true);
  const closePanel = () => setIsPanelOpen(false);

  const subtitle = useMemo(() => {
    const n = schedules.length;
    if (n === 0) return 'No active schedules — drag any range to schedule an auto-reply.';
    if (n === 1) return '1 active schedule — drag any range to add another.';
    return `${n} active schedules — drag any range to add another.`;
  }, [schedules.length]);

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
      target: () => calendarRef.current!,
      nextButtonProps: { onClick: openPanel },
      placement: 'bottom',
    },
    {
      title: 'Input details',
      description: 'Select your mail addresses and input your auto reply message. You can also update your date range.',
      target: () => formRef.current!,
    },
    {
      title: 'Create Your Schedule',
      description: 'Create your schedule auto reply by clicking the button.',
      target: () => createButtonRef.current!,
      nextButtonProps: {
        onClick() {
          localStorage.setItem('scheduleAutoReplyTour', 'completed');
        },
      },
    },
  ];

  return (
    <>
      <PageHeader title="Auto Reply" subtitle={subtitle} />

      <div style={{ display: 'flex', alignItems: 'stretch', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }} ref={calendarRef}>
          <GlassCard variant="solid" padding={16}>
            <Calendar
              schedules={schedules}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              openDrawer={openPanel}
              showModal={showModal}
              setSelectedSchedule={setSelectedSchedule}
            />
          </GlassCard>
        </div>

        <div
          aria-hidden={!isPanelOpen}
          style={{
            width: isPanelOpen ? PANEL_WIDTH : 0,
            overflow: 'hidden',
            transition: PANEL_TRANSITION,
            flexShrink: 0,
          }}
        >
          <div style={{ width: PANEL_WIDTH, height: '100%' }}>
            <CreateSchedule
              setEndDate={setEndDate}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              closePanel={closePanel}
              formRef={formRef}
              createButtonRef={createButtonRef}
            />
          </div>
        </div>
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
