import { useEffect, useState } from 'react';

import { SmileOutlined, FrownOutlined } from '@ant-design/icons';
import { useParams } from 'react-router';
import { Link, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';

import * as api from '../../api/LinkMailAddress';
import { EmailType } from '../../common/types';
import Loader from '../../components/Loader';

export default function OauthCallback() {
  const params = useParams();
  const [searchParams] = useSearchParams();

  const [linkSuccess, setLinkSuccess] = useState<boolean | null>(null);
  const email_type = params.email_type === 'google' ? EmailType.GMAIL : EmailType.YAHOO;
  const code = searchParams.get('code');
  // useEffect(() => {
  // const email_type = params.email_type === 'google' ? EmailType.GMAIL : EmailType.YAHOO;
  // const code = searchParams.get('code');
  // //   const makeRequest = async () => {
  // //     if (code) {
  // //       const res = await linkMailAddress(code, email_type);
  // //       console.log(res);

  // //       if (res) setLinkSuccess(true);
  // //       else setLinkSuccess(false);
  // //     }
  // //   };
  // //   makeRequest();
  // // }, []);

  const { data, isLoading } = useSWR(['/link-mail-address', code], () =>
    api.linkMailAddress({
      data: {
        code: code,
        email_type: email_type,
      },
    }),
  );

  useEffect(() => {
    if (data) {
      setLinkSuccess(true);
    } else {
      setLinkSuccess(false);
    }
  }, [data]);

  const successMessage = () => (
    <>
      <SmileOutlined style={{ fontSize: 64 }} />
      <h1>Success</h1>
      <p style={{ fontSize: '1rem' }}>You have successfully linked your email</p>
      <Link to="/profile">Click here to get back to app</Link>
    </>
  );

  const errorMessage = () => (
    <>
      <FrownOutlined style={{ fontSize: 64 }} />
      <h1>Failed</h1>
      <p style={{ fontSize: '1rem' }}>Failed to link your email</p>
      <Link to="/profile">Click here to get back to app</Link>
    </>
  );

  return isLoading ? (
    <Loader loading={isLoading} />
  ) : (
    linkSuccess !== null && (
      <>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            height: '70vh',
          }}
        >
          {linkSuccess ? successMessage() : errorMessage()}
        </div>
      </>
    )
  );
}
