import React, { createContext, useState, ReactNode } from 'react';

const GlobalContext = createContext({});

export default function GlobalContextProvide({ children }: { children: ReactNode }) {
    const [userData, setUserData] = useState<any>(null);
    return <GlobalContext.Provider value={{ userData, setUserData }}>{children}</GlobalContext.Provider>;
}
