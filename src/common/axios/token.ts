import url from '../utils/url-tools';
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
    return url.query.get('token');
}
