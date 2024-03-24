import { authorizedApiRequestWrapper2 } from '.';

const scheduleMail = authorizedApiRequestWrapper2('/schedule-mail', 'post');
const getScheduleMails = authorizedApiRequestWrapper2('/schedule-mail', 'get');
const updateScheduleMail = authorizedApiRequestWrapper2('/schedule-mail/:schedule_mail_id', 'put');

const getScheduleAutoReply = authorizedApiRequestWrapper2('/schedule-auto-reply', 'get');
const createScheduleAutoReply = authorizedApiRequestWrapper2('/schedule-auto-reply', 'post');

export { scheduleMail, getScheduleMails, updateScheduleMail, getScheduleAutoReply, createScheduleAutoReply };
