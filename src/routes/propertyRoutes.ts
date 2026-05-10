import { Router } from "express";
import { propertyController, createPropertySchema, updatePropertySchema } from "../controllers/propertyController";
import { protect, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validate";

const router = Router();

// All property routes are protected
router.use(protect);

router.get("/my-properties", authorize("BUILDER"), propertyController.getMyProperties);
router.get("/stats", authorize("BUILDER"), propertyController.getDashboardStats);
router.post("/", authorize("BUILDER"), validate(createPropertySchema), propertyController.createProperty);
router.get("/:id", propertyController.getPropertyById);
router.put("/:id", authorize("BUILDER"), validate(updatePropertySchema), propertyController.updateProperty);

// Buyer linking
router.post("/:id/buyers", authorize("BUILDER"), propertyController.linkBuyer);
router.get("/:id/buyers", authorize("BUILDER"), propertyController.getLinkedBuyers);

export default router;
