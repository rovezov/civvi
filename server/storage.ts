import { 
  users, 
  organizations, 
  events, 
  eventParticipants, 
  savedOrganizations,
  type User, 
  type InsertUser,
  type Organization,
  type InsertOrganization,
  type Event,
  type InsertEvent,
  type EventParticipant,
  type InsertEventParticipant,
  type SavedOrganization,
  type InsertSavedOrganization
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Organization methods
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationByUserId(userId: number): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, org: Partial<Organization>): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  searchOrganizations(query: string): Promise<Organization[]>;
  
  // Event methods
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByOrganizerId(organizerId: number): Promise<Event[]>;
  getUpcomingEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  
  // Event Participant methods
  addEventParticipant(participant: InsertEventParticipant): Promise<EventParticipant>;
  getEventParticipants(eventId: number): Promise<EventParticipant[]>;
  getUserEvents(userId: number): Promise<Event[]>;
  
  // Saved organization methods
  saveOrganization(savedOrg: InsertSavedOrganization): Promise<SavedOrganization>;
  getSavedOrganizations(userId: number): Promise<Organization[]>;
  unsaveOrganization(userId: number, organizationId: number): Promise<void>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private organizationsMap: Map<number, Organization>;
  private eventsMap: Map<number, Event>;
  private eventParticipantsMap: Map<number, EventParticipant>;
  private savedOrganizationsMap: Map<number, SavedOrganization>;
  
  private userIdCounter: number;
  private orgIdCounter: number;
  private eventIdCounter: number;
  private eventParticipantIdCounter: number;
  private savedOrgIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.usersMap = new Map();
    this.organizationsMap = new Map();
    this.eventsMap = new Map();
    this.eventParticipantsMap = new Map();
    this.savedOrganizationsMap = new Map();
    
    this.userIdCounter = 1;
    this.orgIdCounter = 1;
    this.eventIdCounter = 1;
    this.eventParticipantIdCounter = 1;
    this.savedOrgIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: Omit<InsertUser, "confirmPassword">): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { 
      id, 
      ...insertUser, 
      points: 0,
      createdAt 
    };
    this.usersMap.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  // Organization methods
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizationsMap.get(id);
  }

  async getOrganizationByUserId(userId: number): Promise<Organization | undefined> {
    return Array.from(this.organizationsMap.values()).find(
      (org) => org.userId === userId
    );
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const id = this.orgIdCounter++;
    const organization: Organization = { 
      id, 
      ...org, 
      followers: 0
    };
    this.organizationsMap.set(id, organization);
    return organization;
  }

  async updateOrganization(id: number, orgData: Partial<Organization>): Promise<Organization | undefined> {
    const org = this.organizationsMap.get(id);
    if (!org) return undefined;
    
    const updatedOrg = { ...org, ...orgData };
    this.organizationsMap.set(id, updatedOrg);
    return updatedOrg;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizationsMap.values());
  }

  async searchOrganizations(query: string): Promise<Organization[]> {
    query = query.toLowerCase();
    return Array.from(this.organizationsMap.values()).filter(org => 
      org.name.toLowerCase().includes(query) || 
      org.description.toLowerCase().includes(query) ||
      org.categories.toLowerCase().includes(query)
    );
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    return this.eventsMap.get(id);
  }

  async getEventsByOrganizerId(organizerId: number): Promise<Event[]> {
    return Array.from(this.eventsMap.values()).filter(
      (event) => event.organizerId === organizerId
    );
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date();
    return Array.from(this.eventsMap.values())
      .filter(event => new Date(event.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const createdAt = new Date();
    const event: Event = { id, ...eventData, createdAt };
    this.eventsMap.set(id, event);
    return event;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = this.eventsMap.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventData };
    this.eventsMap.set(id, updatedEvent);
    return updatedEvent;
  }

  // Event Participant methods
  async addEventParticipant(participant: InsertEventParticipant): Promise<EventParticipant> {
    const id = this.eventParticipantIdCounter++;
    const createdAt = new Date();
    const eventParticipant: EventParticipant = { id, ...participant, createdAt };
    this.eventParticipantsMap.set(id, eventParticipant);
    return eventParticipant;
  }

  async getEventParticipants(eventId: number): Promise<EventParticipant[]> {
    return Array.from(this.eventParticipantsMap.values()).filter(
      (participant) => participant.eventId === eventId
    );
  }

  async getUserEvents(userId: number): Promise<Event[]> {
    const userParticipations = Array.from(this.eventParticipantsMap.values()).filter(
      (participant) => participant.userId === userId
    );
    
    const eventIds = userParticipations.map(p => p.eventId);
    
    return Array.from(this.eventsMap.values()).filter(
      (event) => eventIds.includes(event.id)
    );
  }

  // Saved organization methods
  async saveOrganization(savedOrg: InsertSavedOrganization): Promise<SavedOrganization> {
    const id = this.savedOrgIdCounter++;
    const createdAt = new Date();
    const savedOrganization: SavedOrganization = { id, ...savedOrg, createdAt };
    this.savedOrganizationsMap.set(id, savedOrganization);
    
    // Increment followers count for the organization
    const org = await this.getOrganization(savedOrg.organizationId);
    if (org) {
      await this.updateOrganization(org.id, { followers: org.followers + 1 });
    }
    
    return savedOrganization;
  }

  async getSavedOrganizations(userId: number): Promise<Organization[]> {
    const savedOrgs = Array.from(this.savedOrganizationsMap.values()).filter(
      (saved) => saved.userId === userId
    );
    
    const orgIds = savedOrgs.map(s => s.organizationId);
    
    return Array.from(this.organizationsMap.values()).filter(
      (org) => orgIds.includes(org.id)
    );
  }

  async unsaveOrganization(userId: number, organizationId: number): Promise<void> {
    const savedOrg = Array.from(this.savedOrganizationsMap.values()).find(
      (saved) => saved.userId === userId && saved.organizationId === organizationId
    );
    
    if (savedOrg) {
      this.savedOrganizationsMap.delete(savedOrg.id);
      
      // Decrement followers count for the organization
      const org = await this.getOrganization(organizationId);
      if (org && org.followers > 0) {
        await this.updateOrganization(org.id, { followers: org.followers - 1 });
      }
    }
  }
}

export const storage = new MemStorage();
