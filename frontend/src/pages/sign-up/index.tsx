import { Form, Input, Button } from 'antd';
import { Link } from 'react-router-dom';

import type { ISignUpData } from '../../common/types';
import { useAuthentication } from '../../hooks/authentication';

export default function SignUp() {
  const { signUp, loading } = useAuthentication();

  const onFinish = async (data: ISignUpData) => {
    await signUp(data);
  };

  return (
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
  );
}
