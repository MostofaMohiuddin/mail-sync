import { useState, type ReactNode } from 'react';

import { CloseOutlined, EditOutlined, MinusOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { createPortal } from 'react-dom';

import { useThemeMode } from '../../../hooks/useThemeMode';
import { shadow as lightShadow, shadowDark } from '../../../themes/tokens';

type SheetState = 'collapsed' | 'expanded' | 'minimized';

interface ComposerSheetProps {
  recipientLabel?: string;
  subject?: string;
  defaultOpen?: boolean;
  children: (api: { editorHeight: string }) => ReactNode;
}

const SHEET_WIDTH = 560;
const SHEET_HEIGHT = 640;
const SHEET_OFFSET = 24;
const SHEET_Z_INDEX = 1010;

export default function ComposerSheet({ recipientLabel, subject, defaultOpen = false, children }: ComposerSheetProps) {
  const { colors, mode } = useThemeMode();
  const shadows = mode === 'dark' ? shadowDark : lightShadow;
  const [state, setState] = useState<SheetState>(defaultOpen ? 'expanded' : 'collapsed');

  const open = () => setState('expanded');
  const minimize = () => setState('minimized');
  const close = () => setState('collapsed');

  // Sheet stays mounted while not collapsed, even when minimized — that
  // preserves the children's internal state across minimize/restore.
  // When collapsed, the sheet unmounts and a fresh draft starts on next open.
  const sheet =
    state !== 'collapsed' ? (
      <div
        style={{
          position: 'fixed',
          right: SHEET_OFFSET,
          bottom: SHEET_OFFSET,
          zIndex: SHEET_Z_INDEX,
          width: SHEET_WIDTH,
          maxWidth: `calc(100vw - ${SHEET_OFFSET * 2}px)`,
          height: SHEET_HEIGHT,
          maxHeight: `calc(100vh - ${SHEET_OFFSET * 2}px)`,
          background: colors.surfaceElevated,
          border: `1px solid ${colors.border}`,
          borderRadius: 20,
          boxShadow: shadows.xl,
          display: state === 'expanded' ? 'flex' : 'none',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: 48,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px 0 16px',
            background: colors.primaryGradient,
            color: '#FFFFFF',
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subject || 'New message'}
          </span>
          <Tooltip title="Minimize">
            <Button type="text" size="small" icon={<MinusOutlined />} onClick={minimize} style={{ color: '#FFFFFF' }} />
          </Tooltip>
          <Tooltip title="Close">
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={close} style={{ color: '#FFFFFF' }} />
          </Tooltip>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{children({ editorHeight: '100%' })}</div>
      </div>
    ) : null;

  const pill =
    state === 'collapsed' ? (
      <button
        type="button"
        onClick={open}
        style={{
          position: 'fixed',
          right: SHEET_OFFSET,
          bottom: SHEET_OFFSET,
          zIndex: SHEET_Z_INDEX,
          minWidth: 220,
          height: 48,
          padding: '0 18px',
          borderRadius: 999,
          border: 'none',
          cursor: 'pointer',
          background: colors.primaryGradient,
          color: '#FFFFFF',
          boxShadow: shadows.lg,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        <EditOutlined />
        <span>Reply{recipientLabel ? ` to ${recipientLabel}` : ''}…</span>
      </button>
    ) : state === 'minimized' ? (
      <button
        type="button"
        onClick={open}
        style={{
          position: 'fixed',
          right: SHEET_OFFSET,
          bottom: SHEET_OFFSET,
          zIndex: SHEET_Z_INDEX,
          minWidth: 280,
          maxWidth: 360,
          height: 44,
          padding: '0 14px',
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          cursor: 'pointer',
          background: colors.surfaceElevated,
          color: colors.text,
          boxShadow: shadows.md,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          textAlign: 'left',
        }}
      >
        <UpOutlined style={{ color: colors.textSecondary }} />
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subject || 'Draft reply'}
        </span>
      </button>
    ) : null;

  return createPortal(
    <>
      {sheet}
      {pill}
    </>,
    document.body,
  );
}
