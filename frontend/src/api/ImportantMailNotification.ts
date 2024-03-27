import { authorizedApiRequestWrapper2 } from '.';

const getImportantMailNotifications = () => authorizedApiRequestWrapper2('/important-mail/notifications', 'get')();
const markImportantMailNotificationAsRead = authorizedApiRequestWrapper2('/important-mail/notifications/read', 'put');

export { getImportantMailNotifications, markImportantMailNotificationAsRead };
