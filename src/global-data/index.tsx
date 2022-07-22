import React, { createContext, useState, ReactNode, useRef, useEffect } from 'react';
import frameManager, { FrameManager } from '@/engine';
import axios from '@/common/axios';
import { frameResultApi, frameListApi, projectConfigApi } from '@/common/api';
import {
    FrameResouceList,
    FrameResultData,
    ResouceRelation,
    ProjectConfigType,
    ObjectCategory,
} from '@/common/interface';
import { getPointsFileName } from '@/common/utils/tools';

export type GlobalContextType = {
    userData: unknown;
    setUserData: (para: unknown) => void;
    manager: FrameManager;
    loading: boolean;
    setLoading: (para: boolean) => void;
    frameResultData: FrameResultData[];
    objectCategoryAll: ObjectCategory[];
    resouceRelation: ResouceRelation[];
};

export const GlobalContext = createContext<GlobalContextType>({} as GlobalContextType);

export default function GlobalContextProvide({ children }: { children: ReactNode }) {
    const [userData, setUserData] = useState<unknown>(null);
    const [loading, setLoading] = useState(false);
    const [resouceRelation, setResouceRelation] = useState<ResouceRelation[]>([]);
    const [frameResultData, setFrameResultData] = useState<FrameResultData[]>([]);
    const [objectCategoryAll, setObjectCategory] = useState<ObjectCategory[]>([]);

    const managerRef = useRef(frameManager);

    useEffect(() => {
        const manager = managerRef.current;
        axios.get<never, FrameResouceList>(frameListApi).then((data) => {
            const { images, points, relations } = data;
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
            manager.idbStoreInstance.storeTask(listP, listI);
            setResouceRelation(relations);
        });
        axios.get<never, FrameResultData[]>(frameResultApi).then((data) => {
            setFrameResultData(data);
        });
        axios.get<never, ProjectConfigType>(projectConfigApi).then((data) => {
            const { dimension_range, object_category } = data;
            const radiusArr = dimension_range
                .split(',')
                .filter((item) => !isNaN(Number(item)))
                .map(Number);
            if (radiusArr.length) {
                manager.manager3DInstance.setCircleRadius(radiusArr);
            }
            setObjectCategory(object_category);
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
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
}
