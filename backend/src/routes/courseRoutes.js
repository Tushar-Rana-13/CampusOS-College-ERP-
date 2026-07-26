import express from 'express' ;
import {createCourse , getCourses,enrollStudent} from '../controllers/courseController.js';
import {protect , authorize} from '../middleware/authMiddleware.js' ;

const router = express.Router() ;

router.use(protect) ;

router
    .route('/')
    .get(getCourses)
    .post(authorize('admin'),createCourse) ;

router
    .route('/:id/enroll')
    .post(authorize('admin', 'student'),enrollStudent) ;

export default router ;