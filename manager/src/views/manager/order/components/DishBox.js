import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const DishBox = ({ dishName, dishPrice }) => {
  return (

    <Card className="hover-border-primary sh-20 sw-20">
      <Card.Body className="h-100 d-flex flex-column justify-content-between align-items-center">
        <div className="heading text-center mb-0 sh-4 d-flex align-items-center lh-1 mt-2">{dishName}</div>
        <div className=" text-primary mt-2">{dishPrice}</div>
        <CsLineIcons icon="plus" className="text-primary mt-2" />
      </Card.Body>
    </Card>
  );
};

export default DishBox;
