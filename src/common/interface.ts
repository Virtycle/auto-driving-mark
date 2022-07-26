import { Vec3 } from '@/engine';

export interface ObjectInScene {
    position: Vec3;
    rotation: Vec3;
    dimension: Vec3;
    category: string;
    categoryId: number;
    number: number;
    frameNum: number;
    pointsNum: number;
    id: string;
    isEmpty: boolean;
    interpolated: boolean;
}

export interface ResouceRelation {
    pcd_name: string;
    images: {
        http: string;
        direction: string;
        width: number;
        height: number;
    }[];
}
export interface FrameResouceList {
    images: string[];
    points: string[];
    relations: ResouceRelation[];
}

export interface FrameResultData {
    data_source_id: number;
    data_id: number;
    frameUrl: string;
    items: ObjectInScene[];
    [key: string]: unknown;
}

export interface ProjectConfigType {
    dimension_range: string;
    object_category: ObjectCategory[];
}

export type ObjectCategory = {
    show_color: string;
    show_name: string;
    object_size: { lenght: number; width: number; height: number };
    order: number;
    id: number;
};
