import type { AxiosResponse } from 'axios';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export interface IApiResponse {
  response: AxiosResponse | null;
  error: unknown | null;
}

export interface ISignInData {
  username: string;
  password: string;
}

export interface ISignUpData {
  username: string;
  password: string;
}

export interface IUser {
  username: string;
}

export interface IApiRequest {
  data?: unknown;
  query?: string;
}

export enum EmailType {
  GMAIL = 'gmail',
  YAHOO = 'yahoo',
}
