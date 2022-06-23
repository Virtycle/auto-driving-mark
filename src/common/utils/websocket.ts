const DEFAULT_HEART_BEAT_TIME = 6000;
const DEFAULT_PING_MSG = 'ping';
const DEFAULT_PONG_MSG = 'pong';

type Options = {
    intervalTime?: number;
    pingMsg?: string;
    pongMsg?: string;
    needHeartBeat?: boolean;
};

type EventName = 'open' | 'close' | 'message' | 'error';
type Callback = (...args: Array<unknown | any>) => void;
type EventItem = {
    eventName: EventName;
    callback: Callback;
};

function parseSocketData(event: MessageEvent, pongMsg: string): string {
    let result = '';
    if (event && event.data) {
        const { data } = event;
        if (data !== pongMsg && data !== '') {
            try {
                if (typeof data === 'string') {
                    result = JSON.parse(data);
                }
            } catch (error) {
                window.console.error('JSON parse error', error);
                result = 'error';
                // throw new Error(`Error in websocket-server.js. JSON.parse error.`);
            }
        }
        return result;
    }
    return '';
}

function testEventName(name: string): boolean {
    const reg = /^open$|^close$|^message$|^error$/;
    return reg.test(name);
}

const defaultOpt = {
    intervalTime: DEFAULT_HEART_BEAT_TIME,
    needHeartBeat: true,
};

export default class WSocket {
    private socketInstance: WebSocket | null;

    private eventArray: Array<EventItem>;

    private timer: NodeJS.Timeout | undefined;

    private intervalTime: Options['intervalTime'];

    private options: Options;

    private pingMsg: Options['pingMsg'];

    private pongMsg: Options['pongMsg'];

    private needHeartBeat: Options['needHeartBeat'];

    constructor(options: Options | undefined) {
        this.socketInstance = null;
        this.eventArray = [];
        this.timer = undefined;
        this.intervalTime = options && options.intervalTime ? options.intervalTime : DEFAULT_HEART_BEAT_TIME;
        this.pingMsg = options && options.pingMsg ? options.pingMsg : DEFAULT_PING_MSG;
        this.pongMsg = options && options.pongMsg ? options.pongMsg : DEFAULT_PONG_MSG;
        this.options = options || defaultOpt;
        this.needHeartBeat = options && options.needHeartBeat;
    }

    // 心跳代码
    private creatHeartBeat(): void {
        this.timer = setTimeout(() => {
            this.sendMessage(this.pingMsg);
        }, this.intervalTime);
    }

    private closeHeartBeat(): void {
        clearTimeout(this.timer);
        this.timer = undefined;
    }

    private resetHeartBeat(): void {
        this.closeHeartBeat();
        this.creatHeartBeat();
    }

    // ws代码
    public initSocketInstance(url: string, onOpen: Callback, onMessage: Callback): void {
        if (!('WebSocket' in window)) {
            throw new Error('Websocket is not supported in your browser');
        }
        if (url && typeof url === 'string') {
            const socket = new WebSocket(url);
            this.socketInstance = socket;
            if (this.needHeartBeat || (onOpen && typeof onOpen === 'function')) {
                this.addEventForSocketInstance('open', () => {
                    if (this.needHeartBeat) {
                        this.creatHeartBeat();
                    }
                    if (onOpen && typeof onOpen === 'function') {
                        onOpen();
                    }
                });
            }
            if (onMessage && typeof onMessage === 'function') {
                this.addEventForSocketInstance('message', (event: MessageEvent) => {
                    this.receiveMessage(event, onMessage);
                });
            }
        }
    }

    public addEventForSocketInstance(eventName: EventName, callback: Callback): void {
        const socket = this.socketInstance;
        const { eventArray } = this;
        if (socket && testEventName(eventName)) {
            socket.addEventListener(eventName, callback);
            this.eventArray = [...eventArray, { eventName, callback }];
        }
    }

    public removeEventForSocketInstance(eventName: EventName): void {
        const socket = this.socketInstance;
        const { eventArray } = this;
        if (socket && eventArray.length) {
            const eventArrayWaitRemove = eventArray.filter((item) => item.eventName === eventName);
            if (eventArrayWaitRemove.length) {
                eventArrayWaitRemove.forEach((eventItem) => {
                    socket.removeEventListener(eventItem.eventName, eventItem.callback);
                });
            }
            this.eventArray = eventArray.filter((item) => item.eventName !== eventName);
        }
    }

    public closeSocket(): void {
        const { eventArray } = this;
        const socket = this.socketInstance;
        if (eventArray.length) {
            eventArray.forEach((eventItem) => {
                if (eventItem.eventName !== 'close') {
                    this.removeEventForSocketInstance(eventItem.eventName);
                }
            });
        }
        if (this.needHeartBeat) {
            this.closeHeartBeat();
        }
        if (socket && socket.close) {
            socket.close();
        }
        this.socketInstance = null;
    }

    public sendMessage<T>(msg: T): void {
        const socket = this.socketInstance;
        if (socket && socket.readyState === WebSocket.OPEN) {
            if (typeof msg === 'string') {
                socket.send(msg);
            } else {
                socket.send(JSON.stringify(msg));
            }
            if (this.needHeartBeat) {
                this.resetHeartBeat();
            }
        }
    }

    public receiveMessage(event: MessageEvent, onMessage: Callback): void {
        const data = parseSocketData(event, this.pongMsg as string);
        if (data !== 'error') {
            onMessage(data);
        }
        if (this.needHeartBeat) {
            this.resetHeartBeat();
        }
    }
}
