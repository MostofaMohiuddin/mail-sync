import { notification } from 'antd';
import axios, { AxiosError } from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://mailsync.com:7900/api',
});

axiosClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (config.url === '/auth/refresh-token') {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        config.headers['Authorization'] = `Bearer ${refreshToken}`;
      } else {
        const controller = new AbortController();
        controller.abort();
        return {
          ...config,
          signal: controller.signal,
        };
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (error instanceof AxiosError) {
      if (error.response?.status === 401 && !originalRequest?._retry && originalRequest.url !== '/auth/sign-in') {
        originalRequest._retry = true;
        try {
          const response = await axiosClient.get('/auth/refresh-token');
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return axios(originalRequest);
        } catch (error) {
          return Promise.reject(error);
        }
      }
      notification.error({
        message: 'Error',
        description: error.response?.data.detail || 'Unknown error occurred',
      });
    } else
      notification.error({
        message: 'Error',
        description: 'Unknown error occurred',
      });
    return Promise.reject(error);
  },
);
export default axiosClient;
