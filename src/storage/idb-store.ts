import E2, { Callback } from '@/engine/common/event-emitter';
import { MaxAndMin } from '@/engine';

export const eventNames = {
    ready: 'ready',
    noAvailable: 'noAvailable',
    error: 'error',
    networkErr: 'networkErr',
    storeTask: 'storeTask',
    reStoreTask: 'reStoreTask',
    taskDBCreated: 'taskDBCreated',
    taskDBConnected: 'taskDBConnected',
    restoreTask: 'restoreTask',
    pointIndexStored: 'pointIndexStored',
    imageIndexStored: 'imageIndexStored',
    pointIndexStoredErr: 'pointIndexStoredErr',
    imageIndexStoredErr: 'imageIndexStoredErr',
};

export type EventNames = keyof typeof eventNames;

export const pointsObjectStoreName = 'points-data';
export const imageObjectStoreName = 'images-data';

export type MessageType<T> = {
    type: EventNames;
    info: T;
};

export type StoreInfo = {
    name: string;
    index: number;
};

export type PointStoreData = {
    name: string;
    points: Float32Array;
    intensity: Float32Array;
    range: {
        x: MaxAndMin;
        y: MaxAndMin;
        z: MaxAndMin;
        intensity: MaxAndMin;
    };
};

export type ImageStoreData = {
    name: string;
    width: number;
    height: number;
    blob: Blob;
};

type StoreBaseType = { name: string; url: string };

type StoreProcessPromise = {
    done: (value: void) => void;
    deny: (value: void) => void;
    name: string;
};
export default class IDBTaskStore<
    T extends StoreBaseType,
    // S extends StoreBaseType & { width: number; height: number },
    S extends StoreBaseType,
> {
    private workInner!: Worker;

    private taskName!: string;

    private toStorePoints: T[] = [];

    private toStoreImages: S[] = [];
    // name in toStore
    private storedPoints: string[] = [];

    private storedImages: string[] = [];
    // name in toStore
    private toRestorePoints: string[] = [];

    private toRestoreImages: string[] = [];

    private events = new E2();

    private ready = false;

    private idbApi = indexedDB || webkitIndexedDB || mozIndexedDB || OIndexedDB || msIndexedDB;

    private taskDB!: IDBDatabase;

    private pointLoadProcessPromise: StoreProcessPromise | null = null;

    private imageLoadProcessPromise: StoreProcessPromise[] = [];

    constructor(worker: Worker, taskName: string) {
        this.workInner = worker;
        this.taskName = taskName;
        this.initMessage();
    }

    get workInstance() {
        return this.workInner;
    }

    get isReady() {
        return this.ready;
    }

    private initMessage(): void {
        this.events.on('ready', () => {
            this.ready = true;
        });
        this.events.on('noAvailable', () => {
            this.ready = false;
        });
        this.events.on('error', (data) => {
            console.log(data);
        });
        this.events.on('pointIndexStored', (data) => {
            this.storedPoints.push((data as StoreInfo).name);
            if (this.pointLoadProcessPromise && (data as StoreInfo).name === this.pointLoadProcessPromise.name) {
                this.pointLoadProcessPromise.done();
                this.pointLoadProcessPromise = null;
            }
        });
        this.events.on('imageIndexStored', (data) => {
            this.storedImages.push((data as StoreInfo).name);
            if (this.imageLoadProcessPromise.length) {
                const index = this.imageLoadProcessPromise.findIndex((item) => item.name === (data as StoreInfo).name);
                if (index !== -1) {
                    this.imageLoadProcessPromise[index].done();
                    this.imageLoadProcessPromise.slice(index, 1);
                }
            }
        });
        this.events.on('pointIndexStoredErr', (data) => {
            this.toRestorePoints.push((data as StoreInfo).name);
            if (this.pointLoadProcessPromise && (data as StoreInfo).name === this.pointLoadProcessPromise.name) {
                this.pointLoadProcessPromise.deny();
                this.pointLoadProcessPromise = null;
            }
        });
        this.events.on('imageIndexStoredErr', (data) => {
            this.toRestoreImages.push((data as StoreInfo).name);
            if (this.imageLoadProcessPromise.length) {
                const index = this.imageLoadProcessPromise.findIndex((item) => item.name === (data as StoreInfo).name);
                if (index !== -1) {
                    this.imageLoadProcessPromise[index].deny();
                    this.imageLoadProcessPromise.slice(index, 1);
                }
            }
        });
        this.events.on('taskDBCreated', () => {
            const { taskName } = this;
            const request = this.idbApi.open(taskName, 1);
            request.onsuccess = () => {
                this.taskDB = request.result;
                this.events.emit('taskDBConnected');
            };
        });
        this.workInner.onmessage = (event) => {
            const { data } = event;
            this.events.emit(data.type, data.info);
        };
    }

    public addEventHandler(name: EventNames, callBack: Callback) {
        this.events.on(name, callBack);
    }

    public removeEventHandler(name: EventNames, callBack?: Callback) {
        this.events.off(name, callBack);
    }

    private postMessage<T>(data: MessageType<T>) {
        this.workInner.postMessage(data);
    }

    public storeTask(listP: T[], listI: S[]) {
        this.toStorePoints = listP;
        this.toStoreImages = listI;
        this.postMessage({
            type: eventNames.storeTask as EventNames,
            info: {
                listP,
                listI,
            },
        });
    }

    public restoreTask() {
        const listP = this.toRestorePoints.map((item) => this.toStorePoints.find((itemI) => itemI.name === item));
        const listI = this.toRestoreImages.map((item) => this.toStoreImages.find((itemI) => itemI.name === item));
        this.toRestorePoints = [];
        this.toRestoreImages = [];
        this.postMessage({
            type: eventNames.reStoreTask as EventNames,
            info: {
                listP,
                listI,
            },
        });
    }

    public checkPointStoreProgress(): number {
        if (this.toStorePoints.length === 0) return 0;
        return this.storedPoints.length / this.toStorePoints.length;
    }

    public checkImageStoreProgress(): number {
        if (this.toStoreImages.length === 0) return 0;
        return this.storedImages.length / this.toStoreImages.length;
    }

    public checkPointStored(name: string): boolean {
        return this.storedPoints.findIndex((item) => item === name) !== -1;
    }

    public checkImageStored(name: string): boolean {
        return this.storedImages.findIndex((item) => item === name) !== -1;
    }

    public readPointData(name: string): Promise<PointStoreData> {
        const taskDB = this.taskDB;
        const index = this.storedPoints.findIndex((item) => item === name);
        return new Promise((resolve, reject) => {
            if (this.pointLoadProcessPromise) reject(null);
            new Promise<void>((resolveInner, rejectInner) => {
                if (!taskDB || index === -1) {
                    const indexToStore = this.toStorePoints.findIndex((item) => item.name === name);
                    const indexNoStore = this.toRestorePoints.findIndex((item) => item === name);
                    if (indexToStore === -1 || indexNoStore !== -1) rejectInner();
                    this.pointLoadProcessPromise = {
                        done: resolveInner,
                        deny: rejectInner,
                        name,
                    };
                } else {
                    resolveInner();
                }
            }).then(
                () => {
                    const rq = taskDB
                        .transaction(pointsObjectStoreName, 'readonly')
                        .objectStore(pointsObjectStoreName)
                        .get(name);
                    rq.onsuccess = (e) => {
                        const { target } = e;
                        if (target) resolve((target as EventTarget & { result: PointStoreData }).result);
                    };
                    rq.onerror = () => {
                        reject(null);
                    };
                },
                () => {
                    reject(null);
                },
            );
        });
    }

    public readImageData(name: string): Promise<ImageStoreData> {
        const taskDB = this.taskDB;
        const index = this.storedImages.findIndex((item) => item === name);
        return new Promise((resolve, reject) => {
            new Promise<void>((resolveInner, rejectInner) => {
                if (!taskDB || index === -1) {
                    const indexToStore = this.toStoreImages.findIndex((item) => item.name === name);
                    const indexNoStore = this.toRestoreImages.findIndex((item) => item === name);
                    if (indexToStore === -1 || indexNoStore !== -1) rejectInner();
                    this.imageLoadProcessPromise.push({
                        done: resolveInner,
                        deny: rejectInner,
                        name,
                    });
                } else {
                    resolveInner();
                }
            }).then(
                () => {
                    const rq = taskDB
                        .transaction(imageObjectStoreName, 'readonly')
                        .objectStore(imageObjectStoreName)
                        .get(name);
                    rq.onsuccess = (e) => {
                        const { target } = e;
                        if (target) resolve((target as EventTarget & { result: ImageStoreData }).result);
                    };
                    rq.onerror = () => {
                        reject(null);
                    };
                },
                () => {
                    reject(null);
                },
            );
        });
    }

    destroy(): void {
        this.toStorePoints = [];
        this.toStoreImages = [];
        this.storedPoints = [];
        this.storedImages = [];
        this.toRestorePoints = [];
        this.toRestoreImages = [];
        this.imageLoadProcessPromise = [];
        this.pointLoadProcessPromise = null;
        this.taskDB?.close();
        this.workInner.terminate();
    }
}
