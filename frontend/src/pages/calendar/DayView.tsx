/* eslint-disable @typescript-eslint/no-unused-vars */
import { SolutionOutlined, VideoCameraAddOutlined, TeamOutlined } from '@ant-design/icons';
import { Collapse, type CollapseProps, Avatar, Typography, Flex } from 'antd';
import dayjs from 'dayjs';
import parse from 'html-react-parser';
import { Link } from 'react-router-dom';

import type { IEvent } from '../../common/types';
import { generateRandomColor } from '../../common/utility';

export default function DayView({
  events,
  userLinkedMail,
}: {
  events: IEvent[];
  userLinkedMail: Record<string, string>;
}) {
  console.log(events);

  const getChildrenItem = ({
    icon,
    text,
    isLink,
    itemComponent,
  }: {
    icon: React.ReactNode;
    text?: string;
    isLink?: boolean;
    itemComponent?: React.ReactNode;
  }) => {
    return itemComponent ? (
      <>
        <Flex align="start" style={{ marginBottom: '1rem' }}>
          {icon}
          <span style={{ paddingLeft: '1rem', fontSize: '0.9rem', lineHeight: '0.9rem' }}>{itemComponent}</span>
        </Flex>
      </>
    ) : (
      <>
        <Flex align="start" style={{ marginBottom: '1rem' }}>
          {icon}
          {isLink && text ? (
            <Link
              to={text}
              target="_blank"
              rel="noreferrer"
              style={{ paddingLeft: '1rem', fontSize: '0.9rem', lineHeight: '1.1rem' }}
            >
              {text}
            </Link>
          ) : (
            <span style={{ paddingLeft: '1rem', fontSize: '0.9rem', lineHeight: '0.9rem' }}>{parse(text)}</span>
          )}
        </Flex>
      </>
    );
  };

  const items: CollapseProps['items'] = events.map((event) => {
    return {
      key: event.id,
      label: (
        <>
          <Avatar size="small" src={userLinkedMail[event.creator_email]} />
          <span style={{ paddingLeft: '0.5rem', fontWeight: 'bold' }}>{event.title}</span>
        </>
      ),
      children: (
        <>
          {getChildrenItem({ icon: <SolutionOutlined style={{ fontSize: '1.5rem' }} />, text: event.description })}
          {event.video_conference_link &&
            getChildrenItem({
              icon: <VideoCameraAddOutlined style={{ fontSize: '1.5rem' }} />,
              text: event.video_conference_link,
              isLink: true,
            })}
          {getChildrenItem({
            icon: <TeamOutlined style={{ fontSize: '1.5rem' }} />,
            itemComponent: (
              <div>
                {event.attendees.map((attendee) => (
                  <div key={attendee} style={{ marginBottom: '0.5rem' }}>
                    {userLinkedMail[attendee] ? (
                      <Avatar size={28} src={userLinkedMail[attendee]} />
                    ) : (
                      <Avatar size={28} style={{ fontSize: '0.9rem', backgroundColor: generateRandomColor(attendee) }}>
                        {attendee.charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                    <Typography.Text style={{ paddingLeft: '0.5rem' }}>{attendee}</Typography.Text>
                  </div>
                ))}
              </div>
            ),
          })}
        </>
      ),
      extra: (
        <Typography.Text type="secondary">
          {dayjs(event.start).format('hh:mm A')} - {dayjs(event.end).format('hh:mm A')}
        </Typography.Text>
      ),
    };
  });

  //   [
  //     {
  //       key: '1',
  //       label: 'This is panel header 1',
  //       children: <p>{text}</p>,
  //     },
  //     {
  //       key: '2',
  //       label: (
  //         <>
  //           <Avatar size="small" src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />
  //           <span style={{ paddingLeft: '0.5rem' }}>This is panel header 2</span>
  //         </>
  //       ),
  //       children: <p>{text}</p>,
  //     },
  //     {
  //       key: '3',
  //       label: <span>This is panel header 3</span>,
  //       children: <p>{text}</p>,
  //     },
  //   ];

  return (
    <>
      <Collapse items={items} defaultActiveKey={['1']} expandIconPosition="end" />
    </>
  );
}
