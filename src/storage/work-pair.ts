export const eventNames = {
    noAvailable: 'noAvailable',
    error: 'error',
    storeTask: 'storeTask',
    pointIndexStored: 'pointIndexStored',
    imageIndexStored: 'imageIndexStored',
};

export type MessageType<T> = {
    type: keyof typeof eventNames;
    info: T;
};
export default class WorkerPair {
    private workInner!: Worker;
    constructor(worker: Worker) {
        this.workInner = worker;
        this.initMessage();
    }

    get workInstance() {
        return this.workInner;
    }

    initMessage() {
        this.workInner.onmessage = (event: MessageEvent) => {
            const { data } = event;
            console.log(data, 'in');
        };
    }

    postMessage<T>(data: MessageType<T>) {
        this.workInner.postMessage(data);
    }
}
