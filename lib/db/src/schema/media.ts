import { createInsertSchema } from "drizzle-zod";
import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: text("id").primaryKey(),
  email: text("email"),
  displayName: text("display_name").notNull().default("Guest creator"),
  credits: integer("credits").notNull().default(25),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectsTable = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  mode: varchar("mode", { length: 32 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  generationCount: integer("generation_count").notNull().default(0),
  thumbnailUrl: text("thumbnail_url"),
});

export const charactersTable = pgTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  handle: text("handle").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const generationsTable = pgTable("generations", {
  id: text("id").primaryKey(),
  type: varchar("type", { length: 16 }).notNull(),
  prompt: text("prompt").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("queued"),
  progress: integer("progress").notNull().default(0),
  creditsUsed: integer("credits_used").notNull().default(4),
  aspectRatio: varchar("aspect_ratio", { length: 16 }).notNull().default("16:9"),
  quality: varchar("quality", { length: 16 }).notNull().default("HD"),
  duration: integer("duration"),
  previewUrl: text("preview_url"),
  projectId: text("project_id"),
  characterId: text("character_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  createdAt: true,
});
export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  updatedAt: true,
});
export const insertCharacterSchema = createInsertSchema(charactersTable).omit({
  createdAt: true,
});
export const insertGenerationSchema = createInsertSchema(generationsTable).omit({
  createdAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof charactersTable.$inferSelect;
export type InsertGeneration = z.infer<typeof insertGenerationSchema>;
export type Generation = typeof generationsTable.$inferSelect;