import React, { createContext, useState, ReactNode, useRef } from 'react';
import frameManager, { FrameManager } from '@/engine';
export type GlobalContextType = {
    userData: unknown;
    setUserData: (para: unknown) => void;
    manager: FrameManager;
    loading: boolean;
};
export const GlobalContext = createContext<GlobalContextType>({} as GlobalContextType);

export default function GlobalContextProvide({ children }: { children: ReactNode }) {
    const [userData, setUserData] = useState<unknown>(null);
    const [loading, setLoading] = useState(false);
    const managerRef = useRef(frameManager);
    return (
        <GlobalContext.Provider
            value={{
                userData,
                setUserData,
                manager: managerRef.current,
                loading,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
}
