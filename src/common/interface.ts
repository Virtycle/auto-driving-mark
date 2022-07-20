import { Vec3 } from '@/engine/interface';

export interface ObjectInScene {
    position: Vec3;
    rotation: Vec3;
    dimension: Vec3;
    category: string;
    frameNum: number;
    number: number;
    id: string;
    isEmpty: boolean;
    interpolated: boolean;
}

export interface FrameResultData {
    frameId: number;
    frameUrl: string;
    items: ObjectInScene[];
    [key: string]: any;
}
