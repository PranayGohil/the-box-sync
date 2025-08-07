import React, { useState } from 'react';
import { Button, Row, Col, Card } from 'react-bootstrap';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { NavLink } from 'react-router-dom';
import { Steps } from 'intro.js-react';
import HtmlHead from 'components/html-head/HtmlHead';
import CsLineIcons from 'cs-line-icons/CsLineIcons';
import Glide from 'components/carousel/Glide';
import BreadcrumbList from 'components/breadcrumb-list/BreadcrumbList';
import 'intro.js/introjs.css';

const Staff = () => {
  const staff = [
    {
      name: 'Pranay',
      profile: '/img/product/small/product-1.webp',
    },
    {
      name: 'Mayur',
      profile: '/img/product/small/product-2.webp',
    },
    {
      name: 'Rushi',
      profile: '/img/product/small/product-3.webp',
    },
    {
      name: 'Vishal',
      profile: '/img/product/small/product-4.webp',
    },
    {
      name: 'Pranay',
      profile: '/img/product/small/product-1.webp',
    },
    {
      name: 'Mayur',
      profile: '/img/product/small/product-2.webp',
    },
    {
      name: 'Rushi',
      profile: '/img/product/small/product-3.webp',
    },
    {
      name: 'Vishal',
      profile: '/img/product/small/product-4.webp',
    },
  ];
  return (
    <>
      <Row>
        <Col>
          {/* Stats Start */}
          <>
            <Row className="gx-2">
              <Col className="p-0">
                <Glide
                  options={{
                    gap: 0,
                    rewind: false,
                    bound: true,
                    perView: 6,
                    breakpoints: {
                      400: { perView: 2 },
                      600: { perView: 3 },
                      1400: { perView: 4 },
                      1600: { perView: 5 },
                      1900: { perView: 6 },
                      3840: { perView: 6 },
                    },
                  }}
                >
                  {staff.map((s, i) => (
                    <Glide.Item key={i}>
                      <Card className="sh-20 hover-border-primary mb-5">
                        <Card.Body className="p-4 text-center align-items-center d-flex flex-column justify-content-between">
                          <div className="d-flex sh-8 sw-8 bg-gradient-light text-white mb-3 align-items-center justify-content-center rounded-xl overflow-hidden">
                            <img src={s.profile} alt="..." className='object-fit-cover w-100 h-100' />
                          </div>
                          <p className="mb-0 lh-1">{s.name}</p>
                          {/* <p className="cta-3 mb-0 text-primary">{item.maxPersons}</p> */}
                        </Card.Body>
                      </Card>
                    </Glide.Item>
                  ))}
                </Glide>
              </Col>
            </Row>
          </>
          {/* Stats End */}
        </Col>
      </Row>
    </>
  );
};

export default Staff;
