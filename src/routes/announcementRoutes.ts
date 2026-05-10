import { Router } from "express";
import { announcementController } from "../controllers/announcementController";
import { protect, authorize } from "../middlewares/authMiddleware";

const router = Router({ mergeParams: true }); // Enable propertyId from parent route

router.use(protect);

// Get announcements (Both BUILDER and BUYER can access if authorized)
router.get("/", announcementController.getAnnouncements);

// Builder only routes
router.post("/", authorize("BUILDER"), announcementController.createAnnouncement);
router.delete("/:id", authorize("BUILDER"), announcementController.deleteAnnouncement);

export default router;
