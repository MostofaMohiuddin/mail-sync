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

export interface INextPageToken {
  next_page_token: string;
  email: string;
}

export interface IGetEmailsResponse {
  emails: IEmailMetadata[];
  next_page_tokens: INextPageToken[];
}

export interface IEmailBody {
  html?: string;
  plain?: string;
}
export interface IEmailFullData extends IEmailMetadata {
  body: IEmailBody;
}

export enum IProcessEmailType {
  REPLY = 'REPLY',
  GENERATE = 'GENERATE',
  SUMMARY = 'SUMMARY',
}

export interface IUserLinkedMail {
  id: string;
  username: string;
  email: string;
  picture: string;
  email_name: string;
}
export interface IEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
  creator_email: string;
  created: string;
  updated: string;
  attendees: string[];
  video_conference_link: string;
  userEmail: string;
}

export interface IEventsResponse {
  email: string;
  events: IEvent[];
}

export interface IScheduleMail {
  sender_link_mail_address_id: string;
  receiver: string;
  subject: string;
  body: {
    html: string;
    plain: string;
  };
  status: string;
  scheduled_at: string;
  id: string;
  sender_details: {
    username: string;
    email: string;
  };
}
