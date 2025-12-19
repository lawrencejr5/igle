import Agenda from "agenda";
const mongoConnectionString = process.env.MONGO_URI;

// Connect to Mongo and specify the collection "agendaJobs"
export const agenda = new Agenda({
  db: { address: mongoConnectionString!, collection: "agendaJobs" },
});

// Define the jobs (What should happen?)
agenda.define("send ride reminder", async (job: Record<string, any>) => {
  const { rideId, userId } = job.attrs.data;
  console.log(`Sending reminder for Ride ${rideId} to User ${userId}`);
  // Your logic: await sendPushNotification(userId, "Your ride is in 15 mins!");
});

agenda.define("start ride status", async (job: Record<string, any>) => {
  const { rideId } = job.attrs.data;
  console.log(`Auto-starting ride ${rideId}`);
  // Your logic: await Ride.updateOne({ _id: rideId }, { status: 'arrived' });
});
