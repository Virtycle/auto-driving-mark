export const eventNames = {
    ready: 'ready',
    noAvailable: 'noAvailable',
    error: 'error',
    networkErr: 'networkErr',
    storeTask: 'storeTask',
    restoreTask: 'restoreTask',
    pointIndexStored: 'pointIndexStored',
    imageIndexStored: 'imageIndexStored',
    pointIndexStoredErr: 'pointIndexStoredErr',
    imageIndexStoredErr: 'imageIndexStoredErr',
};

export type MessageType<T> = {
    type: keyof typeof eventNames;
    info: T;
};
export default class IDBTaskStore {
    private workInner!: Worker;
    // private event: {
    //     [key: keyof typeof eventNames]: () => {};
    // } = {};
    // private ready = false;
    constructor(worker: Worker) {
        this.workInner = worker;
        this.initMessage();
    }

    get workInstance() {
        return this.workInner;
    }

    initMessage() {
        // this.event = {
        //     [eventNames.ready]: () => {
        //         self.ready = true;
        //     },
        // };
        // this.workInner.onmessage = (event: MessageEvent<MessageType<unknown>>) => {
        this.workInner.onmessage = () => {
            // const { data } = event;
            // typeof this.event[data.type] === 'function' && this.event[data.type](data);
        };
    }

    postMessage<T>(data: MessageType<T>) {
        this.workInner.postMessage(data);
    }
}
