import React, { useEffect, useState } from 'react';
import tokenTool, { getInitToken } from '@/common/axios/token';
import GlobalContextProvider from '../global-data';
import { ConfigProvider } from 'antd';
import LayoutComp from './layout';
import zhCN from 'antd/lib/locale/zh_CN';
import 'antd/dist/antd.css';
import './index.scss';

function Container() {
    const [isInitToken, setIsInitToken] = useState(false);

    useEffect(() => {
        const token = getInitToken();
        if (token) {
            tokenTool.setToken(token);
            setIsInitToken(true);
        }
    }, []);

    return (
        <ConfigProvider locale={zhCN}>
            <GlobalContextProvider>
                <LayoutComp />
            </GlobalContextProvider>
        </ConfigProvider>
    );
}

export default Container;
