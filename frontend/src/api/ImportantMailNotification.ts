import { authorizedApiRequestWrapper2 } from '.';

const getImportantMailNotifications = () => authorizedApiRequestWrapper2('/important-mail/notifications', 'get')();

export { getImportantMailNotifications };
