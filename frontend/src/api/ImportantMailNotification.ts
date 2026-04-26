import { authorizedApiRequestWrapper2 } from '.';

const getImportantMailNotifications = () => authorizedApiRequestWrapper2('/important-mail/notifications', 'get')();
const markImportantMailNotificationAsRead = authorizedApiRequestWrapper2('/important-mail/notifications/read', 'put');
const getNotificationStreamTicket = () => authorizedApiRequestWrapper2('/notifications/stream/ticket', 'post')();

export {
  getImportantMailNotifications,
  markImportantMailNotificationAsRead,
  getNotificationStreamTicket,
};
