import { Router } from "express";
import { buyerController } from "../controllers/buyerController";
import { protect, authorize } from "../middlewares/authMiddleware";

const router = Router();

// All buyer routes require authentication and BUYER role
router.use(protect, authorize("BUYER"));

router.get("/properties", buyerController.getPurchasedProperties);
router.get("/properties/:id", buyerController.getPropertyDetails);

export default router;
