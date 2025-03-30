import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { insertEventSchema, insertSavedOrganizationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Error handler for Zod validation errors
  const handleZodError = (error: any, res: any) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    throw error;
  };
  
  // Organization routes
  app.get("/api/organizations", async (req, res) => {
    try {
      const searchQuery = req.query.search as string;
      let organizations;
      
      if (searchQuery) {
        organizations = await storage.searchOrganizations(searchQuery);
      } else {
        organizations = await storage.getAllOrganizations();
      }
      
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });
  
  app.get("/api/organizations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });
  
  app.put("/api/organizations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Check if user owns this organization
      if (organization.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this organization" });
      }
      
      const updatedOrg = await storage.updateOrganization(id, req.body);
      res.json(updatedOrg);
    } catch (error) {
      res.status(500).json({ message: "Failed to update organization" });
    }
  });
  
  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const organizerId = req.query.organizerId ? parseInt(req.query.organizerId as string) : undefined;
      
      let events;
      if (organizerId) {
        events = await storage.getEventsByOrganizerId(organizerId);
      } else {
        events = await storage.getUpcomingEvents();
      }
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
  app.get("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });
  
  app.post("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Check if user is an organizer
      if (!req.user.isOrganizer) {
        return res.status(403).json({ message: "Only organizers can create events" });
      }
      
      // Validate event data
      const eventData = insertEventSchema.parse({
        ...req.body,
        organizerId: req.user.id
      });
      
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });
  
  app.put("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if user owns this event
      if (event.organizerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this event" });
      }
      
      const updatedEvent = await storage.updateEvent(id, req.body);
      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update event" });
    }
  });
  
  // Event registration routes
  app.post("/api/events/:id/register", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if user is already registered
      const participants = await storage.getEventParticipants(eventId);
      const alreadyRegistered = participants.some(p => p.userId === req.user.id);
      
      if (alreadyRegistered) {
        return res.status(400).json({ message: "Already registered for this event" });
      }
      
      // Register user for the event
      const participant = await storage.addEventParticipant({
        eventId,
        userId: req.user.id,
        status: "registered"
      });
      
      res.status(201).json(participant);
    } catch (error) {
      res.status(500).json({ message: "Failed to register for event" });
    }
  });
  
  app.get("/api/user/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const events = await storage.getUserEvents(req.user.id);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user events" });
    }
  });
  
  // Saved organizations routes
  app.get("/api/user/saved-organizations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const organizations = await storage.getSavedOrganizations(req.user.id);
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved organizations" });
    }
  });
  
  app.post("/api/organizations/:id/save", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const organizationId = parseInt(req.params.id);
      const organization = await storage.getOrganization(organizationId);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Check if already saved
      const savedOrgs = await storage.getSavedOrganizations(req.user.id);
      const alreadySaved = savedOrgs.some(org => org.id === organizationId);
      
      if (alreadySaved) {
        return res.status(400).json({ message: "Organization already saved" });
      }
      
      // Validate and save
      const savedOrg = insertSavedOrganizationSchema.parse({
        userId: req.user.id,
        organizationId
      });
      
      const result = await storage.saveOrganization(savedOrg);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      res.status(500).json({ message: "Failed to save organization" });
    }
  });
  
  app.delete("/api/organizations/:id/unsave", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const organizationId = parseInt(req.params.id);
      
      await storage.unsaveOrganization(req.user.id, organizationId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to unsave organization" });
    }
  });
  
  // User profile routes
  app.put("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const updatedUser = await storage.updateUser(req.user.id, {
        name: req.body.name,
        bio: req.body.bio,
        interests: req.body.interests
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password back
      const userResponse = { ...updatedUser };
      delete userResponse.password;
      
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
