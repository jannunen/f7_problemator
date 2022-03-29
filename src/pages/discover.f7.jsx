import GameCards from '../components/GameCards.f7.jsx';

export default (props, { $store, $onMounted }) => {
  const { recentGames, upcomingGames, topGames } = $store.getters;

  const fetchData = () => {
    $store.dispatch('getUpcomingGames');
    $store.dispatch('getRecentGames');
    $store.dispatch('getTopGames');
  };

  $onMounted(() => {
    fetchData();
  });

  return () => (
    <div class="page">
      <div class="navbar navbar-transparent">
        <div class="navbar-bg" />
        <div class="navbar-inner">
          <div class="title">Discover</div>
          <div class="right">
            <a href="/search/" class="link icon-only">
              <i class="icon f7-icons ios-only">search</i>
              <i class="icon material-icons md-only">search</i>
            </a>
          </div>
        </div>
      </div>
      <div class="page-content">
        <div class="page-title">Discover</div>
        <div class="block-title block-title-medium">Upcoming games</div>
        {upcomingGames.value.length > 0 ? (
          <GameCards key="upcoming" games={upcomingGames} />
        ) : (
          <GameCards key="upcoming-skeleton" skeleton />
        )}

        <div class="block-title block-title-medium">Recently released</div>
        {recentGames.value.length > 0 ? (
          <GameCards key="recent" games={recentGames} />
        ) : (
          <GameCards key="recent-skeleton" skeleton />
        )}

        <div class="block-title block-title-medium">All time top 25</div>
        {topGames.value.length > 0 ? (
          <GameCards key="top" games={topGames} metacritic />
        ) : (
          <GameCards key="top-skeleton" skeleton />
        )}
      </div>
    </div>
  );
};
