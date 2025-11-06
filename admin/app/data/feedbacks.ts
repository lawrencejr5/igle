export interface Feedback {
  _id: string;
  user?: {
    _id: string;
    fullname: string;
    avatar: string;
  };
  type: "bug" | "feature" | "general";
  message: string;
  images?: string[];
  contact?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const feedbacksData: Feedback[] = [
  {
    _id: "FDB001",
    user: {
      _id: "USR001",
      fullname: "John Doe",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    type: "bug",
    message:
      "The app crashes when I try to book a ride with multiple stops. Please fix this issue.",
    images: [],
    contact: "john.doe@email.com",
    metadata: {
      device: "iPhone 13",
      os: "iOS 16.5",
      appVersion: "2.3.1",
    },
    createdAt: "2024-11-05T10:30:00Z",
    updatedAt: "2024-11-05T10:30:00Z",
  },
  {
    _id: "FDB002",
    user: {
      _id: "USR002",
      fullname: "Jane Smith",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    type: "feature",
    message:
      "Would love to see a dark mode option in the app. It would be great for night rides.",
    images: [],
    contact: "jane.smith@email.com",
    metadata: {
      device: "Samsung Galaxy S22",
      os: "Android 13",
      appVersion: "2.3.0",
    },
    createdAt: "2024-11-04T14:20:00Z",
    updatedAt: "2024-11-04T14:20:00Z",
  },
  {
    _id: "FDB003",
    type: "general",
    message:
      "Great service! The drivers are always professional and the app is easy to use.",
    images: [],
    metadata: {},
    createdAt: "2024-11-03T09:15:00Z",
    updatedAt: "2024-11-03T09:15:00Z",
  },
  {
    _id: "FDB004",
    user: {
      _id: "USR004",
      fullname: "James Brown",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    type: "bug",
    message:
      "Payment gateway keeps timing out. I've tried multiple cards and they all fail.",
    images: ["https://placehold.co/600x400/png"],
    contact: "+1234567890",
    metadata: {
      device: "Google Pixel 7",
      os: "Android 14",
      appVersion: "2.3.1",
      errorCode: "PAYMENT_TIMEOUT",
    },
    createdAt: "2024-11-02T16:45:00Z",
    updatedAt: "2024-11-02T16:45:00Z",
  },
  {
    _id: "FDB005",
    user: {
      _id: "USR005",
      fullname: "Maria Garcia",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    type: "feature",
    message:
      "Can you add a schedule ride feature? I need to book rides in advance for my daily commute.",
    images: [],
    contact: "maria.garcia@email.com",
    metadata: {
      device: "iPhone 14 Pro",
      os: "iOS 17.0",
      appVersion: "2.3.1",
    },
    createdAt: "2024-11-01T11:30:00Z",
    updatedAt: "2024-11-01T11:30:00Z",
  },
  {
    _id: "FDB006",
    user: {
      _id: "USR006",
      fullname: "Robert Wilson",
      avatar: "https://i.pravatar.cc/150?img=6",
    },
    type: "bug",
    message:
      "GPS location is always inaccurate. Shows me 2 blocks away from my actual location.",
    images: [
      "https://placehold.co/600x400/png",
      "https://placehold.co/600x400/png",
    ],
    contact: "robert.w@email.com",
    metadata: {
      device: "OnePlus 11",
      os: "Android 13",
      appVersion: "2.2.9",
      locationAccuracy: "low",
    },
    createdAt: "2024-10-31T08:50:00Z",
    updatedAt: "2024-10-31T08:50:00Z",
  },
  {
    _id: "FDB007",
    type: "general",
    message: "The recent update made the app much faster. Thank you!",
    images: [],
    metadata: {},
    createdAt: "2024-10-30T15:20:00Z",
    updatedAt: "2024-10-30T15:20:00Z",
  },
  {
    _id: "FDB008",
    user: {
      _id: "USR008",
      fullname: "Emily Davis",
      avatar: "https://i.pravatar.cc/150?img=8",
    },
    type: "feature",
    message:
      "Please add support for splitting fares with friends. This would be very useful for group rides.",
    images: [],
    contact: "emily.davis@email.com",
    metadata: {
      device: "iPhone 12",
      os: "iOS 16.7",
      appVersion: "2.3.0",
    },
    createdAt: "2024-10-29T13:10:00Z",
    updatedAt: "2024-10-29T13:10:00Z",
  },
  {
    _id: "FDB009",
    user: {
      _id: "USR009",
      fullname: "Michael Johnson",
      avatar: "https://i.pravatar.cc/150?img=9",
    },
    type: "bug",
    message: "Can't update my profile picture. The upload button doesn't work.",
    images: [],
    contact: "+9876543210",
    metadata: {
      device: "Xiaomi 13",
      os: "Android 13",
      appVersion: "2.3.1",
      errorType: "upload_failed",
    },
    createdAt: "2024-10-28T10:05:00Z",
    updatedAt: "2024-10-28T10:05:00Z",
  },
  {
    _id: "FDB010",
    user: {
      _id: "USR010",
      fullname: "Sarah Martinez",
      avatar: "https://i.pravatar.cc/150?img=10",
    },
    type: "feature",
    message:
      "Add a feature to save favorite locations for quick booking. Home and work addresses would be great.",
    images: [],
    contact: "sarah.m@email.com",
    metadata: {
      device: "Samsung Galaxy S23",
      os: "Android 14",
      appVersion: "2.3.1",
    },
    createdAt: "2024-10-27T17:40:00Z",
    updatedAt: "2024-10-27T17:40:00Z",
  },
  {
    _id: "FDB011",
    type: "general",
    message: "Love the new UI! Much cleaner and easier to navigate.",
    images: [],
    metadata: {},
    createdAt: "2024-10-26T12:25:00Z",
    updatedAt: "2024-10-26T12:25:00Z",
  },
  {
    _id: "FDB012",
    user: {
      _id: "USR012",
      fullname: "David Lee",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    type: "bug",
    message:
      "Notifications are not working. I miss ride updates and driver messages.",
    images: ["https://placehold.co/600x400/png"],
    contact: "david.lee@email.com",
    metadata: {
      device: "iPhone 13 Pro",
      os: "iOS 16.6",
      appVersion: "2.3.0",
      notificationPermission: "granted",
    },
    createdAt: "2024-10-25T09:55:00Z",
    updatedAt: "2024-10-25T09:55:00Z",
  },
  {
    _id: "FDB013",
    user: {
      _id: "USR013",
      fullname: "Jennifer White",
      avatar: "https://i.pravatar.cc/150?img=13",
    },
    type: "feature",
    message:
      "Integration with Google Calendar would be amazing for scheduled rides.",
    images: [],
    contact: "jennifer.white@email.com",
    metadata: {
      device: "Google Pixel 8",
      os: "Android 14",
      appVersion: "2.3.1",
    },
    createdAt: "2024-10-24T14:15:00Z",
    updatedAt: "2024-10-24T14:15:00Z",
  },
  {
    _id: "FDB014",
    user: {
      _id: "USR014",
      fullname: "Christopher Taylor",
      avatar: "https://i.pravatar.cc/150?img=14",
    },
    type: "bug",
    message:
      "The app freezes when I try to view my ride history. Have to force close it every time.",
    images: [],
    contact: "+1122334455",
    metadata: {
      device: "OnePlus 10 Pro",
      os: "Android 13",
      appVersion: "2.2.9",
      crashReport: "HISTORY_VIEW_FREEZE",
    },
    createdAt: "2024-10-23T11:20:00Z",
    updatedAt: "2024-10-23T11:20:00Z",
  },
  {
    _id: "FDB015",
    type: "general",
    message: "Excellent customer service! My issue was resolved quickly.",
    images: [],
    metadata: {},
    createdAt: "2024-10-22T16:30:00Z",
    updatedAt: "2024-10-22T16:30:00Z",
  },
  {
    _id: "FDB016",
    user: {
      _id: "USR016",
      fullname: "Amanda Harris",
      avatar: "https://i.pravatar.cc/150?img=16",
    },
    type: "feature",
    message:
      "Please add voice control for hands-free booking. Would be safer while driving.",
    images: [],
    contact: "amanda.h@email.com",
    metadata: {
      device: "iPhone 15",
      os: "iOS 17.1",
      appVersion: "2.3.1",
    },
    createdAt: "2024-10-21T13:45:00Z",
    updatedAt: "2024-10-21T13:45:00Z",
  },
  {
    _id: "FDB017",
    user: {
      _id: "USR017",
      fullname: "Daniel Rodriguez",
      avatar: "https://i.pravatar.cc/150?img=17",
    },
    type: "bug",
    message:
      "Promo codes are not being applied correctly. Shows discount but charges full price.",
    images: ["https://placehold.co/600x400/png"],
    contact: "daniel.r@email.com",
    metadata: {
      device: "Samsung Galaxy A54",
      os: "Android 13",
      appVersion: "2.3.1",
      promoCode: "SAVE20",
    },
    createdAt: "2024-10-20T10:10:00Z",
    updatedAt: "2024-10-20T10:10:00Z",
  },
  {
    _id: "FDB018",
    user: {
      _id: "USR018",
      fullname: "Lisa Anderson",
      avatar: "https://i.pravatar.cc/150?img=18",
    },
    type: "feature",
    message:
      "Add offline mode to view previous rides and receipts without internet.",
    images: [],
    contact: "lisa.anderson@email.com",
    metadata: {
      device: "iPhone 14",
      os: "iOS 17.0",
      appVersion: "2.3.0",
    },
    createdAt: "2024-10-19T15:35:00Z",
    updatedAt: "2024-10-19T15:35:00Z",
  },
  {
    _id: "FDB019",
    type: "general",
    message: "Best ride-sharing app I've used. Keep up the great work!",
    images: [],
    metadata: {},
    createdAt: "2024-10-18T12:00:00Z",
    updatedAt: "2024-10-18T12:00:00Z",
  },
  {
    _id: "FDB020",
    user: {
      _id: "USR020",
      fullname: "Thomas Clark",
      avatar: "https://i.pravatar.cc/150?img=20",
    },
    type: "bug",
    message:
      "Driver rating system is glitchy. Can't submit ratings after rides.",
    images: [],
    contact: "+5566778899",
    metadata: {
      device: "Google Pixel 7 Pro",
      os: "Android 14",
      appVersion: "2.3.1",
      errorType: "rating_submit_failed",
    },
    createdAt: "2024-10-17T09:25:00Z",
    updatedAt: "2024-10-17T09:25:00Z",
  },
];
