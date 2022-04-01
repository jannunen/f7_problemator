import Home from '../pages/Home.vue';
import Loading from '../pages/Loading.vue';
import Login from '../pages/Login.vue';
import ProblemPage from '../pages/ProblemPage.vue';
import ProblemPopup from '../pages/ProblemPopup.vue';
import ProblemList from '../pages/ProblemList.vue';
import Backlog from '../pages/backlog.f7.jsx';
import Wishlist from '../pages/wishlist.f7.jsx';
import Archive from '../pages/archive.f7.jsx';
import Game from '../pages/game.f7.jsx';
import Search from '../pages/search.f7.jsx';
import { authGuard } from '@js/auth/authguard.js';


const routes = [
  {
    path: '/home/',
    component: Home,
    beforeEnter: authGuard,
  },
  {
    path: '/login/',
    component: Loading,
  },
  {
    path: '/',
    component: Loading,
    beforeEnter: authGuard,
  },
  {
    path: '/problems',
    component: ProblemList,
    beforeEnter: authGuard,
  },
  {
    path: '/login/',
    component: Login,
  },
  {
    path: '/wishlist/',
    component: Wishlist,
    beforeEnter: authGuard,
  },
  {
    path: '/archive/',
    component: Archive,
    beforeEnter: authGuard,
  },
  {
    path: '/problem/:id/popup',
    beforeEnter: authGuard,
    popup: {
      component: ProblemPopup,
      swipeToClose: 'to-bottom',
    },
  },
  {
    path: '/problem/:id',
    beforeEnter: authGuard,
    component: ProblemPage,
  },
  {
    path: '/game/:id/',
    beforeEnter: authGuard,
    popup: {
      component: Game,
      swipeToClose: 'to-bottom',
    },
  },
  {
    path: '/search/',
    beforeEnter: authGuard,
    popup: {
      component: Search,
      swipeToClose: 'to-bottom',
    },
  },
];

export default routes;
