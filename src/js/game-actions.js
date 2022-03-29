export const gameActions = async ({ game, $store, $theme, $f7, targetEl }) => {
  const { inBacklog, inWishlist, inArchive } = await $store.dispatch(
    'getGameInLists',
    game.id,
  );
  const backlogIcon = $theme.ios
    ? '<i class="f7-icons icon">gamecontroller_fill</i>'
    : '<i class="material-icons icon">sports_esports</i>';
  const wishlistIcon = $theme.ios
    ? '<i class="f7-icons icon">square_favorites_alt_fill</i>'
    : '<i class="material-icons icon">collections_bookmark</i>';
  const archiveIcon = $theme.ios
    ? '<i class="f7-icons icon">tray_fill</i>'
    : '<i class="material-icons icon">inventory_2</i>';

  const notify = (listName, wasInList, icon) => {
    $f7.toast
      .create({
        text: `<b>${game.name}</b> ${
          wasInList ? 'removed from' : 'added to'
        } the ${listName}`,
        destroyOnClose: true,
        closeTimeout: 2000,
        horizontalPosition: 'center',
        position: 'center',
        cssClass: wasInList ? 'toast-list-removed' : 'toast-list-added',
        icon,
      })
      .open();
  };
  const actions = $f7.actions.create({
    targetEl,
    buttons: [
      [
        {
          text: inBacklog ? 'Remove from Backlog' : 'Add to Backlog',
          color: inBacklog ? 'red' : '',
          icon: backlogIcon,
          onClick() {
            $store.dispatch(
              inBacklog ? 'removeGameFromList' : 'addGameToList',
              { listName: 'backlog', game },
            );
            notify('Backlog', inBacklog, backlogIcon);
          },
        },
        {
          text: inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist',
          color: inWishlist ? 'red' : '',
          icon: wishlistIcon,
          onClick() {
            $store.dispatch(
              inWishlist ? 'removeGameFromList' : 'addGameToList',
              { listName: 'wishlist', game },
            );
            notify('Wishlist', inWishlist, wishlistIcon);
          },
        },
        {
          text: inArchive ? 'Remove from Archive' : 'Add to Archive',
          color: inArchive ? 'red' : '',
          icon: archiveIcon,
          onClick() {
            $store.dispatch(
              inArchive ? 'removeGameFromList' : 'addGameToList',
              { listName: 'archive', game },
            );
            notify('Archive', inArchive, archiveIcon);
          },
        },
      ],
      [{ text: 'Cancel', color: 'red' }],
    ],
    on: {
      open() {
        actions.$el.find('.list').addClass('no-chevron');
      },
      closed() {
        setTimeout(() => {
          actions.destroy();
        });
      },
    },
  });
  actions.open();
};
