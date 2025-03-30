import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  bio: text("bio").default(""),
  interests: text("interests").default(""),
  points: integer("points").default(0),
  isOrganizer: boolean("is_organizer").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  website: text("website").default(""),
  email: text("email").default(""),
  categories: text("categories").default(""),
  followers: integer("followers").default(0),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  organizerId: integer("organizer_id").notNull().references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  pointsValue: integer("points_value").default(0),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventParticipants = pgTable("event_participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").default("registered"), // registered, attended, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedOrganizations = pgTable("saved_organizations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
// Base user schema
const baseUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, points: true });

// User insert schema
export const insertUserSchema = baseUserSchema
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Organizer insert schema
export const insertOrganizerSchema = z.object({
  ...baseUserSchema.shape,
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  isOrganizer: z.literal(true),
  organization: z.object({
    name: z.string().min(2, "Organization name is required"),
    description: z.string().min(10, "Please provide a description"),
    website: z.string().optional(),
    email: z.string().email("Please provide a valid email").optional(),
    categories: z.string().optional(),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true, 
  createdAt: true,
  followers: true
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true
});

export const insertEventParticipantSchema = createInsertSchema(eventParticipants).omit({
  id: true,
  createdAt: true
});

export const insertSavedOrganizationSchema = createInsertSchema(savedOrganizations).omit({
  id: true,
  createdAt: true
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOrganizer = z.infer<typeof insertOrganizerSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventParticipant = typeof eventParticipants.$inferSelect;
export type InsertEventParticipant = z.infer<typeof insertEventParticipantSchema>;

export type SavedOrganization = typeof savedOrganizations.$inferSelect;
export type InsertSavedOrganization = z.infer<typeof insertSavedOrganizationSchema>;
