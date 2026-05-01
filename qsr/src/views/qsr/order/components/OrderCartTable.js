import React from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import CsLineIcons from 'cs-line-icons/CsLineIcons';

const OrderCartTable = ({ orderItems, updateItemQuantity, removeItem }) => {
  return (
    <div style={{ maxHeight: '300px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', overflowX: 'hidden' }}>
      {/* Desktop & Tablet View */}
      <div className="d-none d-md-block">
        <Table striped bordered hover size="sm" className="mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th>Item</th>
              <th className="text-center">Qty</th>
              <th className="text-center">Price</th>
              <th className="text-center">Total</th>
              <th className="text-center">Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((item, index) => (
              <tr key={index}>
                <td>{item.dish_name}</td>
                <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                  <div className="d-flex align-items-center justify-content-center gap-1">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => updateItemQuantity(index, -1)}
                      disabled={item.quantity <= 1 || item.status === 'Completed'}
                    >
                      -
                    </Button>
                    <span className="mx-2">{item.quantity}</span>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => updateItemQuantity(index, 1)}
                      disabled={item.status === 'Completed'}
                    >
                      +
                    </Button>
                  </div>
                </td>
                <td className="text-center">₹{item.dish_price}</td>
                <td className="text-center">₹{item.dish_price * item.quantity}</td>
                <td className="text-center">
                  {item.status === 'Completed' ? (
                    <Badge bg="success">Completed</Badge>
                  ) : item.status === 'Preparing' ? (
                    <Badge bg="primary">Preparing</Badge>
                  ) : item.status === 'Pending' ? (
                    <Badge bg="dark">Pending</Badge>
                  ) : (
                    <></>
                  )}
                </td>
                <td className="text-center">
                  <Button variant="outline-danger" size="sm" onClick={() => removeItem(index)}>
                    <CsLineIcons icon="bin" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Mobile Stacked View */}
      <div className="d-block d-md-none px-2">
        {orderItems.length === 0 ? (
          <div className="text-center text-muted p-3 small">No items in cart</div>
        ) : (
          orderItems.map((item, index) => (
            <div key={index} className="border-bottom py-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>{item.dish_name}</strong>
                  <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                    ₹{item.dish_price} × {item.quantity} = <strong className="text-dark">₹{item.dish_price * item.quantity}</strong>
                  </div>
                </div>
                <div>
                  {item.status === 'Completed' ? (
                    <Badge bg="success">Completed</Badge>
                  ) : item.status === 'Preparing' ? (
                    <Badge bg="primary">Preparing</Badge>
                  ) : item.status === 'Pending' ? (
                    <Badge bg="dark">Pending</Badge>
                  ) : null}
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="d-flex align-items-center gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => updateItemQuantity(index, -1)}
                    disabled={item.quantity <= 1 || item.status === 'Completed'}
                    style={{ width: '32px', height: '32px', padding: '0' }}
                    className="d-flex align-items-center justify-content-center"
                  >
                    -
                  </Button>
                  <span className="mx-1 fw-bold" style={{ minWidth: '20px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => updateItemQuantity(index, 1)}
                    disabled={item.status === 'Completed'}
                    style={{ width: '32px', height: '32px', padding: '0' }}
                    className="d-flex align-items-center justify-content-center"
                  >
                    +
                  </Button>
                </div>

                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="d-flex align-items-center justify-content-center"
                  style={{ height: '32px' }}
                >
                  <CsLineIcons icon="bin" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderCartTable;
