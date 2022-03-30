const API_KEY = import.meta.env.VITE_API_KEY;
const API_HOST = import.meta.env.VITE_API_HOST;
const endpoint = API_HOST + "/api/v03/"

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month < 10 ? `0${month}` : month}-${
    day < 10 ? `0${day}` : day
  }`;
};

const fetchPost = (url, payload) => {
  return fetch(url, {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload) 
  });
}

const api = {
  login( payload) {
    const url = API_HOST + "/api/auth/login"
    return fetchPost(url, payload)
    .then((res) => res.json())

  },
  getTopGames() {
    return fetch(
      `${endpoint}/games?key=${API_KEY}&page_size=40&ordering=-metacritic`,
    ).then((res) => res.json());
  },
  getUpcomingGames() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yearLater = new Date();
    yearLater.setMonth(yearLater.getMonth() + 6);

    return fetch(
      `${endpoint}/games?key=${API_KEY}&dates=${formatDate(
        tomorrow,
      )},${formatDate(yearLater)}&page_size=12&ordering=-added`,
    ).then((res) => res.json());
  },
  getRecentGames() {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return fetch(
      `${endpoint}/games?key=${API_KEY}&dates=${formatDate(
        monthAgo,
      )},${formatDate(today)}&page_size=12`,
    ).then((res) => res.json());
  },
  getGame(id) {
    return Promise.all([
      // fetch screenshots
      fetch(`${endpoint}/games/${id}/screenshots?key=${API_KEY}`).then((res) =>
        res.json(),
      ),
      // fetch game
      fetch(`${endpoint}/games/${id}?key=${API_KEY}`).then((res) => res.json()),
    ]).then(([screenshots, game]) => {
      return {
        ...game,
        screenshots: screenshots.results,
      };
    });
  },
  search(query) {
    return fetch(
      `${endpoint}/games?key=${API_KEY}&search=${query}&page_size=40&page=1`,
    ).then((res) => res.json());
  },
  searchNext(url) {
    return fetch(url).then((res) => res.json());
  },
};

window.api = api;

export default api;
