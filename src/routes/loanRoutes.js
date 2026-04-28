import express from 'express';
import { LoanController } from '../controllers/loanController.js';

const router = express.Router();

// Route spesifik diletakkan di atas rute root '/'
router.get('/top-borrowers', LoanController.getTopBorrowers);

router.get('/', LoanController.getLoans);
router.post('/', LoanController.createLoan);

export default router;
