export const stripHtml = (value = '') => {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
};

export const normalizePostContent = (value = '') => {
  if (!value) return '';
  const hasHtml = /<[^>]+>/.test(value);
  return hasHtml ? stripHtml(value) : value;
};
