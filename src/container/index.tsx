import React, { useEffect, useState } from 'react';
import tokenTool, { getInitToken } from '@/common/axios/token';
import GlobalContext from '../global-data';
import { ConfigProvider, Layout, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import Dashboard from '../dashboard';
import Header from '../layout/header';
import MainList from '../layout/main-list';
import zhCN from 'antd/lib/locale/zh_CN';
import 'antd/dist/antd.css';
import './index.scss';

const { Content, Sider } = Layout;
const CircleLoading = <LoadingOutlined style={{ fontSize: 24 }} spin />;

function Container() {
    const [isInitToken, setIsInitToken] = useState(false);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const token = getInitToken();
        if (token) {
            tokenTool.setToken(token);
            setIsInitToken(true);
        }
    }, []);

    return (
        <ConfigProvider locale={zhCN}>
            <GlobalContext.Provider value={{}}>
                <Layout style={{ height: '100%' }}>
                    <Header />
                    {/* <Layout>*/}
                    <Spin
                        spinning={loading}
                        indicator={CircleLoading}
                        size="large"
                        wrapperClassName="spo-total-loading"
                    >
                        <Layout style={{ height: '100%' }}>
                            <Sider width={200} className="spo-sider" style={{ background: '#BBBBBB' }}>
                                <MainList />
                            </Sider>
                            <Content className="spo-content">
                                <Dashboard />
                            </Content>
                        </Layout>
                    </Spin>
                    {/* </Layout> */}
                </Layout>
            </GlobalContext.Provider>
        </ConfigProvider>
    );
}

export default Container;
