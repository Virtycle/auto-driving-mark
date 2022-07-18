import urlQuery from '../utils/getQuery';
let token = '';

export default {
    getToken() {
        return token;
    },
    setToken(s: string) {
        token = s;
    },
};

export function getInitToken(): string | null {
    return urlQuery.get('token');
}
