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
interface IApiPathParams {
  [key: string]: string;
}

export interface IApiRequest {
  data?: unknown;
  query?: string;
  param?: IApiPathParams;
}

export enum EmailType {
  GMAIL = 'gmail',
  YAHOO = 'yahoo',
}

export interface IEmailUserInfo {
  email: string;
  name: string;
}

export interface IEmailMetadata {
  sender: IEmailUserInfo;
  subject: string;
  date: string;
  snippet: string;
  receiver: IEmailUserInfo;
  id: string;
}

export interface IEmailBody {
  html?: string;
  plain?: string;
}
export interface IEmailFullData extends IEmailMetadata {
  body: IEmailBody;
}
