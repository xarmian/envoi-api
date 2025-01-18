export function transformAvatarUrl(avatarUrl: string | undefined | null, size = 'thumb'): string | undefined | null {
  if (!avatarUrl) return avatarUrl;

  if (size !== 'full' && avatarUrl.startsWith('https://prod.cdn.highforge.io')) {
    let width = 128;
    if (size === 'small') width = 480;
  
    return `https://prod.cdn.highforge.io/i/${encodeURIComponent(avatarUrl)}?w=${width}`;
  }
  return avatarUrl;
} 