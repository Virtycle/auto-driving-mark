import React, { useContext } from 'react';
import { Drawer as DrawerAntD } from 'antd';
import { GlobalContext } from '../global-data';

export default function Drawer() {
    const { showDraw, setShowDraw } = useContext(GlobalContext);
    return (
        <DrawerAntD
            title="属性列表"
            placement="right"
            onClose={() => {
                setShowDraw(false);
            }}
            visible={showDraw}
        >
            data
        </DrawerAntD>
    );
}
