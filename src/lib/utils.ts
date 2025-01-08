export function transformAvatarUrl(avatarUrl: string | undefined | null, width = 128, fullAvatar = false): string | undefined | null {
  if (!avatarUrl) return avatarUrl;
  
  if (avatarUrl.startsWith('https://prod.cdn.highforge.io') && !fullAvatar) {
    return `https://prod.cdn.highforge.io/i/${encodeURIComponent(avatarUrl)}?w=${width}`;
  }
  
  return avatarUrl;
} 