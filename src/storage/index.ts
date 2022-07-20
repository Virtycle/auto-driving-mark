import workerCreater from './worker-creater';
import IDBTaskStore, { eventNames, pointsObjectStoreName, imageObjectStoreName } from './idb-store';
import work from './work';
import urlQuery from '@/common/utils/getQuery';

const taskName = urlQuery.get('taskName') as string;

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

export default idbStore;
