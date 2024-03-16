import { authorizedApiRequestWrapper2 } from '.';

const getEvents = authorizedApiRequestWrapper2('/calendars/events', 'get');

export { getEvents };
