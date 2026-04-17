// import { connect,ConnectOptions } from "mongoose";

// export const  dbConnect=()=>{
  
//     connect(process.env.MONGO_URI!,{
//         // useNewUrlParser: true,
//         // useUnifiedTopology: true
//     } as ConnectOptions).then(
//         ()=>console.log("DB connection successful"),
//         (error) => console.log("Db connection failed",error)
//     )
// }


import mongoose from "mongoose";
import dns from "dns";

try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
    console.warn("Could not override DNS servers:", e);
}

mongoose.set("strictQuery", false);
const dbConnect = async (mongoURI: string) => {
    console.log(`\n MongoDB : {mongoURI}`,mongoURI);
    try {
        
        const connectionInstance = await mongoose.connect(mongoURI)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

export default dbConnect
