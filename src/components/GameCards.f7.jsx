import { gamePlatforms } from '../js/game-platforms.js';
import './GameCards.less';

export default function GameCards(props) {
  const { games, metacritic, grid, small, skeleton } = props;

  const classes = () => [
    'block game-cards',
    small ? 'game-cards-small' : '',
    grid ? 'game-cards-grid' : 'scroll-block',
    skeleton ? 'skeleton-effect-wave' : '',
  ];
  return () => (
    <div class={classes().join(' ')}>
      {/* show skeleton loading when no items */}
      {skeleton &&
        Array.from({ length: 12 }).map((_, index) => (
          <a key={`loading-${index}`} class="game-card scroll-block-item">
            <div class="game-card-image" />
            <div class="game-card-logos skeleton-text">Logos placeholder</div>
            <div class="game-card-name skeleton-text">Name placeholder</div>
          </a>
        ))}
      {/* otherwise show items */}
      {!skeleton &&
        (games.value || games).map((game) => (
          <a
            key={game.id}
            class="game-card scroll-block-item"
            href={`/game/${game.id}/`}
          >
            <div class="game-card-image">
              <img
                src={game.background_image || 'images/no-image.svg'}
                alt={game.name}
                onLoad={(e) => e.target.classList.add('loaded')}
              />
            </div>

            <div class="game-card-logos">
              {gamePlatforms(game).map((platform) => (
                <img src={`images/${platform}-logo.svg`} alt={platform} />
              ))}
              {metacritic && (
                <div class="game-card-metacritic">
                  <img src="images/metacritic-logo.svg" alt="metacritic" />
                  <span>{game.metacritic}</span>
                </div>
              )}
            </div>
            <div class="game-card-name">{game.name}</div>
          </a>
        ))}
    </div>
  );
}
