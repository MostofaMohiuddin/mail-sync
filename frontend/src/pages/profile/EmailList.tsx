import { useEffect, useState } from 'react';

import { DeleteOutlined, PlusOutlined, GoogleOutlined, YahooOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, List, type MenuProps } from 'antd';
import { Link } from 'react-router-dom';

import { EmailType } from '../../common/types';
import { useMail, type IUserLinkedMail } from '../../hooks/useMail';

export default function EmailList() {
  const [mails, setMails] = useState<IUserLinkedMail[]>([]);
  const { getLinkedMails, loading, getOauthUrl } = useMail();

  useEffect(() => {
    const fetchMails = async () => {
      const data = await getLinkedMails();
      setMails(data);
    };
    fetchMails();
  }, []);

  const linkEmail = async (emailType: EmailType) => {
    const res = await getOauthUrl(emailType);
    window.open(res.redirect_link, '_blank', 'noreferrer');
  };

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <a
          onClick={async () => {
            await linkEmail(EmailType.GMAIL);
          }}
          style={{ fontSize: '0.9rem' }}
        >
          Google
        </a>
      ),
      icon: <GoogleOutlined />,
    },
    {
      key: '2',
      label: (
        <Link rel="noopener noreferrer" to="/sign-out" style={{ fontSize: '0.9rem' }}>
          Yahoo
        </Link>
      ),
      icon: <YahooOutlined />,
      disabled: true,
    },
  ];

  return (
    <>
      <List
        loading={loading}
        header={
          <div
            style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: ' 0 8px',
            }}
          >
            <span>Linked Mail Address</span>
            <Dropdown menu={{ items }} trigger={['hover']} placement="bottom" arrow>
              <Button shape="circle" icon={<PlusOutlined />}></Button>
            </Dropdown>
          </div>
        }
        dataSource={mails}
        renderItem={(item) => (
          <List.Item key={item.email} actions={[<Button key={item.email} shape="circle" icon={<DeleteOutlined />} />]}>
            <List.Item.Meta
              avatar={<Avatar src={item.picture} size={50} />}
              title={item.email_name}
              description={item.email}
            />
          </List.Item>
        )}
      />
    </>
  );
}
