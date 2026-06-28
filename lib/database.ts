import prisma from './prisma';
import crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function normalizeDate(dateString?: string | null) {
  return dateString ? new Date(dateString) : null;
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

  const challan = await prisma.challan.create({ data: { challanNo, dealerName, date: dateObj, riceBags: rice, wheatBags: wheat, totalBags, ratePerBag: rate, calculatedAmount, month, vehicleNumber: vehicleNumber || '', driverName: driverName || '', scannedData: scannedData || null, user: { connect: { id: userId } } } });
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

  const challan = await prisma.challan.update({ where: { id: challanId }, data: { challanNo, dealerName, date: dateObj, riceBags: rice, wheatBags: wheat, totalBags, ratePerBag: rate, calculatedAmount, month, vehicleNumber: vehicleNumber || '', driverName: driverName || '', scannedData: scannedData || existing.scannedData } });
  return { success: true, challan };
}

export async function deleteChallan(userId: string, challanId: string) {
  const existing = await prisma.challan.findFirst({ where: { id: challanId, userId } });
  if (!existing) return { success: false, message: 'Challan not found or unauthorized.' };
  await prisma.challan.delete({ where: { id: challanId } });
  return { success: true, message: 'Challan deleted successfully.' };
}

// Re-export prisma for ad-hoc queries
export { prisma };
