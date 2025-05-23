import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, InsertOrganizer, InsertUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  if (!password) {
    throw new Error("Password cannot be empty");
  }
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  if (!supplied || !stored) {
    return false;
  }
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "community-connect-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if it's a regular user or organizer
      const isOrganizer = !!req.body.isOrganizer;
      const userDto = req.body;
      
      // Validate required fields
      if (!userDto.username || !userDto.password || !userDto.name || !userDto.email) {
        return res.status(400).json({ 
          message: "Missing required fields. Username, password, name, and email are required." 
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userDto.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(userDto.password);
      
      // Create the user object with only necessary fields to avoid
      // passing through unknown properties from the request
      const userToCreate = {
        username: userDto.username,
        name: userDto.name,
        email: userDto.email,
        bio: userDto.bio || "",
        interests: userDto.interests || "",
        isOrganizer: isOrganizer,
        password: hashedPassword
      };
      
      // Extract organization data if user is an organizer
      let organizationData = null;
      if (isOrganizer && userDto.organization) {
        organizationData = {
          name: userDto.organization.name,
          description: userDto.organization.description,
          website: userDto.organization.website || "",
          email: userDto.organization.email || "",
          categories: userDto.organization.categories || ""
        };
      }
      
      const user = await storage.createUser(userToCreate);
      
      // Create organization for organizer
      if (isOrganizer && organizationData) {
        await storage.createOrganization({
          ...organizationData,
          userId: user.id
        });
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send password back to client
        const userResponse = { ...user };
        delete userResponse.password;
        
        res.status(201).json(userResponse);
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send password back to client
        const userResponse = { ...user };
        delete userResponse.password;
        
        res.status(200).json(userResponse);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Don't send password back to client
    const userResponse = { ...req.user };
    delete userResponse.password;
    
    res.json(userResponse);
  });
}
