export interface Report {
  _id: string;
  reporter?: {
    _id: string;
    fullname: string;
    avatar: string;
  } | null;
  driver: {
    _id: string;
    fullname: string;
    avatar: string;
  };
  ride?: {
    _id: string;
    pickup: string;
    destination: string;
  } | null;
  category: string;
  description?: string;
  anonymous: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const reportsData: Report[] = [
  {
    _id: "RPT001",
    reporter: {
      _id: "USR001",
      fullname: "John Doe",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    driver: {
      _id: "DRV001",
      fullname: "Michael Smith",
      avatar: "https://i.pravatar.cc/150?img=11",
    },
    ride: {
      _id: "RID001",
      pickup: "123 Main St",
      destination: "456 Oak Ave",
    },
    category: "Reckless Driving",
    description: "Driver was speeding and not following traffic rules.",
    anonymous: false,
    status: "new",
    createdAt: "2024-11-01T08:30:00Z",
    updatedAt: "2024-11-01T08:30:00Z",
  },
  {
    _id: "RPT002",
    reporter: null,
    driver: {
      _id: "DRV002",
      fullname: "Sarah Johnson",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    ride: {
      _id: "RID002",
      pickup: "789 Pine St",
      destination: "321 Elm St",
    },
    category: "Unprofessional Behavior",
    description: "Driver was rude and used inappropriate language.",
    anonymous: true,
    status: "investigating",
    createdAt: "2024-11-02T10:15:00Z",
    updatedAt: "2024-11-03T14:20:00Z",
  },
  {
    _id: "RPT003",
    reporter: {
      _id: "USR003",
      fullname: "Emily Davis",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    driver: {
      _id: "DRV003",
      fullname: "David Wilson",
      avatar: "https://i.pravatar.cc/150?img=13",
    },
    ride: null,
    category: "Inappropriate Request",
    description: "Driver asked for personal contact information.",
    anonymous: false,
    status: "resolved",
    createdAt: "2024-10-28T16:45:00Z",
    updatedAt: "2024-10-30T11:00:00Z",
  },
  {
    _id: "RPT004",
    reporter: {
      _id: "USR004",
      fullname: "James Brown",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    driver: {
      _id: "DRV004",
      fullname: "Lisa Martinez",
      avatar: "https://i.pravatar.cc/150?img=14",
    },
    ride: {
      _id: "RID004",
      pickup: "555 Sunset Blvd",
      destination: "888 Ocean Dr",
    },
    category: "Vehicle Condition",
    description: "Vehicle was dirty and had a strong odor.",
    anonymous: false,
    status: "new",
    createdAt: "2024-11-04T09:20:00Z",
    updatedAt: "2024-11-04T09:20:00Z",
  },
  {
    _id: "RPT005",
    reporter: null,
    driver: {
      _id: "DRV005",
      fullname: "Robert Anderson",
      avatar: "https://i.pravatar.cc/150?img=15",
    },
    ride: {
      _id: "RID005",
      pickup: "111 Beach Rd",
      destination: "222 Mountain View",
    },
    category: "Overcharging",
    description: "Driver attempted to charge more than the app rate.",
    anonymous: true,
    status: "investigating",
    createdAt: "2024-11-03T13:50:00Z",
    updatedAt: "2024-11-04T10:30:00Z",
  },
  {
    _id: "RPT006",
    reporter: {
      _id: "USR006",
      fullname: "Maria Garcia",
      avatar: "https://i.pravatar.cc/150?img=6",
    },
    driver: {
      _id: "DRV006",
      fullname: "Thomas Taylor",
      avatar: "https://i.pravatar.cc/150?img=16",
    },
    ride: {
      _id: "RID006",
      pickup: "333 Park Ave",
      destination: "444 Lake St",
    },
    category: "Wrong Route",
    description: "Driver deliberately took a longer route to increase fare.",
    anonymous: false,
    status: "dismissed",
    createdAt: "2024-10-25T11:10:00Z",
    updatedAt: "2024-10-27T15:45:00Z",
  },
  {
    _id: "RPT007",
    reporter: {
      _id: "USR007",
      fullname: "William Lee",
      avatar: "https://i.pravatar.cc/150?img=7",
    },
    driver: {
      _id: "DRV007",
      fullname: "Jennifer White",
      avatar: "https://i.pravatar.cc/150?img=17",
    },
    ride: null,
    category: "Harassment",
    description: "Driver made uncomfortable comments during the ride.",
    anonymous: false,
    status: "resolved",
    createdAt: "2024-10-30T14:25:00Z",
    updatedAt: "2024-11-01T09:15:00Z",
  },
  {
    _id: "RPT008",
    reporter: null,
    driver: {
      _id: "DRV008",
      fullname: "Christopher Harris",
      avatar: "https://i.pravatar.cc/150?img=18",
    },
    ride: {
      _id: "RID008",
      pickup: "777 Valley Rd",
      destination: "999 Hill St",
    },
    category: "Safety Concern",
    description: "Driver was using phone while driving.",
    anonymous: true,
    status: "new",
    createdAt: "2024-11-05T07:40:00Z",
    updatedAt: "2024-11-05T07:40:00Z",
  },
  {
    _id: "RPT009",
    reporter: {
      _id: "USR009",
      fullname: "Patricia Martin",
      avatar: "https://i.pravatar.cc/150?img=9",
    },
    driver: {
      _id: "DRV009",
      fullname: "Daniel Clark",
      avatar: "https://i.pravatar.cc/150?img=19",
    },
    ride: {
      _id: "RID009",
      pickup: "666 River Rd",
      destination: "777 Forest Ave",
    },
    category: "No Show",
    description: "Driver accepted ride but never showed up.",
    anonymous: false,
    status: "investigating",
    createdAt: "2024-11-02T18:30:00Z",
    updatedAt: "2024-11-03T10:00:00Z",
  },
  {
    _id: "RPT010",
    reporter: {
      _id: "USR010",
      fullname: "Charles Robinson",
      avatar: "https://i.pravatar.cc/150?img=10",
    },
    driver: {
      _id: "DRV010",
      fullname: "Nancy Rodriguez",
      avatar: "https://i.pravatar.cc/150?img=20",
    },
    ride: {
      _id: "RID010",
      pickup: "888 Meadow Ln",
      destination: "999 Garden Way",
    },
    category: "Reckless Driving",
    description: "Driver ran through red lights and drove dangerously.",
    anonymous: false,
    status: "resolved",
    createdAt: "2024-10-26T12:20:00Z",
    updatedAt: "2024-10-29T16:30:00Z",
  },
  {
    _id: "RPT011",
    reporter: null,
    driver: {
      _id: "DRV011",
      fullname: "Kevin Lewis",
      avatar: "https://i.pravatar.cc/150?img=21",
    },
    ride: null,
    category: "Unprofessional Behavior",
    description: "Driver was eating while driving and appeared distracted.",
    anonymous: true,
    status: "new",
    createdAt: "2024-11-04T15:10:00Z",
    updatedAt: "2024-11-04T15:10:00Z",
  },
  {
    _id: "RPT012",
    reporter: {
      _id: "USR012",
      fullname: "Barbara Walker",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    driver: {
      _id: "DRV012",
      fullname: "Steven Hall",
      avatar: "https://i.pravatar.cc/150?img=22",
    },
    ride: {
      _id: "RID012",
      pickup: "222 Cherry Ln",
      destination: "333 Maple St",
    },
    category: "Vehicle Condition",
    description: "Vehicle had broken seat belt and cracked windshield.",
    anonymous: false,
    status: "investigating",
    createdAt: "2024-11-01T11:45:00Z",
    updatedAt: "2024-11-02T08:20:00Z",
  },
  {
    _id: "RPT013",
    reporter: {
      _id: "USR013",
      fullname: "Linda Allen",
      avatar: "https://i.pravatar.cc/150?img=13",
    },
    driver: {
      _id: "DRV013",
      fullname: "Paul Young",
      avatar: "https://i.pravatar.cc/150?img=23",
    },
    ride: {
      _id: "RID013",
      pickup: "444 Birch Ave",
      destination: "555 Cedar Rd",
    },
    category: "Inappropriate Request",
    description: "Driver offered unauthorized services.",
    anonymous: false,
    status: "resolved",
    createdAt: "2024-10-27T09:35:00Z",
    updatedAt: "2024-10-28T14:50:00Z",
  },
  {
    _id: "RPT014",
    reporter: null,
    driver: {
      _id: "DRV014",
      fullname: "Karen King",
      avatar: "https://i.pravatar.cc/150?img=24",
    },
    ride: {
      _id: "RID014",
      pickup: "666 Spruce St",
      destination: "777 Willow Way",
    },
    category: "Wrong Route",
    description: "Driver refused to use GPS and got lost multiple times.",
    anonymous: true,
    status: "dismissed",
    createdAt: "2024-10-24T16:20:00Z",
    updatedAt: "2024-10-26T10:00:00Z",
  },
  {
    _id: "RPT015",
    reporter: {
      _id: "USR015",
      fullname: "Mark Wright",
      avatar: "https://i.pravatar.cc/150?img=15",
    },
    driver: {
      _id: "DRV015",
      fullname: "Betty Scott",
      avatar: "https://i.pravatar.cc/150?img=25",
    },
    ride: {
      _id: "RID015",
      pickup: "888 Aspen Dr",
      destination: "999 Poplar Ct",
    },
    category: "Safety Concern",
    description: "Driver appeared to be under the influence.",
    anonymous: false,
    status: "new",
    createdAt: "2024-11-05T19:55:00Z",
    updatedAt: "2024-11-05T19:55:00Z",
  },
];
