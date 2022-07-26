import React, { createContext, useState, ReactNode, useRef, useEffect } from 'react';
import frameManager, { FrameManager } from '@/frame-manager';
import axios from '@/common/axios';
import { frameResultApi, frameListApi, projectConfigApi } from '@/common/api';
import {
    FrameResouceList,
    FrameResultData,
    ResouceRelation,
    ProjectConfigType,
    ObjectCategory,
    ObjectInScene,
} from '@/common/interface';
import { getPointsFileName } from '@/common/utils/tools';
import { Color } from 'three';

export type GlobalContextType = {
    userData: unknown;
    setUserData: (para: unknown) => void;
    manager: FrameManager;
    loading: boolean;
    setLoading: (para: boolean) => void;
    frameResultData: FrameResultData[];
    objectCategoryAll: ObjectCategory[];
    resouceRelation: ResouceRelation[];
    circleLimit: number[];
};

export const GlobalContext = createContext<GlobalContextType>({} as GlobalContextType);

export default function GlobalContextProvide({ children }: { children: ReactNode }) {
    const [userData, setUserData] = useState<unknown>(null);
    const [loading, setLoading] = useState(true);
    const [resouceRelation, setResouceRelation] = useState<ResouceRelation[]>([]);
    const [frameResultData, setFrameResultData] = useState<FrameResultData[]>([]);
    const [objectCategoryAll, setObjectCategory] = useState<ObjectCategory[]>([]);
    const [circleLimit, setCircleLimit] = useState<number[]>([]);

    const managerRef = useRef(frameManager);

    useEffect(() => {
        const manager = managerRef.current;
        manager.init();
        const resoucePromise = axios.get<never, FrameResouceList>(frameListApi);
        const resultPromise = axios.get<never, FrameResultData[]>(frameResultApi);
        const configPromise = axios.get<never, ProjectConfigType>(projectConfigApi);
        Promise.all([resoucePromise, resultPromise, configPromise]).then((data) => {
            const [resouce, result, config] = data;
            const { images, points, relations } = resouce;
            const { dimension_range, object_category } = config;

            const listP = points.map((item) => {
                const res = getPointsFileName(item);
                return {
                    name: res && res.length ? res[0] : item,
                    url: item,
                };
            });
            const listI = images.map((item) => {
                return {
                    name: item,
                    url: item,
                };
            });
            manager.idbStoreInstance.addEventHandler('taskDBConnected', () => {
                if (result.length && object_category.length && relations.length) {
                    // 添加所有帧的所有3d object
                    const mapForCheck: { [k: string]: ObjectInScene } = {};
                    // 从后向前覆盖重复
                    for (let index = result.length - 1; index >= 0; index--) {
                        const frame3dItems = result[index].items || [];
                        frame3dItems.forEach((item3d) => {
                            mapForCheck[item3d.id] = item3d;
                        });
                    }
                    Object.values(mapForCheck).forEach((object3D) => {
                        const category =
                            object_category.find((item) => item.id === object3D.categoryId) ||
                            ({ show_color: '#00ff00', show_name: '小汽车' } as ObjectCategory);
                        manager.manager3DInstance.addCubeCollection(
                            {
                                position: object3D.position,
                                rotation: object3D.rotation,
                                dimension: object3D.dimension,
                                name: object3D.id,
                                label: `${category.show_name} ${object3D.number}`,
                                dash: object3D.isEmpty,
                                pointsNum: object3D.pointsNum,
                                color: new Color(category.show_color),
                            },
                            false,
                        );
                    });
                    manager.loadFrame(0, relations[0], result[0]).then(() => {
                        setLoading(false);
                    });
                    manager.idbStoreInstance.removeEventHandler('taskDBConnected');
                    setLoading(false);
                }
            });
            manager.idbStoreInstance.storeTask(listP, listI);
            const radiusArr = dimension_range
                .split(',')
                .filter((item) => !isNaN(Number(item)))
                .map(Number);
            if (radiusArr.length) {
                setCircleLimit(radiusArr);
            }
            setObjectCategory(object_category);
            setResouceRelation(relations);
            setFrameResultData(result);
        });
    }, []);

    return (
        <GlobalContext.Provider
            value={{
                userData,
                setUserData,
                manager: managerRef.current,
                setLoading,
                loading,
                resouceRelation,
                frameResultData,
                objectCategoryAll,
                circleLimit,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
}
