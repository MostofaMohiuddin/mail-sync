// eslint-disable-next-line import/no-extraneous-dependencies
import axios from 'axios';

export default function App() {
  const getName = () => 'React LOL';
  const getRes = async () => {
    const res2 = await axios.get('http://localhost:7900/api/path');
    console.log('res2', res2);
  };
  getRes();
  return <div>{getName()}</div>;
}
