import workerCreater from './worker-creater';
import IDBTaskStore, { eventNames, pointsObjectStoreName, imageObjectStoreName } from './idb-store';
import work from './work';
import url from '@/common/utils/url-tools';

const taskName = url.getUniqueId();

const idbStore = new IDBTaskStore(
    workerCreater(work, {
        taskLimit: 2,
        eventNames,
        taskName,
        pointsObjectStoreName,
        imageObjectStoreName,
    }),
    taskName,
);

export { eventNames };
export default idbStore;
