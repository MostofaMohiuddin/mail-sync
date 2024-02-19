export const generateRandomColor = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate color
  const color = Math.floor(Math.abs(Math.sin(hash) * 16777215) % 16777215); // Generate a hexadecimal color

  // Convert color to hexadecimal format
  const hexColor = '#' + color.toString(16);

  return hexColor;
};

export const generateAvatarText = (text: string) => {
  if (typeof text !== 'string') {
    throw new Error('Input must be a string');
  }

  const words = text.split(' ');
  const firstTwoWords = words.slice(0, 2);

  return firstTwoWords.map((word) => word.charAt(0).toUpperCase()).join('');
};
