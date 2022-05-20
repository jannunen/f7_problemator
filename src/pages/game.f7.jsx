//import { gameActions } from '../js/game-actions.js';
//import { gamePlatforms } from '../js/game-platforms.js';
import './game.less';

export default (
  props,
  { $f7, $theme, $el, $store, $update, $onMounted, $onBeforeUnmount },
) => {
  const { id } = props;
  let game = null;
  let photoBrowser = null;
  let hiddenSummary = true;

  const hasLargeSummary = () => {
    return hiddenSummary && game && game.description.length > 500;
  };
  const showFullSmmary = () => {
    hiddenSummary = false;
    $update();
  };

  const initPhotoBrowser = () => {
    if (!game || !game.screenshots.length) return;
    photoBrowser = $f7.photoBrowser.create({
      photos: game.screenshots.map((el) => el.image),
      popupPush: true,
      theme: 'dark',
      type: 'standalone',
    });
  };
  const destroyPhotoBrowser = () => {
    if (photoBrowser) photoBrowser.destroy();
  };
  const openPhotoBrowser = (index) => {
    if (photoBrowser) photoBrowser.open(index);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const formatter = new Intl.DateTimeFormat('en', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    });
    return formatter.format(date);
  };

  const openGameActions = () => {
    gameActions({
      game,
      $store,
      $theme,
      $f7,
      targetEl: $el.value.find('.game-page-actions-button'),
    });
  };

  $onMounted(() => {
    $store.dispatch('getGame', id).then((res) => {
      game = res;
      initPhotoBrowser();
      $update();
    });
  });
  $onBeforeUnmount(() => {
    destroyPhotoBrowser();
  });

  return () => (
    <div class="popup popup-push">
      <div class="view view-init">
        <div class="page game-page">
          <a href="#" class="link popup-close icon-only color-white">
            <i class="icon f7-icons ios-only">xmark</i>
            <i class="icon material-icons md-only">close</i>
          </a>
          {/* Page preloader */}
          {!game && <span class="preloader game-page-preloader" />}
          {/* Page header */}
          {game && (
            <div class="game-page-header">
              <div class="game-page-header-bg">
                <img
                  src={
                    game.background_image_additional || game.background_image
                  }
                  alt={game.name}
                  onLoad={(e) => e.target.classList.add('loaded')}
                />
              </div>
              <div class="game-page-header-card">
                <img
                  src={game.background_image || 'images/no-image.svg'}
                  alt={game.name}
                  onLoad={(e) => e.target.classList.add('loaded')}
                />
              </div>
            </div>
          )}
          {/* Page content */}
          {game && (
            <div class="page-content">
              <div class="game-page-content">
                <div class="block game-page-genres">
                  {game.genres.map((genre) => (
                    <span>{genre.name}</span>
                  ))}
                </div>
                <div class="page-title game-page-title">
                  <span>{game.name}</span>
                  <button
                    type="button"
                    class="button button-outline button-large game-page-actions-button"
                    onClick={openGameActions}
                  >
                    {$theme.ios && <i class="icon f7-icons">list_bullet</i>}
                    {$theme.md && (
                      <i class="icon material-icons">format_list_bulleted</i>
                    )}
                  </button>
                </div>

                {gamePlatforms(game).length > 0 && (
                  <>
                    <div class="block-title">Platforms</div>
                    <div class="block game-page-platforms">
                      {gamePlatforms(game).map((platform) => (
                        <img
                          src={`images/${platform}-logo.svg`}
                          alt={platform}
                        />
                      ))}
                    </div>
                  </>
                )}

                {game.released && (
                  <>
                    <div class="block-title">Release Date</div>
                    <div class="block game-page-text-item">
                      {formatDate(game.released)}
                    </div>
                  </>
                )}

                {game.description && (
                  <>
                    <div class="block-title">Summary</div>
                    <div
                      class={`block game-page-summary ${
                        hasLargeSummary() ? 'game-page-summary-collapsed' : ''
                      }`}
                    >
                      <div innerHTML={game.description} />
                      {hasLargeSummary() && (
                        <a
                          class="link no-ripple"
                          href="#"
                          onClick={showFullSmmary}
                        >
                          more
                        </a>
                      )}
                    </div>
                  </>
                )}

                {game.screenshots && game.screenshots.length > 0 && (
                  <>
                    <div class="block-title">Screenshots</div>
                    <div class="block game-page-screenshots scroll-block">
                      {game.screenshots.map((item, index) => (
                        <a
                          class="scroll-block-item"
                          key={index}
                          href="#"
                          onClick={() => openPhotoBrowser(index)}
                        >
                          <img
                            loading="lazy"
                            src={item.image}
                            width={item.width}
                            height={item.height}
                            alt="screenshot"
                            onLoad={(e) => e.target.classList.add('loaded')}
                          />
                        </a>
                      ))}
                    </div>
                  </>
                )}

                {game.metacritic && (
                  <>
                    <div class="block-title">Ratings</div>
                    <div class="block game-page-ratings">
                      <div class="game-page-ratings-item">
                        <img src="images/metacritic-logo.svg" />
                        <div>
                          <span>Metacritic</span>
                          <b>{game.metacritic}</b>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {game.developers && game.developers.length > 0 && (
                  <>
                    <div class="block-title">Developer</div>
                    <div class="block game-page-text-item">
                      {game.developers.map((el) => el.name).join(', ')}
                    </div>
                  </>
                )}

                {game.publishers && game.publishers.length > 0 && (
                  <>
                    <div class="block-title">Publisher</div>
                    <div class="block game-page-text-item">
                      {game.publishers.map((el) => el.name).join(', ')}
                    </div>
                  </>
                )}

                {game.website && (
                  <>
                    <div class="block-title">Links</div>
                    <div class="list links-list game-page-links-list">
                      <ul>
                        <li>
                          <a
                            href={game.website}
                            target="_blank"
                            class="external"
                          >
                            Official Website
                          </a>
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
