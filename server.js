require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./database-prisma');

const app = express();
const PORT = process.env.PORT || 8000;
const SECRET_KEY = process.env.JWT_SECRET || 'choudhary-transport-secret-2026';

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  });
};

// Middleware for parsing JSON requests
app.use(express.json());

// Serve static files only when running locally as a standalone server.
if (require.main === module) {
  app.use(express.static(__dirname));
}

// --- JWT Verification Middleware ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Authentication token missing.' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token.' });
    }
    req.user = user;
    next();
  });
}

// --- Authentication API Routes ---

// Register User Account
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { fullName, mobile, email, password, role } = req.body;

  if (!fullName || !mobile || !email || !password) {
    return res.status(400).json({ error: 'All registration fields are required.' });
  }

  const result = await db.registerUser(fullName, mobile, email, password, role);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.status(201).json({ message: 'Registration successful!', user: result.user });
}));

// Login User Account
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const result = await db.loginUser(username, password);
  if (!result.success) {
    return res.status(401).json({ error: result.message });
  }

  const token = jwt.sign(
    { id: result.user.id, email: result.user.email, role: result.user.role },
    SECRET_KEY,
    { expiresIn: '24h' }
  );

  res.status(200).json({
    message: 'Login successful!',
    token,
    user: result.user
  });
}));

// Verify token session helper
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.status(200).json({ valid: true, user: req.user });
});

// --- Challan Management API Routes (Protected) ---
app.get('/api/challans', authenticateToken, asyncHandler(async (req, res) => {
  const challans = await db.getChallans(req.user.id);
  res.status(200).json(challans);
}));

app.post('/api/challans', authenticateToken, asyncHandler(async (req, res) => {
  const { challanNo, dealerName, date, riceBags, wheatBags, ratePerBag, vehicleNumber, driverName, scannedData } = req.body;

  if (!challanNo || !dealerName || !date) {
    return res.status(400).json({ error: 'Challan number, dealer name, and date are required.' });
  }

  const result = await db.addChallan(req.user.id, challanNo, dealerName, date, riceBags, wheatBags, ratePerBag, vehicleNumber, driverName, scannedData);
  res.status(201).json(result.challan);
}));

app.put('/api/challans/:id', authenticateToken, asyncHandler(async (req, res) => {
  const challanId = req.params.id;
  const { challanNo, dealerName, date, riceBags, wheatBags, ratePerBag, vehicleNumber, driverName, scannedData } = req.body;

  if (!challanNo || !dealerName || !date) {
    return res.status(400).json({ error: 'Challan number, dealer name, and date are required for updates.' });
  }

  const result = await db.updateChallan(req.user.id, challanId, challanNo, dealerName, date, riceBags, wheatBags, ratePerBag, vehicleNumber, driverName, scannedData);
  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }

  res.status(200).json(result.challan);
}));

app.delete('/api/challans/:id', authenticateToken, asyncHandler(async (req, res) => {
  const challanId = req.params.id;
  const result = await db.deleteChallan(req.user.id, challanId);

  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }

  res.status(200).json({ message: result.message });
}));

// --- Diesel Tracker API Routes (Protected) ---
app.get('/api/diesel', authenticateToken, asyncHandler(async (req, res) => {
  const entries = await db.getDieselEntries(req.user.id);
  res.status(200).json(entries);
}));

app.post('/api/diesel', authenticateToken, asyncHandler(async (req, res) => {
  const { driverName, vehicleNumber, quantity, rate, date, givenBy, remarks } = req.body;

  if (!driverName || !vehicleNumber || !quantity || !rate || !date || !givenBy) {
    return res.status(400).json({ error: 'Driver name, vehicle number, quantity, rate, date, and given by are required.' });
  }

  const result = await db.addDieselEntry(req.user.id, driverName, vehicleNumber, quantity, rate, date, givenBy, remarks);
  res.status(201).json(result.entry);
}));

app.put('/api/diesel/:id', authenticateToken, asyncHandler(async (req, res) => {
  const entryId = req.params.id;
  const { driverName, vehicleNumber, quantity, rate, date, givenBy, remarks } = req.body;

  if (!driverName || !vehicleNumber || !quantity || !rate || !date || !givenBy) {
    return res.status(400).json({ error: 'Driver name, vehicle number, quantity, rate, date, and given by are required.' });
  }

  const result = await db.updateDieselEntry(req.user.id, entryId, driverName, vehicleNumber, quantity, rate, date, givenBy, remarks);
  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }

  res.status(200).json(result.entry);
}));

app.delete('/api/diesel/:id', authenticateToken, asyncHandler(async (req, res) => {
  const entryId = req.params.id;
  const result = await db.deleteDieselEntry(req.user.id, entryId);

  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }

  res.status(200).json({ message: result.message });
}));

// --- Mechanic Module API Routes (Protected) ---
app.get('/api/mechanic', authenticateToken, asyncHandler(async (req, res) => {
  const expenses = await db.getMechanicExpenses(req.user.id);
  res.status(200).json(expenses);
}));

app.post('/api/mechanic', authenticateToken, asyncHandler(async (req, res) => {
  const { mechanicName, vehicleNumber, workDescription, partsUsed, amountPaid, date, paidBy, remarks } = req.body;

  if (!mechanicName || !vehicleNumber || !workDescription || !amountPaid || !date || !paidBy) {
    return res.status(400).json({ error: 'Mechanic name, vehicle number, work description, amount paid, date, and paid by are required.' });
  }

  const result = await db.addMechanicExpense(req.user.id, mechanicName, vehicleNumber, workDescription, partsUsed, amountPaid, date, paidBy, remarks);
  res.status(201).json(result.expense);
}));

app.put('/api/mechanic/:id', authenticateToken, asyncHandler(async (req, res) => {
  const expenseId = req.params.id;
  const { mechanicName, vehicleNumber, workDescription, partsUsed, amountPaid, date, paidBy, remarks } = req.body;

  if (!mechanicName || !vehicleNumber || !workDescription || !amountPaid || !date || !paidBy) {
    return res.status(400).json({ error: 'Mechanic name, vehicle number, work description, amount paid, date, and paid by are required.' });
  }

  const result = await db.updateMechanicExpense(req.user.id, expenseId, mechanicName, vehicleNumber, workDescription, partsUsed, amountPaid, date, paidBy, remarks);
  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }

  res.status(200).json(result.expense);
}));

app.delete('/api/mechanic/:id', authenticateToken, asyncHandler(async (req, res) => {
  const expenseId = req.params.id;
  const result = await db.deleteMechanicExpense(req.user.id, expenseId);

  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }

  res.status(200).json({ message: result.message });
}));

// --- Driver Module API Routes (Protected) ---
app.get('/api/driver', authenticateToken, asyncHandler(async (req, res) => {
  const records = await db.getDriverRecords(req.user.id);
  res.status(200).json(records);
}));

app.post('/api/driver', authenticateToken, asyncHandler(async (req, res) => {
  const { driverName, mobileNumber, vehicleNumber, amountGiven, paymentDate, paymentType, remarks } = req.body;

  if (!driverName || !mobileNumber || !vehicleNumber || !amountGiven || !paymentDate || !paymentType) {
    return res.status(400).json({ error: 'Driver name, mobile number, vehicle number, amount given, payment date, and payment type are required.' });
  }

  const result = await db.addDriverRecord(req.user.id, driverName, mobileNumber, vehicleNumber, amountGiven, paymentDate, paymentType, remarks);
  res.status(201).json(result.record);
}));

app.put('/api/driver/:id', authenticateToken, asyncHandler(async (req, res) => {
  const recordId = req.params.id;
  const { driverName, mobileNumber, vehicleNumber, amountGiven, paymentDate, paymentType, remarks } = req.body;

  if (!driverName || !mobileNumber || !vehicleNumber || !amountGiven || !paymentDate || !paymentType) {
    return res.status(400).json({ error: 'Driver name, mobile number, vehicle number, amount given, payment date, and payment type are required.' });
  }

  const result = await db.updateDriverRecord(req.user.id, recordId, driverName, mobileNumber, vehicleNumber, amountGiven, paymentDate, paymentType, remarks);
  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }

  res.status(200).json(result.record);
}));

app.delete('/api/driver/:id', authenticateToken, asyncHandler(async (req, res) => {
  const recordId = req.params.id;
  const result = await db.deleteDriverRecord(req.user.id, recordId);

  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }

  res.status(200).json({ message: result.message });
}));

// --- Vehicle Profile API Routes (Protected) ---
app.get('/api/vehicles', authenticateToken, asyncHandler(async (req, res) => {
  const list = await db.getVehicles(req.user.id);
  res.status(200).json(list);
}));

app.post('/api/vehicles', authenticateToken, asyncHandler(async (req, res) => {
  const { vehicleNumber, vehicleType, ownerName, rcDocument, roadTaxExpiry, insuranceExpiry, pucExpiry, fitnessExpiry, permitExpiry, remarks } = req.body;

  if (!vehicleNumber || !vehicleType || !ownerName) {
    return res.status(400).json({ error: 'Vehicle number, vehicle type, and owner name are required.' });
  }

  const result = await db.addVehicle(req.user.id, vehicleNumber, vehicleType, ownerName, rcDocument, roadTaxExpiry, insuranceExpiry, pucExpiry, fitnessExpiry, permitExpiry, remarks);
  res.status(201).json(result.vehicle);
}));

app.put('/api/vehicles/:id', authenticateToken, asyncHandler(async (req, res) => {
  const vehicleId = req.params.id;
  const { vehicleNumber, vehicleType, ownerName, rcDocument, roadTaxExpiry, insuranceExpiry, pucExpiry, fitnessExpiry, permitExpiry, remarks } = req.body;

  if (!vehicleNumber || !vehicleType || !ownerName) {
    return res.status(400).json({ error: 'Vehicle number, vehicle type, and owner name are required.' });
  }

  const result = await db.updateVehicle(req.user.id, vehicleId, vehicleNumber, vehicleType, ownerName, rcDocument, roadTaxExpiry, insuranceExpiry, pucExpiry, fitnessExpiry, permitExpiry, remarks);
  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }

  res.status(200).json(result.vehicle);
}));

app.delete('/api/vehicles/:id', authenticateToken, asyncHandler(async (req, res) => {
  const vehicleId = req.params.id;
  const result = await db.deleteVehicle(req.user.id, vehicleId);

  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }

  res.status(200).json({ message: result.message });
}));

// --- Driver Profile API Routes (Protected) ---
app.get('/api/driver-profiles', authenticateToken, asyncHandler(async (req, res) => {
  const list = await db.getDriverProfiles(req.user.id);
  res.status(200).json(list);
}));

app.post('/api/driver-profiles', authenticateToken, asyncHandler(async (req, res) => {
  const { driverName, mobileNumber, address, aadhaarNumber, aadhaarPhoto, licenseNumber, licensePhoto, driverPhoto, assignedVehicleNumber, joiningDate, remarks } = req.body;

  if (!driverName || !mobileNumber || !licenseNumber) {
    return res.status(400).json({ error: 'Driver name, mobile number, and license number are required.' });
  }

  const result = await db.addDriverProfile(req.user.id, driverName, mobileNumber, address, aadhaarNumber, aadhaarPhoto, licenseNumber, licensePhoto, driverPhoto, assignedVehicleNumber, joiningDate, remarks);
  res.status(201).json(result.profile);
}));

app.put('/api/driver-profiles/:id', authenticateToken, asyncHandler(async (req, res) => {
  const profileId = req.params.id;
  const { driverName, mobileNumber, address, aadhaarNumber, aadhaarPhoto, licenseNumber, licensePhoto, driverPhoto, assignedVehicleNumber, joiningDate, remarks } = req.body;

  if (!driverName || !mobileNumber || !licenseNumber) {
    return res.status(400).json({ error: 'Driver name, mobile number, and license number are required.' });
  }

  const result = await db.updateDriverProfile(req.user.id, profileId, driverName, mobileNumber, address, aadhaarNumber, aadhaarPhoto, licenseNumber, licensePhoto, driverPhoto, assignedVehicleNumber, joiningDate, remarks);
  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }

  res.status(200).json(result.profile);
}));

app.delete('/api/driver-profiles/:id', authenticateToken, asyncHandler(async (req, res) => {
  const profileId = req.params.id;
  const result = await db.deleteDriverProfile(req.user.id, profileId);

  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }

  res.status(200).json({ message: result.message });
}));

// Clean Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(__dirname, 'services.html'));
});

app.get('/tools', (req, res) => {
  res.sendFile(path.join(__dirname, 'tools.html'));
});

app.get('/fleet', (req, res) => {
  res.sendFile(path.join(__dirname, 'fleet.html'));
});

app.get('/booking', (req, res) => {
  res.sendFile(path.join(__dirname, 'booking.html'));
});

// Fallback: serve index.html for main home page and handle file routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start listening only when run directly, not when imported by a serverless wrapper.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Choudhary Transport Server running on http://127.0.0.1:${PORT}`);
  });
}

module.exports = app;

