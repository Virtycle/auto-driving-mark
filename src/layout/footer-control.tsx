import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

export default function FooterControl() {
    return (
        <Footer className="spo-footer" style={{ height: '95px', background: '#696969' }}>
            Controls Frame
        </Footer>
    );
}
