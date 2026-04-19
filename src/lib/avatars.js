export const HEROES = [
  '346-iron-man', '70-batman', '620-spider-man', '149-captain-america', 
  '720-wonder-woman', '644-superman', '659-thor', '106-black-panther', 
  '226-doctor-strange', '213-deadpool', '655-thanos', '332-hulk',
  '263-flash', '58-aquaman', '298-green-lantern', '165-catwoman',
  '306-harley-quinn', '370-joker'
];

export const VIBES = [
  'Felix', 'Aneka', 'Julian', 'Lucas', 'Milo', 'Kira', 'Luna', 'Jasper', 'Finn', 'Oliver'
];

export const BOTS = [
  'Terminator', 'R2D2', 'C3PO', 'WallE', 'Eve', 'Bender', 'Astro', 'Data', 'Zordon', 'Vision'
];

export const PIXELS = [
  'Hero', 'Enemy', 'Pet', 'Npc', 'Dungeon', 'King', 'Queen', 'Knight'
];

export function getHeroUrl(heroKey) {
  return `https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/sm/${heroKey}.jpg`;
}

export function getVibeUrl(seed) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f8faf4`;
}

export function getBotUrl(seed) {
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f8faf4`;
}

export function getPixelUrl(seed) {
  return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f8faf4`;
}

export function getSuperheroAvatar(nameOrEmail) {
  if (!nameOrEmail) return getHeroUrl(HEROES[1]); // Default Batman
  const index = nameOrEmail.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % HEROES.length;
  return getHeroUrl(HEROES[index]);
}
