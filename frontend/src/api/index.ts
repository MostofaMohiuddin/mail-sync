import type { AxiosRequestConfig } from 'axios';

import axiosClient from './AxiosClient';
import type { IApiResponse } from '../common/types';

const apiRequestWrapper =
  (apiEndpoint: string, method: AxiosRequestConfig['method']) =>
  async (data?: unknown): Promise<IApiResponse> => {
    try {
      const response = await axiosClient.request({
        url: apiEndpoint,
        method: method,
        data: data,
      });
      return {
        response,
        error: null,
      };
    } catch (error) {
      return {
        error,
        response: null,
      };
    }
  };

const authorizedApiRequestWrapper =
  (apiEndpoint: string, method: AxiosRequestConfig['method']) =>
  async (data?: unknown): Promise<IApiResponse> => {
    try {
      const response = await axiosClient.request({
        url: apiEndpoint,
        method: method,
        data: data,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      return {
        response,
        error: null,
      };
    } catch (error) {
      return {
        error,
        response: null,
      };
    }
  };

export { apiRequestWrapper, authorizedApiRequestWrapper };
