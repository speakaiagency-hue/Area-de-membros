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
  // =========================
  // 🔐 Authentication Routes
  // =========================
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const role = email.toLowerCase().includes("admin") ? "admin" : "user";
      const username = email.split("@")[0];

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role,
        avatar: "https://github.com/shadcn.png",
        username,
      });

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
      res.clearCookie("connect.sid");
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

  // =========================
  // 🔒 Middleware
  // =========================
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

  // =========================
  // 👤 Profile Routes
  // =========================
  app.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const { name, avatar } = req.body;
      const userId = req.session.userId;

      const updatedUser = await storage.updateUser(userId, { name, avatar });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // =========================
  // 📚 Course Routes
  // =========================
  app.get("/api/courses", requireAuth, async (_req, res) => {
    try {
      const courses = await storage.getAllCourses();
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
        const existingModules = await storage.getModulesByCourse(id);
        const existingModuleIds = new Set(existingModules.map((m) => m.id));
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
            await storage.updateModule(moduleData.id, { ...moduleFields, order: i });
          } else {
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
            const existingLessonIds = new Set(existingLessons.map((l) => l.id));
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
                await storage.updateLesson(lessonData.id, { ...lessonData, order: j });
              } else {
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

  // =========================
  // 🌐 Kiwify Webhook (Inscrição automática)
  // =========================
  app.post("/api/webhooks/kiwify", async (req, res) => {
    try {
      let { email, courseId } = req.body;

      // fallback para courseId em metadata/custom_fields/body/Product.metadata
      if (!courseId) {
        courseId =
          req.body.metadata?.courseId ||
          req.body.custom_fields?.courseId ||
          req.body.courseId ||
          req.body.Product?.metadata?.courseId;
      }

      // fallback via env mapping
      if (!courseId && req.body.Product?.id && process.env.KIWIFY_PRODUCT_MAPPING) {
        try {
          const mapping = JSON.parse(process.env.KIWIFY_PRODUCT_MAPPING);
          courseId = mapping[req.body.Product.id];
        } catch (e) {
          console.error("Error parsing KIWIFY_PRODUCT_MAPPING:", e);
        }
      }

      if (!email) {
        return res.status(400).json({ message: "Missing required field: email" });
      }

      if (!courseId) {
        return res.status(400).json({
          message:
            "Missing courseId. Please configure one of: URL param, webhook metadata, or KIWIFY_PRODUCT_MAPPING",
          receivedProductId: req.body.Product?.id,
          hint: "Add ?courseId=XXX to webhook URL or configure KIWIFY_PRODUCT_MAPPING",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found", courseId });
      }

      let user = await storage.getUserByEmail(email);
      if (!user) {
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

      const existing = await storage.getEnrollment(user.id, courseId);
      if (existing) {
        return res.json({ message: "User already enrolled", enrollment: existing });
      }

      const enrollment = await storage.createEnrollment({
        userId: user.id,
        courseId,
      });

      res.json({ message: "Enrollment created", enrollment });
    } catch (error) {
      console.error("Kiwify webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  return httpServer;
}
