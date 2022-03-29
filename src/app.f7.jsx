import Onboarding from './components/Onboarding.f7.jsx';

export default () => {
  return () => (
    <div id="app">
      {/* Views tabs */}
      <div class="views tabs safe-areas">
        {/* Tabbar */}
        <div class="toolbar toolbar-bottom tabbar tabbar-labels">
          <div class="toolbar-inner">
            <a href="#discover" class="tab-link tab-link-active">
              <i class="icon f7-icons ios-only">compass_fill</i>
              <i class="icon material-icons md-only">explore</i>
              <span class="tabbar-label">Discover</span>
            </a>
            <a href="#backlog" class="tab-link">
              <i class="icon f7-icons ios-only">gamecontroller_fill</i>
              <i class="icon material-icons md-only">sports_esports</i>
              <span class="tabbar-label">Backlog</span>
            </a>
            <a href="#wishlist" class="tab-link">
              <i class="icon f7-icons ios-only">square_favorites_alt_fill</i>
              <i class="icon material-icons md-only">collections_bookmark</i>
              <span class="tabbar-label">Wishlist</span>
            </a>
            <a href="#archive" class="tab-link">
              <i class="icon f7-icons ios-only">tray_fill</i>
              <i class="icon material-icons md-only">inventory_2</i>
              <span class="tabbar-label">Archive</span>
            </a>
          </div>
        </div>
        {/* Views */}
        <div
          class="view view-main view-init tab tab-active"
          id="discover"
          data-url="/"
        />
        <div class="view view-init tab" id="backlog" data-url="/backlog/" />
        <div class="view view-init tab" id="wishlist" data-url="/wishlist/" />
        <div class="view view-init tab" id="archive" data-url="/archive/" />
      </div>
      {/* Onboarding */}
      <Onboarding />
    </div>
  );
};
