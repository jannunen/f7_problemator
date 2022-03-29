import './Onboarding.less';

export default function Onboarding(
  props,
  { $f7, $el, $onMounted, $onBeforeUnmount },
) {
  const enabled = !localStorage.onboardingFinished;
  let swiper;
  let popup;

  const createSwiper = () => {
    swiper = $f7.swiper.create({
      el: '.onboarding .swiper-container',
      observer: true,
      observeParents: true,
      effect: 'coverflow',
      speed: 600,
      coverflowEffect: {
        rotate: 0,
        depth: 400,
        stretch: 0,
      },
      pagination: {
        el: '.onboarding .swiper-pagination',
      },
    });
  };
  const createPopup = () => {
    popup = $f7.popup.create({
      el: $el.value,
      opened: true,
    });
    popup.open(false);
  };
  const destroySwiper = () => {
    if (swiper) swiper.destroy();
  };
  const destroyPopup = () => {
    if (popup) popup.destroy();
  };
  $onMounted(() => {
    if (!enabled) return;
    createPopup();
    createSwiper();
  });
  $onBeforeUnmount(() => {
    destroyPopup();
    destroySwiper();
  });

  const slideNext = () => {
    swiper.slideNext();
  };

  const closeOnboarding = () => {
    $f7.popup.close('.popup-onboarding', true);
    localStorage.onboardingFinished = true;
  };

  // Return empty div when onboarding is disabled
  return () =>
    !enabled ? (
      <div />
    ) : (
      <div
        class="popup popup-onboarding onboarding popup-tablet-fullscreen modal-in"
        onPopupClosed={destroySwiper}
      >
        <div class="swiper-container">
          <div class="swiper-pagination" />
          <div class="swiper-wrapper">
            <div class="swiper-slide">
              <div class="onboarding-content">
                <div class="onboarding-icon">
                  <img src="icons/128x128.png" />
                </div>
                <div class="onboarding-title">Backlogger</div>
                <div class="onboarding-text">
                  Welcome to the Backlogger - ultimate video games tracking app!
                </div>
                <div class="onboarding-next">
                  <a href="#" class="button button-small" onClick={slideNext}>
                    Next
                  </a>
                </div>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="onboarding-content">
                <div class="onboarding-icon">
                  <i class="icon f7-icons ios-only">compass_fill</i>
                  <i class="icon material-icons md-only">explore</i>
                </div>
                <div class="onboarding-title">Discover</div>
                <div class="onboarding-text">
                  Search and discover thousands of video games, upcoming and
                  recent releases.
                </div>
                <div class="onboarding-next">
                  <a href="#" class="button button-small" onClick={slideNext}>
                    Next
                  </a>
                </div>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="onboarding-content">
                <div class="onboarding-icon">
                  <i class="icon f7-icons ios-only">gamecontroller_fill</i>
                  <i class="icon material-icons md-only">sports_esports</i>
                </div>
                <div class="onboarding-title">Backlog</div>
                <div class="onboarding-text">
                  Add games that you own or currently play to the Backlog.
                </div>
                <div class="onboarding-next">
                  <a href="#" class="button button-small" onClick={slideNext}>
                    Next
                  </a>
                </div>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="onboarding-content">
                <div class="onboarding-icon">
                  <i class="icon f7-icons ios-only">
                    square_favorites_alt_fill
                  </i>
                  <i class="icon material-icons md-only">
                    collections_bookmark
                  </i>
                </div>
                <div class="onboarding-title">Wishlist</div>
                <div class="onboarding-text">
                  Make a wishlist of upcoming games or games you want to play in
                  the future.
                </div>
                <div class="onboarding-next">
                  <a href="#" class="button button-small" onClick={slideNext}>
                    Next
                  </a>
                </div>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="onboarding-content">
                <div class="onboarding-icon">
                  <i class="icon f7-icons ios-only">tray_fill</i>
                  <i class="icon material-icons md-only">inventory_2</i>
                </div>
                <div class="onboarding-title">Archive</div>
                <div class="onboarding-text">
                  Archive games that you have finished or dropped.
                </div>
                <div class="onboarding-next">
                  <a href="#" class="button button-small" onClick={slideNext}>
                    Next
                  </a>
                </div>
              </div>
            </div>
            <div class="swiper-slide">
              <div class="onboarding-content">
                <div class="onboarding-icon">🚀</div>
                <div class="onboarding-title">Let's Play</div>
                <div class="onboarding-text">
                  Start from searching your favorite games or browse upcoming
                  and recent releases.
                </div>
                <div class="onboarding-next">
                  <a
                    href="#"
                    class="button button-small"
                    onClick={closeOnboarding}
                  >
                    Show me games!
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}
