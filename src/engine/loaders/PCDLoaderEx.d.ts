import { BufferGeometry, Loader, LoadingManager } from 'three';

export class PCDLoaderEx extends Loader {
    constructor(manager?: LoadingManager);
    littleEndian: boolean;

    load(
        url: string,
        onLoad: (points: BufferGeometry) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (event: ErrorEvent) => void,
    ): void;
    loadAsync(url: string, onProgress?: (event: ProgressEvent) => void): Promise<BufferGeometry>;
    parse(data: ArrayBuffer | string, url: string): BufferGeometry;
}
