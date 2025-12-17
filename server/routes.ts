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
      const parsed = z
        .object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().min(1),
        })
        .parse(req.body);

      const { email, password, name } = parsed;

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
      const parsed = z
        .object({
          email: z.string().email(),
          password: z.string().min(6),
        })
        .parse(req.body);

      const { email, password } = parsed;

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
            // delete lessons of this removed module first
            const lessonsToDelete = await storage.getLessonsByModule(module.id);
            for (const lesson of lessonsToDelete) {
              await storage.deleteLesson(lesson.id);
            }
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

      res.json({ success: true });
    } catch (error) {
      console.error("Update course error:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  // =========================
  // 🗑️ Delete Course (cascade)
  // =========================
  app.delete("/api/courses/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // get all modules of the course
      const modules = await storage.getModulesByCourse(id);

      // delete all lessons of each module, then delete the module
      for (const module of modules) {
        const lessons = await storage.getLessonsByModule(module.id);
        for (const lesson of lessons) {
          await storage.deleteLesson(lesson.id);
        }
        await storage.deleteModule(module.id);
      }

      // finally delete the course
      const deletedCourse = await storage.deleteCourse(id);
      if (!deletedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete course error:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // =========================
  // 🎥 Community (placeholder)
  // =========================
  // Se você estiver usando vídeos da comunidade, aqui é onde
  // você adicionaria rotas usando insertCommunityVideoSchema.
  // Mantive sem implementação para não introduzir mudanças não solicitadas.

  // Done: return server
  return httpServer;
}
