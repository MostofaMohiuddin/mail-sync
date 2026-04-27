import { Spin } from 'antd';
import { createPortal } from 'react-dom';

const Loader = ({ loading }: { loading: boolean }) => {
  return createPortal(<Spin size="large" spinning={loading} fullscreen />, document.body);
};

export default Loader;
