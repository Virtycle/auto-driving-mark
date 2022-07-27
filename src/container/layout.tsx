import React, { useEffect, useRef, useState, useContext } from 'react';
import { GlobalContext } from '../global-data';
import { Layout, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import Dashboard from '../dashboard';
import Header from '../layout/header';
import FooterControl from '../layout/footer-control';
import MainList from '../layout/main-list';
import Drawer from '../layout/drawer';
import throttle from 'lodash/throttle';
import ResizeObserver from 'resize-observer-polyfill';

const { Content, Sider } = Layout;
const CircleLoading = <LoadingOutlined style={{ fontSize: 24 }} spin />;

function LayoutComp() {
    const { loading } = useContext(GlobalContext);
    const [collapsed, setCollapsed] = useState(false);
    const layoutRef = useRef<HTMLElement>(null);
    const [contentSize, setContentSize] = useState({
        width: 0,
        height: 0,
    });
    const contentSizeRef = useRef(contentSize);

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const contentDiv = contentRef.current;
        const resizeObserver = new ResizeObserver(
            throttle((entries: ResizeObserverEntry[]) => {
                for (const entry of entries) {
                    const { width, height } = entry.contentRect;
                    const widthI = Math.floor(width / 4) * 4;
                    const heightI = Math.floor(height / 10) * 10;
                    if (widthI !== contentSizeRef.current.width || heightI !== contentSizeRef.current.height) {
                        setContentSize({ width: widthI, height: heightI });
                    }
                }
            }, 500),
        );
        resizeObserver.observe(contentDiv as Element);
        return () => {
            resizeObserver.unobserve(contentDiv as Element);
        };
    }, []);

    const toggleFullSceen = () => {
        const flag = document.fullscreenElement === layoutRef.current;
        try {
            if (!flag) {
                layoutRef.current?.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <Spin spinning={loading} indicator={CircleLoading} size="large" wrapperClassName="spo-total-loading">
            <Layout style={{ height: '100%' }} ref={layoutRef}>
                <Header toggleFullSceen={toggleFullSceen} />
                <Layout style={{ height: '100%' }}>
                    <Sider
                        width={300}
                        className="spo-sider"
                        style={{ background: '#BBBBBB' }}
                        collapsible
                        collapsed={collapsed}
                        collapsedWidth={0}
                        trigger={null}
                    >
                        <MainList />
                    </Sider>
                    <Content className="spo-content" ref={contentRef}>
                        <Dashboard
                            contentHeight={contentSize.height}
                            contentWidth={contentSize.width}
                            changeSiderCollapsed={setCollapsed}
                        />
                    </Content>
                </Layout>
                <FooterControl />
                <Drawer />
            </Layout>
        </Spin>
    );
}

export default LayoutComp;
