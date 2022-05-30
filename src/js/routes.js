import Home from '../pages/Home.vue';
import Loading from '../pages/Loading.vue';
import Login from '../pages/Login.vue';
import ProblemPage from '../pages/ProblemPage.vue';
import SettingsPage from '../pages/SettingsPage.vue';
import JudgingPage from '../pages/JudgingPage.vue';
import ProblemPopup from '../pages/ProblemPopup.vue';
import ProblemList from '../pages/ProblemList.vue';
import UpcomingCompetitionsPage from '../pages/UpcomingCompetitionsPage.vue';
import OngoingCompetitionsPage from '../pages/OngoingCompetitionsPage.vue';
import SingleCompetitionPage from '../pages/SingleCompetitionPage.vue';

import Backlog from '../pages/backlog.f7.jsx';
import Wishlist from '../pages/wishlist.f7.jsx';
import Archive from '../pages/archive.f7.jsx';
import Game from '../pages/game.f7.jsx';
import Search from '../pages/search.f7.jsx';
import { authGuard } from '@js/auth/authguard.js';
import { useAuth0 } from '@auth0/auth0-vue';
const {  isAuthenticated } = useAuth0;


const routes = [
  {
    path: '/',
    component:  Home ,
    //beforeEnter: authGuard,
  },
  {
    path: '/home',
    component: Home,
    //beforeEnter: authGuard,
  },
  {
    path: '/competitions/:compid/judging',
    //popup: {
      component: JudgingPage,
      //swipeToClose: 'to-bottom',
    //},
    //component: JudgingPage,
    //beforeEnter: authGuard,
  },
  {
    path: '/settings',
    component: SettingsPage,
    //beforeEnter: authGuard,
  },
  {
    path: '/competitions/upcoming',
    component: UpcomingCompetitionsPage,
    //beforeEnter: authGuard,
  },
  {
    path: '/competitions/ongoing',
    component: OngoingCompetitionsPage,
    //beforeEnter: authGuard,
  },
  {
    path: '/competitions/:compid',
    component: SingleCompetitionPage,
    //beforeEnter: authGuard,
  },
  {
    path: '/problems',
    component: ProblemList,
    //beforeEnter: authGuard,
  },
  {
    path: '/problem/:id/popup',
    //beforeEnter: authGuard,
    popup: {
      component: ProblemPopup,
      swipeToClose: 'to-bottom',
    },
  },
  {
    path: '/problem/:id',
    //beforeEnter: authGuard,
    component: ProblemPage,
  },
];

export default routes;
