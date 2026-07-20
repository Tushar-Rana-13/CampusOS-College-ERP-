import mongoose from "mongoose";

const ConnectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDb Connected : ${conn.connection.host}`);
    } catch (error) {
        console.error(`Database Connection Error:${conn.connection.host}`);
    }
    process.exit(1);
};

export default ConnectDB;