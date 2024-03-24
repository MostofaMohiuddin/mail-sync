import { authorizedApiRequestWrapper2 } from '.';

const scheduleMail = authorizedApiRequestWrapper2('/schedule-mail', 'post');
const getScheduleMails = authorizedApiRequestWrapper2('/schedule-mail', 'get');
const updateScheduleMail = authorizedApiRequestWrapper2('/schedule-mail/:schedule_mail_id', 'put');

export { scheduleMail, getScheduleMails, updateScheduleMail };
