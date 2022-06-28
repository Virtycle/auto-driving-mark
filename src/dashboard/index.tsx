import React, { useEffect, useRef, useState } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import './index.scss';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { SceneRender } from '@/engine';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';

const ReactGridLayout = WidthProvider(RGL);

export default function Dashboard() {
    const defaultLayoutOpt = {
        isDraggable: false,
        isResizable: false,
    };

    const ref2 = useRef<SceneRender | null>(null);
    const ref3 = useRef<HTMLDivElement>(null);

    const layout = [
        { i: '2d-main', x: 0, y: 0, w: 6, h: 11 },
        { i: '3d-tools', x: 6, y: 0, w: 6, h: 1 },
        { i: '3d-main', x: 6, y: 2, w: 6, h: 10 },
        { i: '2d-list', x: 0, y: 6, w: 3, h: 7 },
        { i: '3d-front', x: 3, y: 6, w: 3, h: 7 },
        { i: '3d-top', x: 6, y: 6, w: 3, h: 7 },
        { i: '3d-side', x: 9, y: 6, w: 3, h: 7 },
    ];

    useEffect(() => {
        if (!ref2.current) {
            const loader = new PCDLoader();
            const scene = new SceneRender();
            ref2.current = scene;
            loader.load('./052_1591240197426.pcd', (data) => {
                // loader.load('./1635923800089062.pcd', (data) => {
                if (ref3.current) {
                    scene.init({
                        mainDiv: ref3.current?.children[2] as HTMLDivElement,
                        topDiv: ref3.current?.children[5] as HTMLDivElement,
                        frontDiv: ref3.current?.children[4] as HTMLDivElement,
                        sideDiv: ref3.current?.children[6] as HTMLDivElement,
                    });
                    scene.addPointCloud(data);
                    scene.startAnimate();
                }
            });
        }
        // return () => {
        //     scene.stopAnimate();
        // };
    }, []);
    return (
        <>
            <ReactGridLayout
                className="spo-dashboard-wrapper"
                layout={layout}
                cols={12}
                margin={[0, 0]}
                rowHeight={43}
                useCSSTransforms={false}
                innerRef={ref3}
                {...defaultLayoutOpt}
            >
                <div key="2d-main" className="spo-dashboard-item" id="spo-2d-main">
                    2D Canvas Main
                </div>
                <div key="3d-tools" className="spo-dashboard-item" id="spo-3d-tools">
                    3D Canvas tools
                </div>
                <div key="3d-main" className="spo-dashboard-item" id="spo-3d-main"></div>
                <div key="2d-list" className="spo-dashboard-item" id="spo-2d-list">
                    2D Canvas List
                </div>
                <div key="3d-front" className="spo-dashboard-item" id="spo-3d-front"></div>
                <div key="3d-top" className="spo-dashboard-item" id="spo-3d-top"></div>
                <div key="3d-side" className="spo-dashboard-item" id="spo-3d-side"></div>
            </ReactGridLayout>
        </>
    );
}
