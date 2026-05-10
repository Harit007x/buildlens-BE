import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/db";

// Zod Schemas
export const createPropertySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Property name is required"),
    description: z.string().optional(),
    location: z.string().min(1, "Location is required"),
    type: z.enum(["Residential", "Villa", "Commercial", "Plot"]),
    totalUnits: z.number().int().positive(),
    possessionDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
    coverImage: z.string().url().optional().or(z.literal("")),
    reraNumber: z.string().min(1, "RERA number is required"),
  }),
});

export const updatePropertySchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    type: z.enum(["Residential", "Villa", "Commercial", "Plot"]).optional(),
    totalUnits: z.number().int().positive().optional(),
    possessionDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }).optional(),
    coverImage: z.string().url().optional().or(z.literal("")),
    reraNumber: z.string().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

// Controllers
const createProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, location, type, totalUnits, possessionDate, coverImage, reraNumber } = req.body;
    const builderId = (req as any).user.id;

    // Check if RERA number is unique
    const existingRera = await prisma.property.findUnique({ where: { reraNumber } });
    if (existingRera) {
      res.status(400).json({ success: false, message: "RERA number already exists" });
      return;
    }

    const property = await prisma.property.create({
      data: {
        name,
        description,
        location,
        type,
        totalUnits,
        possessionDate: new Date(possessionDate),
        coverImage,
        reraNumber,
        builderId,
      },
    });

    res.status(201).json({ success: true, data: property });
  } catch (error) {
    console.error("Create Property Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getMyProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const builderId = (req as any).user.id;
    const properties = await prisma.property.findMany({
      where: { builderId },
      include: {
        updates: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
        _count: {
          select: { buyers: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: properties });
  } catch (error) {
    console.error("Get Properties Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getPropertyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as any;
    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      res.status(404).json({ success: false, message: "Property not found" });
      return;
    }

    // Check if the user has access
    const user = (req as any).user;
    if (user.role === "BUILDER" && property.builderId !== user.id) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    res.status(200).json({ success: true, data: property });
  } catch (error) {
    console.error("Get Property Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateProperty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as any;
    const updateData = req.body;

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      res.status(404).json({ success: false, message: "Property not found" });
      return;
    }

    if (property.builderId !== (req as any).user.id) {
      res.status(403).json({ success: false, message: "Not authorized to update this property" });
      return;
    }

    if (updateData.possessionDate) {
      updateData.possessionDate = new Date(updateData.possessionDate);
    }

    const updatedProperty = await prisma.property.update({
      where: { id: id as string },
      data: updateData,
    });

    res.status(200).json({ success: true, data: updatedProperty });
  } catch (error) {
    console.error("Update Property Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const linkBuyer = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyId = String(req.params.id);
    const { email } = req.body;
    const builderId = (req as any).user.id;

    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      res.status(404).json({ success: false, message: "Property not found" });
      return;
    }

    if (property.builderId !== builderId) {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ success: false, message: "User not found with this email" });
      return;
    }

    await prisma.property.update({
      where: { id: propertyId },
      data: {
        buyers: {
          connect: { id: user.id },
        },
      },
    });

    res.status(200).json({ success: true, message: "Buyer linked successfully" });
  } catch (error) {
    console.error("Link Buyer Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getLinkedBuyers = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyId = String(req.params.id);
    const builderId = (req as any).user.id;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        buyers: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!property) {
      res.status(404).json({ success: false, message: "Property not found" });
      return;
    }

    if (property.builderId !== builderId) {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    res.status(200).json({ success: true, data: (property as any).buyers });
  } catch (error) {
    console.error("Get Buyers Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** Get builder dashboard statistics */
const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const builderId = (req as any).user.id;

    const [propertyCount, buyerCount, draftUpdateCount] = await Promise.all([
      prisma.property.count({ where: { builderId } }),
      prisma.user.count({
        where: {
          role: "BUYER",
          purchasedProperties: { some: { builderId } },
        },
      }),
      prisma.propertyUpdate.count({
        where: {
          status: "DRAFT",
          property: { builderId },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProperties: propertyCount,
        totalBuyers: buyerCount,
        pendingDrafts: draftUpdateCount,
      },
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const propertyController = {
  createProperty,
  getMyProperties,
  getPropertyById,
  updateProperty,
  linkBuyer,
  getLinkedBuyers,
  getDashboardStats,
};
