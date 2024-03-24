import dayjs from 'dayjs';
import parse from 'html-react-parser';

import type { IScheduleAutoReply } from '../../../common/types';

export default function ViewSchedule({ schedule }: { schedule: IScheduleAutoReply }) {
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
}
