import { apiRequestWrapper } from './index';

const signIn = apiRequestWrapper('/auth/sign-in', 'post');
const signUp = apiRequestWrapper('/auth/sign-up', 'post');

export { signIn, signUp };
