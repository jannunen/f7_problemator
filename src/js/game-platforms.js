export const gamePlatforms = (game) => {
  const platforms = [];
  if (!game.platforms) return platforms;
  game.platforms.forEach(({ platform }) => {
    const { name } = platform;
    if (name.includes('PlayStation') || name.includes('Vita')) {
      platforms.push('playstation');
    } else if (name.includes('Xbox')) {
      platforms.push('xbox');
    } else if (
      name.includes('PC') ||
      name.includes('Steam') ||
      name.includes('Epic') ||
      name.includes('Linux') ||
      name.includes('Epic')
    ) {
      platforms.push('pc');
    } else if (
      name.includes('Nintendo') ||
      name.includes('Switch') ||
      name.includes('GameCube') ||
      name.includes('Wii')
    ) {
      platforms.push('nintendo');
    }
  });

  return [...new Set(platforms)];
};
