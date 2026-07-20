import express from 'express' ;
import {registerUser , loginUser} from '../controllers/authController.js' ;
import{protect,authorize}from '../middleware/authMiddleware.js';

const router = express.Router() ;

router.post('/register' , registerUser) ;
router.post('/login',loginUser) ;

router.get('/profile' , protect, (req,res)=>{
    res.status(200).json({
        message:'User profile retrieved successfully',
        user:req.user,
    });
});

router.get('/admin-dashboard',protect,authorize('admin'),(req,res)=>{
    res.status(200).json({
        message:'Welcome to the Admin Control Panel',
    });
});

export default router ;