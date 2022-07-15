import workerCreater from './worker-creater';
import WorkerPair, { eventNames } from './work-pair';
import work from './work';

export default new WorkerPair(
    workerCreater(work, {
        taskLimit: 2,
        eventNames,
    }),
);
