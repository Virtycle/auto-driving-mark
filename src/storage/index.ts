import workerCreater from './worker-creater';
import IDBTaskStore, { eventNames } from './idb-store';
import work from './work';
import urlQuery from '@/common/utils/getQuery';

const taskName = urlQuery.get('taskName') as string;

export default new IDBTaskStore(
    workerCreater(work, {
        taskLimit: 2,
        eventNames,
        taskName,
    }),
);
