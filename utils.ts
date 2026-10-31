
export const getYoutubeId = (url: string): string | null => {
  if (!url) return null;
  
  // Clean the URL from whitespace
  const cleanUrl = url.trim();
  
  // This regex is more specific for the 11-char ID and handles shorts, mobile, and desktop formats
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]{11}).*/;
  const match = cleanUrl.match(regExp);
  
  return (match && match[1]) ? match[1] : null;
};

export const getThumbnail = (url: string): string => {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : 'https://picsum.photos/seed/jukebox/400/225';
};
