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
        this.workInner.onmessage = () => {
            console.log(2222);
        };
    }

    postMessage() {
        this.workInner.postMessage(555);
    }
}

export const a = 2;
