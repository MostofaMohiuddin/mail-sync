import { notification } from 'antd';
import axios, { AxiosError } from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://mailsync.com:7900/api',
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error instanceof AxiosError)
      notification.error({
        message: 'Error',
        description: error.response?.data?.detail || 'An error occurred',
      });
    else
      notification.error({
        message: 'Error',
        description: 'Unknown error occurred',
      });
    return Promise.reject(error);
  },
);
export default axiosClient;
