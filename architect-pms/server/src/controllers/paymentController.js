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
    const { type, amountDue, dueDate, isEmi, emiPlan } = req.body;
    const projectId = req.params.id;

    let installments = [];
    const isEmiEnabled = Boolean(isEmi);

    if (isEmiEnabled) {
      if (Array.isArray(emiPlan?.installments) && emiPlan.installments.length > 0) {
        installments = emiPlan.installments.map((inst, index) => {
          const instAmount = Number(inst.amount) || 0;
          const paid = Number(inst.paidAmount) || 0;
          return {
            installmentNo: Number(inst.installmentNo) || index + 1,
            name: inst.name || `EMI #${index + 1}`,
            amount: instAmount,
            dueDate: inst.dueDate ? new Date(inst.dueDate) : null,
            paidAmount: paid,
            status: inst.status || (paid >= instAmount && instAmount > 0 ? 'paid' : paid > 0 ? 'partially_paid' : 'pending'),
            paidDate: inst.paidDate ? new Date(inst.paidDate) : (paid >= instAmount && instAmount > 0 ? new Date() : null),
          };
        });
      } else {
        const count = Number(emiPlan?.totalEmis) || 3;
        const totalNum = Number(amountDue) || 0;
        const equalAmount = Math.round(totalNum / count);
        const now = new Date();
        for (let i = 0; i < count; i++) {
          const due = new Date(now);
          due.setMonth(now.getMonth() + i);
          installments.push({
            installmentNo: i + 1,
            name: `Installment ${i + 1}`,
            amount: i === count - 1 ? totalNum - equalAmount * (count - 1) : equalAmount,
            dueDate: due,
            paidAmount: 0,
            status: 'pending',
            paidDate: null,
          });
        }
      }
    }

    const totalCalculatedDue = isEmiEnabled && installments.length > 0
      ? installments.reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0)
      : Number(amountDue) || 0;

    let payment = await Payment.findOne({ projectId, type });
    if (payment) {
      payment.amountDue = totalCalculatedDue !== undefined ? totalCalculatedDue : payment.amountDue;
      payment.dueDate = dueDate || payment.dueDate;
      payment.isEmi = isEmiEnabled;
      if (isEmiEnabled) {
        payment.emiPlan = {
          totalEmis: installments.length || Number(emiPlan?.totalEmis) || 1,
          frequency: emiPlan?.frequency || 'monthly',
          installments,
        };
      } else {
        payment.emiPlan = { totalEmis: 1, frequency: 'monthly', installments: [] };
      }
      payment.markModified('emiPlan');
      payment.markModified('isEmi');
      await payment.save();
    } else {
      payment = await Payment.create({
        projectId,
        type,
        amountDue: totalCalculatedDue,
        amountPaid: 0,
        dueDate: dueDate || null,
        isEmi: isEmiEnabled,
        emiPlan: isEmiEnabled
          ? {
              totalEmis: installments.length || Number(emiPlan?.totalEmis) || 1,
              frequency: emiPlan?.frequency || 'monthly',
              installments,
            }
          : { totalEmis: 1, frequency: 'monthly', installments: [] },
        paymentHistory: [],
      });
    }

    await logAudit({
      user: req.user,
      action: 'SET_PROJECT_FEE',
      entityType: 'Payment',
      entityId: payment._id,
      changesSummary: `Set ${type} fee structure${isEmiEnabled ? ' with EMI Plan' : ''} for project ${projectId}`,
    });

    return res.json({ success: true, data: payment });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.addPaymentRecord = async (req, res) => {
  try {
    const { amount, method, remark, installmentNo } = req.body;
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    const payAmount = Number(amount);
    payment.amountPaid += payAmount;

    let targetInstallmentNo = installmentNo ? Number(installmentNo) : null;

    // Allocate payment to EMI installment(s) if EMI plan is active
    if (payment.isEmi && Array.isArray(payment.emiPlan?.installments) && payment.emiPlan.installments.length > 0) {
      if (targetInstallmentNo) {
        const inst = payment.emiPlan.installments.find(i => i.installmentNo === targetInstallmentNo);
        if (inst) {
          inst.paidAmount = (inst.paidAmount || 0) + payAmount;
          if (inst.paidAmount >= inst.amount) {
            inst.status = 'paid';
            inst.paidDate = new Date();
          } else {
            inst.status = 'partially_paid';
          }
        }
      } else {
        // Cascade to earliest unpaid installment
        let remainingToAllocate = payAmount;
        for (const inst of payment.emiPlan.installments) {
          if (remainingToAllocate <= 0) break;
          const dueForThis = inst.amount - (inst.paidAmount || 0);
          if (dueForThis > 0) {
            const alloc = Math.min(remainingToAllocate, dueForThis);
            inst.paidAmount = (inst.paidAmount || 0) + alloc;
            remainingToAllocate -= alloc;
            if (inst.paidAmount >= inst.amount) {
              inst.status = 'paid';
              inst.paidDate = new Date();
            } else {
              inst.status = 'partially_paid';
            }
            if (!targetInstallmentNo) targetInstallmentNo = inst.installmentNo;
          }
        }
      }
    }

    payment.paymentHistory.push({
      amount: payAmount,
      date: new Date(),
      method: method || 'bank_transfer',
      remark: remark || (targetInstallmentNo ? `Paid EMI #${targetInstallmentNo}` : 'Fee installment received'),
      installmentNo: targetInstallmentNo,
    });

    await payment.save();

    await logAudit({
      user: req.user,
      action: 'RECORD_FEE_PAYMENT',
      entityType: 'Payment',
      entityId: payment._id,
      changesSummary: `Received payment of ₹${payAmount} via ${method || 'bank transfer'} for ${payment.type}${targetInstallmentNo ? ` (EMI #${targetInstallmentNo})` : ''}`,
    });

    return res.json({ success: true, data: payment });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
