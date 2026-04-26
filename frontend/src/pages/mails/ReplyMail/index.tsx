import { convert } from 'html-to-text';

import UserReplyMail from './UserReplyMail';
import type { IEmailFullData } from '../../../common/types';

interface ReplyMailProps {
  receivedMail?: IEmailFullData;
  editorHeight?: number | string;
}

export default function ReplyMail({ receivedMail, editorHeight }: ReplyMailProps) {
  const receivedBody = receivedMail
    ? receivedMail.body.plain || convert(receivedMail.body.html ?? '') || ''
    : '';
  return (
    <UserReplyMail
      receiverEmail={receivedMail?.sender.email}
      replySubject={receivedMail?.subject ? `RE: ${receivedMail.subject}` : ''}
      receivedMailBody={receivedBody}
      editorHeight={editorHeight}
    />
  );
}
