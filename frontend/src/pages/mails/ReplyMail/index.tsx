import { convert } from 'html-to-text';

import AiGenerateMail from './AiGenerateMail';
import AiReplyMail from './AiReplyMail';
import UserReplyMail from './UserReplyMail';
import type { IEmailFullData } from '../../../common/types';

export default function ReplyMail({ receivedMail }: { receivedMail?: IEmailFullData }) {
  return (
    <>
      {receivedMail ? (
        <AiReplyMail receivedMailBody={receivedMail?.body.plain || convert(receivedMail.body.html ?? '') || ''} />
      ) : (
        <AiGenerateMail />
      )}
      <div style={{ marginTop: 32 }}>
        <UserReplyMail
          receiverEmail={receivedMail?.sender.email}
          replySubject={receivedMail?.subject ? `RE: ${receivedMail.subject}` : ''}
        />
      </div>
    </>
  );
}
