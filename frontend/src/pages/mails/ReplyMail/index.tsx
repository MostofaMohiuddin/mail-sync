import { Divider } from 'antd';

import AiReplyMail from './AiReplyMail';
import UserReplyMail from './UserReplyMail';

export default function ReplyMail({ mailBody }: { mailBody: string }) {
  return (
    <>
      <AiReplyMail text={mailBody} />
      <Divider />
      <UserReplyMail />
    </>
  );
}
