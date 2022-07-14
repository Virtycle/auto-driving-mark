import React, { createContext, useState, ReactNode, useRef } from 'react';
import ContentManager3D from '@/engine';
import workerStorage from '@/storage';
export type GlobalContextType = {
    userData: unknown;
    setUserData: (para: unknown) => void;
    manager: ContentManager3D;
    storageWorker: typeof workerStorage;
};
export const GlobalContext = createContext<GlobalContextType>({} as GlobalContextType);

const manager = new ContentManager3D();

export default function GlobalContextProvide({ children }: { children: ReactNode }) {
    const [userData, setUserData] = useState<unknown>(null);
    const managerRef = useRef(manager);
    const storageWorkerRef = useRef(workerStorage);
    return (
        <GlobalContext.Provider
            value={{ userData, setUserData, manager: managerRef.current, storageWorker: storageWorkerRef.current }}
        >
            {children}
        </GlobalContext.Provider>
    );
}
