export interface Ride {
  id: string;
  riderId: string;
  riderName: string;
  driverId?: string;
  driverName?: string;
  pickup: {
    address: string;
    coordinates: [number, number];
  };
  destination: {
    address: string;
    coordinates: [number, number];
  };
  status:
    | "pending"
    | "scheduled"
    | "accepted"
    | "arrived"
    | "ongoing"
    | "completed"
    | "cancelled"
    | "expired";
  vehicle: "cab" | "keke" | "suv";
  fare: number;
  distance_km: number;
  duration_mins: number;
  payment_status: "unpaid" | "paid";
  payment_method: "cash" | "card" | "wallet";
  driver_earnings: number;
  driver_paid: boolean;
  commission: number;
  scheduled: boolean;
  scheduled_time: Date | null;
  cancelled?: {
    by?: "rider" | "driver";
    reason?: string;
  };
  timestamps: {
    accepted_at?: Date;
    arrived_at?: Date;
    started_at?: Date;
    completed_at?: Date;
    cancelled_at?: Date;
  };
  createdAt: Date;
}

export const ridesData: Ride[] = [
  {
    id: "R001",
    riderId: "1",
    riderName: "John Doe",
    driverId: "D001",
    driverName: "Michael Chen",
    pickup: {
      address: "123 Main St, Downtown",
      coordinates: [6.5244, 3.3792],
    },
    destination: {
      address: "456 Oak Ave, Uptown",
      coordinates: [6.5355, 3.3947],
    },
    status: "completed",
    vehicle: "cab",
    fare: 2500,
    distance_km: 8.5,
    duration_mins: 25,
    payment_status: "paid",
    payment_method: "wallet",
    driver_earnings: 2125,
    driver_paid: true,
    commission: 375,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T08:15:00"),
      arrived_at: new Date("2024-11-06T08:25:00"),
      started_at: new Date("2024-11-06T08:27:00"),
      completed_at: new Date("2024-11-06T08:52:00"),
    },
    createdAt: new Date("2024-11-06T08:10:00"),
  },
  {
    id: "R002",
    riderId: "4",
    riderName: "Sarah Williams",
    driverId: "D003",
    driverName: "David Johnson",
    pickup: {
      address: "789 Park Lane, City Center",
      coordinates: [6.5164, 3.3895],
    },
    destination: {
      address: "321 Beach Road, Coastal Area",
      coordinates: [6.4281, 3.4219],
    },
    status: "ongoing",
    vehicle: "suv",
    fare: 4200,
    distance_km: 15.3,
    duration_mins: 35,
    payment_status: "unpaid",
    payment_method: "cash",
    driver_earnings: 3570,
    driver_paid: false,
    commission: 630,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T09:00:00"),
      arrived_at: new Date("2024-11-06T09:12:00"),
      started_at: new Date("2024-11-06T09:15:00"),
    },
    createdAt: new Date("2024-11-06T08:55:00"),
  },
  {
    id: "R003",
    riderId: "6",
    riderName: "Emily Davis",
    status: "pending",
    pickup: {
      address: "555 Market St, Shopping District",
      coordinates: [6.542, 3.3515],
    },
    destination: {
      address: "777 Business Plaza, Financial District",
      coordinates: [6.4541, 3.3947],
    },
    vehicle: "keke",
    fare: 1200,
    distance_km: 4.2,
    duration_mins: 15,
    payment_status: "unpaid",
    payment_method: "wallet",
    driver_earnings: 1020,
    driver_paid: false,
    commission: 180,
    scheduled: false,
    scheduled_time: null,
    timestamps: {},
    createdAt: new Date("2024-11-06T09:30:00"),
  },
  {
    id: "R004",
    riderId: "12",
    riderName: "Olivia Jackson",
    driverId: "D005",
    driverName: "Robert Martinez",
    pickup: {
      address: "888 River View, Waterfront",
      coordinates: [6.4698, 3.5515],
    },
    destination: {
      address: "222 Hill Crest, Highland",
      coordinates: [6.5794, 3.3662],
    },
    status: "accepted",
    vehicle: "cab",
    fare: 3100,
    distance_km: 11.7,
    duration_mins: 28,
    payment_status: "unpaid",
    payment_method: "card",
    driver_earnings: 2635,
    driver_paid: false,
    commission: 465,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T09:45:00"),
    },
    createdAt: new Date("2024-11-06T09:40:00"),
  },
  {
    id: "R005",
    riderId: "16",
    riderName: "Isabella Thompson",
    driverId: "D002",
    driverName: "James Wilson",
    pickup: {
      address: "999 Airport Road, Terminal 1",
      coordinates: [6.5774, 3.3213],
    },
    destination: {
      address: "111 Hotel Boulevard, Luxury District",
      coordinates: [6.4426, 3.4235],
    },
    status: "completed",
    vehicle: "suv",
    fare: 5800,
    distance_km: 22.5,
    duration_mins: 45,
    payment_status: "paid",
    payment_method: "card",
    driver_earnings: 4930,
    driver_paid: true,
    commission: 870,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T07:20:00"),
      arrived_at: new Date("2024-11-06T07:35:00"),
      started_at: new Date("2024-11-06T07:40:00"),
      completed_at: new Date("2024-11-06T08:25:00"),
    },
    createdAt: new Date("2024-11-06T07:15:00"),
  },
  {
    id: "R006",
    riderId: "9",
    riderName: "Christopher Taylor",
    driverId: "D004",
    driverName: "Thomas Anderson",
    pickup: {
      address: "444 University Ave, Campus",
      coordinates: [6.5167, 3.389],
    },
    destination: {
      address: "666 Stadium Road, Sports Complex",
      coordinates: [6.4698, 3.409],
    },
    status: "cancelled",
    vehicle: "keke",
    fare: 1500,
    distance_km: 5.8,
    duration_mins: 18,
    payment_status: "unpaid",
    payment_method: "cash",
    driver_earnings: 1275,
    driver_paid: false,
    commission: 225,
    scheduled: false,
    scheduled_time: null,
    cancelled: {
      by: "rider",
      reason: "Changed my mind",
    },
    timestamps: {
      accepted_at: new Date("2024-11-06T08:00:00"),
      cancelled_at: new Date("2024-11-06T08:05:00"),
    },
    createdAt: new Date("2024-11-06T07:55:00"),
  },
  {
    id: "R007",
    riderId: "18",
    riderName: "Mia Martinez",
    status: "scheduled",
    pickup: {
      address: "333 Restaurant Row, Dining District",
      coordinates: [6.4398, 3.4269],
    },
    destination: {
      address: "777 Conference Center, Business Park",
      coordinates: [6.5167, 3.3789],
    },
    vehicle: "cab",
    fare: 2800,
    distance_km: 9.2,
    duration_mins: 22,
    payment_status: "unpaid",
    payment_method: "wallet",
    driver_earnings: 2380,
    driver_paid: false,
    commission: 420,
    scheduled: true,
    scheduled_time: new Date("2024-11-06T14:00:00"),
    timestamps: {},
    createdAt: new Date("2024-11-06T09:00:00"),
  },
  {
    id: "R008",
    riderId: "19",
    riderName: "Ethan Robinson",
    driverId: "D006",
    driverName: "Christopher Lee",
    pickup: {
      address: "555 Medical Center, Hospital District",
      coordinates: [6.4647, 3.4062],
    },
    destination: {
      address: "888 Pharmacy Lane, Healthcare Area",
      coordinates: [6.4725, 3.3925],
    },
    status: "arrived",
    vehicle: "keke",
    fare: 900,
    distance_km: 2.5,
    duration_mins: 10,
    payment_status: "unpaid",
    payment_method: "cash",
    driver_earnings: 765,
    driver_paid: false,
    commission: 135,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T09:50:00"),
      arrived_at: new Date("2024-11-06T09:58:00"),
    },
    createdAt: new Date("2024-11-06T09:45:00"),
  },
  {
    id: "R009",
    riderId: "21",
    riderName: "William Rodriguez",
    driverId: "D007",
    driverName: "Daniel Brown",
    pickup: {
      address: "222 Train Station, Transit Hub",
      coordinates: [6.4541, 3.3789],
    },
    destination: {
      address: "999 Office Tower, Corporate Plaza",
      coordinates: [6.4281, 3.4175],
    },
    status: "completed",
    vehicle: "cab",
    fare: 3500,
    distance_km: 12.8,
    duration_mins: 30,
    payment_status: "paid",
    payment_method: "wallet",
    driver_earnings: 2975,
    driver_paid: false,
    commission: 525,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T06:30:00"),
      arrived_at: new Date("2024-11-06T06:42:00"),
      started_at: new Date("2024-11-06T06:45:00"),
      completed_at: new Date("2024-11-06T07:15:00"),
    },
    createdAt: new Date("2024-11-06T06:25:00"),
  },
  {
    id: "R010",
    riderId: "24",
    riderName: "Harper Walker",
    driverId: "D008",
    driverName: "Matthew Taylor",
    pickup: {
      address: "111 Shopping Mall, Retail Zone",
      coordinates: [6.6018, 3.3515],
    },
    destination: {
      address: "444 Residence, Suburban Area",
      coordinates: [6.542, 3.3662],
    },
    status: "completed",
    vehicle: "suv",
    fare: 4800,
    distance_km: 16.5,
    duration_mins: 38,
    payment_status: "paid",
    payment_method: "card",
    driver_earnings: 4080,
    driver_paid: true,
    commission: 720,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T10:00:00"),
      arrived_at: new Date("2024-11-06T10:15:00"),
      started_at: new Date("2024-11-06T10:18:00"),
      completed_at: new Date("2024-11-06T10:56:00"),
    },
    createdAt: new Date("2024-11-06T09:55:00"),
  },
  {
    id: "R011",
    riderId: "2",
    riderName: "Jane Smith",
    status: "expired",
    pickup: {
      address: "777 Park Avenue, Green District",
      coordinates: [6.4541, 3.3515],
    },
    destination: {
      address: "333 Library Street, Cultural Quarter",
      coordinates: [6.4647, 3.3662],
    },
    vehicle: "keke",
    fare: 1100,
    distance_km: 3.8,
    duration_mins: 12,
    payment_status: "unpaid",
    payment_method: "wallet",
    driver_earnings: 935,
    driver_paid: false,
    commission: 165,
    scheduled: false,
    scheduled_time: null,
    timestamps: {},
    createdAt: new Date("2024-11-06T08:30:00"),
  },
  {
    id: "R012",
    riderId: "7",
    riderName: "Michael Wilson",
    driverId: "D009",
    driverName: "Andrew Garcia",
    pickup: {
      address: "666 Cinema Complex, Entertainment Zone",
      coordinates: [6.5244, 3.4062],
    },
    destination: {
      address: "222 Home Street, Residential Area",
      coordinates: [6.542, 3.3789],
    },
    status: "completed",
    vehicle: "cab",
    fare: 2200,
    distance_km: 7.3,
    duration_mins: 20,
    payment_status: "paid",
    payment_method: "cash",
    driver_earnings: 1870,
    driver_paid: true,
    commission: 330,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-05T22:00:00"),
      arrived_at: new Date("2024-11-05T22:10:00"),
      started_at: new Date("2024-11-05T22:12:00"),
      completed_at: new Date("2024-11-05T22:32:00"),
    },
    createdAt: new Date("2024-11-05T21:55:00"),
  },
  {
    id: "R013",
    riderId: "13",
    riderName: "Matthew White",
    driverId: "D010",
    driverName: "Joshua Martinez",
    pickup: {
      address: "888 Gym Center, Fitness District",
      coordinates: [6.5774, 3.3947],
    },
    destination: {
      address: "444 Smoothie Bar, Health Quarter",
      coordinates: [6.5698, 3.4062],
    },
    status: "cancelled",
    vehicle: "keke",
    fare: 800,
    distance_km: 1.9,
    duration_mins: 8,
    payment_status: "unpaid",
    payment_method: "wallet",
    driver_earnings: 680,
    driver_paid: false,
    commission: 120,
    scheduled: false,
    scheduled_time: null,
    cancelled: {
      by: "driver",
      reason: "Traffic too heavy",
    },
    timestamps: {
      accepted_at: new Date("2024-11-06T07:00:00"),
      cancelled_at: new Date("2024-11-06T07:08:00"),
    },
    createdAt: new Date("2024-11-06T06:58:00"),
  },
  {
    id: "R014",
    riderId: "22",
    riderName: "Charlotte Lewis",
    driverId: "D011",
    driverName: "William Thompson",
    pickup: {
      address: "555 Museum Road, Arts District",
      coordinates: [6.4426, 3.3789],
    },
    destination: {
      address: "999 Gallery Lane, Creative Quarter",
      coordinates: [6.4541, 3.3895],
    },
    status: "ongoing",
    vehicle: "cab",
    fare: 1800,
    distance_km: 5.5,
    duration_mins: 16,
    payment_status: "unpaid",
    payment_method: "card",
    driver_earnings: 1530,
    driver_paid: false,
    commission: 270,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T10:05:00"),
      arrived_at: new Date("2024-11-06T10:15:00"),
      started_at: new Date("2024-11-06T10:17:00"),
    },
    createdAt: new Date("2024-11-06T10:00:00"),
  },
  {
    id: "R015",
    riderId: "25",
    riderName: "Benjamin Hall",
    status: "pending",
    pickup: {
      address: "333 Tech Hub, Innovation Center",
      coordinates: [6.5167, 3.3662],
    },
    destination: {
      address: "777 Startup Lane, Business Incubator",
      coordinates: [6.5244, 3.3789],
    },
    vehicle: "suv",
    fare: 3200,
    distance_km: 6.8,
    duration_mins: 18,
    payment_status: "unpaid",
    payment_method: "wallet",
    driver_earnings: 2720,
    driver_paid: false,
    commission: 480,
    scheduled: false,
    scheduled_time: null,
    timestamps: {},
    createdAt: new Date("2024-11-06T10:20:00"),
  },
];
