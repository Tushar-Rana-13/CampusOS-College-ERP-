import express from 'express' ;
import cors from 'cors' ;
import dotenv from 'dotenv' ;
import connectDB from './config/db.js' ;

import authRoutes from './routes/authRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import courseRoutes from './routes/courseRoutes.js' ;

import { notFound, errorHandler } from './middleware/errorMiddleware.js';

//Load enviroment variables
dotenv.config() ;
//connect to MongoDB
connectDB() ;

const app = express() ;

app.use(cors()) ;
app.use(express.json()) ;

app.use('/api/auth',authRoutes);
app.use('/api/announcements',announcementRoutes);
app.use('/api/courses' , courseRoutes) ;

app.get('/health' , (req,res) => {
    res.status(200).json({status: 'healthy', timestamp: new Date() }) ;
}) ;

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT||5000 ;

app.listen(PORT , ()=>{
    console.log(`Server Running on ${PORT}`) ;
}) ;

export default app ;