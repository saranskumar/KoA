export function getSuperheroAvatar(nameOrEmail) {
  if (!nameOrEmail) return `https://api.dicebear.com/7.x/bottts/svg?seed=Anonymous&backgroundColor=dde7c7,f0f9f5`;
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nameOrEmail)}&backgroundColor=dde7c7,bfd8bd,77bfa3,fb923c,f0f9f5`;
}
