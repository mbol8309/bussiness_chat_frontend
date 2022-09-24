import { backend_host, tokenNameValue } from "../../../common/globals";

const authProvider = {
    login: async ({ username, password }) => {
        return fetch(backend_host + '/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: username, password }),
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Accept': 'application/json' }
        })
            .then(response => {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.statusText)
                }
                return response.json();
            })
            .then(({ data }) => {
                // let roles = data?.roles?.data ? data.roles.data.map(r=>r.name) : [];
                // localStorage.setItem('can', roles.join(','));
                localStorage.setItem(tokenNameValue, data.token);
                Promise.resolve();
            })
            .catch(() => {
                throw new Error('Network error')
            });
    },
    logout: () => {
        localStorage.removeItem(tokenNameValue);
        localStorage.removeItem('can');
        return Promise.resolve();
    },
    checkAuth: () => {
        return localStorage.getItem(tokenNameValue) ? Promise.resolve() : Promise.reject()
    },
    checkError: (error) => {
        const status = error.status;
        if (status === 401 || status === 403) {
            localStorage.removeItem(tokenNameValue);
            return Promise.reject();
        }
        // other error code (404, 500, etc): no need to log out
        return Promise.resolve();
    },
    getIdentity: () => {
        return fetch(backend_host + '/api/auth/me', {
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem(tokenNameValue)
            }
        }).then(response => {
            if (response.status < 200 || response.status >= 300) {
                // Promise.reject();
                return Promise.reject(response);
                // localStorage.removeItem(tokenNameValue);
                // throw new Error(response)
            }
            return response.json();
        })
            .then(({ data }) => {
                // let roles = data?.roles?.data ? data.roles.data.map(r=>r.name) : [];
                // localStorage.setItem('can', roles.join(','));
                return {
                    id: data.id,
                    fullName: data.name,
                    // avatar: data.avatar
                }
            })
    },
    getPermissions: () => {
        return Promise.resolve('')
    }
}
export default authProvider