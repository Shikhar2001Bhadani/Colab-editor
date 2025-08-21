import express from 'express';
import { checkGrammar, enhanceText, summarizeText, autoCompleteText } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/grammar-check', protect, checkGrammar);
router.post('/enhance', protect, enhanceText);
router.post('/summarize', protect, summarizeText);
router.post('/autocomplete', protect, autoCompleteText);

export default router;