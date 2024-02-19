import { useState } from 'react';

import { Form, Input, Button, notification } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import * as AuthApi from '../../api/Authentication';
import type { ISignUpData } from '../../common/types';

export default function SignUp() {
  const [loading, setLoading] = useState(false);

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
    <>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Form name="basic" initialValues={{ remember: true }} onFinish={onFinish} style={{ width: 300 }}>
          <div style={{ textAlign: 'center', marginBottom: '16px', fontWeight: 'bold', fontSize: '2rem' }}>Sign Up</div>
          <Form.Item name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
            <Input placeholder="Username" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              Sign Up
            </Button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              Or <Link to="/sign-in">Sign In Now!</Link>
            </div>
          </Form.Item>
        </Form>
      </div>
    </>
  );
}
