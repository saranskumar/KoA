const PREFIXES = [
  'Void', 'Nova', 'Iron', 'Shadow', 'Neon', 'Storm', 'Phantom', 'Hyper', 'Cyber', 'Dark',
  'Quantum', 'Crimson', 'Omega', 'Solar', 'Lunar', 'Turbo', 'Electro', 'Inferno', 'Frost', 'Vortex'
];

const SUFFIXES = [
  'Strike', 'Core', 'Rift', 'Flux', 'Edge', 'Pulse', 'Vibe', 'Clash', 'Drift', 'Blast',
  'Shard', 'Spark', 'Wave', 'Drive', 'Trace', 'Snare', 'Crash', 'Shift', 'Zone', 'Force'
];

/**
 * Generates a random comic-style name from prefixes and suffixes.
 * @returns {string} 
 */
export function generateRandomName() {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  
  // 15% chance to add a number for extra uniqueness
  const addNumber = Math.random() < 0.15;
  const number = Math.floor(Math.random() * 99) + 1;
  
  return `${prefix}${suffix}${addNumber ? number : ''}`;
}

/**
 * Generates a list of random name options.
 * @param {number} count 
 * @returns {string[]}
 */
export function generateNameOptions(count = 3) {
  const options = new Set();
  while (options.size < count) {
    options.add(generateRandomName());
  }
  return Array.from(options);
}
