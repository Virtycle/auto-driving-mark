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
    const url = new URL(window.location.href);
    const query = new URLSearchParams(url.search);
    return query.get('token');
}
