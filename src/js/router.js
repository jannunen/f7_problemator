import { createRouter, createWebHashHistory, createWebHistory} from 'vue-router';

import HomePage from '../pages/home.vue';
import ProblemsPage from '../pages/problems.vue';
import MyLogsPage from '../pages/my_logs.vue';
import LoginPage from '../pages/login.vue';
import GymsPage from '../pages/gyms.vue';
import ProblemDetails from '../pages/problem.vue';

//import { authGuard } from '@js/auth/helpers';

import { routes } from '@js/auth/helpers'

/*

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});

*/