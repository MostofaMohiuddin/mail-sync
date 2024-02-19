import { UserOutlined } from '@ant-design/icons';
import { Avatar, Divider } from 'antd';

import EmailAddressList from './EmailAddressList';
import { useSession } from '../../hooks/userSession';

export default function Profile() {
  const { user } = useSession();
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <Avatar size={128} icon={<UserOutlined />} />
        <h2>{user?.username}</h2>
        <Divider />
        <div style={{ width: '60%', maxHeight: '80px !important' }}>
          <EmailAddressList />
        </div>
      </div>
    </>
  );
}
