import type { IEmailMetadata } from '../../common/types';

// Dates are computed once at module load so they look "live" relative to now.
// Static enough not to cause hydration weirdness — the landing isn't SSR'd.
const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();

export interface MockMail extends IEmailMetadata {
  unread: boolean;
}

export const mockMails: MockMail[] = [
  {
    id: 'mock-1',
    sender: { name: 'Alex Rivera', email: 'alex@figma.com' },
    receiver: { name: 'You', email: 'you@gmail.com' },
    subject: 'Design review notes — landing v3',
    snippet: 'Loved the new hero section. A couple of small tweaks before we ship…',
    date: minutesAgo(8),
    unread: true,
  },
  {
    id: 'mock-2',
    sender: { name: 'GitHub', email: 'noreply@github.com' },
    receiver: { name: 'You', email: 'you@gmail.com' },
    subject: '[mail-sync] PR #142 ready for review',
    snippet: 'Aurora Glass UI redesign — adds dark mode and refreshes every page.',
    date: minutesAgo(42),
    unread: false,
  },
  {
    id: 'mock-3',
    sender: { name: 'Priya Nair', email: 'priya@stripe.com' },
    receiver: { name: 'You', email: 'work@gmail.com' },
    subject: 'Quick sync tomorrow?',
    snippet: 'Want to walk through the Q2 plan before the all-hands. 30 min works.',
    date: hoursAgo(3),
    unread: false,
  },
  {
    id: 'mock-4',
    sender: { name: 'Linear', email: 'updates@linear.app' },
    receiver: { name: 'You', email: 'you@gmail.com' },
    subject: 'Your weekly summary is ready',
    snippet: '12 issues completed, 3 in review, 5 new. Velocity is up 18% this week.',
    date: hoursAgo(7),
    unread: false,
  },
];

export const mockMenuItems = [
  { key: 'inbox', label: 'Inbox', count: 12 },
  { key: 'calendar', label: 'Calendar', count: 0 },
  { key: 'schedule', label: 'Scheduled', count: 3 },
  { key: 'profile', label: 'Profile', count: 0 },
];
