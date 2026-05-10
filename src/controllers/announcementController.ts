import { Request, Response } from "express";
import { prisma } from "../utils/db";

/** Create a new announcement for a property */
const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyId = String(req.params.propertyId);
    const { title, content, isImportant } = req.body;
    const builderId = (req as any).user.id;

    // Verify property ownership
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      res.status(404).json({ success: false, message: "Property not found" });
      return;
    }

    if (property.builderId !== builderId) {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        isImportant: !!isImportant,
        propertyId,
      },
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error("Create Announcement Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** Get all announcements for a specific property */
const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyId = String(req.params.propertyId);
    
    // For Buyers, we check if they are linked. For Builders, we check ownership.
    const user = (req as any).user;
    
    if (user.role === "BUILDER") {
      const property = await prisma.property.findUnique({ where: { id: propertyId } });
      if (!property || property.builderId !== user.id) {
        res.status(403).json({ success: false, message: "Access denied" });
        return;
      }
    } else {
      // Buyer check
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          buyers: { some: { id: user.id } }
        }
      });
      if (!property) {
        res.status(403).json({ success: false, message: "Access denied" });
        return;
      }
    }

    const announcements = await prisma.announcement.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    console.error("Get Announcements Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** Delete an announcement */
const deleteAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const builderId = (req as any).user.id;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!announcement) {
      res.status(404).json({ success: false, message: "Announcement not found" });
      return;
    }

    if ((announcement as any).property.builderId !== builderId) {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    await prisma.announcement.delete({ where: { id } });

    res.status(200).json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    console.error("Delete Announcement Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const announcementController = {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
};
