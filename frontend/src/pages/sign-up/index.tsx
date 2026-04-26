import { useState } from 'react';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, notification } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import * as AuthApi from '../../api/Authentication';
import type { ISignUpData } from '../../common/types';
import { useThemeMode } from '../../hooks/useThemeMode';
import AuthShell from '../auth/AuthShell';

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const { colors } = useThemeMode();
  const navigate = useNavigate();

  const onFinish = async (data: ISignUpData) => {
    setLoading(true);
    const { response } = await AuthApi.signUp({ ...data });
    if (response) {
      notification.success({
        message: 'User Created',
        description: 'User has been created successfully. Please sign in to continue.',
      });
      navigate('/sign-in');
    }
    setLoading(false);
  };

  return (
    <AuthShell
      eyebrow="Get started"
      headline="Create your MailSync account."
      subhead="Bring all your inboxes together in minutes."
    >
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: colors.text }}>
          Create account
        </h2>
        <p style={{ margin: '6px 0 0', color: colors.textSecondary, fontSize: 14 }}>
          It only takes a moment.
        </p>
      </div>

      <Form name="signUp" initialValues={{ remember: true }} onFinish={onFinish} layout="vertical" requiredMark={false}>
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
            placeholder="Choose a strong password"
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
            Create account
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 13 }}>
          Already have an account?{' '}
          <Link to="/sign-in" style={{ color: colors.primary, fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </Form>
    </AuthShell>
  );
}
