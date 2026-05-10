import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/db";
import { MilestoneStage, UpdateStatus } from "@prisma/client";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const milestoneStages = [
  "FOUNDATION",
  "STRUCTURE",
  "BRICKWORK",
  "PLUMBING",
  "ELECTRICAL",
  "PLASTERING",
  "FLOORING",
  "FINISHING",
  "HANDOVER",
] as const;

export const createUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    stage: z.enum(milestoneStages, { error: "Invalid milestone stage" }),
    status: z.enum(["DRAFT", "PUBLISHED"]).optional().default("DRAFT"),
    photoUrls: z.array(z.string().url()).optional().default([]),
  }),
});

export const editUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    stage: z.enum(milestoneStages).optional(),
    status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
    photoUrls: z.array(z.string().url()).optional(),
  }),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Verify the property exists and belongs to the requesting builder */
async function verifyPropertyOwnership(
  propertyId: string,
  builderId: string,
  res: Response
): Promise<boolean> {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    res.status(404).json({ success: false, message: "Property not found" });
    return false;
  }
  if (property.builderId !== builderId) {
    res.status(403).json({ success: false, message: "Access denied" });
    return false;
  }
  return true;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/** POST /api/properties/:propertyId/updates */
const createUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyId = String(req.params.propertyId);
    const builderId = String(req.user!.id);

    if (!(await verifyPropertyOwnership(propertyId, builderId, res))) return;

    const { title, description, stage, status, photoUrls } = req.body;

    const update = await prisma.propertyUpdate.create({
      data: {
        title,
        description,
        stage: stage as MilestoneStage,
        status: (status ?? "DRAFT") as UpdateStatus,
        propertyId,
        photos: {
          create: (photoUrls ?? []).map((url: string) => ({ url })),
        },
      },
      include: { photos: true },
    });

    res.status(201).json({ success: true, data: update });
  } catch (error) {
    console.error("Create Update Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** GET /api/properties/:propertyId/updates */
const getUpdates = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyId = String(req.params.propertyId);
    const builderId = String(req.user!.id);

    if (!(await verifyPropertyOwnership(propertyId, builderId, res))) return;

    const updates = await prisma.propertyUpdate.findMany({
      where: { propertyId },
      include: { photos: true },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: updates });
  } catch (error) {
    console.error("Get Updates Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** GET /api/properties/:propertyId/updates/:id */
const getUpdateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyId = String(req.params.propertyId);
    const id = String(req.params.id);
    const builderId = String(req.user!.id);

    if (!(await verifyPropertyOwnership(propertyId, builderId, res))) return;

    const update = await prisma.propertyUpdate.findFirst({
      where: { id, propertyId },
      include: { photos: true },
    });

    if (!update) {
      res.status(404).json({ success: false, message: "Update not found" });
      return;
    }

    res.status(200).json({ success: true, data: update });
  } catch (error) {
    console.error("Get Update Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** PATCH /api/properties/:propertyId/updates/:id */
const updateUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyId = String(req.params.propertyId);
    const id = String(req.params.id);
    const builderId = String(req.user!.id);

    if (!(await verifyPropertyOwnership(propertyId, builderId, res))) return;

    const existing = await prisma.propertyUpdate.findFirst({ where: { id, propertyId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Update not found" });
      return;
    }

    const { title, description, stage, status, photoUrls } = req.body;

    // If photoUrls provided, replace all existing photos
    const updated = await prisma.propertyUpdate.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(stage !== undefined && { stage: stage as MilestoneStage }),
        ...(status !== undefined && { status: status as UpdateStatus }),
        ...(photoUrls !== undefined && {
          photos: {
            deleteMany: {},
            create: (photoUrls as string[]).map((url) => ({ url })),
          },
        }),
      },
      include: { photos: true },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Edit Update Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** PATCH /api/properties/:propertyId/updates/:id/publish */
const publishUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyId = String(req.params.propertyId);
    const id = String(req.params.id);
    const builderId = String(req.user!.id);

    if (!(await verifyPropertyOwnership(propertyId, builderId, res))) return;

    const existing = await prisma.propertyUpdate.findFirst({ where: { id, propertyId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Update not found" });
      return;
    }

    const updated = await prisma.propertyUpdate.update({
      where: { id },
      data: { status: "PUBLISHED" },
      include: { photos: true },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Publish Update Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** DELETE /api/properties/:propertyId/updates/:id */
const deleteUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    const propertyId = String(req.params.propertyId);
    const id = String(req.params.id);
    const builderId = String(req.user!.id);

    if (!(await verifyPropertyOwnership(propertyId, builderId, res))) return;

    const existing = await prisma.propertyUpdate.findFirst({ where: { id, propertyId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Update not found" });
      return;
    }

    await prisma.propertyUpdate.delete({ where: { id } });

    res.status(200).json({ success: true, message: "Update deleted successfully" });
  } catch (error) {
    console.error("Delete Update Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateController = {
  createUpdate,
  getUpdates,
  getUpdateById,
  updateUpdate,
  publishUpdate,
  deleteUpdate,
};
