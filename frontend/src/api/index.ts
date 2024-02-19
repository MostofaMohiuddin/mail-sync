import type { AxiosRequestConfig } from 'axios';

import axiosClient from './AxiosClient';
import type { IApiResponse, IApiRequest } from '../common/types';

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
  async (request?: IApiRequest): Promise<IApiResponse> => {
    // const accessToken = localStorage.getItem('access_token');
    const { data, query, param } = request || {};

    let url = apiEndpoint;
    if (param) {
      Object.keys(param).forEach((key) => {
        url = url.replace(`:${key}`, encodeURIComponent(param[key]!));
      });
    }

    try {
      const response = await axiosClient.request({
        url: query ? `${url}?${query}` : url,
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

const authorizedApiRequestWrapper2 =
  (apiEndpoint: string, method: AxiosRequestConfig['method']) =>
  async (request?: IApiRequest): Promise<any> => {
    const { data, query, param } = request || {};
    // const accessToken = localStorage.getItem('access_token');
    let url = apiEndpoint;
    if (param) {
      Object.keys(param).forEach((key) => {
        url = url.replace(`:${key}`, encodeURIComponent(param[key]!));
      });
    }

    // try {
    //   const response = await axiosClient.request({
    //     url: query ? `${url}?${query}` : url,
    //     method: method,
    //     data: data,
    //     headers: {
    //       Authorization: `Bearer ${accessToken}`,
    //     },
    //   });
    //   return {
    //     response,
    //     error: null,
    //   };
    // } catch (error) {
    //   return {
    //     error,
    //     response: null,
    //   };
    // }

    return await axiosClient.request({
      url: query ? `${url}?${query}` : url,
      method: method,
      data: data,
      // headers: {
      //   Authorization: `Bearer ${accessToken}`,
      // },
    });
  };

export { apiRequestWrapper, authorizedApiRequestWrapper, authorizedApiRequestWrapper2 };
