import workerCreater from './worker-creater';
import WorkerPair from './work-pair';
import work from './work';

export default new WorkerPair(workerCreater(work, { a: 1 }));
