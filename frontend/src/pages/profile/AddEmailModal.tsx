import { useState } from 'react';

import { Form, Input, Modal, Select } from 'antd';

import { EmailType } from '../../common/types';
import { useMail } from '../../hooks/useMail';

export default function AddEmailModal({ open, handleCancel }: { open: boolean; handleCancel: () => void }) {
  const { Option } = Select;
  const { loading, getOauthUrl } = useMail();
  const [email, setEmail] = useState('');

  const availableMailTypes = (
    <Select defaultValue="@gmail.com">
      <Option value="@gmail.com">@gmail.com</Option>
    </Select>
  );

  const linkEmail = async () => {
    console.log('Linking email', email);
    const res = await getOauthUrl(EmailType.GMAIL);
    console.log('Linking email response', res);
  };

  return (
    <Modal
      title="Link Mail Address"
      open={open}
      onOk={linkEmail}
      confirmLoading={loading}
      onCancel={handleCancel}
      okText="Link"
    >
      <Form name="basic" onFinish={linkEmail}>
        <Form.Item rules={[{ required: true, message: 'Please input your username!' }]}>
          <Input
            addonAfter={availableMailTypes}
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
