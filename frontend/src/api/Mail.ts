import { authorizedApiRequestWrapper } from '.';

const getLinkedMailAddress = authorizedApiRequestWrapper('/link-mail-address', 'get');

const getOauthUrl = authorizedApiRequestWrapper('/link-mail-address/oauth-url', 'get');

const linkMailAddress = authorizedApiRequestWrapper('/link-mail-address', 'post');

export { getLinkedMailAddress, getOauthUrl, linkMailAddress };
