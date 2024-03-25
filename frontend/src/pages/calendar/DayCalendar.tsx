import { useState } from 'react';

import { type EventClickArg } from '@fullcalendar/core/index.js';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Button, Modal } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { Link } from 'react-router-dom';

import type { IEvent } from '../../common/types';

export default function DayCalendar({
  events,
  calendarRef,
  initialDate,
}: {
  events: IEvent[];
  calendarRef: any;
  initialDate?: Dayjs;
}) {
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

  const EventCard = ({ event }: { event: IEvent }) => {
    const { start, end, location, description, creator_email, attendees, video_conference_link, userEmail } = event;

    return (
      <div className="event-card">
        <p>
          <strong>Start:</strong> {dayjs(start).format('DD MMMM,YYYY hh:mmA')}
        </p>
        <p>
          <strong>End:</strong> {dayjs(end).format('DD MMMM,YYYY hh:mmA')}
        </p>
        <p>
          <strong>Location:</strong> {location || 'Not Available'}
        </p>
        <p>
          <strong>Description:</strong> {description || 'Not Available'}
        </p>
        <p>
          <strong>Creator Email:</strong> {creator_email}
        </p>
        <p>
          <strong>Attendees:</strong>{' '}
          {attendees.length > 0 ? attendees.map((attendee) => <div key={attendee}>{attendee}</div>) : 'None'}
        </p>
        <p>
          <strong>Video Conference Link:</strong>{' '}
          {video_conference_link ? (
            <Link to={video_conference_link} target="_blank">
              {video_conference_link}
            </Link>
          ) : (
            'Not Available'
          )}
        </p>
        <p>
          <strong>User Email:</strong> {userEmail}
        </p>
      </div>
    );
  };

  return (
    <>
      <FullCalendar
        headerToolbar={false}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialDate={initialDate?.toDate()}
        initialView="timeGridDay"
        ref={calendarRef}
        events={events}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        eventClick={handleEventClick}
        height={'80vh'}
      />
      <Modal
        title={selectedEvent?.title}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button type="primary" key="back" onClick={handleCancel}>
            Close
          </Button>,
        ]}
      >
        {selectedEvent ? <EventCard event={selectedEvent} /> : null}
      </Modal>
    </>
  );
}
