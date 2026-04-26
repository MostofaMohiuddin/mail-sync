import { useEffect, useState } from 'react';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import type { ISignInData } from '../../common/types';
import { useSession } from '../../hooks/userSession';
import { useThemeMode } from '../../hooks/useThemeMode';
import AuthShell from '../auth/AuthShell';

export default function SignIn() {
  const { signIn: signInApi, isAuthenticated } = useSession();
  const { colors } = useThemeMode();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (data: ISignInData) => {
    setLoading(true);
    await signInApi(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) navigate('/');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isAuthenticated) return null;

  return (
    <AuthShell
      eyebrow="Welcome back"
      headline="Your mail, beautifully unified."
      subhead="Sign in to pick up right where you left off."
    >
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: colors.text }}>
          Sign in
        </h2>
        <p style={{ margin: '6px 0 0', color: colors.textSecondary, fontSize: 14 }}>
          Use your MailSync account to continue.
        </p>
      </div>

      <Form name="signIn" initialValues={{ remember: true }} onFinish={onFinish} layout="vertical" requiredMark={false}>
        <Form.Item
          name="username"
          label={<span style={{ fontWeight: 500, color: colors.text }}>Username</span>}
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input size="large" prefix={<UserOutlined style={{ color: colors.textTertiary }} />} placeholder="username" />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span style={{ fontWeight: 500, color: colors.text }}>Password</span>}
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined style={{ color: colors.textTertiary }} />}
            placeholder="••••••••"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            style={{
              background: colors.primaryGradient,
              border: 'none',
              fontWeight: 600,
              boxShadow: '0 8px 18px rgba(99,102,241,0.35)',
            }}
          >
            Sign in
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 13 }}>
          New here?{' '}
          <Link to="/sign-up" style={{ color: colors.primary, fontWeight: 600 }}>
            Create an account
          </Link>
        </div>
      </Form>
    </AuthShell>
  );
}
