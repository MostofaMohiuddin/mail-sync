import { authorizedApiRequestWrapper } from '.';

const getUser = authorizedApiRequestWrapper('/user', 'get');

export { getUser };
