import { authorizedApiRequestWrapper2 } from '.';

const getLinkedMailAddress = () => authorizedApiRequestWrapper2('/link-mail-address', 'get')();

const getOauthUrl = authorizedApiRequestWrapper2('/link-mail-address/oauth-url', 'get');

const linkMailAddress = authorizedApiRequestWrapper2('/link-mail-address', 'post');

const unlinkMailAddress = authorizedApiRequestWrapper2('/link-mail-address', 'delete');

export { getLinkedMailAddress, getOauthUrl, linkMailAddress, unlinkMailAddress };
