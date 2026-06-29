import Link from 'next/link';
import Head from 'next/head';
import { useEffect, useMemo, useRef, useState, FormEvent } from 'react';

type Challan = {
  id: string;
  challanNo: string;
  dealerName: string;
  vehicleNumber?: string | null;
  driverName?: string | null;
  date: string;
  riceBags: number;
  wheatBags: number;
  totalBags: number;
  ratePerBag: number;
  calculatedAmount: number;
  scannedData?: string | null;
};

type VehicleProfile = {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  ownerName: string;
  roadTaxExpiry?: string | null;
  insuranceExpiry?: string | null;
  pucExpiry?: string | null;
  fitnessExpiry?: string | null;
  permitExpiry?: string | null;
  rcDocument?: string | null;
  remarks?: string | null;
};

type DriverProfile = {
  id: string;
  driverName: string;
  mobileNumber: string;
  assignedVehicleNumber?: string | null;
  address?: string | null;
  aadhaarNumber?: string | null;
  licenseNumber?: string | null;
  joiningDate?: string | null;
  remarks?: string | null;
  driverPhoto?: string | null;
  aadhaarPhoto?: string | null;
  licensePhoto?: string | null;
};

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'challan' | 'vehicle' | 'driver-profile' | 'driver' | 'mechanic' | 'diesel'>('challan');
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrScannerError, setQrScannerError] = useState<string | null>(null);
  const [scannerStream, setScannerStream] = useState<MediaStream | null>(null);
  const [vehicleOptions, setVehicleOptions] = useState<string[]>([]);
  const [vehicleProfiles, setVehicleProfiles] = useState<VehicleProfile[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'expiring'>('all');
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [vehicleStats, setVehicleStats] = useState({ totalVehicles: 0, expiringAlerts: 0 });
  const [driverProfiles, setDriverProfiles] = useState<DriverProfile[]>([]);
  const [driverProfileSearch, setDriverProfileSearch] = useState('');
  const [driverProfileLoading, setDriverProfileLoading] = useState(true);
  const [driverStats, setDriverStats] = useState({ totalDrivers: 0, assignedDrivers: 0 });
  const [challanSearch, setChallanSearch] = useState('');
  const [challanMonthFilter, setChallanMonthFilter] = useState('all');
  const [challanVehicleFilter, setChallanVehicleFilter] = useState('all');
  const [challans, setChallans] = useState<Challan[]>([]);
  const [challanLoading, setChallanLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalChallans: 0,
    riceBags: 0,
    wheatBags: 0,
    totalBags: 0,
    totalAmount: 0,
  });
  const [formToast, setFormToast] = useState<string | null>(null);
  const [reportMonth, setReportMonth] = useState(() => {
    const today = new Date();
    return String(today.getMonth() + 1).padStart(2, '0');
  });
  const [reportYear, setReportYear] = useState(() => String(new Date().getFullYear()));
  const [reportCompiled, setReportCompiled] = useState(false);
  const [reportResults, setReportResults] = useState<Challan[]>([]);
  const [reportSummary, setReportSummary] = useState({
    totalChallans: 0,
    riceBags: 0,
    wheatBags: 0,
    totalBags: 0,
    totalAmount: 0,
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const barcodeDetectorRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const switchTab = (tab: 'challan' | 'vehicle' | 'driver-profile' | 'driver' | 'mechanic' | 'diesel') => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const getAuthToken = () => (typeof window !== 'undefined' ? window.localStorage.getItem('authToken') : null);

  const logout = () => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
    window.location.href = '/login';
  };

  const formatDate = (rawDate: string) => {
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return rawDate;
    return date.toLocaleDateString('en-GB');
  };

  const normalizeQrDate = (dateValue: string): string | null => {
    if (!dateValue) return null;
    const cleaned = dateValue.trim().replace(/[.\/]/g, '-');
    const parts = cleaned.split('-').map((part) => part.trim());
    if (parts.length === 3) {
      const [first, second, third] = parts;
      if (first.length === 4 && second.length <= 2 && third.length <= 2) {
        // ISO format: YYYY-MM-DD
        return `${first.padStart(4, '0')}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
      }
      if (third.length === 4 && first.length <= 2 && second.length <= 2) {
        // Assume DD-MM-YYYY for Indian dates.
        return `${third.padStart(4, '0')}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
      }
    }

    const monthNames: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
      july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
      jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };

    const monthTextMatch = dateValue.match(/(\d{1,2})\s*[-./]?\s*([A-Za-z]+)\s*['\s]*\s*(\d{4})/i);
    if (monthTextMatch) {
      const day = monthTextMatch[1].padStart(2, '0');
      const month = monthNames[monthTextMatch[2].toLowerCase()] || '01';
      const year = monthTextMatch[3];
      return `${year}-${month}-${day}`;
    }

    const parsed = new Date(cleaned);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return null;
  };

  const parseQrPayload = (payload: string) => {
    if (!payload) return null;
    let parsed: any = null;

    const specialTruckChallan = {} as any;
    const truckChallanPattern = /Truck\s*Challan\s*[:\s]*([A-Z0-9-]+)\s+([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4})\s*\(?([A-Z0-9- ]+?)\)?/i;
    const dealerNamePattern = /Dealer\s*Name\s*[:\s]*([^:\n\r]+?)(?:\s+Panchayath|$)/i;

    const truckMatch = payload.match(truckChallanPattern);
    if (truckMatch) {
      specialTruckChallan.challanNo = truckMatch[1].trim();
      specialTruckChallan.date = normalizeQrDate(truckMatch[2].trim()) || truckMatch[2].trim();
      specialTruckChallan.vehicleNumber = truckMatch[3].trim();
    }

    const dealerMatch = payload.match(dealerNamePattern);
    if (dealerMatch) {
      specialTruckChallan.dealerName = dealerMatch[1].trim();
    }

    if (Object.keys(specialTruckChallan).length) {
      parsed = specialTruckChallan;
    }

    if (!parsed) {
      try {
        parsed = JSON.parse(payload);
      } catch {
        const normalized = payload
          .replace(/\r\n/g, '\n')
          .replace(/[;|]+/g, '\n')
          .split('\n')
          .map((part) => part.trim())
          .filter(Boolean);

        const mapKey = (key: string) => {
          const raw = key.toLowerCase().replace(/[^a-z]/g, '');
          return {
            challanno: 'challanNo',
            challannumber: 'challanNo',
            challan: 'challanNo',
            dealernames: 'dealerName',
            dealername: 'dealerName',
            dealer: 'dealerName',
            vehiclenumber: 'vehicleNumber',
            vehicle: 'vehicleNumber',
            drivername: 'driverName',
            driver: 'driverName',
            date: 'date',
            ricebags: 'riceBags',
            wheatbags: 'wheatBags',
            rate: 'ratePerBag',
            amount: 'calculatedAmount',
          }[raw] || key;
        };

        const result: any = {};
        normalized.forEach((line) => {
          const parts = line.split(/[:=]/);
          if (parts.length < 2) return;
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          const normalizedKey = mapKey(key);
          if (['riceBags', 'wheatBags', 'ratePerBag', 'calculatedAmount'].includes(normalizedKey)) {
            result[normalizedKey] = Number(value) || 0;
          } else if (normalizedKey === 'date') {
            result[normalizedKey] = normalizeQrDate(value) || value;
          } else {
            result[normalizedKey] = value;
          }
        });
        parsed = Object.keys(result).length ? result : null;
      }
    }

    if (parsed?.date && typeof parsed.date === 'string') {
      const normalizedDate = normalizeQrDate(parsed.date);
      if (normalizedDate) parsed.date = normalizedDate;
    }

    return parsed;
  };

  const calculateStats = (list: Challan[]) => {
    const totalChallans = list.length;
    const riceBags = list.reduce((sum, item) => sum + (item.riceBags || 0), 0);
    const wheatBags = list.reduce((sum, item) => sum + (item.wheatBags || 0), 0);
    const totalBags = riceBags + wheatBags;
    const totalAmount = list.reduce((sum, item) => sum + (item.calculatedAmount || 0), 0);
    return { totalChallans, riceBags, wheatBags, totalBags, totalAmount };
  };

  const updateFormTotals = () => {
    const rice = Number((document.getElementById('form-rice-bags') as HTMLInputElement | null)?.value || 0);
    const wheat = Number((document.getElementById('form-wheat-bags') as HTMLInputElement | null)?.value || 0);
    const totalBags = rice + wheat;
    const bagsDisplay = document.getElementById('form-total-bags-display');
    if (bagsDisplay) bagsDisplay.textContent = totalBags.toLocaleString();
  };

  const setDefaultChallanDate = () => {
    if (typeof window === 'undefined') return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateInput = document.getElementById('form-challan-date') as HTMLInputElement | null;
    if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;
  };

  const loadVehicleOptions = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('/api/vehicles', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;
      const data = await response.json();
      const vehicleList = Array.isArray(data)
        ? data.map((item: any) => ({
            id: String(item.id),
            vehicleNumber: String(item.vehicleNumber || '').trim(),
            vehicleType: String(item.vehicleType || ''),
            ownerName: String(item.ownerName || ''),
            roadTaxExpiry: item.roadTaxExpiry || null,
            insuranceExpiry: item.insuranceExpiry || null,
            pucExpiry: item.pucExpiry || null,
            fitnessExpiry: item.fitnessExpiry || null,
            permitExpiry: item.permitExpiry || null,
            rcDocument: item.rcDocument || null,
            remarks: item.remarks || null,
          }))
        : [];
      setVehicleOptions(vehicleList.map((vehicle) => vehicle.vehicleNumber).filter(Boolean));
      setVehicleProfiles(vehicleList);
    } catch (error) {
      console.error('Error loading vehicle options:', error);
    }
  };

  const filteredChallans = useMemo(() => {
    return challans.filter((item) => {
      const matchesSearch = challanSearch
        ? [item.challanNo, item.dealerName, item.vehicleNumber, item.driverName]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(challanSearch.toLowerCase()))
        : true;

      const matchesMonth = challanMonthFilter === 'all'
        ? true
        : (() => {
            const date = new Date(item.date);
            const itemMonth = String(date.getMonth() + 1).padStart(2, '0');
            return itemMonth === challanMonthFilter;
          })();

      const matchesVehicle = challanVehicleFilter === 'all'
        ? true
        : item.vehicleNumber === challanVehicleFilter;

      return matchesSearch && matchesMonth && matchesVehicle;
    });
  }, [challans, challanSearch, challanMonthFilter, challanVehicleFilter]);

  const filteredVehicleProfiles = useMemo(() => {
    return vehicleProfiles.filter((item) => {
      const matchesSearch = vehicleSearch
        ? [item.vehicleNumber, item.vehicleType, item.ownerName]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(vehicleSearch.toLowerCase()))
        : true;
      if (vehicleFilter === 'expiring') {
        const now = new Date();
        const isExpiring = ['roadTaxExpiry', 'insuranceExpiry', 'pucExpiry', 'fitnessExpiry', 'permitExpiry']
          .some((key) => {
            const value = item[key as keyof VehicleProfile] as string | null | undefined;
            if (!value) return false;
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return false;
            const diffDays = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays <= 30;
          });
        return matchesSearch && isExpiring;
      }
      return matchesSearch;
    });
  }, [vehicleProfiles, vehicleSearch, vehicleFilter]);

  const filteredDriverProfiles = useMemo(() => {
    return driverProfiles.filter((item) => {
      const query = driverProfileSearch.toLowerCase().trim();
      if (!query) return true;
      return [item.driverName, item.mobileNumber, item.assignedVehicleNumber, item.licenseNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [driverProfiles, driverProfileSearch]);

  const driverOptions = useMemo(() => {
    return Array.from(new Set(driverProfiles.map((driver) => driver.driverName).filter(Boolean)));
  }, [driverProfiles]);

  const exportChallansCsv = () => {
    const rows = filteredChallans.map((c) => [
      c.challanNo,
      c.dealerName,
      c.vehicleNumber || '',
      c.driverName || '',
      formatDate(c.date),
      c.riceBags,
      c.wheatBags,
      c.totalBags,
      c.ratePerBag,
      c.calculatedAmount,
    ]);

    const csvHeader = 'Challan No,Dealer Name,Vehicle Number,Driver Name,Date,Rice Bags,Wheat Bags,Total Bags,Rate,Amount';
    const csvContent = [
      csvHeader,
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'challans-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadChallans = async () => {
    setChallanLoading(true);
    setFormToast(null);

    try {
      const token = getAuthToken();
      if (!token) {
        logout();
        return;
      }

      const response = await fetch('/api/challans', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          return;
        }
        throw new Error('Failed to load challan records.');
      }

      const data = await response.json();
      const loadedChallans: Challan[] = Array.isArray(data)
        ? data
            .map((item: any) => ({
              id: String(item.id),
              challanNo: item.challanNo || '',
              dealerName: item.dealerName || '',
              vehicleNumber: item.vehicleNumber || null,
              driverName: item.driverName || null,
              date: item.date || '',
              riceBags: Number(item.riceBags || 0),
              wheatBags: Number(item.wheatBags || 0),
              totalBags: Number(item.totalBags || (Number(item.riceBags || 0) + Number(item.wheatBags || 0))),
              ratePerBag: Number(item.ratePerBag || 10),
              calculatedAmount: Number(item.calculatedAmount || ((Number(item.riceBags || 0) + Number(item.wheatBags || 0)) * Number(item.ratePerBag || 10))),
              scannedData: item.scannedData || null,
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [];

      setChallans(loadedChallans);
      setDashboardStats(calculateStats(loadedChallans));
    } catch (error) {
      console.error('Error loading challans:', error);
      setFormToast('Unable to load challan records. Please try again later.');
    } finally {
      setChallanLoading(false);
    }
  };

  const loadVehicleProfiles = async () => {
    setVehicleLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return;
      const response = await fetch('/api/vehicles', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const data = await response.json();
      const loadedVehicles: VehicleProfile[] = Array.isArray(data)
        ? data.map((item: any) => ({
            id: String(item.id),
            vehicleNumber: String(item.vehicleNumber || '').trim(),
            vehicleType: String(item.vehicleType || '').trim(),
            ownerName: String(item.ownerName || '').trim(),
            roadTaxExpiry: item.roadTaxExpiry || null,
            insuranceExpiry: item.insuranceExpiry || null,
            pucExpiry: item.pucExpiry || null,
            fitnessExpiry: item.fitnessExpiry || null,
            permitExpiry: item.permitExpiry || null,
            rcDocument: item.rcDocument || null,
            remarks: item.remarks || null,
          }))
        : [];
      setVehicleProfiles(loadedVehicles);
      setVehicleStats({
        totalVehicles: loadedVehicles.length,
        expiringAlerts: loadedVehicles.filter((vehicle) => {
          const now = new Date();
          return ['roadTaxExpiry', 'insuranceExpiry', 'pucExpiry', 'fitnessExpiry', 'permitExpiry'].some((key) => {
            const value = vehicle[key as keyof VehicleProfile] as string | null | undefined;
            if (!value) return false;
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return false;
            const diffDays = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays <= 30;
          });
        }).length,
      });
    } catch (error) {
      console.error('Error loading vehicle profiles:', error);
    } finally {
      setVehicleLoading(false);
    }
  };

  const loadDriverProfiles = async () => {
    setDriverProfileLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return;
      const response = await fetch('/api/driver-profiles', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const data = await response.json();
      const loadedDrivers: DriverProfile[] = Array.isArray(data)
        ? data.map((item: any) => ({
            id: String(item.id),
            driverName: String(item.driverName || '').trim(),
            mobileNumber: String(item.mobileNumber || '').trim(),
            assignedVehicleNumber: item.assignedVehicleNumber || null,
            address: item.address || null,
            aadhaarNumber: item.aadhaarNumber || null,
            licenseNumber: item.licenseNumber || null,
            joiningDate: item.joiningDate || null,
            remarks: item.remarks || null,
            driverPhoto: item.driverPhoto || null,
            aadhaarPhoto: item.aadhaarPhoto || null,
            licensePhoto: item.licensePhoto || null,
          }))
        : [];
      setDriverProfiles(loadedDrivers);
      setDriverStats({
        totalDrivers: loadedDrivers.length,
        assignedDrivers: loadedDrivers.filter((dp) => dp.assignedVehicleNumber && dp.assignedVehicleNumber.trim().length > 0).length,
      });
    } catch (error) {
      console.error('Error loading driver profiles:', error);
    } finally {
      setDriverProfileLoading(false);
    }
  };

  const compileLedger = () => {
    const filtered = challans.filter((item) => {
      const date = new Date(item.date);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear());
      return month === reportMonth && year === reportYear;
    });

    setReportResults(filtered);
    setReportSummary(calculateStats(filtered));
    setReportCompiled(true);
  };

  const handleChallanFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormToast(null);

    const form = event.currentTarget;
    const challanNo = (form.querySelector('#form-challan-no') as HTMLInputElement | null)?.value.trim() || '';
    const dealerName = (form.querySelector('#form-dealer-name') as HTMLInputElement | null)?.value.trim() || '';
    const vehicleNumber = (form.querySelector('#form-challan-vehicle') as HTMLSelectElement | null)?.value.trim() || '';
    const driverName = (form.querySelector('#form-challan-driver') as HTMLSelectElement | null)?.value.trim() || '';
    const date = (form.querySelector('#form-challan-date') as HTMLInputElement | null)?.value || '';
    const riceBags = Number((form.querySelector('#form-rice-bags') as HTMLInputElement | null)?.value || 0);
    const wheatBags = Number((form.querySelector('#form-wheat-bags') as HTMLInputElement | null)?.value || 0);
    const ratePerBag = 10;

    if (!challanNo || !dealerName || !date) {
      setFormToast('Challan number, dealer name, and date are required.');
      return;
    }

    const body = {
      challanNo,
      dealerName,
      vehicleNumber,
      driverName,
      date,
      riceBags,
      wheatBags,
      ratePerBag,
    };

    try {
      const token = getAuthToken();
      if (!token) {
        logout();
        return;
      }

      const response = await fetch('/api/challans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          return;
        }
        const errorData = await response.json().catch(() => null);
        const message = errorData?.error || 'Unable to save record. Please try again.';
        setFormToast(message);
        return;
      }

      const created = await response.json();
      const newChallan: Challan = {
        id: String(created.id),
        challanNo: created.challanNo || challanNo,
        dealerName: created.dealerName || dealerName,
        vehicleNumber: created.vehicleNumber || vehicleNumber,
        driverName: created.driverName || driverName,
        date: created.date || date,
        riceBags: Number(created.riceBags ?? riceBags),
        wheatBags: Number(created.wheatBags ?? wheatBags),
        totalBags: Number(created.totalBags ?? riceBags + wheatBags),
        ratePerBag: Number(created.ratePerBag ?? ratePerBag),
        calculatedAmount: Number(created.calculatedAmount ?? ((riceBags + wheatBags) * ratePerBag)),
      };

      setChallans((current) => {
        const next = [newChallan, ...current];
        setDashboardStats(calculateStats(next));
        return next;
      });
      setFormToast('Challan saved successfully.');
      form.reset();
      setDefaultChallanDate();
      updateFormTotals();
    } catch (error) {
      console.error('Error submitting challan:', error);
      setFormToast('Unable to save challan. Please try again later.');
    }
  };

  const handleVehicleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const vehicleNumber = (form.querySelector('#form-vehicle-number') as HTMLInputElement | null)?.value.trim() || '';
    const vehicleType = (form.querySelector('#form-vehicle-type') as HTMLInputElement | null)?.value.trim() || '';
    const ownerName = (form.querySelector('#form-vehicle-owner') as HTMLInputElement | null)?.value.trim() || '';
    const roadTaxExpiry = (form.querySelector('#form-roadtax-expiry') as HTMLInputElement | null)?.value || null;
    const insuranceExpiry = (form.querySelector('#form-insurance-expiry') as HTMLInputElement | null)?.value || null;
    const pucExpiry = (form.querySelector('#form-puc-expiry') as HTMLInputElement | null)?.value || null;
    const fitnessExpiry = (form.querySelector('#form-fitness-expiry') as HTMLInputElement | null)?.value || null;
    const permitExpiry = (form.querySelector('#form-permit-expiry') as HTMLInputElement | null)?.value || null;
    const remarks = (form.querySelector('#form-vehicle-remarks') as HTMLInputElement | null)?.value.trim() || null;

    if (!vehicleNumber || !vehicleType || !ownerName) {
      setFormToast('Vehicle number, type, and owner name are required.');
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        logout();
        return;
      }

      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vehicleNumber, vehicleType, ownerName, roadTaxExpiry, insuranceExpiry, pucExpiry, fitnessExpiry, permitExpiry, remarks }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setFormToast(errorData?.error || 'Unable to save vehicle profile.');
        return;
      }

      await loadVehicleOptions();
      await loadVehicleProfiles();
      setFormToast('Vehicle profile saved successfully.');
      form.reset();
    } catch (error) {
      console.error('Error submitting vehicle profile:', error);
      setFormToast('Unable to save vehicle profile. Please try again later.');
    }
  };

  const handleDriverProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const driverName = (form.querySelector('#form-driver-profile-name') as HTMLInputElement | null)?.value.trim() || '';
    const mobileNumber = (form.querySelector('#form-driver-profile-mobile') as HTMLInputElement | null)?.value.trim() || '';
    const assignedVehicleNumber = (form.querySelector('#form-driver-profile-vehicle') as HTMLInputElement | null)?.value.trim() || null;
    const address = (form.querySelector('#form-driver-profile-address') as HTMLInputElement | null)?.value.trim() || null;
    const aadhaarNumber = (form.querySelector('#form-driver-profile-aadhaar') as HTMLInputElement | null)?.value.trim() || null;
    const licenseNumber = (form.querySelector('#form-driver-profile-license') as HTMLInputElement | null)?.value.trim() || null;
    const joiningDate = (form.querySelector('#form-driver-profile-joining') as HTMLInputElement | null)?.value || null;
    const remarks = (form.querySelector('#form-driver-profile-remarks') as HTMLInputElement | null)?.value.trim() || null;

    if (!driverName || !mobileNumber) {
      setFormToast('Driver name and mobile number are required.');
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        logout();
        return;
      }

      const response = await fetch('/api/driver-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ driverName, mobileNumber, assignedVehicleNumber, address, aadhaarNumber, licenseNumber, joiningDate, remarks }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setFormToast(errorData?.error || 'Unable to save driver profile.');
        return;
      }

      await loadDriverProfiles();
      setFormToast('Driver profile saved successfully.');
      form.reset();
    } catch (error) {
      console.error('Error submitting driver profile:', error);
      setFormToast('Unable to save driver profile. Please try again later.');
    }
  };

  useEffect(() => {
    setDefaultChallanDate();
    if (typeof window !== 'undefined') {
      const today = new Date();
      setReportMonth(String(today.getMonth() + 1).padStart(2, '0'));
      setReportYear(String(today.getFullYear()));
    }
    loadVehicleOptions();
    loadVehicleProfiles();
    loadDriverProfiles();
    loadChallans();
  }, []);

  useEffect(() => {
    if (reportCompiled) {
      compileLedger();
    }
  }, [challans]);

  const closeQrScanner = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScannerStream(null);
    setQrScannerOpen(false);
    setQrScannerError(null);
  };

  const scanFrame = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const BarcodeDetectorClass = (window as any).BarcodeDetector;
    if (!BarcodeDetectorClass) {
      setQrScannerError('QR scanning is not supported in this browser. Please paste the QR code manually.');
      return;
    }

    try {
      if (!barcodeDetectorRef.current) {
        barcodeDetectorRef.current = new BarcodeDetectorClass({ formats: ['qr_code'] });
      }
      const barcodes = await barcodeDetectorRef.current.detect(video);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        const qrValue = barcodes[0].rawValue.trim();
        const parsed = parseQrPayload(qrValue);

        if (parsed) {
          const challanNoInput = document.getElementById('form-challan-no') as HTMLInputElement | null;
          const dealerNameInput = document.getElementById('form-dealer-name') as HTMLInputElement | null;
          const vehicleInput = document.getElementById('form-challan-vehicle') as HTMLSelectElement | null;
          const driverInput = document.getElementById('form-challan-driver') as HTMLSelectElement | null;
          const dateInput = document.getElementById('form-challan-date') as HTMLInputElement | null;
          const riceBagsInput = document.getElementById('form-rice-bags') as HTMLInputElement | null;
          const wheatBagsInput = document.getElementById('form-wheat-bags') as HTMLInputElement | null;

          if (parsed.challanNo && challanNoInput) challanNoInput.value = parsed.challanNo;
          if (parsed.dealerName && dealerNameInput) dealerNameInput.value = parsed.dealerName;
          if (parsed.date && dateInput) dateInput.value = parsed.date;
          if (parsed.vehicleNumber && vehicleInput) vehicleInput.value = parsed.vehicleNumber;
          if (parsed.driverName && driverInput) driverInput.value = parsed.driverName;
          if (parsed.riceBags !== undefined && riceBagsInput) riceBagsInput.value = String(parsed.riceBags);
          if (parsed.wheatBags !== undefined && wheatBagsInput) wheatBagsInput.value = String(parsed.wheatBags);

          updateFormTotals();
        }

        closeQrScanner();
        return;
      }
    } catch (scanError) {
      console.error('QR scan error:', scanError);
      setQrScannerError('Unable to read QR code. Please try again or paste the QR code manually.');
      return;
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const openQrScanner = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setQrScannerError('Camera access is unavailable in this browser. Please use a supported browser.');
      return;
    }

    setQrScannerError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setScannerStream(stream);
      setQrScannerOpen(true);
    } catch (err) {
      console.error('QR camera error:', err);
      setQrScannerError('Unable to access the camera. Please allow camera access in your browser settings.');
      setScannerStream(null);
      setQrScannerOpen(false);
    }
  };

  useEffect(() => {
    if (qrScannerOpen && scannerStream && videoRef.current) {
      videoRef.current.srcObject = scannerStream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current
        .play()
        .then(() => {
          scanFrame();
        })
        .catch((err) => {
          console.error('QR video play error:', err);
          setQrScannerError('Unable to start the camera preview. Please refresh or try another browser.');
        });
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (scannerStream) {
        scannerStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [qrScannerOpen, scannerStream]);

  const renderHeaderTitle = () => {
    switch (activeTab) {
      case 'vehicle':
        return 'Vehicle Profiles';
      case 'driver-profile':
        return 'Driver Profiles';
      case 'driver':
        return 'Driver Section';
      case 'mechanic':
        return 'Mechanic Logs';
      case 'diesel':
        return 'Diesel Tracker';
      default:
        return 'Challan System';
    }
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard | Choudhary Transport</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossOrigin="anonymous" />
      </Head>
      <div className="dash-layout">
        <aside className={`dash-sidebar${sidebarOpen ? ' active' : ''}`}>
          <div className="sidebar-brand">
            <Link href="/" className="logo" onClick={() => setSidebarOpen(false)}>
              <span className="logo-icon"><i className="fa-solid fa-truck-fast" /></span>
              <span className="logo-text">CHOUDHARY<span className="accent-text">PORTAL</span></span>
            </Link>
          </div>
          <div className="user-profile-sub">
            <div className="avatar"><i className="fa-solid fa-user-tie" /></div>
            <div className="user-info">
              <h4 id="user-full-name">Administrator</h4>
              <span id="user-role-badge">Administrator</span>
            </div>
          </div>
          <nav className="sidebar-menu">
            <button type="button" className={`menu-item${activeTab === 'challan' ? ' active' : ''}`} onClick={() => switchTab('challan')}>
              <i className="fa-solid fa-file-invoice" /> Challan Module
            </button>
            <button type="button" className={`menu-item${activeTab === 'vehicle' ? ' active' : ''}`} onClick={() => switchTab('vehicle')}>
              <i className="fa-solid fa-truck" /> Vehicle Profiles
            </button>
            <button type="button" className={`menu-item${activeTab === 'driver-profile' ? ' active' : ''}`} onClick={() => switchTab('driver-profile')}>
              <i className="fa-solid fa-id-card-clip" /> Driver Profiles
            </button>
            <button type="button" className={`menu-item${activeTab === 'driver' ? ' active' : ''}`} onClick={() => switchTab('driver')}>
              <i className="fa-solid fa-id-card" /> Driver Section
            </button>
            <button type="button" className={`menu-item${activeTab === 'mechanic' ? ' active' : ''}`} onClick={() => switchTab('mechanic')}>
              <i className="fa-solid fa-screwdriver-wrench" /> Mechanic Logs
            </button>
            <button type="button" className={`menu-item${activeTab === 'diesel' ? ' active' : ''}`} onClick={() => switchTab('diesel')}>
              <i className="fa-solid fa-gas-pump" /> Diesel Tracker
            </button>
          </nav>
          <div className="sidebar-footer">
            <button type="button" className="btn btn-secondary btn-block btn-sm" onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>
              <i className="fa-solid fa-right-from-bracket" /> Log Out
            </button>
          </div>
        </aside>
        <div className="dash-content-area">
          <div className={sidebarOpen ? 'dashboard-overlay active' : 'dashboard-overlay'} onClick={() => setSidebarOpen(false)} />
          <header className="dash-header">
            <div className="header-left">
              <button type="button" className="sidebar-toggle-btn" onClick={() => setSidebarOpen((prev) => !prev)}>
                <i className="fa-solid fa-bars" />
                <span className="sidebar-toggle-text">Menu</span>
              </button>
              <h2 className="workspace-title">{renderHeaderTitle()}</h2>
            </div>
          </header>
          <main className="dash-main-scroll">
            <section className={activeTab === 'challan' ? 'dash-tab-pane active' : 'dash-tab-pane'}>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Total Challans</span>
                      <h3 id="stat-total-challans">{dashboardStats.totalChallans}</h3>
                    </div>
                    <div className="card-icon blue-bg"><i className="fa-solid fa-file-lines" /></div>
                  </div>
                  <div className="card-footer-desc">Cumulative Records</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Rice Bags</span>
                      <h3 id="stat-rice-bags">{dashboardStats.riceBags}</h3>
                    </div>
                    <div className="card-icon orange-bg"><i className="fa-solid fa-bowl-rice" /></div>
                  </div>
                  <div className="card-footer-desc">This Month</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Wheat Bags</span>
                      <h3 id="stat-wheat-bags">{dashboardStats.wheatBags}</h3>
                    </div>
                    <div className="card-icon blue-bg"><i className="fa-solid fa-wheat-awn" /></div>
                  </div>
                  <div className="card-footer-desc">This Month</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Total Bags</span>
                      <h3 id="stat-total-bags">{dashboardStats.totalBags}</h3>
                    </div>
                    <div className="card-icon green-bg"><i className="fa-solid fa-boxes-stacked" /></div>
                  </div>
                  <div className="card-footer-desc">This Month</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Total Amount</span>
                      <h3 id="stat-total-amount">₹ {dashboardStats.totalAmount.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="card-icon green-bg"><i className="fa-solid fa-indian-rupee-sign" /></div>
                  </div>
                  <div className="card-footer-desc">This Month (₹10/Bag)</div>
                </div>
              </div>

              <div className="workspace-grid">
                <div className="workspace-table-panel">
                  <div className="panel-header">
                    <h3>Live Challan Database</h3>
                    <div className="filter-row">
                      <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input
                          type="text"
                          id="challan-search"
                          value={challanSearch}
                          onChange={(e) => setChallanSearch(e.target.value)}
                          placeholder="Search Dealer / Challan No..."
                        />
                      </div>
                      <div className="month-filter">
                        <select
                          id="challan-month-filter"
                          value={challanMonthFilter}
                          onChange={(e) => setChallanMonthFilter(e.target.value)}
                        >
                          <option value="all">All Months</option>
                          <option value="01">January</option>
                          <option value="02">February</option>
                          <option value="03">March</option>
                          <option value="04">April</option>
                          <option value="05">May</option>
                          <option value="06">June</option>
                          <option value="07">July</option>
                          <option value="08">August</option>
                          <option value="09">September</option>
                          <option value="10">October</option>
                          <option value="11">November</option>
                          <option value="12">December</option>
                        </select>
                      </div>
                      <div className="month-filter">
                        <select
                          id="challan-vehicle-filter"
                          value={challanVehicleFilter}
                          onChange={(e) => setChallanVehicleFilter(e.target.value)}
                        >
                          <option value="all">All Vehicles</option>
                          {vehicleOptions.map((vehicle) => (
                            <option key={vehicle} value={vehicle}>{vehicle}</option>
                          ))}
                        </select>
                      </div>
                      <div className="month-filter">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={exportChallansCsv}>
                          <i className="fa-solid fa-file-csv" /> Export CSV
                        </button>
                      </div>
                    </div>
                  </div>

                  <div id="challan-table-loader" className={challanLoading ? 'table-spinner' : 'table-spinner hidden'}>
                    <i className="fa-solid fa-circle-notch fa-spin" /> Retrieving Records...
                  </div>

                  <div className="table-responsive">
                    <table className="dash-table" id="challans-data-table">
                      <thead>
                        <tr>
                          <th>Challan No.</th>
                          <th>Dealer Name</th>
                          <th>Vehicle Number</th>
                          <th>Driver Name</th>
                          <th>Date</th>
                          <th className="text-right">Rice Bags</th>
                          <th className="text-right">Wheat Bags</th>
                          <th className="text-right">Total Bags</th>
                          <th className="text-right">Rate</th>
                          <th className="text-right">Amount</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody id="challan-table-rows">
                        {filteredChallans.map((c) => (
                          <tr key={c.id} id={`row-${c.id}`}>
                            <td className="font-bold text-white">{c.challanNo}</td>
                            <td>{c.dealerName}</td>
                            <td>{c.vehicleNumber || '-'}</td>
                            <td>{c.driverName || '-'}</td>
                            <td>{formatDate(c.date)}</td>
                            <td className="text-right">{c.riceBags.toLocaleString()}</td>
                            <td className="text-right">{c.wheatBags.toLocaleString()}</td>
                            <td className="text-right font-bold text-white">{c.totalBags.toLocaleString()}</td>
                            <td className="text-right">₹ {c.ratePerBag}</td>
                            <td className="text-right font-bold text-white">₹ {c.calculatedAmount.toLocaleString('en-IN')}</td>
                            <td className="text-center">
                              <div className="actions-cell">
                                <button type="button" className="btn-icon view-btn" title="View Bill"><i className="fa-solid fa-eye"></i></button>
                                <button type="button" className="btn-icon edit-btn" title="Edit Log"><i className="fa-solid fa-pen-to-square"></i></button>
                                <button type="button" className="btn-icon delete-btn" title="Delete Log"><i className="fa-solid fa-trash-can"></i></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className={`table-empty-state${!challanLoading && challans.length === 0 ? '' : ' hidden'}`} id="challan-table-empty">
                    <i className="fa-solid fa-receipt" />
                    <p>No challan records found matching your filters.</p>
                  </div>
                </div>

                <div className="workspace-form-panel">
                  <div className="form-card">
                    <h3 id="form-panel-title"><i className="fa-solid fa-folder-plus" /> Add New Challan Entry</h3>
                    <p className="form-panel-subtitle">Create a cargo consignment log. Amount is calculated automatically.</p>
                    <div className={`form-feedback-toast${formToast ? '' : ' hidden'}`} id="form-toast">
                      {formToast}
                    </div>
                    <form id="challan-entry-form" onSubmit={handleChallanFormSubmit}>
                      <input type="hidden" id="form-challan-id" value="" />

                      <div className="input-group">
                        <label htmlFor="form-challan-no">Challan Number</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-hashtag" />
                          <input type="text" id="form-challan-no" required placeholder="e.g. CH-2026-90" />
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-dealer-name">Dealer / Trader Name</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-building-flag" />
                          <input type="text" id="form-dealer-name" required placeholder="e.g. Krishna Grain Agencies" />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-challan-vehicle">Vehicle Number</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-truck" />
                            <select id="form-challan-vehicle" defaultValue="">
                              <option value="">Select vehicle number</option>
                              {vehicleOptions.map((vehicle) => (
                                <option key={vehicle} value={vehicle}>{vehicle}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-challan-driver">Driver Name</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-user" />
                            <select id="form-challan-driver" defaultValue="">
                              <option value="">Select driver name</option>
                              {driverOptions.map((driver) => (
                                <option key={driver} value={driver}>{driver}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-challan-date">Challan Date</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-calendar" />
                            <input type="date" id="form-challan-date" required />
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-rice-bags">Rice Bags Qty</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-bowl-rice" />
                            <input type="number" id="form-rice-bags" required defaultValue={0} min={0} onInput={updateFormTotals} />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-wheat-bags">Wheat Bags Qty</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-wheat-awn" />
                            <input type="number" id="form-wheat-bags" required defaultValue={0} min={0} onInput={updateFormTotals} />
                          </div>
                        </div>
                      </div>

                      <div className="form-row calculations-highlight">
                        <div className="calc-box">
                          <span className="calc-label">Total Bags</span>
                          <span className="calc-val" id="form-total-bags-display">0</span>
                        </div>
                      </div>

                      <div className="form-actions-row">
                        <button type="button" className="btn btn-secondary" onClick={openQrScanner}>
                          <i className="fa-solid fa-camera" /> Scan QR Code
                        </button>
                        <button type="submit" className="btn btn-primary" id="btn-form-submit">
                          <i className="fa-solid fa-circle-check" /> Save Record
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="report-section-panel">
                <div className="panel-header">
                  <h3><i className="fa-solid fa-chart-pie" /> Monthly Consolidated Ledger Reports</h3>
                  <p>Filter challans and review aggregate bags weight, rates, and cash collections.</p>
                </div>

                <div className="report-filter-bar">
                  <div className="r-filters">
                    <div className="input-group-inline">
                      <label htmlFor="report-select-month">Select Month</label>
                      <select id="report-select-month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}>
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                    <div className="input-group-inline">
                      <label htmlFor="report-select-year">Select Year</label>
                      <select id="report-select-year" value={reportYear} onChange={(e) => setReportYear(e.target.value)}>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                        <option value="2028">2028</option>
                      </select>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={compileLedger}>
                      <i className="fa-solid fa-filter" /> Compile Ledger
                    </button>
                  </div>

                  <div className="r-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => {}}>
                      <i className="fa-solid fa-file-csv" /> Export CSV
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                      <i className="fa-solid fa-print" /> Print Report
                    </button>
                  </div>
                </div>

                {reportCompiled ? (
                  <div className="report-results-grid" id="report-results-container">
                    <div className="report-summary-stats">
                      <div className="r-stat">
                        <span className="r-label">Total Challans</span>
                        <span className="r-val" id="report-total-challans">{reportSummary.totalChallans}</span>
                      </div>
                      <div className="r-stat">
                        <span className="r-label">Total Rice Bags</span>
                        <span className="r-val" id="report-rice-total">{reportSummary.riceBags}</span>
                      </div>
                      <div className="r-stat">
                        <span className="r-label">Total Wheat Bags</span>
                        <span className="r-val" id="report-wheat-total">{reportSummary.wheatBags}</span>
                      </div>
                      <div className="r-stat">
                        <span className="r-label">Total Bags</span>
                        <span className="r-val" id="report-total-bags">{reportSummary.totalBags}</span>
                      </div>
                      <div className="r-stat">
                        <span className="r-label">Total Amount</span>
                        <span className="r-val" id="report-total-amount">₹ {reportSummary.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="table-responsive">
                      <table className="dash-table min-table">
                        <thead>
                          <tr>
                            <th>Challan No.</th>
                            <th>Date</th>
                            <th>Rice Bags</th>
                            <th>Wheat Bags</th>
                            <th>Total Bags</th>
                            <th className="text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody id="report-table-rows">
                          {reportResults.map((item) => (
                            <tr key={item.id}>
                              <td>{item.challanNo}</td>
                              <td>{formatDate(item.date)}</td>
                              <td>{item.riceBags.toLocaleString()}</td>
                              <td>{item.wheatBags.toLocaleString()}</td>
                              <td>{item.totalBags.toLocaleString()}</td>
                              <td className="text-right">₹ {item.calculatedAmount.toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="report-empty-state" id="report-empty-container">
                    <i className="fa-solid fa-calculator" />
                    <p>Select Month and Year above and click "Compile Ledger" to review monthly totals.</p>
                  </div>
                )}
              </div>
            </section>
            <section className={activeTab === 'vehicle' ? 'dash-tab-pane active' : 'dash-tab-pane'}>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Registered Vehicles</span>
                      <h3>{vehicleStats.totalVehicles}</h3>
                    </div>
                    <div className="card-icon blue-bg"><i className="fa-solid fa-truck" /></div>
                  </div>
                  <div className="card-footer-desc">Active Fleet Profiles</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Expiring Documents</span>
                      <h3>{vehicleStats.expiringAlerts}</h3>
                    </div>
                    <div className="card-icon orange-bg"><i className="fa-solid fa-triangle-exclamation" /></div>
                  </div>
                  <div className="card-footer-desc">Expiring in 30 days</div>
                </div>
              </div>

              <div className="workspace-grid">
                <div className="workspace-table-panel">
                  <div className="panel-header">
                    <h3>Vehicle Profile Registry</h3>
                    <div className="filter-row">
                      <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input
                          type="text"
                          value={vehicleSearch}
                          onChange={(e) => setVehicleSearch(e.target.value)}
                          placeholder="Search Vehicle / Owner / Type..."
                        />
                      </div>
                      <div className="month-filter">
                        <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value as 'all' | 'expiring')}>
                          <option value="all">All Vehicles</option>
                          <option value="expiring">Expiring Soon</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {vehicleLoading ? (
                    <div className="table-spinner">
                      <i className="fa-solid fa-circle-notch fa-spin" /> Retrieving vehicle profiles...
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>Vehicle Number</th>
                            <th>Type</th>
                            <th>Owner</th>
                            <th>Road Tax</th>
                            <th>Insurance</th>
                            <th>PUC</th>
                            <th>Fitness</th>
                            <th>Permit</th>
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVehicleProfiles.map((vehicle) => (
                            <tr key={vehicle.id}>
                              <td>{vehicle.vehicleNumber}</td>
                              <td>{vehicle.vehicleType}</td>
                              <td>{vehicle.ownerName}</td>
                              <td>{vehicle.roadTaxExpiry || '-'}</td>
                              <td>{vehicle.insuranceExpiry || '-'}</td>
                              <td>{vehicle.pucExpiry || '-'}</td>
                              <td>{vehicle.fitnessExpiry || '-'}</td>
                              <td>{vehicle.permitExpiry || '-'}</td>
                              <td className="text-center">
                                <div className="actions-cell">
                                  <button type="button" className="btn-icon view-btn" title="View"><i className="fa-solid fa-eye" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className={`table-empty-state${!vehicleLoading && filteredVehicleProfiles.length === 0 ? '' : ' hidden'}`}>
                    <i className="fa-solid fa-truck-field" />
                    <p>No vehicle profiles found matching your filters.</p>
                  </div>
                </div>

                <div className="workspace-form-panel">
                  <div className="form-card">
                    <h3><i className="fa-solid fa-truck" /> Add Vehicle Profile</h3>
                    <p className="form-panel-subtitle">Register a vehicle and maintain expiry reminders for transport compliance.</p>
                    <div className={`form-feedback-toast${formToast ? '' : ' hidden'}`}>
                      {formToast}
                    </div>

                    <form onSubmit={handleVehicleProfileSubmit}>
                      <div className="input-group">
                        <label htmlFor="form-vehicle-number">Vehicle Number</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-hashtag" />
                          <input type="text" id="form-vehicle-number" required placeholder="e.g. RJ-14-GD-8921" />
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-vehicle-type">Vehicle Type</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-car-side" />
                          <input type="text" id="form-vehicle-type" required placeholder="e.g. Tractor Trailer" />
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-vehicle-owner">Owner Name</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-user" />
                          <input type="text" id="form-vehicle-owner" required placeholder="e.g. Krishna Transport" />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-roadtax-expiry">Road Tax Expiry</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-calendar-days" />
                            <input type="date" id="form-roadtax-expiry" />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-insurance-expiry">Insurance Expiry</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-shield" />
                            <input type="date" id="form-insurance-expiry" />
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-puc-expiry">PUC Expiry</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-leaf" />
                            <input type="date" id="form-puc-expiry" />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-fitness-expiry">Fitness Expiry</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-cogs" />
                            <input type="date" id="form-fitness-expiry" />
                          </div>
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-permit-expiry">Permit Expiry</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-file-signature" />
                          <input type="date" id="form-permit-expiry" />
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-vehicle-remarks">Remarks</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-comment-dots" />
                          <input type="text" id="form-vehicle-remarks" placeholder="e.g. Inter-state permit valid" />
                        </div>
                      </div>

                      <div className="form-actions-row">
                        <button type="submit" className="btn btn-primary">
                          <i className="fa-solid fa-circle-check" /> Save Vehicle
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => setFormToast(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </section>
            <section className={activeTab === 'driver-profile' ? 'dash-tab-pane active' : 'dash-tab-pane'}>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Driver Records</span>
                      <h3>{driverStats.totalDrivers}</h3>
                    </div>
                    <div className="card-icon blue-bg"><i className="fa-solid fa-id-card-clip" /></div>
                  </div>
                  <div className="card-footer-desc">Driver profile count</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Assigned Drivers</span>
                      <h3>{driverStats.assignedDrivers}</h3>
                    </div>
                    <div className="card-icon green-bg"><i className="fa-solid fa-user-check" /></div>
                  </div>
                  <div className="card-footer-desc">Drivers with vehicles</div>
                </div>
              </div>

              <div className="workspace-grid">
                <div className="workspace-table-panel">
                  <div className="panel-header">
                    <h3>Driver Profile Ledger</h3>
                    <div className="filter-row">
                      <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input
                          type="text"
                          value={driverProfileSearch}
                          onChange={(e) => setDriverProfileSearch(e.target.value)}
                          placeholder="Search Driver / Mobile / Vehicle..."
                        />
                      </div>
                    </div>
                  </div>

                  {driverProfileLoading ? (
                    <div className="table-spinner">
                      <i className="fa-solid fa-circle-notch fa-spin" /> Retrieving driver profiles...
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>Driver Name</th>
                            <th>Mobile</th>
                            <th>Vehicle</th>
                            <th>License</th>
                            <th>Joining</th>
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDriverProfiles.map((driver) => (
                            <tr key={driver.id}>
                              <td>{driver.driverName}</td>
                              <td>{driver.mobileNumber}</td>
                              <td>{driver.assignedVehicleNumber || '-'}</td>
                              <td>{driver.licenseNumber || '-'}</td>
                              <td>{driver.joiningDate || '-'}</td>
                              <td className="text-center">
                                <div className="actions-cell">
                                  <button type="button" className="btn-icon view-btn" title="View"><i className="fa-solid fa-eye" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className={`table-empty-state${!driverProfileLoading && filteredDriverProfiles.length === 0 ? '' : ' hidden'}`}>
                    <i className="fa-solid fa-id-card" />
                    <p>No driver profiles found matching your search.</p>
                  </div>
                </div>

                <div className="workspace-form-panel">
                  <div className="form-card">
                    <h3><i className="fa-solid fa-id-card-clip" /> Add Driver Profile</h3>
                    <p className="form-panel-subtitle">Record a new driver profile to assign vehicles and maintain compliance.</p>
                    <div className={`form-feedback-toast${formToast ? '' : ' hidden'}`}>
                      {formToast}
                    </div>

                    <form onSubmit={handleDriverProfileSubmit}>
                      <div className="input-group">
                        <label htmlFor="form-driver-profile-name">Driver Name</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-user" />
                          <input type="text" id="form-driver-profile-name" required placeholder="e.g. Ram Singh Choudhary" />
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-driver-profile-mobile">Mobile Number</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-phone" />
                          <input type="tel" id="form-driver-profile-mobile" required placeholder="e.g. 9876543210" pattern="[0-9]{10}" />
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-driver-profile-vehicle">Assigned Vehicle</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-truck" />
                          <input list="driver-vehicle-options" type="text" id="form-driver-profile-vehicle" placeholder="Select or type vehicle number" />
                          <datalist id="driver-vehicle-options">
                            {vehicleOptions.map((vehicle) => (
                              <option key={vehicle} value={vehicle} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-driver-profile-address">Address</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-location-dot" />
                          <input type="text" id="form-driver-profile-address" placeholder="e.g. Sikar, Rajasthan" />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-driver-profile-aadhaar">Aadhaar Number</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-id-card" />
                            <input type="text" id="form-driver-profile-aadhaar" placeholder="XXXX-XXXX-XXXX" />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-driver-profile-license">License Number</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-id-badge" />
                            <input type="text" id="form-driver-profile-license" placeholder="e.g. RJ14XXXXXX" />
                          </div>
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-driver-profile-joining">Joining Date</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-calendar" />
                          <input type="date" id="form-driver-profile-joining" />
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-driver-profile-remarks">Remarks</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-comment-dots" />
                          <input type="text" id="form-driver-profile-remarks" placeholder="e.g. Experienced long-haul driver" />
                        </div>
                      </div>

                      <div className="form-actions-row">
                        <button type="submit" className="btn btn-primary">
                          <i className="fa-solid fa-circle-check" /> Save Driver
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => setFormToast(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </section>
            <section className={activeTab === 'driver' ? 'dash-tab-pane active' : 'dash-tab-pane'}>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Driver Transactions</span>
                      <h3 id="stat-driver-transactions">0</h3>
                    </div>
                    <div className="card-icon blue-bg"><i className="fa-solid fa-file-lines" /></div>
                  </div>
                  <div className="card-footer-desc">Cumulative Records</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Advances (This Month)</span>
                      <h3 id="stat-driver-advances-this-month">₹ 0</h3>
                    </div>
                    <div className="card-icon green-bg"><i className="fa-solid fa-hand-holding-dollar" /></div>
                  </div>
                  <div className="card-footer-desc">Given to Drivers</div>
                </div>
              </div>

              <div className="workspace-grid">
                <div className="workspace-table-panel">
                  <div className="panel-header">
                    <h3>Live Driver Ledger Database</h3>
                    <div className="filter-row">
                      <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input type="text" id="driver-search" placeholder="Search Driver / Vehicle..." />
                      </div>
                      <div className="month-filter">
                        <select id="driver-month-filter" defaultValue="all">
                          <option value="all">All Months</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div id="driver-table-loader" className="table-spinner">
                    <i className="fa-solid fa-circle-notch fa-spin" /> Retrieving Records...
                  </div>

                  <div className="table-responsive">
                    <table className="dash-table" id="driver-data-table">
                      <thead>
                        <tr>
                          <th>Driver Name</th>
                          <th>Mobile Number</th>
                          <th>Vehicle Number</th>
                          <th className="text-right">Amount Given</th>
                          <th>Date</th>
                          <th>Payment Type</th>
                          <th>Remarks</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody id="driver-table-rows"></tbody>
                    </table>
                  </div>

                  <div className="table-empty-state hidden" id="driver-table-empty">
                    <i className="fa-solid fa-id-card" />
                    <p>No driver payment records found matching your filters.</p>
                  </div>
                </div>

                <div className="workspace-form-panel">
                  <div className="form-card">
                    <h3 id="driver-form-panel-title"><i className="fa-solid fa-user-plus" /> Add Driver Advance</h3>
                    <p className="form-panel-subtitle">Record payment or advance given to carrier driver. Date defaults to today.</p>
                    <div className="form-feedback-toast hidden" id="driver-form-toast"></div>

                    <form id="driver-entry-form" onSubmit={(e) => e.preventDefault()}>
                      <input type="hidden" id="form-driver-id" value="" />
                      <div className="input-group">
                        <label htmlFor="form-driver-name">Driver Name</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-user" />
                          <input type="text" id="form-driver-name" required placeholder="e.g. Ram Singh Choudhary" />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-driver-mobile">Mobile Number</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-phone" />
                            <input type="tel" id="form-driver-mobile" required placeholder="e.g. 9876543210" pattern="[0-9]{10}" />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-driver-vehicle">Vehicle Number</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-truck" />
                            <input type="text" id="form-driver-vehicle" required placeholder="e.g. RJ-14-GD-8921" />
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-driver-amount">Amount Given / Advance</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-indian-rupee-sign" />
                            <input type="number" id="form-driver-amount" required placeholder="e.g. 5000" min={1} />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-driver-date">Payment Date</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-calendar" />
                            <input type="date" id="form-driver-date" required />
                          </div>
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-driver-type">Payment Type</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-credit-card" />
                          <select id="form-driver-type" required defaultValue="Cash">
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank">Bank Transfer</option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-driver-remarks">Remarks</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-comment-dots" />
                          <input type="text" id="form-driver-remarks" placeholder="e.g. Advance for highway tolls" />
                        </div>
                      </div>

                      <div className="form-actions-row">
                        <button type="submit" className="btn btn-primary" id="btn-driver-form-submit">
                          <i className="fa-solid fa-circle-check" /> Save Record
                        </button>
                        <button type="button" className="btn btn-secondary" id="btn-driver-form-cancel" onClick={() => {}}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="report-section-panel">
                <div className="panel-header">
                  <h3><i className="fa-solid fa-chart-pie" /> Monthly Driver Ledger Compilation</h3>
                  <p>Filter logs and compile totals given to drivers during selected duration.</p>
                </div>

                <div className="report-filter-bar">
                  <div className="r-filters">
                    <div className="input-group-inline">
                      <label htmlFor="driver-report-month">Select Month</label>
                      <select id="driver-report-month" defaultValue="06">
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                    <div className="input-group-inline">
                      <label htmlFor="driver-report-year">Select Year</label>
                      <select id="driver-report-year" defaultValue="2026">
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => {}}>
                      <i className="fa-solid fa-arrows-rotate" /> Compile Ledger
                    </button>
                  </div>

                  <div className="r-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => {}}>
                      <i className="fa-solid fa-file-csv" /> Export to CSV
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                      <i className="fa-solid fa-print" /> Print Report
                    </button>
                  </div>
                </div>

                <div className="report-results-grid hidden" id="driver-report-results-container">
                  <div className="report-summary-stats">
                    <div className="r-stat">
                      <span className="r-label">Compiled Month</span>
                      <span className="r-val" id="driver-rep-display-month">June 2026</span>
                    </div>
                    <div className="r-stat">
                      <span className="r-label">Total Amount Paid</span>
                      <span className="r-val green-text" id="driver-rep-total-amount">₹ 0</span>
                    </div>
                    <div className="r-stat">
                      <span className="r-label">Unique Drivers Paid</span>
                      <span className="r-val" id="driver-rep-unique-drivers">0</span>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="dash-table min-table">
                      <thead>
                        <tr>
                          <th>Driver Name</th>
                          <th>Mobile Number</th>
                          <th>Vehicle Number</th>
                          <th className="text-right">Total Advance Given</th>
                          <th className="text-right">Transaction Count</th>
                        </tr>
                      </thead>
                      <tbody id="driver-report-table-rows"></tbody>
                    </table>
                  </div>
                </div>

                <div className="report-empty-state" id="driver-report-empty-container">
                  <i className="fa-solid fa-calculator" />
                  <p>Select Month and Year above and click "Compile Ledger" to review driver payments.</p>
                </div>
              </div>
            </section>
            <section className={activeTab === 'mechanic' ? 'dash-tab-pane active' : 'dash-tab-pane'}>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Services Logged</span>
                      <h3 id="stat-mechanic-invoices-count">0</h3>
                    </div>
                    <div className="card-icon blue-bg"><i className="fa-solid fa-file-lines" /></div>
                  </div>
                  <div className="card-footer-desc">Cumulative Records</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Expense (This Month)</span>
                      <h3 id="stat-mechanic-cost-this-month">₹ 0</h3>
                    </div>
                    <div className="card-icon green-bg"><i className="fa-solid fa-screwdriver-wrench" /></div>
                  </div>
                  <div className="card-footer-desc">Workshop Maintenance</div>
                </div>
              </div>

              <div className="workspace-grid">
                <div className="workspace-table-panel">
                  <div className="panel-header">
                    <h3>Live Fleet Maintenance Database</h3>
                    <div className="filter-row">
                      <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input type="text" id="mechanic-search" placeholder="Search Mechanic / Vehicle..." />
                      </div>
                      <div className="month-filter">
                        <select id="mechanic-month-filter" defaultValue="all">
                          <option value="all">All Months</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div id="mechanic-table-loader" className="table-spinner">
                    <i className="fa-solid fa-circle-notch fa-spin" /> Retrieving Records...
                  </div>

                  <div className="table-responsive">
                    <table className="dash-table" id="mechanic-data-table">
                      <thead>
                        <tr>
                          <th>Mechanic Name</th>
                          <th>Vehicle Number</th>
                          <th>Work Description</th>
                          <th>Parts Used</th>
                          <th className="text-right">Amount Paid</th>
                          <th>Date</th>
                          <th>Paid By</th>
                          <th>Remarks</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody id="mechanic-table-rows"></tbody>
                    </table>
                  </div>

                  <div className="table-empty-state hidden" id="mechanic-table-empty">
                    <i className="fa-solid fa-wrench" />
                    <p>No mechanic expense records found matching your filters.</p>
                  </div>
                </div>

                <div className="workspace-form-panel">
                  <div className="form-card">
                    <h3 id="mechanic-form-panel-title"><i className="fa-solid fa-screwdriver-wrench" /> Add Workshop Record</h3>
                    <p className="form-panel-subtitle">Create maintenance log for vehicles. Date defaults to today.</p>
                    <div className="form-feedback-toast hidden" id="mechanic-form-toast"></div>

                    <form id="mechanic-entry-form" onSubmit={(e) => e.preventDefault()}>
                      <input type="hidden" id="form-mechanic-id" value="" />
                      <div className="input-group">
                        <label htmlFor="form-mechanic-name">Mechanic Name</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-user-gear" />
                          <input type="text" id="form-mechanic-name" required placeholder="e.g. Jaipur Garage Association" />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-mechanic-vehicle">Vehicle Number</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-truck" />
                            <input type="text" id="form-mechanic-vehicle" required placeholder="e.g. RJ-14-GD-8921" />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-mechanic-amount">Amount Paid</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-indian-rupee-sign" />
                            <input type="number" id="form-mechanic-amount" required placeholder="e.g. 7500" min={1} />
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-mechanic-date">Service Date</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-calendar" />
                            <input type="date" id="form-mechanic-date" required />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-mechanic-paidby">Paid By</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-user-check" />
                            <input type="text" id="form-mechanic-paidby" required placeholder="e.g. Choudhary Admin" />
                          </div>
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-mechanic-work">Work Description</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-hammer" />
                          <input type="text" id="form-mechanic-work" required placeholder="e.g. Gearbox tuning and alignment" />
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-mechanic-parts">Parts Used</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-gears" />
                          <input type="text" id="form-mechanic-parts" placeholder="e.g. Spindle gears, gasket seal" />
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-mechanic-remarks">Remarks</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-comment-dots" />
                          <input type="text" id="form-mechanic-remarks" placeholder="e.g. Routine 50K maintenance" />
                        </div>
                      </div>

                      <div className="form-actions-row">
                        <button type="submit" className="btn btn-primary" id="btn-mechanic-form-submit">
                          <i className="fa-solid fa-circle-check" /> Save Record
                        </button>
                        <button type="button" className="btn btn-secondary" id="btn-mechanic-form-cancel" onClick={() => {}}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="report-section-panel">
                <div className="panel-header">
                  <h3><i className="fa-solid fa-chart-pie" /> Monthly Maintenance Expense Reports</h3>
                  <p>Filter logs and compile totals paid for mechanic repairs during selected duration.</p>
                </div>

                <div className="report-filter-bar">
                  <div className="r-filters">
                    <div className="input-group-inline">
                      <label htmlFor="mechanic-report-month">Select Month</label>
                      <select id="mechanic-report-month" defaultValue="06">
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                    <div className="input-group-inline">
                      <label htmlFor="mechanic-report-year">Select Year</label>
                      <select id="mechanic-report-year" defaultValue="2026">
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => {}}>
                      <i className="fa-solid fa-arrows-rotate" /> Compile Ledger
                    </button>
                  </div>

                  <div className="r-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => {}}>
                      <i className="fa-solid fa-file-csv" /> Export to CSV
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                      <i className="fa-solid fa-print" /> Print Report
                    </button>
                  </div>
                </div>

                <div className="report-results-grid hidden" id="mechanic-report-results-container">
                  <div className="report-summary-stats">
                    <div className="r-stat">
                      <span className="r-label">Compiled Month</span>
                      <span className="r-val" id="mechanic-rep-display-month">June 2026</span>
                    </div>
                    <div className="r-stat">
                      <span className="r-label">Total Expense</span>
                      <span className="r-val green-text" id="mechanic-rep-total-amount">₹ 0</span>
                    </div>
                    <div className="r-stat">
                      <span className="r-label">Services Logged</span>
                      <span className="r-val" id="mechanic-rep-total-tasks">0</span>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="dash-table min-table">
                      <thead>
                        <tr>
                          <th>Mechanic Name</th>
                          <th>Vehicle Number</th>
                          <th>Work Description</th>
                          <th>Parts Used</th>
                          <th className="text-right">Amount Paid</th>
                          <th>Date</th>
                          <th>Paid By</th>
                        </tr>
                      </thead>
                      <tbody id="mechanic-report-table-rows"></tbody>
                    </table>
                  </div>
                </div>

                <div className="report-empty-state" id="mechanic-report-empty-container">
                  <i className="fa-solid fa-calculator" />
                  <p>Select Month and Year above and click "Compile Ledger" to review workshop expenses.</p>
                </div>
              </div>
            </section>
            <section className={activeTab === 'diesel' ? 'dash-tab-pane active' : 'dash-tab-pane'}>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Total Liters (This Month)</span>
                      <h3 id="stat-diesel-liters-this-month">0 L</h3>
                    </div>
                    <div className="card-icon blue-bg"><i className="fa-solid fa-droplet" /></div>
                  </div>
                  <div className="card-footer-desc">Volume Given to Fleet</div>
                </div>
                <div className="stat-card">
                  <div className="card-inner">
                    <div>
                      <span className="card-title">Diesel Cost (This Month)</span>
                      <h3 id="stat-diesel-cost-this-month">₹ 0</h3>
                    </div>
                    <div className="card-icon green-bg"><i className="fa-solid fa-indian-rupee-sign" /></div>
                  </div>
                  <div className="card-footer-desc">Fuel Cost Expenditures</div>
                </div>
              </div>

              <div className="workspace-grid">
                <div className="workspace-table-panel">
                  <div className="panel-header">
                    <h3>Live Diesel Tracker Database</h3>
                    <div className="filter-row">
                      <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input type="text" id="diesel-search" placeholder="Search Driver / Vehicle..." onInput={() => {}} />
                      </div>
                      <div className="month-filter">
                        <select id="diesel-month-filter" onChange={() => {}} defaultValue="all">
                          <option value="all">All Months</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div id="diesel-table-loader" className="table-spinner">
                    <i className="fa-solid fa-circle-notch fa-spin" /> Retrieving Records...
                  </div>

                  <div className="table-responsive">
                    <table className="dash-table" id="diesel-data-table">
                      <thead>
                        <tr>
                          <th>Driver Name</th>
                          <th>Vehicle Number</th>
                          <th className="text-right">Quantity (L)</th>
                          <th className="text-right">Rate / L</th>
                          <th className="text-right">Total Amount</th>
                          <th>Date</th>
                          <th>Given By</th>
                          <th>Remarks</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody id="diesel-table-rows"></tbody>
                    </table>
                  </div>

                  <div className="table-empty-state hidden" id="diesel-table-empty">
                    <i className="fa-solid fa-gas-pump" />
                    <p>No diesel log records found matching your filters.</p>
                  </div>
                </div>

                <div className="workspace-form-panel">
                  <div className="form-card">
                    <h3 id="diesel-form-panel-title"><i className="fa-solid fa-gas-pump" /> Add Diesel Log</h3>
                    <p className="form-panel-subtitle">Record fuel billing. Total diesel amount is calculated automatically.</p>
                    <div className="form-feedback-toast hidden" id="diesel-form-toast" />

                    <form id="diesel-entry-form" onSubmit={(e) => e.preventDefault()}>
                      <input type="hidden" id="form-diesel-id" value="" />
                      <div className="input-group">
                        <label htmlFor="form-diesel-driver">Driver Name</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-user" />
                          <input type="text" id="form-diesel-driver" required placeholder="e.g. Ram Singh Choudhary" />
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-diesel-vehicle">Vehicle Number</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-truck" />
                          <input type="text" id="form-diesel-vehicle" required placeholder="e.g. RJ-14-GD-8921" />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-diesel-quantity">Diesel Quantity (Liters)</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-droplet" />
                            <input type="number" id="form-diesel-quantity" required placeholder="e.g. 150" min="1" step="0.01" onInput={() => {}} />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-diesel-rate">Diesel Rate (per Liter)</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-tag" />
                            <input type="number" id="form-diesel-rate" required placeholder="e.g. 90" min="1" step="0.01" onInput={() => {}} />
                          </div>
                        </div>
                      </div>

                      <div className="form-row calculations-highlight">
                        <div className="calc-box">
                          <span className="calc-label">Total Diesel Amount</span>
                          <span className="calc-val accent-val" id="form-diesel-amount-display">₹ 0</span>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="input-group">
                          <label htmlFor="form-diesel-date">Filling Date</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-calendar" />
                            <input type="date" id="form-diesel-date" required />
                          </div>
                        </div>
                        <div className="input-group">
                          <label htmlFor="form-diesel-givenby">Given By</label>
                          <div className="input-with-icon">
                            <i className="fa-solid fa-user-check" />
                            <input type="text" id="form-diesel-givenby" required placeholder="e.g. Choudhary Admin" />
                          </div>
                        </div>
                      </div>

                      <div className="input-group">
                        <label htmlFor="form-diesel-remarks">Remarks</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-comment-dots" />
                          <input type="text" id="form-diesel-remarks" placeholder="e.g. Tank refill VKI Station" />
                        </div>
                      </div>

                      <div className="form-actions-row">
                        <button type="submit" className="btn btn-primary" id="btn-diesel-form-submit">
                          <i className="fa-solid fa-circle-check" /> Save Record
                        </button>
                        <button type="button" className="btn btn-secondary" id="btn-diesel-form-cancel" onClick={() => {}}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="report-section-panel">
                <div className="panel-header">
                  <h3><i className="fa-solid fa-chart-pie" /> Monthly Driver-wise Diesel Ledger Reports</h3>
                  <p>Filter fuel logs and review driver-wise consumption totals during selected month.</p>
                </div>

                <div className="report-filter-bar">
                  <div className="r-filters">
                    <div className="input-group-inline">
                      <label htmlFor="diesel-report-month">Select Month</label>
                      <select id="diesel-report-month" defaultValue="06">
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                    </div>
                    <div className="input-group-inline">
                      <label htmlFor="diesel-report-year">Select Year</label>
                      <select id="diesel-report-year" defaultValue="2026">
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => {}}>
                      <i className="fa-solid fa-arrows-rotate" /> Compile Ledger
                    </button>
                  </div>

                  <div className="r-actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => {}}>
                      <i className="fa-solid fa-file-csv" /> Export to CSV
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                      <i className="fa-solid fa-print" /> Print Report
                    </button>
                  </div>
                </div>

                <div className="report-results-grid hidden" id="diesel-report-results-container">
                  <div className="report-summary-stats">
                    <div className="r-stat">
                      <span className="r-label">Compiled Month</span>
                      <span className="r-val" id="diesel-rep-display-month">June 2026</span>
                    </div>
                    <div className="r-stat">
                      <span className="r-label">Total Liters Filled</span>
                      <span className="r-val text-white" id="diesel-rep-total-liters">0 L</span>
                    </div>
                    <div className="r-stat">
                      <span className="r-label">Grand Total Cost</span>
                      <span className="r-val green-text" id="diesel-rep-total-amount">₹ 0</span>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="dash-table min-table">
                      <thead>
                        <tr>
                          <th>Driver Name</th>
                          <th className="text-right">Total Liters</th>
                          <th className="text-right">Average Rate</th>
                          <th className="text-right">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody id="diesel-report-table-rows"></tbody>
                    </table>
                  </div>
                </div>

                <div className="report-empty-state" id="diesel-report-empty-container">
                  <i className="fa-solid fa-calculator" />
                  <p>Select Month and Year above and click "Compile Ledger" to review diesel reports.</p>
                </div>
              </div>
            </section>
          </main>
          {qrScannerOpen && (
            <div className="modal-overlay active">
              <div className="modal-card">
                <div className="modal-header">
                  <h3><i className="fa-solid fa-qrcode" /> Scan Challan QR</h3>
                  <button type="button" className="modal-close" onClick={closeQrScanner}>&times;</button>
                </div>
                <div className="modal-body">
                  {qrScannerError ? (
                    <div className="scanner-error">{qrScannerError}</div>
                  ) : (
                    <video ref={videoRef} className="scanner-video" autoPlay muted playsInline />
                  )}
                  <div className="scanner-actions">
                    <button type="button" className="btn btn-secondary" onClick={closeQrScanner}>
                      <i className="fa-solid fa-stop" /> Stop Camera
                    </button>
                    <button type="button" className="btn btn-primary" onClick={closeQrScanner}>
                      <i className="fa-solid fa-xmark" /> Cancel
                    </button>
                  </div>
                  <p className="scanner-help">Point your phone camera at the QR code. The scanned text will populate the challan details automatically.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
