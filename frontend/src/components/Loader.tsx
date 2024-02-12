import { Spin } from 'antd';

const Loader = ({ loading }: { loading: boolean }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
      }}
    >
      <Spin size="large" spinning={loading} />
    </div>
  );
};

export default Loader;
