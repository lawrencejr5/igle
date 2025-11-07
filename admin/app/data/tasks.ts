// Task types matching server model
export type TaskType = "ride" | "delivery" | "streak" | "referral" | "custom";

export interface Task {
  _id: string;
  title: string;
  description?: string;
  type: TaskType;
  goalCount: number;
  rewardAmount: number;
  active: boolean;
  startAt?: string | null;
  endAt?: string | null;
  terms?: string;
  maxPerUser?: number;
  totalBudget?: number | null;
  createdAt: string;
  updatedAt: string;
}

// UserTask types matching server model
export type UserTaskStatus =
  | "locked"
  | "in_progress"
  | "completed"
  | "claimed"
  | "expired";

export interface UserTask {
  _id: string;
  user: {
    _id: string;
    fullname: string;
    email: string;
  };
  task: Task;
  progress: number;
  status: UserTaskStatus;
  claimedAt?: string | null;
  attempts?: number;
  createdAt: string;
  updatedAt: string;
}

// Sample Tasks
export const sampleTasks: Task[] = [
  {
    _id: "TSK001",
    title: "Complete 10 Rides",
    description: "Take 10 successful rides to earn bonus rewards",
    type: "ride",
    goalCount: 10,
    rewardAmount: 5000,
    active: true,
    startAt: "2024-11-01T00:00:00.000Z",
    endAt: "2024-12-31T23:59:59.000Z",
    terms: "Only completed rides count. Cancelled rides are excluded.",
    maxPerUser: 1,
    totalBudget: 500000,
    createdAt: "2024-10-25T10:30:00.000Z",
    updatedAt: "2024-11-01T08:15:00.000Z",
  },
  {
    _id: "TSK002",
    title: "Weekend Warrior",
    description: "Complete 5 deliveries on weekends",
    type: "delivery",
    goalCount: 5,
    rewardAmount: 3000,
    active: true,
    startAt: "2024-11-01T00:00:00.000Z",
    endAt: "2024-11-30T23:59:59.000Z",
    terms: "Only Saturday and Sunday deliveries count",
    maxPerUser: 2,
    totalBudget: 300000,
    createdAt: "2024-10-28T14:20:00.000Z",
    updatedAt: "2024-11-02T09:00:00.000Z",
  },
  {
    _id: "TSK003",
    title: "7-Day Streak Master",
    description: "Use the app for 7 consecutive days",
    type: "streak",
    goalCount: 7,
    rewardAmount: 2000,
    active: true,
    startAt: null,
    endAt: null,
    terms: "Login or complete at least one activity each day",
    maxPerUser: 1,
    totalBudget: null,
    createdAt: "2024-10-20T11:00:00.000Z",
    updatedAt: "2024-10-20T11:00:00.000Z",
  },
  {
    _id: "TSK004",
    title: "Refer 3 Friends",
    description: "Invite 3 friends who complete their first ride",
    type: "referral",
    goalCount: 3,
    rewardAmount: 10000,
    active: true,
    startAt: "2024-11-01T00:00:00.000Z",
    endAt: "2025-01-31T23:59:59.000Z",
    terms: "Referred users must complete at least one ride within 30 days",
    maxPerUser: 5,
    totalBudget: 1000000,
    createdAt: "2024-10-30T16:45:00.000Z",
    updatedAt: "2024-11-01T10:30:00.000Z",
  },
  {
    _id: "TSK005",
    title: "First-Time Rider Bonus",
    description: "Complete your first ride and get rewarded",
    type: "ride",
    goalCount: 1,
    rewardAmount: 500,
    active: true,
    startAt: null,
    endAt: null,
    terms: "Available to new users only",
    maxPerUser: 1,
    totalBudget: null,
    createdAt: "2024-09-15T08:00:00.000Z",
    updatedAt: "2024-09-15T08:00:00.000Z",
  },
  {
    _id: "TSK006",
    title: "Delivery Champion",
    description: "Complete 20 deliveries this month",
    type: "delivery",
    goalCount: 20,
    rewardAmount: 8000,
    active: true,
    startAt: "2024-11-01T00:00:00.000Z",
    endAt: "2024-11-30T23:59:59.000Z",
    terms: "All delivery types count towards goal",
    maxPerUser: 1,
    totalBudget: 400000,
    createdAt: "2024-10-31T12:00:00.000Z",
    updatedAt: "2024-11-01T07:20:00.000Z",
  },
  {
    _id: "TSK007",
    title: "Early Bird Special",
    description: "Complete 5 rides before 9 AM",
    type: "custom",
    goalCount: 5,
    rewardAmount: 2500,
    active: false,
    startAt: "2024-11-01T00:00:00.000Z",
    endAt: "2024-11-15T23:59:59.000Z",
    terms: "Ride must start between 6 AM and 9 AM",
    maxPerUser: 1,
    totalBudget: 250000,
    createdAt: "2024-10-29T09:15:00.000Z",
    updatedAt: "2024-11-05T14:30:00.000Z",
  },
  {
    _id: "TSK008",
    title: "Monthly Streak Legend",
    description: "Maintain a 30-day streak",
    type: "streak",
    goalCount: 30,
    rewardAmount: 15000,
    active: true,
    startAt: null,
    endAt: null,
    terms: "Must use app or complete activity daily for 30 consecutive days",
    maxPerUser: 1,
    totalBudget: null,
    createdAt: "2024-10-18T10:00:00.000Z",
    updatedAt: "2024-10-18T10:00:00.000Z",
  },
  {
    _id: "TSK009",
    title: "Super Referrer",
    description: "Refer 10 active users",
    type: "referral",
    goalCount: 10,
    rewardAmount: 25000,
    active: true,
    startAt: "2024-11-01T00:00:00.000Z",
    endAt: "2025-03-31T23:59:59.000Z",
    terms: "Each referred user must complete at least 5 rides",
    maxPerUser: 1,
    totalBudget: 500000,
    createdAt: "2024-10-27T15:30:00.000Z",
    updatedAt: "2024-11-01T09:45:00.000Z",
  },
  {
    _id: "TSK010",
    title: "Night Owl Deliveries",
    description: "Complete 3 deliveries between 10 PM and 6 AM",
    type: "custom",
    goalCount: 3,
    rewardAmount: 3500,
    active: true,
    startAt: "2024-11-01T00:00:00.000Z",
    endAt: "2024-11-30T23:59:59.000Z",
    terms: "Delivery must be completed during night hours (10 PM - 6 AM)",
    maxPerUser: 2,
    totalBudget: 200000,
    createdAt: "2024-10-30T18:00:00.000Z",
    updatedAt: "2024-11-02T11:20:00.000Z",
  },
];

// Sample User Tasks
export const sampleUserTasks: UserTask[] = [
  {
    _id: "UT001",
    user: {
      _id: "USR001",
      fullname: "John Doe",
      email: "john@example.com",
    },
    task: sampleTasks[0], // Complete 10 Rides
    progress: 7,
    status: "in_progress",
    claimedAt: null,
    attempts: 0,
    createdAt: "2024-11-02T08:30:00.000Z",
    updatedAt: "2024-11-06T15:20:00.000Z",
  },
  {
    _id: "UT002",
    user: {
      _id: "USR002",
      fullname: "Jane Smith",
      email: "jane@example.com",
    },
    task: sampleTasks[0], // Complete 10 Rides
    progress: 10,
    status: "completed",
    claimedAt: null,
    attempts: 0,
    createdAt: "2024-11-01T10:00:00.000Z",
    updatedAt: "2024-11-05T18:45:00.000Z",
  },
  {
    _id: "UT003",
    user: {
      _id: "USR003",
      fullname: "Mike Johnson",
      email: "mike@example.com",
    },
    task: sampleTasks[2], // 7-Day Streak Master
    progress: 7,
    status: "claimed",
    claimedAt: "2024-11-04T12:00:00.000Z",
    attempts: 1,
    createdAt: "2024-10-28T09:00:00.000Z",
    updatedAt: "2024-11-04T12:00:00.000Z",
  },
  {
    _id: "UT004",
    user: {
      _id: "USR004",
      fullname: "Sarah Williams",
      email: "sarah@example.com",
    },
    task: sampleTasks[1], // Weekend Warrior
    progress: 3,
    status: "in_progress",
    claimedAt: null,
    attempts: 0,
    createdAt: "2024-11-02T14:20:00.000Z",
    updatedAt: "2024-11-03T16:30:00.000Z",
  },
  {
    _id: "UT005",
    user: {
      _id: "USR005",
      fullname: "David Brown",
      email: "david@example.com",
    },
    task: sampleTasks[3], // Refer 3 Friends
    progress: 2,
    status: "in_progress",
    claimedAt: null,
    attempts: 0,
    createdAt: "2024-11-01T11:15:00.000Z",
    updatedAt: "2024-11-05T09:40:00.000Z",
  },
  {
    _id: "UT006",
    user: {
      _id: "USR006",
      fullname: "Emily Davis",
      email: "emily@example.com",
    },
    task: sampleTasks[4], // First-Time Rider Bonus
    progress: 1,
    status: "claimed",
    claimedAt: "2024-11-01T14:30:00.000Z",
    attempts: 1,
    createdAt: "2024-11-01T10:00:00.000Z",
    updatedAt: "2024-11-01T14:30:00.000Z",
  },
  {
    _id: "UT007",
    user: {
      _id: "USR007",
      fullname: "Robert Wilson",
      email: "robert@example.com",
    },
    task: sampleTasks[5], // Delivery Champion
    progress: 12,
    status: "in_progress",
    claimedAt: null,
    attempts: 0,
    createdAt: "2024-11-01T08:00:00.000Z",
    updatedAt: "2024-11-06T17:20:00.000Z",
  },
  {
    _id: "UT008",
    user: {
      _id: "USR008",
      fullname: "Lisa Anderson",
      email: "lisa@example.com",
    },
    task: sampleTasks[0], // Complete 10 Rides
    progress: 0,
    status: "locked",
    claimedAt: null,
    attempts: 0,
    createdAt: "2024-11-06T09:00:00.000Z",
    updatedAt: "2024-11-06T09:00:00.000Z",
  },
  {
    _id: "UT009",
    user: {
      _id: "USR009",
      fullname: "James Taylor",
      email: "james@example.com",
    },
    task: sampleTasks[7], // Monthly Streak Legend
    progress: 15,
    status: "in_progress",
    claimedAt: null,
    attempts: 0,
    createdAt: "2024-10-22T10:30:00.000Z",
    updatedAt: "2024-11-06T08:15:00.000Z",
  },
  {
    _id: "UT010",
    user: {
      _id: "USR010",
      fullname: "Maria Garcia",
      email: "maria@example.com",
    },
    task: sampleTasks[9], // Night Owl Deliveries
    progress: 3,
    status: "completed",
    claimedAt: null,
    attempts: 0,
    createdAt: "2024-11-02T22:00:00.000Z",
    updatedAt: "2024-11-05T23:45:00.000Z",
  },
  {
    _id: "UT011",
    user: {
      _id: "USR002",
      fullname: "Jane Smith",
      email: "jane@example.com",
    },
    task: sampleTasks[2], // 7-Day Streak Master
    progress: 5,
    status: "in_progress",
    claimedAt: null,
    attempts: 0,
    createdAt: "2024-11-01T12:00:00.000Z",
    updatedAt: "2024-11-06T10:30:00.000Z",
  },
  {
    _id: "UT012",
    user: {
      _id: "USR001",
      fullname: "John Doe",
      email: "john@example.com",
    },
    task: sampleTasks[1], // Weekend Warrior
    progress: 5,
    status: "claimed",
    claimedAt: "2024-11-04T16:20:00.000Z",
    attempts: 1,
    createdAt: "2024-11-02T11:00:00.000Z",
    updatedAt: "2024-11-04T16:20:00.000Z",
  },
];
