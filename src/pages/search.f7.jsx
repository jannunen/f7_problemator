import './search.less';
import GameCards from '../components/GameCards.f7.jsx';

export default (props, { $f7, $store, $update }) => {
  let searchbar;
  let searchStarted = false;

  const {
    searchResults,
    searchRecent,
    searchState,
    searchNext,
    searchNextLoading,
  } = $store.getters;

  const search = (e) => {
    e.preventDefault();
    const query = searchbar.query.trim();
    if (query === '') return;
    if (!searchStarted) {
      searchStarted = true;
      $update();
    }
    $store.dispatch('search', query.trim());
  };

  const loadMore = () => {
    $store.dispatch('searchNext');
  };

  const onRecentSearchClick = (query) => {
    searchbar.search(query);
    searchbar.$el.trigger('submit');
  };

  const initSearchbar = () => {
    searchbar = $f7.searchbar.create({
      el: '.popup-search .searchbar',
      customSearch: true,
      backdrop: false,
      disableButton: false,
    });
  };
  const destroySearchbar = () => {
    if (searchbar) searchbar.destroy();
  };
  return () => (
    <div
      class="popup popup-push popup-search"
      data-swipe-to-close="to-bottom"
      onPopupOpened={initSearchbar}
      onPopupClosed={destroySearchbar}
    >
      <div class="view view-init">
        <div class="page search-page">
          <div class="navbar">
            <div class="navbar-bg" />
            <div class="navbar-inner">
              <div class="title">Search</div>
              <div class="right">
                <a href="#" class="popup-close link">
                  Close
                </a>
              </div>
              <div class="subnavbar">
                <form class="searchbar" action="" onSubmit={search}>
                  <div class="searchbar-inner">
                    <div class="searchbar-input-wrap">
                      <input type="search" placeholder="Search games" />
                      <i class="searchbar-icon" />
                      <span class="input-clear-button" />
                    </div>
                    <span class="searchbar-disable-button">Cancel</span>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div
            class="page-content infinite-scroll-content"
            onInfinite={loadMore}
          >
            {!searchStarted && searchRecent.value.length > 0 && (
              <>
                <div class="block-title">Recent Searches</div>
                <div class="list inset recent-searches-list">
                  <ul>
                    {searchRecent.value.map((searchQuery) => (
                      <li>
                        <a
                          href="#"
                          class="list-button"
                          onClick={() => onRecentSearchClick(searchQuery)}
                        >
                          {searchQuery}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            {searchStarted && searchState.value === 'loading' && (
              <GameCards key="skeleton" small skeleton grid />
            )}
            {searchStarted && searchState.value === 'results' && (
              <>
                <GameCards key="results" small games={searchResults} grid />
                {searchNextLoading.value && (
                  <GameCards key="skeleton" small skeleton grid />
                )}
                {searchNext.value && (
                  <div class="preloader infinite-scroll-preloader" />
                )}
              </>
            )}
            {searchStarted && searchState.value === 'empty' && (
              <div key="empty" class="block">
                No games found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
