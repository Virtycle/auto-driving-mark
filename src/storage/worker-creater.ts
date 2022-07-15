export type Config = {
    taskLimit: number;
    eventNames: {
        [key: string]: string;
    };
};

export default function workerCreater(worker: (config: Config) => void, config: Config): Worker {
    const code = worker.toString();
    const input = JSON.stringify(config);
    const blob = new Blob([`(${code})(${input})`]);
    return new Worker(URL.createObjectURL(blob));
}
