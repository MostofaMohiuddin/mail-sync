import { authorizedApiRequestWrapper2 } from '.';

const getMails = () => authorizedApiRequestWrapper2('/mails', 'get')();

const getMail = authorizedApiRequestWrapper2('/mails/:mail_address/:mail_id', 'get');

const processMailWithAI = authorizedApiRequestWrapper2('/mails/process-with-ai', 'post');

export { getMails, getMail, processMailWithAI };
