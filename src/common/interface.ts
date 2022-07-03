import { Vec3 } from '@/engine/interface';

export interface ObjectInScene {
    position: Vec3;
    rotation: Vec3;
    dimension: Vec3;
    category: '小汽车';
    frameNum: number;
    id: string;
}

export interface AllFrameData {
    frameId: number;
    frameUrl: string;
    items: ObjectInScene[];
    [key: string]: any;
}