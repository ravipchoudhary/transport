const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function normalizeDate(dateString) {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;

  // Accept common formats: YYYY-MM-DD (ISO) and DD-MM-YYYY (display)
  const ddmmyyyy = /^\d{2}-\d{2}-\d{4}$/;
  const yyyymmdd = /^\d{4}-\d{2}-\d{2}$/;

  try {
    if (ddmmyyyy.test(dateString)) {
      const [d, m, y] = dateString.split('-');
      return new Date(`${y}-${m}-${d}T00:00:00`);
    }
    if (yyyymmdd.test(dateString)) {
      return new Date(`${dateString}T00:00:00`);
    }

    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch (e) {
    return null;
  }
}

async function registerUser(fullName, mobile, email, password, role) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { mobile }]
    }
  });

  if (existing) {
    return { success: false, message: 'Email or Mobile number is already registered.' };
  }

  const user = await prisma.user.create({
    data: {
      fullName,
      mobile,
      email,
      password: hashPassword(password),
      role: role || 'Administrator'
    }
  });

  return { success: true, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, mobile: user.mobile } };
}

async function loginUser(username, password) {
  const hashedPassword = hashPassword(password);
  const user = await prisma.user.findFirst({
    where: {
      AND: [
        { password: hashedPassword },
        {
          OR: [{ email: username }, { mobile: username }]
        }
      ]
    }
  });

  if (!user) {
    return { success: false, message: 'Invalid email/mobile or password.' };
  }

  return { success: true, user: { id: user.id, fullName: user.fullName, email: user.email, mobile: user.mobile, role: user.role } };
}

async function getChallans(userId) {
  return prisma.challan.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });
}

async function addChallan(userId, challanNo, dealerName, date, bags, ratePerBag, vehicleNumber, driverName, scannedData) {
  const bagCount = parseInt(bags) || 0;
  const rate = parseFloat(ratePerBag) || 10;
  const calculatedAmount = bagCount * rate;
  const dateObj = normalizeDate(date);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : '';

  const challan = await prisma.challan.create({
    data: {
      challanNo,
      dealerName,
      date: dateObj,
      bags: bagCount,
      ratePerBag: rate,
      calculatedAmount,
      month,
      vehicleNumber: vehicleNumber || '',
      driverName: driverName || '',
      scannedData: scannedData || null,
      user: { connect: { id: userId } }
    }
  });

  return { success: true, challan };
}

async function updateChallan(userId, challanId, challanNo, dealerName, date, bags, ratePerBag, vehicleNumber, driverName, scannedData) {
  const existing = await prisma.challan.findFirst({ where: { id: challanId, userId } });
  if (!existing) {
    return { success: false, message: 'Challan not found or unauthorized.' };
  }

  const bagCount = parseInt(bags) || 0;
  const rate = parseFloat(ratePerBag) || 10;
  const calculatedAmount = bagCount * rate;
  const dateObj = normalizeDate(date);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : existing.month;

  const challan = await prisma.challan.update({
    where: { id: challanId },
    data: {
      challanNo,
      dealerName,
      date: dateObj,
      bags: bagCount,
      ratePerBag: rate,
      calculatedAmount,
      month,
      vehicleNumber: vehicleNumber || '',
      driverName: driverName || '',
      scannedData: scannedData || existing.scannedData
    }
  });

  return { success: true, challan };
}

async function deleteChallan(userId, challanId) {
  const existing = await prisma.challan.findFirst({ where: { id: challanId, userId } });
  if (!existing) {
    return { success: false, message: 'Challan not found or unauthorized.' };
  }

  await prisma.challan.delete({ where: { id: challanId } });
  return { success: true, message: 'Challan deleted successfully.' };
}

async function getDieselEntries(userId) {
  return prisma.diesel.findMany({ where: { userId }, orderBy: { date: 'desc' } });
}

async function addDieselEntry(userId, driverName, vehicleNumber, quantity, rate, date, givenBy, remarks) {
  const qty = parseFloat(quantity) || 0;
  const rt = parseFloat(rate) || 0;
  const amount = qty * rt;
  const dateObj = normalizeDate(date);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : '';

  const entry = await prisma.diesel.create({
    data: {
      driverName,
      vehicleNumber,
      quantity: qty,
      rate: rt,
      amount,
      date: dateObj,
      givenBy,
      remarks: remarks || null,
      month,
      user: { connect: { id: userId } }
    }
  });

  return { success: true, entry };
}

async function updateDieselEntry(userId, entryId, driverName, vehicleNumber, quantity, rate, date, givenBy, remarks) {
  const existing = await prisma.diesel.findFirst({ where: { id: entryId, userId } });
  if (!existing) {
    return { success: false, message: 'Diesel log not found or unauthorized.' };
  }

  const qty = parseFloat(quantity) || 0;
  const rt = parseFloat(rate) || 0;
  const amount = qty * rt;
  const dateObj = normalizeDate(date);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : existing.month;

  const entry = await prisma.diesel.update({
    where: { id: entryId },
    data: {
      driverName,
      vehicleNumber,
      quantity: qty,
      rate: rt,
      amount,
      date: dateObj,
      givenBy,
      remarks: remarks || null,
      month
    }
  });

  return { success: true, entry };
}

async function deleteDieselEntry(userId, entryId) {
  const existing = await prisma.diesel.findFirst({ where: { id: entryId, userId } });
  if (!existing) {
    return { success: false, message: 'Diesel log not found or unauthorized.' };
  }

  await prisma.diesel.delete({ where: { id: entryId } });
  return { success: true, message: 'Diesel log deleted successfully.' };
}

async function getMechanicExpenses(userId) {
  return prisma.mechanic.findMany({ where: { userId }, orderBy: { date: 'desc' } });
}

async function addMechanicExpense(userId, mechanicName, vehicleNumber, workDescription, partsUsed, amountPaid, date, paidBy, remarks) {
  const paid = parseFloat(amountPaid) || 0;
  const dateObj = normalizeDate(date);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : '';

  const expense = await prisma.mechanic.create({
    data: {
      mechanicName,
      vehicleNumber,
      workDescription,
      partsUsed: partsUsed || null,
      amountPaid: paid,
      date: dateObj,
      paidBy,
      remarks: remarks || null,
      month,
      user: { connect: { id: userId } }
    }
  });

  return { success: true, expense };
}

async function updateMechanicExpense(userId, expenseId, mechanicName, vehicleNumber, workDescription, partsUsed, amountPaid, date, paidBy, remarks) {
  const existing = await prisma.mechanic.findFirst({ where: { id: expenseId, userId } });
  if (!existing) {
    return { success: false, message: 'Mechanic expense log not found or unauthorized.' };
  }

  const paid = parseFloat(amountPaid) || 0;
  const dateObj = normalizeDate(date);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : existing.month;

  const expense = await prisma.mechanic.update({
    where: { id: expenseId },
    data: {
      mechanicName,
      vehicleNumber,
      workDescription,
      partsUsed: partsUsed || null,
      amountPaid: paid,
      date: dateObj,
      paidBy,
      remarks: remarks || null,
      month
    }
  });

  return { success: true, expense };
}

async function deleteMechanicExpense(userId, expenseId) {
  const existing = await prisma.mechanic.findFirst({ where: { id: expenseId, userId } });
  if (!existing) {
    return { success: false, message: 'Mechanic expense log not found or unauthorized.' };
  }

  await prisma.mechanic.delete({ where: { id: expenseId } });
  return { success: true, message: 'Mechanic expense deleted successfully.' };
}

async function getDriverRecords(userId) {
  return prisma.driver.findMany({ where: { userId }, orderBy: { paymentDate: 'desc' } });
}

async function addDriverRecord(userId, driverName, mobileNumber, vehicleNumber, amountGiven, paymentDate, paymentType, remarks) {
  const given = parseFloat(amountGiven) || 0;
  const dateObj = normalizeDate(paymentDate);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : '';

  const record = await prisma.driver.create({
    data: {
      driverName,
      mobileNumber,
      vehicleNumber,
      amountGiven: given,
      paymentDate: dateObj,
      paymentType,
      remarks: remarks || null,
      month,
      user: { connect: { id: userId } }
    }
  });

  return { success: true, record };
}

async function updateDriverRecord(userId, recordId, driverName, mobileNumber, vehicleNumber, amountGiven, paymentDate, paymentType, remarks) {
  const existing = await prisma.driver.findFirst({ where: { id: recordId, userId } });
  if (!existing) {
    return { success: false, message: 'Driver payment record not found or unauthorized.' };
  }

  const given = parseFloat(amountGiven) || 0;
  const dateObj = normalizeDate(paymentDate);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : existing.month;

  const record = await prisma.driver.update({
    where: { id: recordId },
    data: {
      driverName,
      mobileNumber,
      vehicleNumber,
      amountGiven: given,
      paymentDate: dateObj,
      paymentType,
      remarks: remarks || null,
      month
    }
  });

  return { success: true, record };
}

async function deleteDriverRecord(userId, recordId) {
  const existing = await prisma.driver.findFirst({ where: { id: recordId, userId } });
  if (!existing) {
    return { success: false, message: 'Driver payment record not found or unauthorized.' };
  }

  await prisma.driver.delete({ where: { id: recordId } });
  return { success: true, message: 'Driver payment record deleted successfully.' };
}

async function getVehicles(userId) {
  return prisma.vehicle.findMany({ where: { userId } });
}

async function addVehicle(userId, vehicleNumber, vehicleType, ownerName, rcDocument, roadTaxExpiry, insuranceExpiry, pucExpiry, fitnessExpiry, permitExpiry, remarks) {
  const dateRoadTax = normalizeDate(roadTaxExpiry);
  const dateInsurance = normalizeDate(insuranceExpiry);
  const datePuc = normalizeDate(pucExpiry);
  const dateFitness = normalizeDate(fitnessExpiry);
  const datePermit = normalizeDate(permitExpiry);

  const vehicle = await prisma.vehicle.create({
    data: {
      vehicleNumber: (vehicleNumber || '').toUpperCase().trim(),
      vehicleType,
      ownerName,
      rcDocument: rcDocument || null,
      roadTaxExpiry: dateRoadTax,
      insuranceExpiry: dateInsurance,
      pucExpiry: datePuc,
      fitnessExpiry: dateFitness,
      permitExpiry: datePermit,
      remarks: remarks || null,
      user: { connect: { id: userId } }
    }
  });

  return { success: true, vehicle };
}

async function updateVehicle(userId, id, vehicleNumber, vehicleType, ownerName, rcDocument, roadTaxExpiry, insuranceExpiry, pucExpiry, fitnessExpiry, permitExpiry, remarks) {
  const existing = await prisma.vehicle.findFirst({ where: { id, userId } });
  if (!existing) {
    return { success: false, message: 'Vehicle profile not found or unauthorized.' };
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      vehicleNumber: (vehicleNumber || '').toUpperCase().trim(),
      vehicleType,
      ownerName,
      rcDocument: rcDocument !== undefined ? rcDocument : existing.rcDocument,
      roadTaxExpiry: normalizeDate(roadTaxExpiry) || existing.roadTaxExpiry,
      insuranceExpiry: normalizeDate(insuranceExpiry) || existing.insuranceExpiry,
      pucExpiry: normalizeDate(pucExpiry) || existing.pucExpiry,
      fitnessExpiry: normalizeDate(fitnessExpiry) || existing.fitnessExpiry,
      permitExpiry: normalizeDate(permitExpiry) || existing.permitExpiry,
      remarks: remarks || existing.remarks
    }
  });

  return { success: true, vehicle };
}

async function deleteVehicle(userId, id) {
  const existing = await prisma.vehicle.findFirst({ where: { id, userId } });
  if (!existing) {
    return { success: false, message: 'Vehicle profile not found or unauthorized.' };
  }

  await prisma.vehicle.delete({ where: { id } });
  return { success: true, message: 'Vehicle profile deleted successfully.' };
}

async function getDriverProfiles(userId) {
  return prisma.driverProfile.findMany({ where: { userId } });
}

async function addDriverProfile(userId, driverName, mobileNumber, address, aadhaarNumber, aadhaarPhoto, licenseNumber, licensePhoto, driverPhoto, assignedVehicleNumber, joiningDate, remarks) {
  const profile = await prisma.driverProfile.create({
    data: {
      driverName,
      mobileNumber,
      address: address || null,
      aadhaarNumber: aadhaarNumber || null,
      aadhaarPhoto: aadhaarPhoto || null,
      licenseNumber,
      licensePhoto: licensePhoto || null,
      driverPhoto: driverPhoto || null,
      assignedVehicleNumber: (assignedVehicleNumber || '').toUpperCase().trim() || null,
      joiningDate: normalizeDate(joiningDate),
      remarks: remarks || null,
      user: { connect: { id: userId } }
    }
  });

  return { success: true, profile };
}

async function updateDriverProfile(userId, id, driverName, mobileNumber, address, aadhaarNumber, aadhaarPhoto, licenseNumber, licensePhoto, driverPhoto, assignedVehicleNumber, joiningDate, remarks) {
  const existing = await prisma.driverProfile.findFirst({ where: { id, userId } });
  if (!existing) {
    return { success: false, message: 'Driver profile not found or unauthorized.' };
  }

  const profile = await prisma.driverProfile.update({
    where: { id },
    data: {
      driverName,
      mobileNumber,
      address: address || existing.address,
      aadhaarNumber: aadhaarNumber || existing.aadhaarNumber,
      aadhaarPhoto: aadhaarPhoto !== undefined ? aadhaarPhoto : existing.aadhaarPhoto,
      licenseNumber,
      licensePhoto: licensePhoto !== undefined ? licensePhoto : existing.licensePhoto,
      driverPhoto: driverPhoto !== undefined ? driverPhoto : existing.driverPhoto,
      assignedVehicleNumber: (assignedVehicleNumber || existing.assignedVehicleNumber || '').toUpperCase().trim() || null,
      joiningDate: normalizeDate(joiningDate) || existing.joiningDate,
      remarks: remarks || existing.remarks
    }
  });

  return { success: true, profile };
}

async function deleteDriverProfile(userId, id) {
  const existing = await prisma.driverProfile.findFirst({ where: { id, userId } });
  if (!existing) {
    return { success: false, message: 'Driver profile not found or unauthorized.' };
  }

  await prisma.driverProfile.delete({ where: { id } });
  return { success: true, message: 'Driver profile deleted successfully.' };
}

async function seedDatabase() {
  const count = await prisma.user.count();
  if (count > 0) return;

  const admin = await prisma.user.create({
    data: {
      fullName: 'Choudhary Admin',
      mobile: '9876543210',
      email: 'admin@choudhary.com',
      password: hashPassword('admin123'),
      role: 'Administrator',
      challans: {
        create: [
          {
            challanNo: 'CH-2026-001',
            dealerName: 'Kailash Grain Traders',
            date: new Date('2026-06-10'),
            riceBags: 150,
            wheatBags: 100,
            totalBags: 250,
            ratePerBag: 10,
            calculatedAmount: 2500,
            month: '2026-06',
            vehicleNumber: 'RJ-14-GD-8921',
            driverName: 'Ram Singh',
            scannedData: null
          },
          {
            challanNo: 'CH-2026-002',
            dealerName: 'Jaipur Agro Corporation',
            date: new Date('2026-06-15'),
            riceBags: 300,
            wheatBags: 200,
            totalBags: 500,
            ratePerBag: 10,
            calculatedAmount: 5000,
            month: '2026-06',
            vehicleNumber: 'PB-11-XX-4819',
            driverName: 'Satnam Singh',
            scannedData: null
          }
        ]
      }
    }
  });

  await prisma.diesel.createMany({
    data: [
      {
        driverName: 'Ram Singh Choudhary',
        vehicleNumber: 'RJ-14-GD-8921',
        quantity: 150,
        rate: 90,
        amount: 13500,
        date: new Date('2026-06-12'),
        givenBy: 'Choudhary Admin',
        remarks: 'Full tank highway fill',
        month: '2026-06',
        userId: admin.id
      },
      {
        driverName: 'Satnam Singh',
        vehicleNumber: 'PB-11-XX-4819',
        quantity: 200,
        rate: 92,
        amount: 18400,
        date: new Date('2026-06-14'),
        givenBy: 'Test Dispatcher',
        remarks: 'Delhi transit hub',
        month: '2026-06',
        userId: admin.id
      }
    ]
  });
}

// Only run the seed when this module is executed directly (local/dev).
if (require.main === module) {
  seedDatabase().catch(err => {
    console.error('Prisma seed failed:', err);
  });
}

module.exports = {
  registerUser,
  loginUser,
  getChallans,
  addChallan,
  updateChallan,
  deleteChallan,
  getDieselEntries,
  addDieselEntry,
  updateDieselEntry,
  deleteDieselEntry,
  getMechanicExpenses,
  addMechanicExpense,
  updateMechanicExpense,
  deleteMechanicExpense,
  getDriverRecords,
  addDriverRecord,
  updateDriverRecord,
  deleteDriverRecord,
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getDriverProfiles,
  addDriverProfile,
  updateDriverProfile,
  deleteDriverProfile,
  prisma
};
