import { authorizedApiRequestWrapper2 } from '.';

const getUser = () => authorizedApiRequestWrapper2('/user', 'get')();

export { getUser };
