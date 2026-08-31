import Home from '../pages/Home.vue';
import ProblemPage from '../pages/ProblemPage.vue';
import SettingsPage from '../pages/SettingsPage.vue';
import ArchivePage from '../pages/ArchivePage.vue';
import JudgingPage from '../pages/JudgingPage.vue';
import ClimberProfilePage from '../pages/ClimberProfilePage.vue';
import ProblemPopup from '../pages/ProblemPopup.vue';
import GymCompletionPage from '../pages/GymCompletionPage.vue';
import GymMapPage from '../pages/GymMapPage.vue';
import FeedPage from '../components/feed/FeedTab.vue';
import ProblemList from '../pages/ProblemList.vue';
import UpcomingCompetitionsPage from '../pages/UpcomingCompetitionsPage.vue';
import ShowRankingTop10Page from '../pages/ShowRankingTop10Page.vue';
import PastCompetitionsPage from '../pages/PastCompetitionsPage.vue';
import OngoingCompetitionsPage from '../pages/OngoingCompetitionsPage.vue';
import SingleCompetitionPage from '../pages/SingleCompetitionPage.vue';
import PublicSingleCompetitionPage from '../pages/PublicSingleCompetitionPage.vue';
import SprayWallPage from '../pages/SprayWallPage.vue';
import SprayWallCreatorPage from '../pages/SprayWallCreatorPage.vue';
import SprayWallProblemPage from '../pages/SprayWallProblemPage.vue';
import BadgesPage from '../pages/BadgesPage.vue'
import TrainingPage from '../pages/TrainingPage.vue'
import TrainingProgramPage from '../pages/TrainingProgramPage.vue'
import TrainingSessionPage from '../pages/TrainingSessionPage.vue';
import MessagesPage from '../pages/MessagesPage.vue';
import AdaExplainerPage from '../pages/AdaExplainerPage.vue';
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
    path: '/badges',
    component: BadgesPage,
  },
  {
    path: '/training',
    component: TrainingPage,
  },
  {
    path: '/training/:id',
    component: TrainingProgramPage,
  },
  {
    path: '/training/:id/session/:sessionId',
    component: TrainingSessionPage,
  },
  {
    // Deep link to one conversation. Without it, anything that opens a thread
    // could only drop you on the list to find it again yourself.
    path: '/messages/:threadId',
    component: MessagesPage,
  },
  {
    path: '/messages',
    component: MessagesPage,
  },
  {
    path: '/coach/ada',
    component: AdaExplainerPage,
  },
  {
    path: '/settings',
    component: SettingsPage,
    //beforeEnter: authGuard,
  },
  {
    path: '/competitions/past',
    component: PastCompetitionsPage,
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
    path: '/competitions/public/:compid',
    component: PublicSingleCompetitionPage,
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
    path: '/feed',
    component: FeedPage,
  },
  {
    path: '/gym-map',
    component: GymMapPage,
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
    path: '/ranking/top10',
    component: ShowRankingTop10Page,
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
  {
    // Listed before the wall route so '/spray-wall/12/new' is not swallowed
    // by ':wallId'.
    path: '/spray-wall/:wallId/new',
    component: SprayWallCreatorPage,
  },
  {
    // Before ':wallId', or 'problem' is read as a wall id.
    path: '/spray-wall/problem/:problemId',
    component: SprayWallProblemPage,
  },
  {
    path: '/spray-wall/:wallId',
    component: SprayWallPage,
  },
];

export default routes;
