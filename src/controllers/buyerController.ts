import { Request, Response } from "express";
import { prisma } from "../utils/db";

/** Get all properties linked to the authenticated buyer */
const getPurchasedProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const buyerId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: buyerId },
      include: {
        purchasedProperties: {
          include: {
            builder: {
              select: { name: true, email: true },
            },
            // Include latest published update for status summary
            updates: {
              where: { status: "PUBLISHED" },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({ success: true, data: user.purchasedProperties });
  } catch (error) {
    console.error("Get Purchased Properties Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** Get specific property details and its published updates for a buyer */
const getPropertyDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyId = String(req.params.id);
    const buyerId = (req as any).user.id;

    // Check if the buyer is actually linked to this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        buyers: {
          some: { id: buyerId },
        },
      },
      include: {
        builder: {
          select: { name: true, email: true },
        },
        updates: {
          where: { status: "PUBLISHED" },
          include: { photos: true },
          orderBy: { createdAt: "desc" },
        },
        announcements: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!property) {
      res.status(404).json({ success: false, message: "Property not found or access denied" });
      return;
    }

    res.status(200).json({ success: true, data: property });
  } catch (error) {
    console.error("Get Property Details Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const buyerController = {
  getPurchasedProperties,
  getPropertyDetails,
};
