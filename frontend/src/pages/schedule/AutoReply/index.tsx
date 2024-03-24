import { useEffect, useState } from 'react';

import { Modal, Drawer, Button } from 'antd';
import type { Dayjs } from 'dayjs';
import useSWR from 'swr';

import Calendar from './Calendar';
import CreateSchedule from './CreateSchedule';
import ViewSchedule from './ViewSchedule';
import * as api from '../../../api/Schedule';
import type { IScheduleAutoReply } from '../../../common/types';

export default function ScheduleAutoReply() {
  const [schedules, setSchedules] = useState<IScheduleAutoReply[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<IScheduleAutoReply | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
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

  return (
    <>
      <div style={{ width: isDrawerOpen ? '50%' : '100%' }}>
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
          <Button key="delete" danger>
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
        <CreateSchedule setEndDate={setEndDate} startDate={startDate} setStartDate={setStartDate} endDate={endDate} />
      </Drawer>
    </>
  );
}
