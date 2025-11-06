export interface Delivery {
  id: string;
  senderId: string;
  senderName: string;
  driverId?: string;
  driverName?: string;
  pickup: {
    address: string;
    coordinates: [number, number];
  };
  dropoff: {
    address: string;
    coordinates: [number, number];
  };
  to?: {
    name?: string;
    phone?: string;
  };
  package: {
    description?: string;
    fragile?: boolean;
    amount?: number;
    type?:
      | "document"
      | "electronics"
      | "clothing"
      | "food"
      | "furniture"
      | "other";
  };
  status:
    | "pending"
    | "scheduled"
    | "accepted"
    | "arrived"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "failed"
    | "cancelled"
    | "expired";
  fare: number;
  distance_km: number;
  duration_mins: number;
  vehicle: "bike" | "cab" | "van" | "truck";
  payment_status: "unpaid" | "paid";
  payment_method: "cash" | "card" | "wallet";
  driver_earnings: number;
  commission: number;
  scheduled: boolean;
  scheduled_time: Date | null;
  cancelled?: {
    by?: "sender" | "driver";
    reason?: string;
  };
  timestamps: {
    accepted_at?: Date;
    picked_up_at?: Date;
    delivered_at?: Date;
    cancelled_at?: Date;
  };
  createdAt: Date;
}

export const deliveriesData: Delivery[] = [
  {
    id: "D001",
    senderId: "1",
    senderName: "John Doe",
    driverId: "D001",
    driverName: "Michael Chen",
    pickup: {
      address: "123 Main St, Downtown",
      coordinates: [6.5244, 3.3792],
    },
    dropoff: {
      address: "456 Oak Ave, Uptown",
      coordinates: [6.5355, 3.3947],
    },
    to: {
      name: "Sarah Johnson",
      phone: "+1 234 567 8900",
    },
    package: {
      description: "Electronics - Laptop",
      fragile: true,
      amount: 150000,
      type: "electronics",
    },
    status: "delivered",
    vehicle: "bike",
    fare: 1500,
    distance_km: 5.2,
    duration_mins: 20,
    payment_status: "paid",
    payment_method: "wallet",
    driver_earnings: 1275,
    commission: 225,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T08:15:00"),
      picked_up_at: new Date("2024-11-06T08:30:00"),
      delivered_at: new Date("2024-11-06T08:50:00"),
    },
    createdAt: new Date("2024-11-06T08:10:00"),
  },
  {
    id: "D002",
    senderId: "4",
    senderName: "Sarah Williams",
    driverId: "D003",
    driverName: "David Johnson",
    pickup: {
      address: "789 Park Lane, City Center",
      coordinates: [6.5164, 3.3895],
    },
    dropoff: {
      address: "321 Beach Road, Coastal Area",
      coordinates: [6.4281, 3.4219],
    },
    to: {
      name: "Robert Brown",
      phone: "+1 234 567 8901",
    },
    package: {
      description: "Documents - Legal papers",
      fragile: false,
      type: "document",
    },
    status: "in_transit",
    vehicle: "bike",
    fare: 2200,
    distance_km: 12.5,
    duration_mins: 35,
    payment_status: "unpaid",
    payment_method: "cash",
    driver_earnings: 1870,
    commission: 330,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T09:00:00"),
      picked_up_at: new Date("2024-11-06T09:15:00"),
    },
    createdAt: new Date("2024-11-06T08:55:00"),
  },
  {
    id: "D003",
    senderId: "6",
    senderName: "Emily Davis",
    status: "pending",
    pickup: {
      address: "555 Market St, Shopping District",
      coordinates: [6.542, 3.3515],
    },
    dropoff: {
      address: "777 Business Plaza, Financial District",
      coordinates: [6.4541, 3.3947],
    },
    to: {
      name: "Michael White",
      phone: "+1 234 567 8902",
    },
    package: {
      description: "Food - Restaurant delivery",
      fragile: false,
      type: "food",
    },
    vehicle: "bike",
    fare: 800,
    distance_km: 3.5,
    duration_mins: 15,
    payment_status: "unpaid",
    payment_method: "wallet",
    driver_earnings: 680,
    commission: 120,
    scheduled: false,
    scheduled_time: null,
    timestamps: {},
    createdAt: new Date("2024-11-06T09:30:00"),
  },
  {
    id: "D004",
    senderId: "12",
    senderName: "Olivia Jackson",
    driverId: "D005",
    driverName: "Robert Martinez",
    pickup: {
      address: "888 River View, Waterfront",
      coordinates: [6.4698, 3.5515],
    },
    dropoff: {
      address: "222 Hill Crest, Highland",
      coordinates: [6.5794, 3.3662],
    },
    to: {
      name: "Amanda Green",
      phone: "+1 234 567 8903",
    },
    package: {
      description: "Clothing - Fashion items",
      fragile: false,
      amount: 25000,
      type: "clothing",
    },
    status: "picked_up",
    vehicle: "cab",
    fare: 1800,
    distance_km: 8.7,
    duration_mins: 25,
    payment_status: "unpaid",
    payment_method: "card",
    driver_earnings: 1530,
    commission: 270,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T09:45:00"),
      picked_up_at: new Date("2024-11-06T09:55:00"),
    },
    createdAt: new Date("2024-11-06T09:40:00"),
  },
  {
    id: "D005",
    senderId: "16",
    senderName: "Isabella Thompson",
    driverId: "D002",
    driverName: "James Wilson",
    pickup: {
      address: "999 Airport Road, Terminal 1",
      coordinates: [6.5774, 3.3213],
    },
    dropoff: {
      address: "111 Hotel Boulevard, Luxury District",
      coordinates: [6.4426, 3.4235],
    },
    to: {
      name: "Christopher Lee",
      phone: "+1 234 567 8904",
    },
    package: {
      description: "Furniture - Office chair",
      fragile: true,
      amount: 75000,
      type: "furniture",
    },
    status: "delivered",
    vehicle: "van",
    fare: 4500,
    distance_km: 18.3,
    duration_mins: 40,
    payment_status: "paid",
    payment_method: "card",
    driver_earnings: 3825,
    commission: 675,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T07:20:00"),
      picked_up_at: new Date("2024-11-06T07:40:00"),
      delivered_at: new Date("2024-11-06T08:20:00"),
    },
    createdAt: new Date("2024-11-06T07:15:00"),
  },
  {
    id: "D006",
    senderId: "9",
    senderName: "Christopher Taylor",
    driverId: "D004",
    driverName: "Thomas Anderson",
    pickup: {
      address: "444 University Ave, Campus",
      coordinates: [6.5167, 3.389],
    },
    dropoff: {
      address: "666 Stadium Road, Sports Complex",
      coordinates: [6.4698, 3.409],
    },
    to: {
      name: "Jessica Miller",
      phone: "+1 234 567 8905",
    },
    package: {
      description: "Electronics - Mobile phone",
      fragile: true,
      amount: 80000,
      type: "electronics",
    },
    status: "cancelled",
    vehicle: "bike",
    fare: 1200,
    distance_km: 4.8,
    duration_mins: 18,
    payment_status: "unpaid",
    payment_method: "cash",
    driver_earnings: 1020,
    commission: 180,
    scheduled: false,
    scheduled_time: null,
    cancelled: {
      by: "sender",
      reason: "Changed delivery address",
    },
    timestamps: {
      accepted_at: new Date("2024-11-06T08:00:00"),
      cancelled_at: new Date("2024-11-06T08:05:00"),
    },
    createdAt: new Date("2024-11-06T07:55:00"),
  },
  {
    id: "D007",
    senderId: "18",
    senderName: "Mia Martinez",
    status: "scheduled",
    pickup: {
      address: "333 Restaurant Row, Dining District",
      coordinates: [6.4398, 3.4269],
    },
    dropoff: {
      address: "777 Conference Center, Business Park",
      coordinates: [6.5167, 3.3789],
    },
    to: {
      name: "Daniel Wilson",
      phone: "+1 234 567 8906",
    },
    package: {
      description: "Food - Catering supplies",
      fragile: false,
      type: "food",
    },
    vehicle: "cab",
    fare: 2500,
    distance_km: 9.2,
    duration_mins: 28,
    payment_status: "unpaid",
    payment_method: "wallet",
    driver_earnings: 2125,
    commission: 375,
    scheduled: true,
    scheduled_time: new Date("2024-11-06T14:00:00"),
    timestamps: {},
    createdAt: new Date("2024-11-06T09:00:00"),
  },
  {
    id: "D008",
    senderId: "19",
    senderName: "Ethan Robinson",
    driverId: "D006",
    driverName: "Christopher Lee",
    pickup: {
      address: "555 Medical Center, Hospital District",
      coordinates: [6.4647, 3.4062],
    },
    dropoff: {
      address: "888 Pharmacy Lane, Healthcare Area",
      coordinates: [6.4725, 3.3925],
    },
    to: {
      name: "Sophia Davis",
      phone: "+1 234 567 8907",
    },
    package: {
      description: "Document - Medical reports",
      fragile: false,
      type: "document",
    },
    status: "accepted",
    vehicle: "bike",
    fare: 600,
    distance_km: 2.5,
    duration_mins: 10,
    payment_status: "unpaid",
    payment_method: "cash",
    driver_earnings: 510,
    commission: 90,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T09:50:00"),
    },
    createdAt: new Date("2024-11-06T09:45:00"),
  },
  {
    id: "D009",
    senderId: "21",
    senderName: "William Rodriguez",
    driverId: "D007",
    driverName: "Daniel Brown",
    pickup: {
      address: "222 Train Station, Transit Hub",
      coordinates: [6.4541, 3.3789],
    },
    dropoff: {
      address: "999 Office Tower, Corporate Plaza",
      coordinates: [6.4281, 3.4175],
    },
    to: {
      name: "Olivia Martinez",
      phone: "+1 234 567 8908",
    },
    package: {
      description: "Other - Gift package",
      fragile: true,
      amount: 15000,
      type: "other",
    },
    status: "delivered",
    vehicle: "bike",
    fare: 1400,
    distance_km: 6.8,
    duration_mins: 22,
    payment_status: "paid",
    payment_method: "wallet",
    driver_earnings: 1190,
    commission: 210,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T06:30:00"),
      picked_up_at: new Date("2024-11-06T06:45:00"),
      delivered_at: new Date("2024-11-06T07:07:00"),
    },
    createdAt: new Date("2024-11-06T06:25:00"),
  },
  {
    id: "D010",
    senderId: "24",
    senderName: "Harper Walker",
    driverId: "D008",
    driverName: "Matthew Taylor",
    pickup: {
      address: "111 Shopping Mall, Retail Zone",
      coordinates: [6.6018, 3.3515],
    },
    dropoff: {
      address: "444 Residence, Suburban Area",
      coordinates: [6.542, 3.3662],
    },
    to: {
      name: "Benjamin Harris",
      phone: "+1 234 567 8909",
    },
    package: {
      description: "Furniture - Small table",
      fragile: false,
      amount: 45000,
      type: "furniture",
    },
    status: "delivered",
    vehicle: "truck",
    fare: 5200,
    distance_km: 15.5,
    duration_mins: 38,
    payment_status: "paid",
    payment_method: "card",
    driver_earnings: 4420,
    commission: 780,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T10:00:00"),
      picked_up_at: new Date("2024-11-06T10:18:00"),
      delivered_at: new Date("2024-11-06T10:56:00"),
    },
    createdAt: new Date("2024-11-06T09:55:00"),
  },
  {
    id: "D011",
    senderId: "2",
    senderName: "Jane Smith",
    status: "expired",
    pickup: {
      address: "777 Park Avenue, Green District",
      coordinates: [6.4541, 3.3515],
    },
    dropoff: {
      address: "333 Library Street, Cultural Quarter",
      coordinates: [6.4647, 3.3662],
    },
    to: {
      name: "Ethan Anderson",
      phone: "+1 234 567 8910",
    },
    package: {
      description: "Document - Library books",
      fragile: false,
      type: "document",
    },
    vehicle: "bike",
    fare: 700,
    distance_km: 2.8,
    duration_mins: 12,
    payment_status: "unpaid",
    payment_method: "wallet",
    driver_earnings: 595,
    commission: 105,
    scheduled: false,
    scheduled_time: null,
    timestamps: {},
    createdAt: new Date("2024-11-06T08:30:00"),
  },
  {
    id: "D012",
    senderId: "7",
    senderName: "Michael Wilson",
    driverId: "D009",
    driverName: "Andrew Garcia",
    pickup: {
      address: "666 Cinema Complex, Entertainment Zone",
      coordinates: [6.5244, 3.4062],
    },
    dropoff: {
      address: "222 Home Street, Residential Area",
      coordinates: [6.542, 3.3789],
    },
    to: {
      name: "Emma Thompson",
      phone: "+1 234 567 8911",
    },
    package: {
      description: "Electronics - Gaming console",
      fragile: true,
      amount: 120000,
      type: "electronics",
    },
    status: "delivered",
    vehicle: "cab",
    fare: 1900,
    distance_km: 7.3,
    duration_mins: 24,
    payment_status: "paid",
    payment_method: "cash",
    driver_earnings: 1615,
    commission: 285,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-05T22:00:00"),
      picked_up_at: new Date("2024-11-05T22:12:00"),
      delivered_at: new Date("2024-11-05T22:36:00"),
    },
    createdAt: new Date("2024-11-05T21:55:00"),
  },
  {
    id: "D013",
    senderId: "13",
    senderName: "Matthew White",
    driverId: "D010",
    driverName: "Joshua Martinez",
    pickup: {
      address: "888 Gym Center, Fitness District",
      coordinates: [6.5774, 3.3947],
    },
    dropoff: {
      address: "444 Smoothie Bar, Health Quarter",
      coordinates: [6.5698, 3.4062],
    },
    to: {
      name: "Ava Wilson",
      phone: "+1 234 567 8912",
    },
    package: {
      description: "Food - Health supplements",
      fragile: false,
      type: "food",
    },
    status: "failed",
    vehicle: "bike",
    fare: 900,
    distance_km: 3.9,
    duration_mins: 15,
    payment_status: "unpaid",
    payment_method: "wallet",
    driver_earnings: 765,
    commission: 135,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T07:00:00"),
      picked_up_at: new Date("2024-11-06T07:10:00"),
    },
    createdAt: new Date("2024-11-06T06:58:00"),
  },
  {
    id: "D014",
    senderId: "22",
    senderName: "Charlotte Lewis",
    driverId: "D011",
    driverName: "William Thompson",
    pickup: {
      address: "555 Museum Road, Arts District",
      coordinates: [6.4426, 3.3789],
    },
    dropoff: {
      address: "999 Gallery Lane, Creative Quarter",
      coordinates: [6.4541, 3.3895],
    },
    to: {
      name: "Liam Brown",
      phone: "+1 234 567 8913",
    },
    package: {
      description: "Other - Art supplies",
      fragile: true,
      amount: 35000,
      type: "other",
    },
    status: "in_transit",
    vehicle: "cab",
    fare: 1600,
    distance_km: 5.5,
    duration_mins: 18,
    payment_status: "unpaid",
    payment_method: "card",
    driver_earnings: 1360,
    commission: 240,
    scheduled: false,
    scheduled_time: null,
    timestamps: {
      accepted_at: new Date("2024-11-06T10:05:00"),
      picked_up_at: new Date("2024-11-06T10:17:00"),
    },
    createdAt: new Date("2024-11-06T10:00:00"),
  },
  {
    id: "D015",
    senderId: "25",
    senderName: "Benjamin Hall",
    status: "pending",
    pickup: {
      address: "333 Tech Hub, Innovation Center",
      coordinates: [6.5167, 3.3662],
    },
    dropoff: {
      address: "777 Startup Lane, Business Incubator",
      coordinates: [6.5244, 3.3789],
    },
    to: {
      name: "Isabella Clark",
      phone: "+1 234 567 8914",
    },
    package: {
      description: "Electronics - Computer accessories",
      fragile: true,
      amount: 55000,
      type: "electronics",
    },
    vehicle: "van",
    fare: 2800,
    distance_km: 6.8,
    duration_mins: 20,
    payment_status: "unpaid",
    payment_method: "wallet",
    driver_earnings: 2380,
    commission: 420,
    scheduled: false,
    scheduled_time: null,
    timestamps: {},
    createdAt: new Date("2024-11-06T10:20:00"),
  },
];
