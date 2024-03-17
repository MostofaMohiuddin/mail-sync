import { useEffect, useState } from 'react';

import { DeleteOutlined, PlusOutlined, GoogleOutlined, YahooOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, List, type MenuProps } from 'antd';
import { Link } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';

import * as api from '../../api/LinkMailAddress';
import { EmailType, type IUserLinkedMail } from '../../common/types';

export default function EmailAddressList() {
  const [mails, setMails] = useState<IUserLinkedMail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { mutate } = useSWRConfig();

  const { data: linkedMailAddressResponse, isLoading: isLoadingMailAddresses } = useSWR(
    '/link-mail-address',
    api.getLinkedMailAddress,
    {
      revalidateOnMount: true,
      revalidateOnFocus: true,
    },
  );

  useEffect(() => {
    setMails(linkedMailAddressResponse?.data || []);
  }, [linkedMailAddressResponse]);

  const linkEmail = async (emailType: EmailType) => {
    const res = await api.getOauthUrl({ query: `email_type=${emailType}` });

    window.open(res?.data?.redirect_link, '_blank', 'noreferrer');
  };

  const unlinkMail = async (email: string) => {
    setIsLoading(true);
    const data = await api.unlinkMailAddress({ query: `email=${email}` });
    if (data?.status === 204) {
      mutate('/link-mail-address');
      mutate((key) => Array.isArray(key) && key[0] === '/mails', undefined, { revalidate: false });
    }
    setIsLoading(false);
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
        loading={isLoadingMailAddresses || isLoading}
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
          <List.Item
            key={item.email}
            actions={[
              <Button
                key={item.email}
                shape="circle"
                icon={<DeleteOutlined />}
                onClick={() => unlinkMail(item.email)}
              />,
            ]}
          >
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
