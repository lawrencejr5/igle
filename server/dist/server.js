"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const connect_db_1 = require("./config/connect_db");
const not_found_1 = require("./middleware/not_found");
const user_1 = __importDefault(require("./routes/user"));
const driver_1 = __importDefault(require("./routes/driver"));
const ride_1 = __importDefault(require("./routes/ride"));
const task_1 = __importDefault(require("./routes/task"));
const userTask_1 = __importDefault(require("./routes/userTask"));
const transaction_1 = __importDefault(require("./routes/transaction"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const history_1 = __importDefault(require("./routes/history"));
const saved_place_1 = __importDefault(require("./routes/saved_place"));
const activity_1 = __importDefault(require("./routes/activity"));
const delivery_1 = __importDefault(require("./routes/delivery"));
const feedback_1 = __importDefault(require("./routes/feedback"));
const report_1 = __importDefault(require("./routes/report"));
const admin_1 = __importDefault(require("./routes/admin"));
const app_wallet_1 = __importDefault(require("./routes/app_wallet"));
const system_settings_1 = __importDefault(require("./routes/system_settings"));
const rating_1 = __importDefault(require("./routes/rating"));
const sockets_1 = require("./sockets");
const agenda_1 = require("./jobs/agenda");
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/v1/users", user_1.default);
app.use("/api/v1/drivers", driver_1.default);
app.use("/api/v1/rides", ride_1.default);
app.use("/api/v1/tasks", task_1.default);
app.use("/api/v1/user_tasks", userTask_1.default);
app.use("/api/v1/transactions", transaction_1.default);
app.use("/api/v1/wallet", wallet_1.default);
app.use("/api/v1/history", history_1.default);
app.use("/api/v1/saved_place", saved_place_1.default);
app.use("/api/v1/activity", activity_1.default);
app.use("/api/v1/rating", rating_1.default);
app.use("/api/v1/delivery", delivery_1.default);
app.use("/api/v1/feedback", feedback_1.default);
app.use("/api/v1/report", report_1.default);
app.use("/api/v1/admin", admin_1.default);
app.use("/api/v1/app_wallet", app_wallet_1.default);
app.use("/api/v1/system", system_settings_1.default);
app.use(not_found_1.not_found);
const port = process.env.PORT || "5000";
const mongo_url = process.env.MONGO_URI;
const http_server = http_1.default.createServer(app);
const io = new socket_io_1.Server(http_server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
exports.io = io;
io.on("connection", (socket) => {
    (0, sockets_1.handle_socket_events)(io, socket);
});
const start_server = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, connect_db_1.connect_db)(mongo_url);
        yield agenda_1.agenda.start();
        yield http_server.listen(port, () => console.log(`Connected! Server running at port ${port}...`));
    }
    catch (err) {
        console.log(err);
    }
});
start_server();
