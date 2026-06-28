import prisma from './prisma';
import crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function normalizeDate(dateString?: string | null) {
  if (!dateString) return new Date();
  const parsed = new Date(dateString);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function registerUser(fullName: string, mobile: string, email: string, password: string, role?: string) {
  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { mobile }] } });
  if (existing) return { success: false, message: 'Email or Mobile number is already registered.' };

  const user = await prisma.user.create({ data: { fullName, mobile, email, password: hashPassword(password), role: role || 'Administrator' } });
  return { success: true, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, mobile: user.mobile } };
}

export async function loginUser(username: string, password: string) {
  const hashedPassword = hashPassword(password);
  const user = await prisma.user.findFirst({ where: { AND: [{ password: hashedPassword }, { OR: [{ email: username }, { mobile: username }] }] } });
  if (!user) return { success: false, message: 'Invalid email/mobile or password.' };
  return { success: true, user: { id: user.id, fullName: user.fullName, email: user.email, mobile: user.mobile, role: user.role } };
}

export async function getChallans(userId: string) {
  return prisma.challan.findMany({ where: { userId }, orderBy: { date: 'desc' } });
}

export async function addChallan(userId: string, challanNo: string, dealerName: string, date: string, riceBags: any, wheatBags: any, ratePerBag: any, vehicleNumber?: string, driverName?: string, scannedData?: string | null) {
  const rice = parseInt(riceBags) || 0;
  const wheat = parseInt(wheatBags) || 0;
  const totalBags = rice + wheat;
  const rate = parseFloat(ratePerBag) || 10;
  const calculatedAmount = totalBags * rate;
  const dateObj = normalizeDate(date);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : '';

  const challan = await prisma.challan.create({ data: { challanNo, dealerName, date: dateObj ?? new Date(), riceBags: rice, wheatBags: wheat, totalBags, ratePerBag: rate, calculatedAmount, month, vehicleNumber: vehicleNumber || '', driverName: driverName || '', scannedData: scannedData || null, user: { connect: { id: userId } } } });
  return { success: true, challan };
}

export async function updateChallan(userId: string, challanId: string, challanNo: string, dealerName: string, date: string, riceBags: any, wheatBags: any, ratePerBag: any, vehicleNumber?: string, driverName?: string, scannedData?: string | null) {
  const existing = await prisma.challan.findFirst({ where: { id: challanId, userId } });
  if (!existing) return { success: false, message: 'Challan not found or unauthorized.' };
  const rice = parseInt(riceBags) || 0;
  const wheat = parseInt(wheatBags) || 0;
  const totalBags = rice + wheat;
  const rate = parseFloat(ratePerBag) || 10;
  const calculatedAmount = totalBags * rate;
  const dateObj = normalizeDate(date);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : existing.month;

  const challan = await prisma.challan.update({ where: { id: challanId }, data: { challanNo, dealerName, date: dateObj ?? existing.date, riceBags: rice, wheatBags: wheat, totalBags, ratePerBag: rate, calculatedAmount, month, vehicleNumber: vehicleNumber || '', driverName: driverName || '', scannedData: scannedData || existing.scannedData } });
  return { success: true, challan };
}

export async function deleteChallan(userId: string, challanId: string) {
  const existing = await prisma.challan.findFirst({ where: { id: challanId, userId } });
  if (!existing) return { success: false, message: 'Challan not found or unauthorized.' };
  await prisma.challan.delete({ where: { id: challanId } });
  return { success: true, message: 'Challan deleted successfully.' };
}

export async function getDieselEntries(userId: string) {
  return prisma.diesel.findMany({ where: { userId }, orderBy: { date: 'desc' } });
}

export async function addDieselEntry(userId: string, driverName: string, vehicleNumber: string, quantity: any, rate: any, date: string, givenBy: string, remarks?: string) {
  const qty = parseFloat(quantity) || 0;
  const rt = parseFloat(rate) || 0;
  const amount = qty * rt;
  const dateObj = normalizeDate(date);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : '';

  const entry = await prisma.diesel.create({ data: { driverName, vehicleNumber, quantity: qty, rate: rt, amount, date: dateObj ?? new Date(), givenBy, remarks: remarks || null, month, user: { connect: { id: userId } } } });
  return { success: true, entry };
}

export async function updateDieselEntry(userId: string, entryId: string, driverName: string, vehicleNumber: string, quantity: any, rate: any, date: string, givenBy: string, remarks?: string) {
  const existing = await prisma.diesel.findFirst({ where: { id: entryId, userId } });
  if (!existing) return { success: false, message: 'Diesel log not found or unauthorized.' };
  const qty = parseFloat(quantity) || 0;
  const rt = parseFloat(rate) || 0;
  const amount = qty * rt;
  const dateObj = normalizeDate(date);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : existing.month;

  const entry = await prisma.diesel.update({ where: { id: entryId }, data: { driverName, vehicleNumber, quantity: qty, rate: rt, amount, date: dateObj ?? existing.date, givenBy, remarks: remarks || null, month } });
  return { success: true, entry };
}

export async function deleteDieselEntry(userId: string, entryId: string) {
  const existing = await prisma.diesel.findFirst({ where: { id: entryId, userId } });
  if (!existing) return { success: false, message: 'Diesel log not found or unauthorized.' };
  await prisma.diesel.delete({ where: { id: entryId } });
  return { success: true, message: 'Diesel log deleted successfully.' };
}

export async function getMechanicExpenses(userId: string) {
  return prisma.mechanic.findMany({ where: { userId }, orderBy: { date: 'desc' } });
}

export async function addMechanicExpense(userId: string, mechanicName: string, vehicleNumber: string, workDescription: string, partsUsed: string | null, amountPaid: any, date: string, paidBy: string, remarks?: string) {
  const paid = parseFloat(amountPaid) || 0;
  const dateObj = normalizeDate(date);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : '';

  const expense = await prisma.mechanic.create({ data: { mechanicName, vehicleNumber, workDescription, partsUsed: partsUsed || null, amountPaid: paid, date: dateObj ?? new Date(), paidBy, remarks: remarks || null, month, user: { connect: { id: userId } } } });
  return { success: true, expense };
}

export async function updateMechanicExpense(userId: string, expenseId: string, mechanicName: string, vehicleNumber: string, workDescription: string, partsUsed: string | null, amountPaid: any, date: string, paidBy: string, remarks?: string) {
  const existing = await prisma.mechanic.findFirst({ where: { id: expenseId, userId } });
  if (!existing) return { success: false, message: 'Mechanic expense log not found or unauthorized.' };
  const paid = parseFloat(amountPaid) || 0;
  const dateObj = normalizeDate(date);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : existing.month;

  const expense = await prisma.mechanic.update({ where: { id: expenseId }, data: { mechanicName, vehicleNumber, workDescription, partsUsed: partsUsed || null, amountPaid: paid, date: dateObj ?? existing.date, paidBy, remarks: remarks || null, month } });
  return { success: true, expense };
}

export async function deleteMechanicExpense(userId: string, expenseId: string) {
  const existing = await prisma.mechanic.findFirst({ where: { id: expenseId, userId } });
  if (!existing) return { success: false, message: 'Mechanic expense log not found or unauthorized.' };
  await prisma.mechanic.delete({ where: { id: expenseId } });
  return { success: true, message: 'Mechanic expense deleted successfully.' };
}

export async function getDriverRecords(userId: string) {
  return prisma.driver.findMany({ where: { userId }, orderBy: { paymentDate: 'desc' } });
}

export async function addDriverRecord(userId: string, driverName: string, mobileNumber: string, vehicleNumber: string, amountGiven: any, paymentDate: string, paymentType: string, remarks?: string) {
  const given = parseFloat(amountGiven) || 0;
  const dateObj = normalizeDate(paymentDate);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : '';

  const record = await prisma.driver.create({ data: { driverName, mobileNumber, vehicleNumber, amountGiven: given, paymentDate: dateObj ?? new Date(), paymentType, remarks: remarks || null, month, user: { connect: { id: userId } } } });
  return { success: true, record };
}

export async function updateDriverRecord(userId: string, recordId: string, driverName: string, mobileNumber: string, vehicleNumber: string, amountGiven: any, paymentDate: string, paymentType: string, remarks?: string) {
  const existing = await prisma.driver.findFirst({ where: { id: recordId, userId } });
  if (!existing) return { success: false, message: 'Driver payment record not found or unauthorized.' };
  const given = parseFloat(amountGiven) || 0;
  const dateObj = normalizeDate(paymentDate);
  const month = dateObj ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : existing.month;

  const record = await prisma.driver.update({ where: { id: recordId }, data: { driverName, mobileNumber, vehicleNumber, amountGiven: given, paymentDate: dateObj ?? existing.paymentDate, paymentType, remarks: remarks || null, month } });
  return { success: true, record };
}

export async function deleteDriverRecord(userId: string, recordId: string) {
  const existing = await prisma.driver.findFirst({ where: { id: recordId, userId } });
  if (!existing) return { success: false, message: 'Driver payment record not found or unauthorized.' };
  await prisma.driver.delete({ where: { id: recordId } });
  return { success: true, message: 'Driver payment record deleted successfully.' };
}

export async function getVehicles(userId: string) {
  return prisma.vehicle.findMany({ where: { userId } });
}

export async function addVehicle(userId: string, vehicleNumber: string, vehicleType: string, ownerName: string, rcDocument?: string | null, roadTaxExpiry?: string | null, insuranceExpiry?: string | null, pucExpiry?: string | null, fitnessExpiry?: string | null, permitExpiry?: string | null, remarks?: string | null) {
  const dateRoadTax = normalizeDate(roadTaxExpiry);
  const dateInsurance = normalizeDate(insuranceExpiry);
  const datePuc = normalizeDate(pucExpiry);
  const dateFitness = normalizeDate(fitnessExpiry);
  const datePermit = normalizeDate(permitExpiry);

  const vehicle = await prisma.vehicle.create({ data: { vehicleNumber: (vehicleNumber || '').toUpperCase().trim(), vehicleType, ownerName, rcDocument: rcDocument || null, roadTaxExpiry: dateRoadTax, insuranceExpiry: dateInsurance, pucExpiry: datePuc, fitnessExpiry: dateFitness, permitExpiry: datePermit, remarks: remarks || null, user: { connect: { id: userId } } } });
  return { success: true, vehicle };
}

export async function updateVehicle(userId: string, id: string, vehicleNumber: string, vehicleType: string, ownerName: string, rcDocument?: string | null, roadTaxExpiry?: string | null, insuranceExpiry?: string | null, pucExpiry?: string | null, fitnessExpiry?: string | null, permitExpiry?: string | null, remarks?: string | null) {
  const existing = await prisma.vehicle.findFirst({ where: { id, userId } });
  if (!existing) return { success: false, message: 'Vehicle profile not found or unauthorized.' };

  const vehicle = await prisma.vehicle.update({ where: { id }, data: { vehicleNumber: (vehicleNumber || '').toUpperCase().trim(), vehicleType, ownerName, rcDocument: rcDocument !== undefined ? rcDocument : existing.rcDocument, roadTaxExpiry: normalizeDate(roadTaxExpiry) || existing.roadTaxExpiry, insuranceExpiry: normalizeDate(insuranceExpiry) || existing.insuranceExpiry, pucExpiry: normalizeDate(pucExpiry) || existing.pucExpiry, fitnessExpiry: normalizeDate(fitnessExpiry) || existing.fitnessExpiry, permitExpiry: normalizeDate(permitExpiry) || existing.permitExpiry, remarks: remarks || existing.remarks } });
  return { success: true, vehicle };
}

export async function deleteVehicle(userId: string, id: string) {
  const existing = await prisma.vehicle.findFirst({ where: { id, userId } });
  if (!existing) return { success: false, message: 'Vehicle profile not found or unauthorized.' };
  await prisma.vehicle.delete({ where: { id } });
  return { success: true, message: 'Vehicle profile deleted successfully.' };
}

export async function getDriverProfiles(userId: string) {
  return prisma.driverProfile.findMany({ where: { userId } });
}

export async function addDriverProfile(userId: string, driverName: string, mobileNumber: string, address?: string | null, aadhaarNumber?: string | null, aadhaarPhoto?: string | null, licenseNumber?: string, licensePhoto?: string | null, driverPhoto?: string | null, assignedVehicleNumber?: string | null, joiningDate?: string | null, remarks?: string | null) {
  const profile = await prisma.driverProfile.create({ data: { driverName, mobileNumber, address: address || null, aadhaarNumber: aadhaarNumber || null, aadhaarPhoto: aadhaarPhoto || null, licenseNumber: licenseNumber || '', licensePhoto: licensePhoto || null, driverPhoto: driverPhoto || null, assignedVehicleNumber: (assignedVehicleNumber || '').toUpperCase().trim() || null, joiningDate: normalizeDate(joiningDate), remarks: remarks || null, user: { connect: { id: userId } } } });
  return { success: true, profile };
}

export async function updateDriverProfile(userId: string, id: string, driverName: string, mobileNumber: string, address?: string | null, aadhaarNumber?: string | null, aadhaarPhoto?: string | null, licenseNumber?: string, licensePhoto?: string | null, driverPhoto?: string | null, assignedVehicleNumber?: string | null, joiningDate?: string | null, remarks?: string | null) {
  const existing = await prisma.driverProfile.findFirst({ where: { id, userId } });
  if (!existing) return { success: false, message: 'Driver profile not found or unauthorized.' };

  const profile = await prisma.driverProfile.update({ where: { id }, data: { driverName, mobileNumber, address: address || existing.address, aadhaarNumber: aadhaarNumber || existing.aadhaarNumber, aadhaarPhoto: aadhaarPhoto !== undefined ? aadhaarPhoto : existing.aadhaarPhoto, licenseNumber: licenseNumber || existing.licenseNumber, licensePhoto: licensePhoto !== undefined ? licensePhoto : existing.licensePhoto, driverPhoto: driverPhoto !== undefined ? driverPhoto : existing.driverPhoto, assignedVehicleNumber: (assignedVehicleNumber || existing.assignedVehicleNumber || '').toUpperCase().trim() || null, joiningDate: normalizeDate(joiningDate) || existing.joiningDate, remarks: remarks || existing.remarks } });
  return { success: true, profile };
}

export async function deleteDriverProfile(userId: string, id: string) {
  const existing = await prisma.driverProfile.findFirst({ where: { id, userId } });
  if (!existing) return { success: false, message: 'Driver profile not found or unauthorized.' };
  await prisma.driverProfile.delete({ where: { id } });
  return { success: true, message: 'Driver profile deleted successfully.' };
}
// Re-export prisma for ad-hoc queries
export { prisma };
