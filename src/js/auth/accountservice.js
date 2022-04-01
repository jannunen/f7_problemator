import { BehaviorSubject } from 'rxjs';
import axios from 'axios';
import store from '@js/store.js'
import { f7 } from 'framework7-vue'


const baseUrl = import.meta.env.VITE_API_HOST + "/api/auth"
const accountSubject = new BehaviorSubject(null);

async function login() {
    // login with facebook then authenticate with the API to get a JWT auth token
    FB.login((response) => {
        const authResponse = response.authResponse
        if (!authResponse) return;

        if (response.status === 'connected') {
            FB.api('/me', { fields: 'name,email' }, function (response) {
                apiAuthenticate(response.email, authResponse.accessToken).then(resp => {
                    // get return url from query parameters or default to home page
                });
            });
        }


    }, { scope: 'email' });
}

async function goodOleLogin(email, password) {
    const payload = { email, password }
    return store.dispatch('login', payload)
        .then((data) => {
            if (data.error) {
                return false
            } else {
                const account = {...data, 'type' : 'old'};

                localStorage.account = JSON.stringify(account)
                accountSubject.next(account);
                localStorage.access_token = data.access_token
                startAuthenticateTimer();
                return true
            }
        })
        .catch(err => {
            debugger
            alert(JSON.stringify(err.response.data || err))
            return false
        })

}

async function checkIfLogin() {
    const account = JSON.parse(localStorage.account)
    if (account == null || account.error === true) {
        return false
    }
    const { email } = account.user
    const access_token = localStorage.access_token
    let ret = true
    if (account.type == 'old') {
        // IF old email+pwd  login, assume valid. It will be checked when doing the
        // first call.
        accountSubject.next(account);
    } else if (account.type == 'fb') {
        ret = await apiAuthenticate(email, access_token)
    }
    return ret
}


async function apiAuthenticate(email, accessToken) {
    // authenticate with the api using a facebook access token,
    // on success the api returns an account object with a JWT auth token
    const response = await axios.post(`${baseUrl}/authenticate`, { email, accessToken });
    const account = {...response.data, 'type' : 'fb'};
    if (account.error) {
        // Invalidate login
        localStorage.account = null
        accountSubject.next(null);
        stopAuthenticateTimer();
        return null;
    } else {

        localStorage.account = JSON.stringify(account)
        accountSubject.next(account);
        startAuthenticateTimer();
        return account;
    }
}

async function goodOleLogout() {
    debugger
    try {
        const ret = await axios.post(`${baseUrl}/logout`)
    } catch (e) {
        // Might fail if no access_token present
    }
    localStorage.account = null
    accountSubject.next(null);
    stopAuthenticateTimer();
    f7.views.main.router.navigate("/")
}

function logout() {
    goodOleLogout()
}

function getAll() {
    return axios.get(baseUrl)
        .then(response => response.data);
}

function getById(id) {
    return axios.get(`${baseUrl}/${id}`)
        .then(response => response.data);
}

async function update(account) {
    /*const response = await axios.put(`${baseUrl}/${id}`, params);
    let account = response.data;
    // update the current account if it was updated
    if (account.id === accountSubject./logovalue?.id) {
        // publish updated account to subscribers
        account = { ...accountSubject.value, ...account };
        */
       debugger
    accountSubject.next(account);
    //}
    return account;
}

async function _delete(id) {
    await axios.delete(`${baseUrl}/${id}`);
    if (id === accountSubject.value?.id) {
        // auto logout if the logged in account was deleted
        logout();
    }
}

// helper methods

let authenticateTimeout;

function startAuthenticateTimer() {
    // parse json object from base64 encoded jwt token
    const jwtToken = JSON.parse(atob(accountSubject.value.access_token.split('.')[1]));

    // set a timeout to re-authenticate with the api one minute before the token expires
    const expires = new Date(jwtToken.exp * 1000);
    const timeout = expires.getTime() - Date.now() - (60 * 1000);
    //const { accessToken } = FB.getAuthResponse();
    authenticateTimeout = setTimeout(() => apiAuthenticate(accountSubject.value.access_token), timeout);
}

function stopAuthenticateTimer() {
    // cancel timer for re-authenticating with the api
    clearTimeout(authenticateTimeout);
}

export const accountService = {
    login,
    goodOleLogin,
    goodOleLogout,
    apiAuthenticate,
    logout,
    getAll,
    getById,
    checkIfLogin,
    update,
    delete: _delete,
    loggedIn : accountSubject.value!= null,
    account: accountSubject.asObservable(),
    get accountValue() { return accountSubject.value; }
};