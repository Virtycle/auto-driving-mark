import React, { createContext, useState, ReactNode, useRef } from 'react';
import ContentManager3D from '@/engine';
export type GlobalContextType = {
    userData: unknown;
    setUserData: (para: unknown) => void;
    manager: ContentManager3D;
};
export const GlobalContext = createContext<GlobalContextType>({} as GlobalContextType);

export default function GlobalContextProvide({ children }: { children: ReactNode }) {
    const [userData, setUserData] = useState<unknown>(null);
    const manager = useRef(new ContentManager3D());
    return (
        <GlobalContext.Provider value={{ userData, setUserData, manager: manager.current }}>
            {children}
        </GlobalContext.Provider>
    );
}
