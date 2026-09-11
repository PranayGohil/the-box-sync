require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const Professional = require('./models/Professional');
const Project = require('./models/Project');
const ProgressStage = require('./models/ProgressStage');
const SiteVisit = require('./models/SiteVisit');
const Reminder = require('./models/Reminder');
const BUPermission = require('./models/BUPermission');
const Payment = require('./models/Payment');
const AuditLog = require('./models/AuditLog');

const seedDatabase = async () => {
  await connectDB();

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Professional.deleteMany({}),
    Project.deleteMany({}),
    ProgressStage.deleteMany({}),
    SiteVisit.deleteMany({}),
    Reminder.deleteMany({}),
    BUPermission.deleteMany({}),
    Payment.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log('[Seed] Creating demo users with fixed credentials...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password@123', salt);

  const admin = await User.create({
    name: 'Ar. Rajesh Mehta (Partner)',
    email: 'admin@architectpms.com',
    passwordHash,
    role: 'admin',
    phone: '+91 98250 11223',
  });

  const architect = await User.create({
    name: 'Ar. Priya Sharma',
    email: 'architect@architectpms.com',
    passwordHash,
    role: 'architect',
    phone: '+91 98250 44556',
  });

  const staff = await User.create({
    name: 'Karan Patel (Office Admin)',
    email: 'staff@architectpms.com',
    passwordHash,
    role: 'staff',
    phone: '+91 98250 77889',
  });

  const siteEngineer = await User.create({
    name: 'Eng. Vikram Desai',
    email: 'engineer@architectpms.com',
    passwordHash,
    role: 'site_engineer',
    phone: '+91 98250 99001',
  });

  const client = await User.create({
    name: 'Mr. Ramesh Shah (Skyline Developers)',
    email: 'client@skyline.com',
    passwordHash,
    role: 'client',
    phone: '+91 98240 12345',
  });

  console.log('[Seed] Creating Professionals (Master Data)...');
  const profArchitect = await Professional.create({
    type: 'architect',
    name: 'Ar. Rajesh Mehta',
    licenseNo: 'CA/2008/42110',
    licenseIssueDate: new Date('2008-04-15'),
    licenseExpiryDate: new Date('2028-04-15'),
    phone: '+91 98250 11223',
    email: 'rajesh@mehtaarchitects.com',
    status: 'active',
  });

  const profEngineer = await Professional.create({
    type: 'engineer',
    name: 'Eng. Suresh Choksi',
    licenseNo: 'MNC/ENG/1029',
    licenseIssueDate: new Date('2015-06-10'),
    licenseExpiryDate: new Date('2026-09-01'), // Expiring soon to trigger reminder
    phone: '+91 98251 33445',
    email: 'suresh.choksi@engsol.com',
    status: 'active',
  });

  const profContractor = await Professional.create({
    type: 'contractor',
    name: 'Apex Infrastructure Pvt Ltd (COW)',
    licenseNo: 'COW/GUJ/5021',
    licenseIssueDate: new Date('2018-01-20'),
    licenseExpiryDate: new Date('2027-01-20'),
    phone: '+91 98252 66778',
    email: 'projects@apexinfra.in',
    status: 'active',
  });

  const profStructural = await Professional.create({
    type: 'structural_engineer',
    name: 'Er. Harshil Trivedi (STR-1)',
    licenseNo: 'STR/MNC/304',
    licenseIssueDate: new Date('2012-09-01'),
    licenseExpiryDate: new Date('2027-09-01'),
    phone: '+91 98253 88990',
    email: 'harshil@trivedistructures.com',
    status: 'active',
  });

  const profSOR = await Professional.create({
    type: 'sor',
    name: 'SOR Board Gujarat Region',
    licenseNo: 'SOR/REG/8812',
    licenseIssueDate: new Date('2020-01-01'),
    licenseExpiryDate: new Date('2030-01-01'),
    phone: '+91 98254 11122',
    email: 'info@sorboard.org',
    status: 'active',
  });

  const profDeveloper = await Professional.create({
    type: 'developer',
    name: 'Skyline Buildcon Ltd',
    licenseNo: 'DEV/RERA/99201',
    licenseIssueDate: new Date('2019-05-10'),
    licenseExpiryDate: new Date('2029-05-10'),
    phone: '+91 98240 12345',
    email: 'contact@skylinebuildcon.com',
    status: 'active',
  });

  console.log('[Seed] Registering Sample Projects (Cases)...');
  const project1 = await Project.create({
    caseNo: 'BP/2026/0412',
    rajachitthiNo: 'RC-9941/2026',
    rajachitthiDate: new Date('2026-07-10'),
    ownerName: 'Mr. Ramesh Shah',
    projectName: 'Skyline Heights Commercial Complex',
    blockNo: 'A-12',
    tpsNo: '14',
    rsNo: '450/1',
    fpNo: '88',
    csNo: '102',
    spNo: '04',
    zone: 'West Zone',
    ward: 'Ward 5 - Navrangpura',
    architectId: profArchitect._id,
    engineerId: profEngineer._id,
    contractorId: profContractor._id,
    structuralEngineerId: profStructural._id,
    sorId: profSOR._id,
    developerId: profDeveloper._id,
    status: 'under_scrutiny',
    statusHistory: [
      { status: 'submitted', date: new Date('2026-07-01'), remark: 'Project application submitted online', updatedBy: 'Karan Patel' },
      { status: 'under_scrutiny', date: new Date('2026-07-05'), remark: 'Drawings assigned to Senior Scrutiny Officer', updatedBy: 'Ar. Rajesh Mehta' },
    ],
    documents: [
      { fileUrl: '/uploads/sample_drawing.pdf', fileName: 'Architectural_Floor_Plan_v1.pdf', type: 'drawing', uploadedAt: new Date('2026-07-01') },
      { fileUrl: '/uploads/rajachitthi_copy.pdf', fileName: 'Rajachitthi_Receipt.pdf', type: 'rajachitthi', uploadedAt: new Date('2026-07-10') },
    ],
    createdBy: admin._id,
  });

  const project2 = await Project.create({
    caseNo: 'BP/2026/0589',
    rajachitthiNo: 'RC-10102/2026',
    rajachitthiDate: new Date('2026-08-01'),
    ownerName: 'Mrs. Sunita Ben Patel',
    projectName: 'Emerald Residency 3BHK Villas',
    blockNo: 'B-04',
    tpsNo: '28',
    rsNo: '112/B',
    fpNo: '210',
    csNo: '54',
    spNo: '12',
    zone: 'South Zone',
    ward: 'Ward 12 - Maninagar',
    architectId: profArchitect._id,
    engineerId: profEngineer._id,
    contractorId: profContractor._id,
    structuralEngineerId: profStructural._id,
    sorId: profSOR._id,
    developerId: profDeveloper._id,
    status: 'rajachitthi_issued',
    statusHistory: [
      { status: 'submitted', date: new Date('2026-05-10'), remark: 'Case opened', updatedBy: 'Karan Patel' },
      { status: 'approved', date: new Date('2026-06-15'), remark: 'Plan approval sanctioned by Municipal Comm.', updatedBy: 'Ar. Rajesh Mehta' },
      { status: 'rajachitthi_issued', date: new Date('2026-08-01'), remark: 'Rajachitthi issued officially', updatedBy: 'Ar. Rajesh Mehta' },
    ],
    createdBy: admin._id,
  });

  // Link client user to project 1
  client.linkedClientProjectIds = [project1._id];
  await client.save();

  console.log('[Seed] Seeding Construction Progress Stages...');
  await ProgressStage.create([
    {
      projectId: project2._id,
      stage: 'foundation',
      completionDate: new Date('2026-06-20'),
      remarks: 'Basement excavation and RCC footing raft poured and cured.',
      photos: ['/uploads/foundation_photo.jpg'],
      updatedBy: 'Eng. Vikram Desai',
    },
    {
      projectId: project2._id,
      stage: 'plinth',
      completionDate: new Date('2026-07-15'),
      remarks: 'Plinth beam casting completed. Backfilling in progress.',
      photos: ['/uploads/plinth_photo.jpg'],
      updatedBy: 'Eng. Vikram Desai',
    },
    {
      projectId: project2._id,
      stage: 'middle_story',
      completionDate: new Date('2026-08-02'),
      remarks: 'Columns and 2nd slab shuttering done.',
      photos: [],
      updatedBy: 'Eng. Vikram Desai',
    },
    {
      projectId: project2._id,
      stage: 'top_slab',
      completionDate: new Date('2026-08-10'),
      remarks: 'Terrace slab casting complete. B.U. application unlocked.',
      photos: [],
      updatedBy: 'Eng. Vikram Desai',
    },
  ]);

  console.log('[Seed] Seeding Site Visits...');
  await SiteVisit.create([
    {
      projectId: project1._id,
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
      assignedTo: siteEngineer._id,
      purpose: 'Verify setback dimensions and boundary wall alignment before scrutiny clear.',
      status: 'scheduled',
      notes: 'Ensure client site manager is present with survey equipment.',
    },
    {
      projectId: project2._id,
      scheduledDate: new Date('2026-08-05'),
      assignedTo: siteEngineer._id,
      purpose: 'Inspect top slab steel reinforcement before concrete pour.',
      status: 'completed',
      notes: 'Approved. Reinforcement matches STR drawing.',
    },
  ]);

  console.log('[Seed] Seeding B.U. Permission...');
  await BUPermission.create({
    projectId: project2._id,
    status: 'under_review',
    statusHistory: [
      { status: 'application_submitted', date: new Date('2026-08-11'), remark: 'BU application submitted with completion drawings', updatedBy: 'Karan Patel' },
      { status: 'under_review', date: new Date('2026-08-12'), remark: 'Fire & Drainage NOC verified', updatedBy: 'Ar. Rajesh Mehta' },
    ],
    documents: [{ fileUrl: '/uploads/bu_application.pdf', fileName: 'BU_Form_A_Signed.pdf', uploadedAt: new Date('2026-08-11') }],
  });

  console.log('[Seed] Seeding Payments & Fees...');
  await Payment.create([
    {
      projectId: project1._id,
      type: 'architect_fee',
      amountDue: 250000,
      amountPaid: 100000,
      dueDate: new Date('2026-08-30'),
      paymentHistory: [{ amount: 100000, date: new Date('2026-07-02'), method: 'neft', remark: 'Advance fee on case filing' }],
    },
    {
      projectId: project1._id,
      type: 'govt_fee',
      amountDue: 75000,
      amountPaid: 75000,
      dueDate: new Date('2026-07-05'),
      paymentHistory: [{ amount: 75000, date: new Date('2026-07-05'), method: 'online_chalan', remark: 'Municipal scrutiny chalan paid' }],
    },
  ]);

  console.log('[Seed] Seeding Reminders...');
  await Reminder.create([
    {
      type: 'license_expiry',
      refId: profEngineer._id,
      title: `License Expiry Alert: ${profEngineer.name} (ENGINEER)`,
      description: `License ${profEngineer.licenseNo} expires on ${new Date(profEngineer.licenseExpiryDate).toLocaleDateString()}`,
      dueDate: profEngineer.licenseExpiryDate,
      status: 'pending',
      channel: 'email',
    },
    {
      type: 'site_visit',
      refId: project1._id,
      title: `Upcoming Site Visit: Case ${project1.caseNo} (${project1.projectName})`,
      description: 'Scheduled setback inspection in 3 days',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'pending',
      channel: 'in_app',
    },
  ]);

  console.log('[Seed] Seeding Audit Logs...');
  await AuditLog.create([
    {
      userId: admin._id,
      userName: admin.name,
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'System',
      entityId: 'SYS-001',
      changesSummary: 'Database initialized with full seed dataset',
      timestamp: new Date(),
    },
  ]);

  console.log('[Seed] Seed process finished successfully!');
};

seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Seed Error]:', err);
    process.exit(1);
  });
