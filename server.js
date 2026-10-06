import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// ─────────────────────────────────────────────────────────────
// IN-MEMORY DATA STORE (Shipments, Immutable Audit Logs, Webhooks)
// ─────────────────────────────────────────────────────────────

const AUDIT_TRAIL = [];
const NOTIFICATION_WEBHOOK_LOG = [];

// Standard automated transit hubs (FedEx network style)
export const AUTOMATED_HUBS = [
  { id: 'HUB-MEM', name: 'FedEx World Hub — Memphis, TN (MEM)', lat: 35.0424, lng: -89.9767 },
  { id: 'HUB-IND', name: 'FedEx National Hub — Indianapolis, IN (IND)', lat: 39.7173, lng: -86.2944 },
  { id: 'HUB-EWR', name: 'Newark Regional Hub — Newark, NJ (EWR)', lat: 40.6895, lng: -74.1745 },
  { id: 'HUB-OAK', name: 'West Coast Gateway — Oakland, CA (OAK)', lat: 37.7213, lng: -122.2207 },
  { id: 'HUB-CDG', name: 'European Hub — Paris Charles de Gaulle, FR (CDG)', lat: 49.0097, lng: 2.5479 },
  { id: 'HUB-DXB', name: 'Middle East Hub — Dubai World Central, UAE (DWC)', lat: 24.8960, lng: 55.1614 },
  { id: 'HUB-NRT', name: 'Asia-Pacific Hub — Tokyo Narita, JP (NRT)', lat: 35.7720, lng: 140.3929 },
  { id: 'HUB-LHR', name: 'London Heathrow Gateway — London, UK (LHR)', lat: 51.4700, lng: -0.4543 }
];

const INITIAL_SHIPMENTS = [
  {
    trackingID: 'SHIP-DEMO0001',
    userUID: 'user-demo-01',
    recipientName: 'Sarah Jenkins',
    recipientEmail: 'sarah.jenkins@example.com',
    recipientPhone: '+1 (555) 234-5678',
    origin: 'Memphis, TN, USA',
    destination: 'London Heathrow, United Kingdom',
    weight: '3.8',
    dimensions: '32 × 24 × 18 cm',
    packageType: 'FedEx Priority',
    serviceLevel: 'FedEx International Priority®',
    signatureRequired: true,
    doorTagNumber: 'DT-8829104',
    status: 'In Transit',
    currentLocation: 'North Atlantic Flight Corridor — Flight FX-042',
    currentLat: 48.2100,
    currentLng: -28.4500,
    estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    checkpoints: [
      {
        id: 'cp-1',
        status: 'Picked Up',
        location: 'FedEx Origin Facility — Memphis, TN',
        timestamp: 'Oct 4, 2026, 09:15 AM',
        lat: 35.1495,
        lng: -90.0490,
        entryType: 'SYSTEM_AUTOMATED'
      },
      {
        id: 'cp-2',
        status: 'Arrived at Sort Facility',
        location: 'FedEx World Hub — Memphis, TN (MEM)',
        timestamp: 'Oct 4, 2026, 04:30 PM',
        lat: 35.0424,
        lng: -89.9767,
        entryType: 'SYSTEM_AUTOMATED'
      },
      {
        id: 'cp-3',
        status: 'Departed Hub',
        location: 'Memphis International Airport (MEM)',
        timestamp: 'Oct 5, 2026, 01:20 AM',
        lat: 35.0424,
        lng: -89.9767,
        entryType: 'SYSTEM_AUTOMATED'
      },
      {
        id: 'cp-4',
        status: 'In Transit',
        location: 'North Atlantic Flight Corridor — Flight FX-042',
        timestamp: 'Oct 5, 2026, 08:45 AM',
        lat: 48.2100,
        lng: -28.4500,
        entryType: 'SYSTEM_AUTOMATED'
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    trackingID: 'FDX-77894201',
    userUID: 'user-enterprise-99',
    recipientName: 'David Sterling (Global Aviation Logistics)',
    recipientEmail: 'd.sterling@aviationglobal.co.uk',
    recipientPhone: '+44 20 7946 0912',
    origin: 'Seattle Boeing Field, WA, USA',
    destination: 'Gatwick Cargo Terminal, London, UK',
    weight: '14.5',
    dimensions: '60 × 45 × 35 cm',
    packageType: 'Freight',
    serviceLevel: 'FedEx 1Day® Freight',
    signatureRequired: true,
    doorTagNumber: 'DT-9940123',
    status: 'Sorting at Destination Facility',
    currentLocation: 'Hangar 3, Private Section B, Berth 12',
    currentLat: 51.1537,
    currentLng: -0.1821,
    estimatedDelivery: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    checkpoints: [
      {
        id: 'cp-f1',
        status: 'Picked Up',
        location: 'Boeing Field Cargo Ramp — Seattle, WA',
        timestamp: 'Oct 3, 2026, 11:00 AM',
        lat: 47.5300,
        lng: -122.3020,
        entryType: 'SYSTEM_AUTOMATED'
      },
      {
        id: 'cp-f2',
        status: 'In Transit',
        location: 'Transatlantic Heavy Cargo Route FX-902',
        timestamp: 'Oct 4, 2026, 06:15 PM',
        lat: 53.4000,
        lng: -20.5000,
        entryType: 'SYSTEM_AUTOMATED'
      },
      {
        id: 'cp-f3',
        status: 'Arrived at Destination Airport',
        location: 'London Gatwick Cargo Apron',
        timestamp: 'Oct 5, 2026, 07:10 AM',
        lat: 51.1537,
        lng: -0.1821,
        entryType: 'SYSTEM_AUTOMATED'
      },
      {
        id: 'cp-f4',
        status: 'Sorting at Destination Facility',
        location: 'Hangar 3, Private Section B, Berth 12',
        timestamp: 'Oct 5, 2026, 10:45 AM',
        lat: 51.1537,
        lng: -0.1821,
        entryType: 'MANUAL_INPUT',
        overrideReason: 'Oversized turbine component staged at specialized engineering ramp for customs inspection clearance.'
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    trackingID: 'SHIP-A1B2C3D4',
    userUID: 'user-03',
    recipientName: 'Michael Chen',
    recipientEmail: 'mchen.tech@example.com',
    recipientPhone: '+1 (415) 889-1029',
    origin: 'Shenzhen Tech Bay, CN',
    destination: 'San Francisco, CA, USA',
    weight: '2.1',
    dimensions: '25 × 20 × 10 cm',
    packageType: 'Parcel',
    serviceLevel: 'FedEx International Express®',
    signatureRequired: false,
    doorTagNumber: 'DT-3129845',
    status: 'Out for Delivery',
    currentLocation: 'San Francisco Metro Delivery Hub — Van 42',
    currentLat: 37.7749,
    currentLng: -122.4194,
    estimatedDelivery: new Date().toISOString().split('T')[0],
    checkpoints: [
      {
        id: 'cp-c1',
        status: 'Departed Facility',
        location: 'Shenzhen Airport Logistics Center',
        timestamp: 'Oct 2, 2026, 10:00 AM',
        lat: 22.6393,
        lng: 113.8107,
        entryType: 'SYSTEM_AUTOMATED'
      },
      {
        id: 'cp-c2',
        status: 'Customs Cleared',
        location: 'San Francisco International Airport (SFO)',
        timestamp: 'Oct 4, 2026, 03:20 AM',
        lat: 37.6213,
        lng: -122.3790,
        entryType: 'SYSTEM_AUTOMATED'
      },
      {
        id: 'cp-c3',
        status: 'Out for Delivery',
        location: 'San Francisco Metro Delivery Hub — Van 42',
        timestamp: 'Oct 5, 2026, 07:45 AM',
        lat: 37.7749,
        lng: -122.4194,
        entryType: 'SYSTEM_AUTOMATED'
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const SHIPMENTS_MAP = new Map();
INITIAL_SHIPMENTS.forEach(s => SHIPMENTS_MAP.set(s.trackingID, s));

// Seed initial audit log for demonstration
AUDIT_TRAIL.push({
  id: 'audit-seed-001',
  timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
  tracking_number: 'FDX-77894201',
  action_type: 'MANUAL_LOCATION_OVERRIDE',
  admin_user_id: 'nimissolomon@gmail.com',
  old_location_string: 'London Gatwick Cargo Apron',
  new_location_string: 'Hangar 3, Private Section B, Berth 12',
  override_reason: 'Oversized turbine component staged at specialized engineering ramp for customs inspection clearance.',
  coordinates: { latitude: 51.1537, longitude: -0.1821 },
  previous_status: 'In Transit',
  updated_status: 'Sorting at Destination Facility',
  webhook_dispatched: true,
  client_ip: '127.0.0.1'
});

// ─────────────────────────────────────────────────────────────
// 1. API ENDPOINT DESIGN: MANUAL LOCATION OVERRIDE
// ─────────────────────────────────────────────────────────────
/**
 * PATCH /api/shipments/:trackingNumber/location-override
 *
 * Request Payload:
 * {
 *   "is_manual_override": true,
 *   "location_string": "Grid Section C, Berth 4",
 *   "override_reason": "Package too large for standard automated sorting bins; moved to heavy freight berth.",
 *   "admin_user_id": "nimissolomon@gmail.com",
 *   "coordinates": {
 *     "latitude": 51.1537,
 *     "longitude": -0.1821
 *   },
 *   "override_status": "Sorting at Destination Facility" // optional, defaults to 'Sorting at Destination Facility'
 * }
 *
 * Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Manual location override applied and broadcast successfully.",
 *   "audit_id": "audit-abc-123",
 *   "tracking_number": "SHIP-DEMO0001",
 *   "updated_shipment": { ... },
 *   "webhook_event": { ... }
 * }
 */
const handleLocationOverride = (req, res) => {
  const { trackingNumber } = req.params;
  const {
    is_manual_override = true,
    location_string,
    override_reason,
    admin_user_id,
    coordinates,
    override_status = 'Sorting at Destination Facility'
  } = req.body;

  // ── Validation: Malicious & Empty String Prevention ──
  if (!trackingNumber || typeof trackingNumber !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Valid trackingNumber parameter is required.'
    });
  }

  const cleanTrackingID = trackingNumber.trim().toUpperCase();
  const shipment = SHIPMENTS_MAP.get(cleanTrackingID);

  if (!shipment) {
    return res.status(404).json({
      success: false,
      error: 'SHIPMENT_NOT_FOUND',
      message: `Shipment with tracking ID '${cleanTrackingID}' does not exist.`
    });
  }

  // Location string validation
  if (!location_string || typeof location_string !== 'string' || location_string.trim().length === 0) {
    return res.status(422).json({
      success: false,
      error: 'INVALID_LOCATION_STRING',
      message: 'Location string cannot be empty, whitespace-only, or non-string.'
    });
  }

  const cleanLocation = location_string.trim();
  if (cleanLocation.length > 150) {
    return res.status(422).json({
      success: false,
      error: 'LOCATION_STRING_EXCEEDS_LIMIT',
      message: `Location string exceeds the maximum allowed length of 150 characters (received ${cleanLocation.length}).`
    });
  }

  // Override reason justification validation
  if (!override_reason || typeof override_reason !== 'string' || override_reason.trim().length < 5) {
    return res.status(422).json({
      success: false,
      error: 'JUSTIFICATION_REQUIRED',
      message: 'A detailed justification reason (minimum 5 characters) is mandatory for manual location overrides.'
    });
  }

  // Admin user identifier validation
  if (!admin_user_id || typeof admin_user_id !== 'string') {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED_ADMIN',
      message: 'A valid admin_user_id must be supplied for audit attribution.'
    });
  }

  // Optional Coordinates validation
  let validCoords = null;
  if (coordinates && typeof coordinates === 'object') {
    const lat = parseFloat(coordinates.latitude);
    const lng = parseFloat(coordinates.longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      validCoords = { latitude: lat, longitude: lng };
    }
  }

  const oldLocation = shipment.currentLocation || shipment.origin || 'Unknown Initial Location';
  const oldStatus = shipment.status;
  const newStatus = override_status || 'Sorting at Destination Facility';
  const nowISO = new Date().toISOString();
  const readableTime = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // ── TRIGGER 1: State Mutation ──
  shipment.status = newStatus;
  shipment.currentLocation = cleanLocation;
  if (validCoords) {
    shipment.currentLat = validCoords.latitude;
    shipment.currentLng = validCoords.longitude;
  }
  shipment.updatedAt = nowISO;

  const newCheckpoint = {
    id: `cp-${Date.now()}`,
    status: newStatus,
    location: cleanLocation,
    timestamp: readableTime,
    lat: validCoords ? validCoords.latitude : shipment.currentLat,
    lng: validCoords ? validCoords.longitude : shipment.currentLng,
    entryType: is_manual_override ? 'MANUAL_INPUT' : 'SYSTEM_AUTOMATED',
    overrideReason: override_reason.trim()
  };

  shipment.checkpoints.push(newCheckpoint);

  // ── TRIGGER 2: Immutable Audit Trail ──
  const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const auditRecord = Object.freeze({
    id: auditId,
    timestamp: nowISO,
    tracking_number: cleanTrackingID,
    action_type: 'MANUAL_LOCATION_OVERRIDE',
    admin_user_id: admin_user_id.trim(),
    old_location_string: oldLocation,
    new_location_string: cleanLocation,
    override_reason: override_reason.trim(),
    coordinates: validCoords,
    previous_status: oldStatus,
    updated_status: newStatus,
    entry_type: is_manual_override ? 'MANUAL_INPUT' : 'SYSTEM_AUTOMATED',
    client_ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    webhook_dispatched: true
  });
  AUDIT_TRAIL.unshift(auditRecord);

  // ── TRIGGER 3: Notification Webhook Payload Broadcast ──
  const webhookEventId = `wh-evt-${Date.now()}`;
  const webhookPayload = {
    event_id: webhookEventId,
    event_type: 'shipment.manual_location_override.broadcast',
    created_at: nowISO,
    data: {
      tracking_number: cleanTrackingID,
      recipient_name: shipment.recipientName,
      recipient_email: shipment.recipientEmail,
      recipient_phone: shipment.recipientPhone || '+1 (555) 019-2831',
      previous_location: oldLocation,
      current_location: cleanLocation,
      current_status: newStatus,
      justification_note: override_reason.trim(),
      coordinates: validCoords,
      channels: {
        sms: {
          dispatched: true,
          message: `FedEx / SwiftTrack Alert: Package ${cleanTrackingID} has arrived locally at [${cleanLocation}]. Status: ${newStatus}.`
        },
        email: {
          dispatched: true,
          subject: `Shipment Staging Update: ${cleanTrackingID} arrived at ${cleanLocation}`
        },
        whatsapp: {
          dispatched: true,
          status: 'SENT'
        }
      }
    }
  };
  NOTIFICATION_WEBHOOK_LOG.unshift(webhookPayload);

  // Return clean structured RESTful response
  return res.status(200).json({
    success: true,
    message: 'Manual location override applied, audit log recorded, and recipient broadcast dispatched.',
    audit_id: auditId,
    tracking_number: cleanTrackingID,
    updated_location: cleanLocation,
    status: newStatus,
    updated_shipment: shipment,
    webhook_event: webhookPayload
  });
};

app.patch('/api/shipments/:trackingNumber/location-override', handleLocationOverride);
app.post('/api/shipments/:trackingNumber/location-override', handleLocationOverride);

// ─────────────────────────────────────────────────────────────
// ADDITIONAL REST API ENDPOINTS
// ─────────────────────────────────────────────────────────────

// List all shipments
app.get('/api/shipments', (req, res) => {
  res.json({
    success: true,
    total: SHIPMENTS_MAP.size,
    shipments: Array.from(SHIPMENTS_MAP.values())
  });
});

// Get single shipment
app.get('/api/shipments/:trackingNumber', (req, res) => {
  const id = req.params.trackingNumber.trim().toUpperCase();
  const shipment = SHIPMENTS_MAP.get(id);
  if (!shipment) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Shipment not found' });
  }
  res.json({ success: true, shipment });
});

// Create new shipment
app.post('/api/shipments', (req, res) => {
  const s = req.body;
  if (!s.trackingID) {
    return res.status(400).json({ success: false, error: 'trackingID is required' });
  }
  const tid = s.trackingID.trim().toUpperCase();
  const created = {
    ...s,
    trackingID: tid,
    status: s.status || 'Pending',
    checkpoints: s.checkpoints || [
      {
        id: `cp-${Date.now()}`,
        status: s.status || 'Pending',
        location: s.origin || 'Origin Terminal',
        timestamp: new Date().toLocaleString(),
        lat: s.currentLat || 40.7128,
        lng: s.currentLng || -74.0060,
        entryType: 'SYSTEM_AUTOMATED'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  SHIPMENTS_MAP.set(tid, created);
  res.status(201).json({ success: true, shipment: created });
});

// Get automated hub presets
app.get('/api/automated-hubs', (req, res) => {
  res.json({ success: true, hubs: AUTOMATED_HUBS });
});

// Get Immutable Audit Logs
app.get('/api/audit-logs', (req, res) => {
  const { tracking_number } = req.query;
  let logs = AUDIT_TRAIL;
  if (tracking_number) {
    const q = tracking_number.trim().toUpperCase();
    logs = logs.filter(l => l.tracking_number === q);
  }
  res.json({
    success: true,
    total: logs.length,
    audit_logs: logs
  });
});

// Get Webhook Broadcast Notifications
app.get('/api/webhook-logs', (req, res) => {
  res.json({
    success: true,
    total: NOTIFICATION_WEBHOOK_LOG.length,
    webhook_logs: NOTIFICATION_WEBHOOK_LOG
  });
});

// FedEx-Style Rate & Transit Calculator API
app.post('/api/rates/calculate', (req, res) => {
  const { originZip, destZip, weight = 1, packageType = 'Parcel' } = req.body;
  const wt = parseFloat(weight) || 1;
  const baseRate = wt * 4.5;

  const quotes = [
    {
      service: 'FedEx First Overnight®',
      description: 'Next business day by 8:00 AM to most areas',
      transitTime: 'Next day 8:00 AM',
      rate: (baseRate * 2.8 + 45.0).toFixed(2),
      currency: 'USD',
      guaranteed: true
    },
    {
      service: 'FedEx Priority Overnight®',
      description: 'Next business day by 10:30 AM to most businesses',
      transitTime: 'Next day 10:30 AM',
      rate: (baseRate * 2.1 + 32.5).toFixed(2),
      currency: 'USD',
      guaranteed: true
    },
    {
      service: 'FedEx 2Day®',
      description: 'Second business day by 4:30 PM to most areas',
      transitTime: '2 Business Days',
      rate: (baseRate * 1.4 + 18.2).toFixed(2),
      currency: 'USD',
      guaranteed: true
    },
    {
      service: 'FedEx Ground®',
      description: 'Day-definite delivery in 1–5 business days',
      transitTime: '1–4 Business Days',
      rate: (baseRate * 0.9 + 11.5).toFixed(2),
      currency: 'USD',
      guaranteed: false
    },
    {
      service: 'FedEx International Priority®',
      description: 'Time-definite delivery across 220+ countries',
      transitTime: '1–3 Business Days',
      rate: (baseRate * 3.5 + 68.0).toFixed(2),
      currency: 'USD',
      guaranteed: true
    }
  ];

  res.json({ success: true, originZip, destZip, quotes });
});

// ─────────────────────────────────────────────────────────────
// SPA FALLBACK ROUTE
// ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start listening if not in Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SwiftTrack enterprise server listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;
