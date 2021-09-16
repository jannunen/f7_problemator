import HomePage from '@pages/home.vue';
import ProblemsPage from '@pages/problems.vue';
import MyLogsPage from '@pages/my_logs.vue';
import LoginPage from '@pages/login.vue';
import GymsPage from '@pages/gyms.vue';
import ProblemDetails from '@pages/problem.vue';
import SearchProblemsSheet from '@components/ui/problem/SearchProblemsSheet.vue'

import { authGuard } from '@js/auth/helpers';

export const  routes = [
  {
    path: '/',
    component: HomePage,
    beforeEnter: authGuard,
  },
  {
    path: '/gyms',
    component: GymsPage,
    //beforeEnter: authGuard,
  },
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/searchproblems',
    component: SearchProblemsSheet,
    beforeEnter: authGuard,
  },
  {
    path: '/mylogs',
    component: MyLogsPage,
    beforeEnter: authGuard,
  },
  {
    path: '/problems',
    component: ProblemsPage,
    beforeEnter: authGuard,
    routes :[
        {
            path: '/:problemId',
            component : ProblemDetails,
            beforeEnter: authGuard,
        },

    ]

  },
];
