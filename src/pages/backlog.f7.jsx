import GameCards from '../components/GameCards.f7.jsx';

export default (props, { $store, $theme }) => {
  const { backlog } = $store.getters;
  const icon = $theme.ios ? (
    <i class="icon f7-icons">compass_fill</i>
  ) : (
    <i class="icon material-icons">explore</i>
  );
  return () => (
    <div class="page">
      <div class="navbar navbar-transparent">
        <div class="navbar-bg" />
        <div class="navbar-inner">
          <div class="title">Backlog</div>
        </div>
      </div>
      <div class="page-content">
        <div class="page-title">Backlog</div>
        {backlog.value.length > 0 ? (
          <GameCards small grid games={backlog} />
        ) : (
          <div class="block collection-placeholder">
            Your Backlog is empty. Tap the {icon} button on the tab bar to
            discover new games.
          </div>
        )}
      </div>
    </div>
  );
};
