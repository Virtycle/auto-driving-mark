import { v5 as uuidv5 } from 'uuid';
const url = new URL(window.location.href);
const query = url.searchParams;

const taskInfo = url.pathname.split('/').filter((item) => item !== '');

function getProjectId(): string {
    return taskInfo[0];
}

function getRecordId(): string {
    return taskInfo[1];
}

function getUniqueId(): string {
    return uuidv5(`${taskInfo[0]}-${taskInfo[1]}`, uuidv5.URL);
}

export default { query, url, getProjectId, getRecordId, getUniqueId };
