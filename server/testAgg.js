const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const Order = require('./models/orderModel');
    const agg = await Order.aggregate([
      { $match: { customer_phone: '1231231231' } },
      { $limit: 1 },
      { $lookup: {
          from: 'customers',
          let: { orderPhone: '$customer_phone', orderUserId: '$user_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$phone', '$$orderPhone'] },
                    { $eq: ['$user_id', '$$orderUserId'] }
                  ]
                }
              }
            }
          ],
          as: 'profile'
        }
      }
    ]);
    console.log(JSON.stringify(agg[0], null, 2));
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
});
