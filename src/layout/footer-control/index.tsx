import React, { useContext } from 'react';
import { Layout } from 'antd';
import { GlobalContext } from '@/global-data';
import {
    FrameResouceList,
    FrameResultData,
    ResouceRelation,
    ProjectConfigType,
    ObjectCategory,
    ObjectInScene,
} from '@/common/interface';
import './index.scss';

const { Footer } = Layout;

export default function FooterControl() {
    const { manager, circleLimit, frameResultData, resouceRelation } = useContext(GlobalContext);

    // function generateFrameList(list: FrameResultData[]): JSX.Element[] {
    //     return list.map((frameData, index) => {
    //         return (
    //             <div className="spo-footer-frame-list-item" key={frameData.data_source_id}>
    //                 {index + 1}
    //             </div>
    //         );
    //     });
    // }

    function generateFrameList(): JSX.Element[] {
        const arr = [];
        for (let i = 0; i < 150; i++) {
            arr.push({
                id: i,
            });
        }
        return arr.map((item, index) => {
            return (
                <div className="spo-footer-frame-list-item" key={item.id}>
                    {index + 1}
                </div>
            );
        });
    }

    return (
        <Footer className="spo-footer" style={{ height: '95px', background: '#696969' }}>
            {/* <div className="spo-footer-frame-list">{generateFrameList(frameResultData)}</div> */}
            <div className="spo-footer-frame-list-out">
                <div className="spo-footer-frame-list-inner">{generateFrameList()}</div>
            </div>
        </Footer>
    );
}
