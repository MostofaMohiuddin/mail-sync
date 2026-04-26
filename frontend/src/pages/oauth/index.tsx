import { useEffect, useState } from 'react';

import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { useParams } from 'react-router';
import { Link, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';

import * as api from '../../api/LinkMailAddress';
import { EmailType } from '../../common/types';
import Loader from '../../components/Loader';
import GlassCard from '../../components/ui/GlassCard';
import { useThemeMode } from '../../hooks/useThemeMode';

export default function OauthCallback() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { colors } = useThemeMode();

  const [linkSuccess, setLinkSuccess] = useState<boolean | null>(null);
  const email_type = params.email_type === 'google' ? EmailType.GMAIL : EmailType.YAHOO;
  const code = searchParams.get('code');

  const { data, isLoading } = useSWR(['/link-mail-address', code], () =>
    api.linkMailAddress({
      data: { code, email_type },
    }),
  );

  useEffect(() => {
    if (data) setLinkSuccess(true);
    else setLinkSuccess(false);
  }, [data]);

  if (isLoading) return <Loader loading={isLoading} />;
  if (linkSuccess === null) return null;

  const success = linkSuccess;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh',
        padding: 24,
      }}
    >
      <GlassCard variant="solid" padding={36} style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: success ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: success ? colors.success : colors.error,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 44,
            margin: '0 auto 16px',
          }}
        >
          {success ? <CheckCircleFilled /> : <CloseCircleFilled />}
        </div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: colors.text }}>
          {success ? 'Account linked' : 'Linking failed'}
        </h2>
        <p style={{ marginTop: 8, color: colors.textSecondary, fontSize: 14 }}>
          {success
            ? 'Your email account has been connected. You can close this tab or head back to the app.'
            : 'We could not link your email. Please try again from the profile page.'}
        </p>
        <div style={{ marginTop: 24 }}>
          <Link
            to="/profile"
            style={{
              display: 'inline-block',
              padding: '10px 22px',
              background: colors.primaryGradient,
              color: '#FFFFFF',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 8px 18px rgba(99,102,241,0.35)',
            }}
          >
            Back to Profile
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
