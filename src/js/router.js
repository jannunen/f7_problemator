import { createRouter, createWebHistory} from 'vue-router';

import HomePage from '../pages/home.vue';
import ProblemsPage from '../pages/problems.vue';
import MyLogsPage from '../pages/my_logs.vue';
import LoginPage from '../pages/login.vue';
import ProblemDetails from '../pages/problem.vue';
import WelcomePage from '../pages/welcome.vue';

import { authGuard } from '@js/auth/helpers';

import NotFoundPage from '../pages/404.vue';

const  routes = [
  {
    path: '/',
    component: HomePage,
    beforeEnter : authGuard,
  },
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/mylogs',
    component: MyLogsPage,
    beforeEnter : authGuard,
  },
  {
    path: '/problems',
    component: ProblemsPage,
    beforeEnter : authGuard,

  },
  {
    path: '/problems/:problemId/',
    component : ProblemDetails,
    beforeEnter : authGuard,
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

//export default routes;
export const router = createRouter({
  history: createWebHistory(),
  routes
});
