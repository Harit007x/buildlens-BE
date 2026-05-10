import express from "express";
import { dummyController } from "../controllers/dummyController";
import { authRouter } from "./authRoutes";
import propertyRoutes from "./propertyRoutes";
import updateRoutes from "./updateRoutes";
import buyerRoutes from "./buyerRoutes";
import announcementRoutes from "./announcementRoutes";

export const router = express.Router();

const { fetchAllTodo } = dummyController;

/**
 * @openapi
 * /todos:
 *   get:
 *     summary: Fetch all todos (Dummy endpoint)
 *     tags: [General]
 *     responses:
 *       200:
 *         description: List of todos returned successfully
 */
router.get("/todos", fetchAllTodo);
router.use("/auth", authRouter);
router.use("/properties", propertyRoutes);
router.use("/properties/:propertyId/updates", updateRoutes);
router.use("/properties/:propertyId/announcements", announcementRoutes);
router.use("/buyer", buyerRoutes);
