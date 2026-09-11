const Payment = require('../models/Payment');
const { logAudit } = require('../middleware/audit');

exports.getProjectPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ projectId: req.params.id });
    return res.json({ success: true, data: payments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createOrUpdatePayment = async (req, res) => {
  try {
    const { type, amountDue, dueDate } = req.body;
    const projectId = req.params.id;

    let payment = await Payment.findOne({ projectId, type });
    if (payment) {
      payment.amountDue = amountDue !== undefined ? amountDue : payment.amountDue;
      payment.dueDate = dueDate || payment.dueDate;
      await payment.save();
    } else {
      payment = await Payment.create({
        projectId,
        type,
        amountDue,
        amountPaid: 0,
        dueDate: dueDate || null,
        paymentHistory: [],
      });
    }

    await logAudit({
      user: req.user,
      action: 'SET_PROJECT_FEE',
      entityType: 'Payment',
      entityId: payment._id,
      changesSummary: `Set ${type} fee structure for project ${projectId}`,
    });

    return res.json({ success: true, data: payment });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.addPaymentRecord = async (req, res) => {
  try {
    const { amount, method, remark } = req.body;
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    const payAmount = Number(amount);
    payment.amountPaid += payAmount;
    payment.paymentHistory.push({
      amount: payAmount,
      date: new Date(),
      method: method || 'bank_transfer',
      remark: remark || 'Fee installment received',
    });

    await payment.save();

    await logAudit({
      user: req.user,
      action: 'RECORD_FEE_PAYMENT',
      entityType: 'Payment',
      entityId: payment._id,
      changesSummary: `Received payment of ₹${payAmount} via ${method || 'bank transfer'} for ${payment.type}`,
    });

    return res.json({ success: true, data: payment });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
