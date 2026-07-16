import React from 'react';

import { Row } from 'react-bootstrap';
import HtmlHead from 'components/html-head/HtmlHead';

const DineInOrder = () => {
    const title = "Delivery Partners";
    const description = 'Manage delivery partners';

    return (
        <>
            <HtmlHead title={title} description={description} />

            <Row className="g-1">
                This is for Delivery Partners view.
            </Row>
        </>
    );
};

export default DineInOrder;
