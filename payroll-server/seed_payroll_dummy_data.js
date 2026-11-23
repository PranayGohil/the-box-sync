const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const staffModel = require('./models/staffModel');
const staffPayrollModel = require('./models/staffPayrollModel');
const branchModel = require('./models/branchModel');
const departmentModel = require('./models/departmentModel');
const payingEntityModel = require('./models/payingEntityModel');
const PayrollConfig = require('./models/PayrollConfig');
const salaryAdvanceModel = require('./models/salaryAdvanceModel');
const expenseModel = require('./models/expenseModel');
const leaveRequestModel = require('./models/leaveRequestModel');
const staffAttendanceModel = require('./models/staffAttendanceModel');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas...');

  const userId = '6937b920f45bc0d16bde1cee'; // Sardarji Londonwaley / Rushi Maru

  // 1. Create Branches
  console.log('Seeding Branches...');
  let branches = await branchModel.find({ user_id: userId });
  if (branches.length === 0) {
    branches = await branchModel.insertMany([
      { name: 'Flagship Dine-in (Bandra West)', user_id: userId, address: 'Plot 42, Hill Road, Bandra West, Mumbai 400050' },
      { name: 'Gourmet Bistro (Lower Parel)', user_id: userId, address: 'Phoenix Palladium, High Street, Lower Parel, Mumbai 400013' },
      { name: 'Express Cloud Kitchen (Andheri)', user_id: userId, address: 'Unit 7, MIDC Industrial Area, Andheri East, Mumbai 400093' }
    ]);
  }
  const branchIds = branches.map(b => b._id);
  console.log(`Branches ready: ${branches.length}`);

  // 2. Create Departments
  console.log('Seeding Departments...');
  let depts = await departmentModel.find({ user_id: userId });
  if (depts.length === 0) {
    depts = await departmentModel.insertMany([
      { name: 'Executive & Management', user_id: userId, is_global: true },
      { name: 'Culinary & Kitchen', user_id: userId, is_global: true },
      { name: 'F&B Service & Bar', user_id: userId, is_global: true },
      { name: 'Operations & Floor', user_id: userId, is_global: true },
      { name: 'Finance, HR & Accounts', user_id: userId, is_global: true }
    ]);
  }
  const deptMap = {};
  depts.forEach(d => { deptMap[d.name] = d._id; });
  console.log(`Departments ready: ${depts.length}`);

  // 3. Create Paying Entity
  console.log('Seeding Paying Entity...');
  let payingEntity = await payingEntityModel.findOne({ user_id: userId });
  if (!payingEntity) {
    payingEntity = await payingEntityModel.create({
      user_id: userId,
      company_name: 'Sardarji Hospitality & Dining LLP',
      bank_name: 'HDFC Bank',
      account_number: '50200084920194',
      ifsc_code: 'HDFC0000240',
      branch_name: 'Bandra Kurla Complex Branch',
      address: 'Plot 42, Hill Road, Bandra West, Mumbai - 400050',
      is_default: true
    });
  }
  console.log(`Paying Entity ready: ${payingEntity.company_name}`);

  // 4. Update / Seed Staff Members
  console.log('Seeding Staff Members...');
  const staffCatalog = [
    {
      staff_id: 'EMP-101',
      f_name: 'Aarav',
      l_name: 'Sharma',
      position: 'Executive Head Chef',
      salary: 68000,
      email: 'aarav.chef@theboxsync.com',
      phone_no: 9820147291,
      gender: 'Male',
      department: deptMap['Culinary & Kitchen'] || depts[1]._id,
      branch_id: branchIds[0],
      city: 'Mumbai',
      state: 'Maharashtra',
      joining_date: '2023-04-10',
      uan_number: '101482910482',
      bank_account_no: '918204910294',
      ifsc_code: 'HDFC0000240',
      pan_number: 'AHFPS9182K'
    },
    {
      staff_id: 'EMP-102',
      f_name: 'Neha',
      l_name: 'Kulkarni',
      position: 'Restaurant General Manager',
      salary: 75000,
      email: 'neha.gm@theboxsync.com',
      phone_no: 9819284729,
      gender: 'Female',
      department: deptMap['Executive & Management'] || depts[0]._id,
      branch_id: branchIds[0],
      city: 'Mumbai',
      state: 'Maharashtra',
      joining_date: '2022-08-15',
      uan_number: '101928471928',
      bank_account_no: '482910482918',
      ifsc_code: 'ICIC0001048',
      pan_number: 'BKLPK4829M'
    },
    {
      staff_id: 'EMP-103',
      f_name: 'Vikramaditya',
      l_name: 'Rathore',
      position: 'Operations & Floor Lead',
      salary: 54000,
      email: 'vikram.rathore@theboxsync.com',
      phone_no: 9769284019,
      gender: 'Male',
      department: deptMap['Operations & Floor'] || depts[3]._id,
      branch_id: branchIds[1],
      city: 'Mumbai',
      state: 'Maharashtra',
      joining_date: '2023-01-12',
      uan_number: '101827491028',
      bank_account_no: '382910482910',
      ifsc_code: 'SBIN0004829',
      pan_number: 'CJLPR3928L'
    },
    {
      staff_id: 'EMP-104',
      f_name: 'Pooja',
      l_name: 'Verma',
      position: 'HR & People Operations',
      salary: 48000,
      email: 'pooja.hr@theboxsync.com',
      phone_no: 9821094829,
      gender: 'Female',
      department: deptMap['Finance, HR & Accounts'] || depts[4]._id,
      branch_id: branchIds[0],
      city: 'Mumbai',
      state: 'Maharashtra',
      joining_date: '2023-06-01',
      uan_number: '101738491029',
      bank_account_no: '281940184920',
      ifsc_code: 'HDFC0000240',
      pan_number: 'DLKPV2918P'
    },
    {
      staff_id: 'EMP-105',
      f_name: 'Kunal',
      l_name: 'Mehta',
      position: 'Lead Mixologist & Bar Head',
      salary: 42000,
      email: 'kunal.bar@theboxsync.com',
      phone_no: 9920184729,
      gender: 'Male',
      department: deptMap['F&B Service & Bar'] || depts[2]._id,
      branch_id: branchIds[0],
      city: 'Mumbai',
      state: 'Maharashtra',
      joining_date: '2023-09-18',
      uan_number: '101628491048',
      bank_account_no: '592019482910',
      ifsc_code: 'UTIB0000918',
      pan_number: 'EKMPM1928N'
    },
    {
      staff_id: 'EMP-106',
      f_name: 'Ananya',
      l_name: 'Sen',
      position: 'Senior Finance Accountant',
      salary: 46000,
      email: 'ananya.acc@theboxsync.com',
      phone_no: 9820918472,
      gender: 'Female',
      department: deptMap['Finance, HR & Accounts'] || depts[4]._id,
      branch_id: branchIds[0],
      city: 'Mumbai',
      state: 'Maharashtra',
      joining_date: '2023-03-20',
      uan_number: '101528491039',
      bank_account_no: '692019482910',
      ifsc_code: 'KKBK0000482',
      pan_number: 'FKLPJ3918R'
    },
    {
      staff_id: 'EMP-107',
      f_name: 'Rohit',
      l_name: 'Nair',
      position: 'Floor Captain & Host',
      salary: 32000,
      email: 'rohit.captain@theboxsync.com',
      phone_no: 9769182940,
      gender: 'Male',
      department: deptMap['F&B Service & Bar'] || depts[2]._id,
      branch_id: branchIds[1],
      city: 'Mumbai',
      state: 'Maharashtra',
      joining_date: '2023-11-05',
      uan_number: '101429184029',
      bank_account_no: '482910482918',
      ifsc_code: 'HDFC0000240',
      pan_number: 'GLKPN4829T'
    },
    {
      staff_id: 'EMP-108',
      f_name: 'Suresh',
      l_name: 'Patil',
      position: 'Sous Chef (Tandoor & Curry)',
      salary: 39000,
      email: 'suresh.patil@theboxsync.com',
      phone_no: 9820491820,
      gender: 'Male',
      department: deptMap['Culinary & Kitchen'] || depts[1]._id,
      branch_id: branchIds[2],
      city: 'Mumbai',
      state: 'Maharashtra',
      joining_date: '2023-07-22',
      uan_number: '101328491028',
      bank_account_no: '829104829102',
      ifsc_code: 'BARB0BANDRA',
      pan_number: 'HKLPP2918S'
    },
    {
      staff_id: 'EMP-109',
      f_name: 'Deepak',
      l_name: 'Joshi',
      position: 'Specialty Coffee Barista',
      salary: 28000,
      email: 'deepak.barista@theboxsync.com',
      phone_no: 9819482019,
      gender: 'Male',
      department: deptMap['F&B Service & Bar'] || depts[2]._id,
      branch_id: branchIds[1],
      city: 'Mumbai',
      state: 'Maharashtra',
      joining_date: '2024-01-10',
      uan_number: '101238491029',
      bank_account_no: '392019482918',
      ifsc_code: 'ICIC0001048',
      pan_number: 'IKLPJ9182Q'
    },
    {
      staff_id: 'EMP-110',
      f_name: 'Priya',
      l_name: 'Deshmukh',
      position: 'Cashier & POS Operator',
      salary: 24000,
      email: 'priya.pos@theboxsync.com',
      phone_no: 9769382019,
      gender: 'Female',
      department: deptMap['Operations & Floor'] || depts[3]._id,
      branch_id: branchIds[0],
      city: 'Mumbai',
      state: 'Maharashtra',
      joining_date: '2024-02-15',
      uan_number: '101149201928',
      bank_account_no: '281940182910',
      ifsc_code: 'HDFC0000240',
      pan_number: 'JKLPK1928P'
    },
    {
      staff_id: 'EMP-111',
      f_name: 'Amit',
      l_name: 'Yadav',
      position: 'Senior Dining Steward',
      salary: 21000,
      email: 'amit.steward@theboxsync.com',
      phone_no: 9820391829,
      gender: 'Male',
      department: deptMap['F&B Service & Bar'] || depts[2]._id,
      branch_id: branchIds[0],
      city: 'Mumbai',
      state: 'Maharashtra',
      joining_date: '2024-03-01',
      uan_number: '101039182910',
      bank_account_no: '582019482910',
      ifsc_code: 'SBIN0004829',
      pan_number: 'KKLPY4829M'
    },
    {
      staff_id: 'EMP-112',
      f_name: 'Raju',
      l_name: 'Sawant',
      position: 'Kitchen Steward & Prep',
      salary: 19000,
      email: 'raju.kitchen@theboxsync.com',
      phone_no: 9819203948,
      gender: 'Male',
      department: deptMap['Culinary & Kitchen'] || depts[1]._id,
      branch_id: branchIds[2],
      city: 'Mumbai',
      state: 'Maharashtra',
      joining_date: '2024-04-12',
      uan_number: '100938291029',
      bank_account_no: '719204918201',
      ifsc_code: 'MAHB0000120',
      pan_number: 'LKLPZ2918N'
    }
  ];

  const allStaff = [];
  for (const s of staffCatalog) {
    let staffDoc = await staffModel.findOne({ user_id: userId, email: s.email });
    if (!staffDoc) {
      staffDoc = await staffModel.create({
        ...s,
        user_id: userId,
        paying_entity_id: payingEntity._id,
        address: 'Bandra West, Mumbai',
        pincode: '400050',
        country: 'India'
      });
    } else {
      await staffModel.updateOne({ _id: staffDoc._id }, { $set: { ...s, paying_entity_id: payingEntity._id } });
    }
    allStaff.push(staffDoc);
  }

  // Also include the existing staff members
  const existingStaff = await staffModel.find({ user_id: userId, email: { $nin: staffCatalog.map(s => s.email) } });
  allStaff.push(...existingStaff);
  console.log(`Total staff in place: ${allStaff.length}`);

  // 5. Generate Realistic Payroll Records for Months 10 and 11, 2026
  console.log('Generating Payroll Records for current and previous months...');
  const monthsToSeed = [
    { month: 10, year: 2026, paid: true },
    { month: 11, year: 2026, paid: false } // current month has some paid, some unpaid
  ];

  for (const period of monthsToSeed) {
    for (let i = 0; i < allStaff.length; i++) {
      const staff = allStaff[i];
      const salary = staff.salary || 25000;
      const workingDays = 26;
      // Realistic attendance: 23 to 26 days
      const presentDays = Math.max(22, Math.min(26, workingDays - (i % 3)));
      const absentDays = workingDays - presentDays;
      const attendanceRatio = presentDays / workingDays;

      // Earned breakdown
      const fullBasic = Math.round(salary * 0.45);
      const fullHra = Math.round(salary * 0.25);
      const fullConveyance = 1600;
      const fullMedical = 1250;
      const fullSpecial = Math.max(0, salary - (fullBasic + fullHra + fullConveyance + fullMedical));

      const earnedBasic = Math.round(fullBasic * attendanceRatio);
      const earnedHra = Math.round(fullHra * attendanceRatio);
      const earnedConveyance = Math.round(fullConveyance * attendanceRatio);
      const earnedMedical = Math.round(fullMedical * attendanceRatio);
      const earnedSpecial = Math.round(fullSpecial * attendanceRatio);
      const totalGross = earnedBasic + earnedHra + earnedConveyance + earnedMedical + earnedSpecial;

      // Statutory deductions
      // PF: 12% on basic capped at 15000
      const pfBasic = Math.min(15000, earnedBasic);
      const pf = Math.round(pfBasic * 0.12);

      // ESI: 0.75% if gross <= 21000
      const esi = totalGross <= 21000 ? Math.round(totalGross * 0.0075) : 0;

      // Professional Tax: Maharashtra standard ₹200
      const pt = totalGross > 10000 ? 200 : 0;
      const totalStatutory = pf + esi + pt;

      // Optional TDS for high earners (salary >= 50k)
      const tds = salary >= 50000 ? Math.round(salary * 0.05) : 0;

      // Optional Advance deduction
      const advanceDeduction = (i === 2 || i === 6) ? 2500 : 0;

      // Net salary
      const netSalary = totalGross - totalStatutory - tds - advanceDeduction;

      // Status
      let status = 'unpaid';
      let paidDate = null;
      if (period.paid || (period.month === 11 && i < 7)) {
        status = 'paid';
        paidDate = period.month === 10 ? '2026-11-02' : '2026-11-20';
      }

      await staffPayrollModel.findOneAndUpdate(
        { staff_id: staff._id, month: period.month, year: period.year },
        {
          user_id: userId,
          staff_id: staff._id,
          month: period.month,
          year: period.year,
          paying_entity: {
            entity_id: payingEntity._id,
            company_name: payingEntity.company_name,
            bank_name: payingEntity.bank_name,
            account_number: payingEntity.account_number,
            ifsc_code: payingEntity.ifsc_code,
            address: payingEntity.address
          },
          earned_breakdown: {
            basic: earnedBasic,
            hra: earnedHra,
            conveyance: earnedConveyance,
            medical: earnedMedical,
            special: earnedSpecial,
            other: 0,
            total_gross: totalGross
          },
          deduction_breakdown: {
            pf,
            esi,
            pt,
            total_statutory: totalStatutory
          },
          working_days_in_month: workingDays,
          present_days: presentDays,
          absent_days: absentDays,
          leave_summary: {
            paid_leave_days: absentDays > 0 ? 1 : 0,
            lwp_days: Math.max(0, absentDays - 1),
            holiday_days: 2,
            week_off_days: 4,
            comp_off_days: 0,
            total_paid_days: presentDays + (absentDays > 0 ? 1 : 0) + 6
          },
          advance_deduction: advanceDeduction,
          tds,
          overtime_hours: (i % 4 === 0) ? 6 : 0,
          overtime_rate: Math.round(salary / (26 * 8)),
          overtime_pay: (i % 4 === 0) ? Math.round(6 * (salary / (26 * 8))) : 0,
          bonus: (i === 0 || i === 1) ? 5000 : 0,
          net_salary: netSalary + ((i === 0 || i === 1) ? 5000 : 0) + ((i % 4 === 0) ? Math.round(6 * (salary / (26 * 8))) : 0),
          status,
          paid_date: paidDate,
          notes: status === 'paid' ? 'Disbursed via Direct Bank NEFT' : 'Pending batch authorization'
        },
        { upsert: true, new: true }
      );
    }
  }
  console.log('Payroll records successfully upserted for all staff across 2 months.');

  // 6. Seed Salary Advances
  console.log('Seeding Salary Advances...');
  await salaryAdvanceModel.deleteMany({ user_id: userId });
  await salaryAdvanceModel.insertMany([
    {
      staff_id: allStaff[2]._id,
      user_id: userId,
      amount: 15000,
      given_date: new Date('2026-10-15'),
      reason: 'Home relocation & deposit support',
      recovery_mode: 'installments',
      installments: 3,
      status: 'active',
      notes: '₹5,000 monthly auto-deduction'
    },
    {
      staff_id: allStaff[6]._id,
      user_id: userId,
      amount: 8000,
      given_date: new Date('2026-11-05'),
      reason: 'Two-wheeler repair & insurance renewal',
      recovery_mode: 'single',
      installments: 1,
      status: 'active',
      notes: 'Full deduction in next payroll run'
    },
    {
      staff_id: allStaff[4]._id,
      user_id: userId,
      amount: 12000,
      given_date: new Date('2026-09-20'),
      reason: 'Family festival travel',
      recovery_mode: 'installments',
      installments: 2,
      status: 'fully_recovered',
      notes: 'Fully recovered in Sep & Oct cycles'
    },
    {
      staff_id: allStaff[8]._id,
      user_id: userId,
      amount: 5000,
      given_date: new Date('2026-10-28'),
      reason: 'Medical prescription advance',
      recovery_mode: 'single',
      installments: 1,
      status: 'active',
      notes: 'Deducted in Nov payroll'
    }
  ]);
  console.log('Salary advances seeded.');

  // 7. Seed Staff Expenses
  console.log('Seeding Expenses...');
  await expenseModel.deleteMany({ user_id: userId });
  await expenseModel.insertMany([
    {
      staff_id: allStaff[0]._id,
      user_id: userId,
      category: 'Kitchen Supplies',
      amount: 4850,
      date: '2026-11-18',
      description: 'Emergency artisanal cheese and fresh herb restock from local market',
      merchant: 'Nature Basket Bandra',
      invoice_no: 'INV-NB-82910',
      status: 'approved'
    },
    {
      staff_id: allStaff[5]._id,
      user_id: userId,
      category: 'Office & Stationery',
      amount: 1420,
      date: '2026-11-15',
      description: 'Thermal billing paper rolls (pack of 50) + filing registers',
      merchant: 'Metro Wholesale',
      invoice_no: 'MW-48201',
      status: 'approved'
    },
    {
      staff_id: allStaff[2]._id,
      user_id: userId,
      category: 'Repairs & Maintenance',
      amount: 3600,
      date: '2026-11-12',
      description: 'Bar blender servicing + water purifier filter cartridge replacement',
      merchant: 'Coolcare Solutions',
      invoice_no: 'CC-9182',
      status: 'approved'
    },
    {
      staff_id: allStaff[1]._id,
      user_id: userId,
      category: 'Staff Welfare',
      amount: 5800,
      date: '2026-11-08',
      description: 'Monthly team dinner & high-achievement celebration',
      merchant: 'Punjab Grill',
      invoice_no: 'PG-49102',
      status: 'approved'
    },
    {
      staff_id: allStaff[6]._id,
      user_id: userId,
      category: 'Travel & Logistics',
      amount: 850,
      date: '2026-11-20',
      description: 'Urgent FSSAI documents submission travel via cab',
      merchant: 'Uber India',
      invoice_no: 'UB-1049281',
      status: 'pending'
    },
    {
      staff_id: allStaff[7]._id,
      user_id: userId,
      category: 'Kitchen Supplies',
      amount: 2200,
      date: '2026-11-21',
      description: 'Special tandoor skewers and heat-resistant silicone gloves',
      merchant: 'Chef Choice Equipment',
      invoice_no: 'CCE-7192',
      status: 'pending'
    }
  ]);
  console.log('Expenses seeded.');

  // 8. Seed Leave Requests
  console.log('Seeding Leave Requests...');
  await leaveRequestModel.deleteMany({ user_id: userId });
  await leaveRequestModel.insertMany([
    {
      staff_id: allStaff[0]._id,
      user_id: userId,
      leave_type_id: 'cl',
      from_date: new Date('2026-11-24'),
      to_date: new Date('2026-11-26'),
      days: 3,
      reason: 'Attending cousin wedding in Jaipur',
      status: 'approved',
      approved_by: 'Management'
    },
    {
      staff_id: allStaff[4]._id,
      user_id: userId,
      leave_type_id: 'sl',
      from_date: new Date('2026-11-10'),
      to_date: new Date('2026-11-11'),
      days: 2,
      reason: 'Severe viral fever and medical rest advised by doctor',
      status: 'approved',
      approved_by: 'Management'
    },
    {
      staff_id: allStaff[6]._id,
      user_id: userId,
      leave_type_id: 'pl',
      from_date: new Date('2026-11-28'),
      to_date: new Date('2026-11-30'),
      days: 3,
      reason: 'Annual family pilgrimage',
      status: 'pending'
    },
    {
      staff_id: allStaff[8]._id,
      user_id: userId,
      leave_type_id: 'cl',
      from_date: new Date('2026-12-02'),
      to_date: new Date('2026-12-03'),
      days: 2,
      reason: 'Personal legal document renewal in hometown',
      status: 'pending'
    },
    {
      staff_id: allStaff[10]._id,
      user_id: userId,
      leave_type_id: 'cl',
      from_date: new Date('2026-11-04'),
      to_date: new Date('2026-11-04'),
      days: 1,
      reason: 'Short notice personal work',
      status: 'rejected',
      rejected_reason: 'Peak weekend banquet service day'
    }
  ]);
  console.log('Leave requests seeded.');

  // 9. Seed Daily Staff Attendance for November 2026
  console.log('Seeding Staff Attendance punch logs...');
  const attendanceDocs = [];
  const daysInNov = 22; // up to today
  for (const staff of allStaff.slice(0, 10)) {
    for (let day = 1; day <= daysInNov; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const dateStr = `2026-11-${dayStr}`;
      const dateObj = new Date(2026, 10, day);
      const isSunday = dateObj.getDay() === 0;

      if (isSunday) {
        attendanceDocs.push({
          staff_id: staff._id,
          user_id: userId,
          date: dateStr,
          status: 'week_off',
          in_time: null,
          out_time: null
        });
      } else {
        const isLate = (day % 7 === 0);
        attendanceDocs.push({
          staff_id: staff._id,
          user_id: userId,
          date: dateStr,
          status: isLate ? 'present' : 'present',
          in_time: isLate ? '09:24 AM' : '08:55 AM',
          out_time: '06:05 PM'
        });
      }
    }
  }

  // Remove existing Nov attendance for this user and insert fresh
  await staffAttendanceModel.deleteMany({ user_id: userId, date: { $regex: '^2026-11' } });
  await staffAttendanceModel.insertMany(attendanceDocs);
  console.log(`Seeded ${attendanceDocs.length} attendance punch logs.`);

  console.log('\n=============================================');
  console.log('ALL DUMMY PAYROLL DATA SUCCESSFULLY SEEDED!');
  console.log('=============================================');
  console.log(`- User ID: ${userId} (Sardarji Londonwaley / Rushi Maru)`);
  console.log(`- Branches: 3`);
  console.log(`- Departments: 5`);
  console.log(`- Paying Entity: Sardarji Hospitality & Dining LLP (HDFC Bank)`);
  console.log(`- Total Staff: ${allStaff.length}`);
  console.log(`- Payroll Records: ${allStaff.length * 2} records (Oct & Nov 2026)`);
  console.log(`- Salary Advances: 4 records`);
  console.log(`- Expenses: 6 claims`);
  console.log(`- Leave Requests: 5 records`);
  console.log(`- Attendance Logs: ${attendanceDocs.length} punches`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
