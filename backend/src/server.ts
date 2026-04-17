import dotenv from "dotenv";
 dotenv.config({
    path: './.env'
});

import path from"path";
import express, { Request, Response } from "express";
import cors from "cors";
import dbConnect from "./configs/database.config";

const mongoURI = process.env.Mongo_URI;
if (!mongoURI) {
    console.error('MongoDB URI is not provided in environment variables.');
    process.exit(1);
}
dbConnect(mongoURI);
import foodRouter from "./router/food.router";
import userRouter from "./router/user.router";
import orderRouter from "./router/order.router";
import chatbotRouter from "./router/chatbot.router";

const app = express();
app.use(express.json())
app.use(cors({
    credentials:true,
    origin:["http://localhost:4200"]
}));


app.use("/api/foods",foodRouter);
app.use("/api/users",userRouter);
app.use("/api/orders",orderRouter);
app.use("/api/chatbot",chatbotRouter);



app.use(express.static(path.join(__dirname, 'dist/browser')));

// Wildcard route to serve the Angular app for all routes
app.get('*', (req: Request, res: Response) => {
   const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    console.log('Requested URL:', fullUrl);
    res.sendFile(path.join(__dirname, 'dist/browser', 'index.html'));
});


const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("Website served on port" + port);
})
