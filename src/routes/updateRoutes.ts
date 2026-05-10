import express from "express";
import { updateController } from "../controllers/updateController";
import { protect, authorize } from "../middlewares/authMiddleware";

const updateRouter = express.Router({ mergeParams: true }); // mergeParams to access :propertyId

const { createUpdate, getUpdates, getUpdateById, updateUpdate, publishUpdate, deleteUpdate } =
  updateController;

// All routes require authentication and BUILDER role
updateRouter.use(protect, authorize("BUILDER"));

updateRouter.route("/").get(getUpdates).post(createUpdate);

updateRouter.route("/:id").get(getUpdateById).patch(updateUpdate).delete(deleteUpdate);

updateRouter.patch("/:id/publish", publishUpdate);

export default updateRouter;
