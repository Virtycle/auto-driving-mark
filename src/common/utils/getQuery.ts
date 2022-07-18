const url = new URL(window.location.href);
const query = new URLSearchParams(url.search);
export default query;
