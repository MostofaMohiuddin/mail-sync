import { useState } from 'react';

import { type EventClickArg, type ViewMountArg } from '@fullcalendar/core/index.js';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Button, Modal } from 'antd';

import type { IEvent } from '../../common/types';

export default function MyCalendar({ events }: { events: IEvent[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);

  const eventsMapById = events.reduce(
    (acc, event) => {
      acc[event.id] = event;
      return acc;
    },
    {} as Record<string, IEvent>,
  );

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(eventsMapById[clickInfo.event.id] || null);
    showModal();
  };
  const handleViewRender = (info: ViewMountArg) => {
    const view = info.view;
    const start = view.activeStart;
    const end = view.activeEnd;
    const dates = [];

    let current = start;

    while (current <= end) {
      dates.push(current);
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000); // Increment current date by one day
    }

    console.log('Currently displayed dates:', dates);
    // You can perform your logic with the displayed dates here
  };

  console.log(eventsMapById);

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          left: 'prev,next',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        eventClick={handleEventClick}
        height={'70vh'}
        viewDidMount={handleViewRender}
      />
      <Modal
        title={selectedEvent?.title}
        open={isModalOpen}
        footer={[
          <Button type="primary" key="back" onClick={handleCancel}>
            Close
          </Button>,
        ]}
      >
        <p>{selectedEvent?.description}</p>
        <p>{selectedEvent?.attendees}</p>
        <p>
          {selectedEvent?.start}-{selectedEvent?.end}
        </p>
      </Modal>
    </>
  );
}
