import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { and, count, desc, eq, gt, lt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, charactersTable, generationsTable, profilesTable, projectsTable } from "@workspace/db";
import {
  CancelGenerationParams,
  CancelGenerationResponse,
  CreateCharacterBody,
  CreateCharacterResponse,
  CreateGenerationBody,
  CreateGenerationResponse,
  CreateProjectBody,
  CreateProjectResponse,
  GetDashboardResponse,
  ListCharactersResponse,
  ListGenerationsQueryParams,
  ListGenerationsResponse,
  ListProjectsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
let seedPromise: Promise<void> | null = null;

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

async function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const existing = await db.select({ id: projectsTable.id }).from(projectsTable).limit(1);
    if (existing.length > 0) return;

    const now = new Date();
    await db.insert(profilesTable).values({
      id: "guest-user",
      email: "guest@studio.local",
      displayName: "Guest creator",
      credits: 25,
    }).onConflictDoNothing();
    await db.insert(projectsTable).values([
      {
        id: "project-neon-rain",
        name: "Neon Rain / Mumbai",
        mode: "cinematic_story",
        updatedAt: new Date(now.getTime() - 1000 * 60 * 42),
        generationCount: 8,
      },
      {
        id: "project-monsoon",
        name: "Monsoon Letters",
        mode: "single_clip",
        updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 18),
        generationCount: 3,
      },
    ]);
    await db.insert(charactersTable).values([
      {
        id: "character-vikram",
        name: "Vikram",
        handle: "@Vikram",
        imageUrl: "",
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
      },
      {
        id: "character-anjali",
        name: "Anjali",
        handle: "@Anjali",
        imageUrl: "",
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      },
    ]);
    await db.insert(generationsTable).values([
      {
        id: "generation-rain",
        type: "video",
        prompt: "A lone cyclist glides through a neon monsoon, reflections folding into the night.",
        status: "generating",
        progress: 67,
        creditsUsed: 8,
        aspectRatio: "16:9",
        quality: "HD",
        duration: 8,
        projectId: "project-neon-rain",
        characterId: "character-vikram",
        createdAt: new Date(now.getTime() - 1000 * 60 * 3),
        expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
      },
      {
        id: "generation-portrait",
        type: "image",
        prompt: "Editorial portrait, rain on glass, sodium vapor light, quiet resolve.",
        status: "complete",
        progress: 100,
        creditsUsed: 4,
        aspectRatio: "1:1",
        quality: "2K",
        projectId: "project-neon-rain",
        characterId: "character-vikram",
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5),
        expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4),
      },
      {
        id: "generation-score",
        type: "audio",
        prompt: "A slow-burn cinematic score with tape hiss, distant tabla, and analog synth.",
        status: "complete",
        progress: 100,
        creditsUsed: 3,
        aspectRatio: "—",
        quality: "HD",
        projectId: "project-monsoon",
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 26),
        expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 6),
      },
    ]);
  })();
  return seedPromise;
}

router.get("/dashboard", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, "guest-user")).limit(1);
  const [{ value: totalGenerations }] = await db.select({ value: count() }).from(generationsTable);
  const [{ value: activeGenerations }] = await db
    .select({ value: count() })
    .from(generationsTable)
    .where(eq(generationsTable.status, "generating"));
  const [{ value: projects }] = await db.select({ value: count() }).from(projectsTable);
  const soon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
  const [{ value: expiringSoon }] = await db
    .select({ value: count() })
    .from(generationsTable)
    .where(and(
      eq(generationsTable.status, "complete"),
      gt(generationsTable.expiresAt, new Date()),
      lt(generationsTable.expiresAt, soon),
    ));
  res.json(GetDashboardResponse.parse({
    credits: profile?.credits ?? 25,
    activeGenerations: Number(activeGenerations),
    totalGenerations: Number(totalGenerations),
    projects: Number(projects),
    expiringSoon: Number(expiringSoon),
  }));
});

router.get("/projects", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const rows = await db.select().from(projectsTable).orderBy(desc(projectsTable.updatedAt));
  res.json(ListProjectsResponse.parse(rows.map((row) => ({
    ...row,
    updatedAt: row.updatedAt.toISOString(),
  }))));
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const project = {
    id: randomUUID(),
    name: parsed.data.name,
    mode: parsed.data.mode,
    updatedAt: new Date(),
    generationCount: 0,
    thumbnailUrl: null,
  };
  const [created] = await db.insert(projectsTable).values(project).returning();
  res.status(201).json(CreateProjectResponse.parse({ ...created, updatedAt: created.updatedAt.toISOString() }));
});

router.get("/characters", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const rows = await db.select().from(charactersTable).orderBy(desc(charactersTable.createdAt));
  res.json(ListCharactersResponse.parse(rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }))));
});

router.post("/characters", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCharacterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db.insert(charactersTable).values({
    id: randomUUID(),
    ...parsed.data,
    createdAt: new Date(),
  }).returning();
  res.status(201).json(CreateCharacterResponse.parse({ ...created, createdAt: created.createdAt.toISOString() }));
});

router.get("/generations", async (req, res): Promise<void> => {
  await ensureSeeded();
  const parsed = ListGenerationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = parsed.data.kind
    ? await db.select().from(generationsTable).where(eq(generationsTable.type, parsed.data.kind)).orderBy(desc(generationsTable.createdAt))
    : await db.select().from(generationsTable).orderBy(desc(generationsTable.createdAt));
  res.json(ListGenerationsResponse.parse(rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  }))));
});

router.post("/generations", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateGenerationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const now = new Date();
  const [created] = await db.insert(generationsTable).values({
    id: randomUUID(),
    type: parsed.data.type,
    prompt: parsed.data.prompt,
    status: "generating",
    progress: 8,
    creditsUsed: parsed.data.type === "video" ? 8 : parsed.data.type === "image" ? 4 : 3,
    aspectRatio: parsed.data.aspectRatio ?? (parsed.data.type === "audio" ? "—" : "16:9"),
    quality: parsed.data.quality ?? "HD",
    duration: parsed.data.duration ?? null,
    projectId: parsed.data.projectId ?? null,
    characterId: parsed.data.characterId ?? null,
    createdAt: now,
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
  }).returning();
  if (created.projectId) {
    await db.update(projectsTable).set({
      generationCount: sql`${projectsTable.generationCount} + 1`,
      updatedAt: now,
    }).where(eq(projectsTable.id, created.projectId));
  }
  res.status(201).json(CreateGenerationResponse.parse({
    ...created,
    createdAt: created.createdAt.toISOString(),
    expiresAt: created.expiresAt.toISOString(),
  }));
});

router.post("/generations/:id/cancel", requireAuth, async (req, res): Promise<void> => {
  const params = CancelGenerationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [updated] = await db.update(generationsTable).set({
    status: "cancelled",
  }).where(eq(generationsTable.id, params.data.id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Generation not found" });
    return;
  }
  res.json(CancelGenerationResponse.parse({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    expiresAt: updated.expiresAt.toISOString(),
  }));
});

export default router;