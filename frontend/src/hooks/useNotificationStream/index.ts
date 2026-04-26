import { useEffect, useRef, useState } from 'react';

import { useSWRConfig } from 'swr';

import { getNotificationStreamTicket } from '../../api/ImportantMailNotification';
import type { IImportantMailNotification } from '../../common/types';

const NOTIFICATIONS_KEY = '/important-mail/notifications';
const STREAM_BASE = 'https://mailsync.com/api/notifications/stream';
const BACKOFF_INITIAL_MS = 1000;
const BACKOFF_MAX_MS = 30_000;

interface NewEventPayload {
  type: 'new_important_mail';
  notifications: IImportantMailNotification[];
}

export function useNotificationStream({ enabled }: { enabled: boolean }): { connected: boolean } {
  const { mutate } = useSWRConfig();
  const [connected, setConnected] = useState(false);

  const sourceRef = useRef<EventSource | null>(null);
  const backoffRef = useRef(BACKOFF_INITIAL_MS);
  const reconnectTimerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const teardown = () => {
      cancelledRef.current = true;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      setConnected(false);
    };

    const open = async () => {
      if (cancelledRef.current) return;
      if (!enabled || document.visibilityState !== 'visible') return;

      let ticket: string | undefined;
      try {
        const response = await getNotificationStreamTicket();
        ticket = response?.data?.ticket;
      } catch {
        // network failure — let the visibility/onerror paths reschedule
      }
      if (!ticket || cancelledRef.current) return;

      const source = new EventSource(`${STREAM_BASE}?ticket=${encodeURIComponent(ticket)}`);
      sourceRef.current = source;

      source.addEventListener('ready', () => {
        backoffRef.current = BACKOFF_INITIAL_MS;
        setConnected(true);
      });

      source.addEventListener('new', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as NewEventPayload;
          const incoming = payload.notifications ?? [];
          mutate(
            NOTIFICATIONS_KEY,
            (current: { data?: IImportantMailNotification[] } | undefined) => {
              const existing = current?.data ?? [];
              const seen = new Set(existing.map((n) => n.id));
              const merged = [...incoming.filter((n) => !seen.has(n.id)), ...existing];
              return current ? { ...current, data: merged } : { data: merged };
            },
            { revalidate: false },
          );
          window.setTimeout(() => mutate(NOTIFICATIONS_KEY), 1000);
        } catch {
          // malformed payload — fall back to a refetch
          mutate(NOTIFICATIONS_KEY);
        }
      });

      source.onerror = () => {
        setConnected(false);
        source.close();
        sourceRef.current = null;
        if (cancelledRef.current) return;
        const delay = backoffRef.current;
        backoffRef.current = Math.min(backoffRef.current * 2, BACKOFF_MAX_MS);
        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null;
          void open();
        }, delay);
      };
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // refetch on resume to catch anything missed
        mutate(NOTIFICATIONS_KEY);
        if (!sourceRef.current) {
          backoffRef.current = BACKOFF_INITIAL_MS;
          void open();
        }
      } else {
        if (sourceRef.current) {
          sourceRef.current.close();
          sourceRef.current = null;
          setConnected(false);
        }
        if (reconnectTimerRef.current !== null) {
          window.clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    void open();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      teardown();
    };
  }, [enabled, mutate]);

  return { connected };
}
