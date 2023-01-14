import Home from '../pages/Home.vue';
import ProblemPage from '../pages/ProblemPage.vue';
import SettingsPage from '../pages/SettingsPage.vue';
import ArchivePage from '../pages/ArchivePage.vue';
import JudgingPage from '../pages/JudgingPage.vue';
import ClimberProfilePage from '../pages/ClimberProfilePage.vue';
import ProblemPopup from '../pages/ProblemPopup.vue';
import GymCompletionPage from '../pages/GymCompletionPage.vue';
import ProblemList from '../pages/ProblemList.vue';
import UpcomingCompetitionsPage from '../pages/UpcomingCompetitionsPage.vue';
import OngoingCompetitionsPage from '../pages/OngoingCompetitionsPage.vue';
import SingleCompetitionPage from '../pages/SingleCompetitionPage.vue';

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
    path: '/competitions/:compid/judging',
    component: JudgingPage,
  },
  {
    path: '/competitions/:compid',
    component: SingleCompetitionPage,
  },
  {
    path: '/archive',
    component: ArchivePage,
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
    path: '/gym/completion',
    component: GymCompletionPage,
  },
  {
    path: '/problem/:id',
    //beforeEnter: authGuard,
    component: ProblemPage,
  },
  {
    path: '/climber/:id',
    component: ClimberProfilePage,
  },
];

export default routes;
