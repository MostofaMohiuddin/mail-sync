// Fixed 6-color palette of mid-saturation colors that read well as
// FullCalendar event backgrounds with white text. Same email always
// resolves to the same color, so events from the same linked account
// share a color.

const PALETTE = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const colorForAccount = (email: string): string => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]!;
};
