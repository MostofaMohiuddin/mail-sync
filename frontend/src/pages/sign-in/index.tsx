import { useEffect, useState } from 'react';

import { Form, Input, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import type { ISignInData } from '../../common/types';
import { useSession } from '../../hooks/userSession';

export default function SignIn() {
  const { signIn: signInApi, isAuthenticated } = useSession();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const onFinish = async (data: ISignInData) => {
    console.log(signInApi);
    setLoading(true);
    await signInApi(data);
    setLoading(false);
  };
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, []);

  return (
    !isAuthenticated && (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Form name="basic" initialValues={{ remember: true }} onFinish={onFinish} style={{ width: 300 }}>
          <div style={{ textAlign: 'center', marginBottom: '16px', fontWeight: 'bold', fontSize: '2rem' }}>Sign In</div>
          <Form.Item name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
            <Input placeholder="Username" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              Sign In
            </Button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              Or <Link to="/sign-up">Sign Up Now!</Link>
            </div>
          </Form.Item>
        </Form>
      </div>
    )
  );
}
