import { Input } from 'antd';

export default function ReplyDataInput({
  value,
  setValue,
  placeholder,
}: {
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div style={{ border: '1px solid #ddd', borderBottom: 'none', padding: '4px 0px' }}>
      <Input
        placeholder={placeholder}
        variant="borderless"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ fontSize: '0.85rem' }}
      />
    </div>
  );
}
