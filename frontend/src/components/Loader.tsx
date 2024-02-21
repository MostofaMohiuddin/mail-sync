import { Spin } from 'antd';

const Loader = ({ loading }: { loading: boolean }) => {
  return <Spin size="large" spinning={loading} fullscreen />;
};

export default Loader;
