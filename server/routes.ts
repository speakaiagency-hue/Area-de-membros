import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertCourseSchema, insertCommunityVideoSchema } from "@shared/schema";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Authentication Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Determine role
      const role = email.toLowerCase().includes("admin") ? "admin" : "user";

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role,
        avatar: "https://github.com/shadcn.png",
      });

      // Set session
      req.session.userId = user.id;

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    });
  });

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Course Routes
  app.get("/api/courses", requireAuth, async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      
      // Get modules and lessons for each course
      const coursesWithContent = await Promise.all(
        courses.map(async (course) => {
          const modules = await storage.getModulesByCourse(course.id);
          const modulesWithLessons = await Promise.all(
            modules.map(async (module) => {
              const lessons = await storage.getLessonsByModule(module.id);
              return { ...module, lessons };
            })
          );
          return { ...course, modules: modulesWithLessons };
        })
      );

      res.json(coursesWithContent);
    } catch (error) {
      console.error("Get courses error:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post("/api/courses", requireAdmin, async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.json(course);
    } catch (error) {
      console.error("Create course error:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { modules, ...courseData } = req.body;

      // Update course
      const course = await storage.updateCourse(id, courseData);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Handle modules if provided
      if (modules) {
        // Get existing modules
        const existingModules = await storage.getModulesByCourse(id);
        const existingModuleIds = new Set(existingModules.map(m => m.id));
        const newModuleIds = new Set(modules.map((m: any) => m.id).filter(Boolean));

        // Delete removed modules
        for (const module of existingModules) {
          if (!newModuleIds.has(module.id)) {
            await storage.deleteModule(module.id);
          }
        }

        // Update or create modules
        for (let i = 0; i < modules.length; i++) {
          const moduleData = modules[i];
          const { lessons, ...moduleFields } = moduleData;
          
          if (moduleData.id && existingModuleIds.has(moduleData.id)) {
            // Update existing module
            await storage.updateModule(moduleData.id, { ...moduleFields, order: i });
          } else {
            // Create new module
            const newModule = await storage.createModule({
              courseId: id,
              title: moduleFields.title,
              order: i,
            });
            moduleData.id = newModule.id;
          }

          // Handle lessons
          if (lessons) {
            const existingLessons = await storage.getLessonsByModule(moduleData.id);
            const existingLessonIds = new Set(existingLessons.map(l => l.id));
            const newLessonIds = new Set(lessons.map((l: any) => l.id).filter(Boolean));

            // Delete removed lessons
            for (const lesson of existingLessons) {
              if (!newLessonIds.has(lesson.id)) {
                await storage.deleteLesson(lesson.id);
              }
            }

            // Update or create lessons
            for (let j = 0; j < lessons.length; j++) {
              const lessonData = lessons[j];
              
              if (lessonData.id && existingLessonIds.has(lessonData.id)) {
                // Update existing lesson
                await storage.updateLesson(lessonData.id, { ...lessonData, order: j });
              } else {
                // Create new lesson
                await storage.createLesson({
                  moduleId: moduleData.id,
                  title: lessonData.title,
                  videoUrl: lessonData.videoUrl,
                  pdfUrl: lessonData.pdfUrl,
                  duration: lessonData.duration,
                  order: j,
                });
              }
            }
          }
        }
      }

      // Return updated course with modules and lessons
      const updatedModules = await storage.getModulesByCourse(id);
      const modulesWithLessons = await Promise.all(
        updatedModules.map(async (module) => {
          const lessons = await storage.getLessonsByModule(module.id);
          return { ...module, lessons };
        })
      );

      res.json({ ...course, modules: modulesWithLessons });
    } catch (error) {
      console.error("Update course error:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCourse(req.params.id);
      res.json({ message: "Course deleted" });
    } catch (error) {
      console.error("Delete course error:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Community Videos Routes
  app.get("/api/community-videos", requireAuth, async (req, res) => {
    try {
      const videos = await storage.getAllCommunityVideos();
      res.json(videos);
    } catch (error) {
      console.error("Get community videos error:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.post("/api/community-videos", requireAdmin, async (req, res) => {
    try {
      const videoData = insertCommunityVideoSchema.parse(req.body);
      const video = await storage.createCommunityVideo(videoData);
      res.json(video);
    } catch (error) {
      console.error("Create video error:", error);
      res.status(500).json({ message: "Failed to create video" });
    }
  });

  app.put("/api/community-videos/:id", requireAdmin, async (req, res) => {
    try {
      const video = await storage.updateCommunityVideo(req.params.id, req.body);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      console.error("Update video error:", error);
      res.status(500).json({ message: "Failed to update video" });
    }
  });

  app.delete("/api/community-videos/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCommunityVideo(req.params.id);
      res.json({ message: "Video deleted" });
    } catch (error) {
      console.error("Delete video error:", error);
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  // Enrollment Routes
  app.get("/api/enrollments", requireAuth, async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByUser(req.session.userId!);
      res.json(enrollments);
    } catch (error) {
      console.error("Get enrollments error:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", requireAuth, async (req, res) => {
    try {
      const { courseId } = req.body;
      const enrollment = await storage.createEnrollment({
        userId: req.session.userId!,
        courseId,
        progress: 0,
        completedLessons: [],
      });
      res.json(enrollment);
    } catch (error) {
      console.error("Create enrollment error:", error);
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  app.post("/api/enrollments/complete-lesson", requireAuth, async (req, res) => {
    try {
      const { courseId, lessonId } = req.body;

      // Validate required fields
      if (!courseId || !lessonId) {
        return res.status(400).json({ message: "Missing required fields: courseId and lessonId" });
      }

      const enrollment = await storage.markLessonComplete(req.session.userId!, courseId, lessonId);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found. Please enroll in the course first." });
      }

      res.json(enrollment);
    } catch (error) {
      console.error("Complete lesson error:", error);
      res.status(500).json({ message: "Failed to mark lesson as complete" });
    }
  });

  // Webhook endpoint for Kiwify integration
  app.post("/api/webhook/kiwify", async (req, res) => {
    try {
      // Validate webhook token for security
      // Kiwify sends token in query params or body
      const token = req.query.token || req.body.token;
      
      if (!token || token !== process.env.KIWIFY_WEBHOOK_SECRET) {
        return res.status(401).json({ message: "Invalid webhook token" });
      }

      // Log the webhook payload for debugging
      console.log("Kiwify webhook received:", JSON.stringify(req.body, null, 2));

      // Get courseId from query params (each Kiwify product has its own webhook URL)
      const courseId = req.query.courseId as string;

      // Kiwify sends data in different formats depending on the event
      // Common fields: Customer.email, order_id, Product.id, etc.
      const email = req.body.Customer?.email || req.body.customer_email || req.body.email;

      // Validate required fields
      if (!email) {
        return res.status(400).json({ message: "Missing required field: email" });
      }

      if (!courseId) {
        return res.status(400).json({ 
          message: "Missing courseId in URL. Use: /api/webhook/kiwify?token=XXX&courseId=YYY"
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Verify course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found", courseId });
      }
      
      let user = await storage.getUserByEmail(email);
      if (!user) {
        // Create user if doesn't exist
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        user = await storage.createUser({
          email,
          name: email.split("@")[0],
          password: hashedPassword,
          role: "user",
          avatar: "https://github.com/shadcn.png",
        });
      }

      // Check if already enrolled
      const existing = await storage.getEnrollment(user.id, courseId);
      if (existing) {
        return res.json({ message: "User already enrolled", enrollment: existing });
      }

      // Create enrollment
      const enrollment = await storage.createEnrollment({
        userId: user.id,
        courseId,
        progress: 0,
        completedLessons: [],
      });

      res.json({ message: "Enrollment created successfully", enrollment });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  return httpServer;
}
