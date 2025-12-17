// server/routes.ts
import type { Express } from "express";
import type { Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { insertCourseSchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // 🔐 Auth
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) return res.status(400).json({ message: "User already exists" });

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
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar });
  });

  // 🔒 Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
    next();
  };

  // 📚 Courses
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

  // Sincronização de curso + módulos + aulas
  app.put("/api/courses/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { modules, ...courseData } = req.body;
      const course = await storage.updateCourse(id, courseData);
      if (!course) return res.status(404).json({ message: "Course not found" });

      if (modules && Array.isArray(modules)) {
        const existingModules = await storage.getModulesByCourse(id);
        const existingModuleIds = new Set(existingModules.map((m) => m.id));
        const newModuleIds = new Set(modules.map((m: any) => m.id).filter(Boolean));

        // Remover módulos que não estão mais presentes
        for (const module of existingModules) {
          if (!newModuleIds.has(module.id)) {
            const lessons = await storage.getLessonsByModule(module.id);
            for (const lesson of lessons) await storage.deleteLesson(lesson.id);
            await storage.deleteModule(module.id);
          }
        }

        // Criar/atualizar módulos e suas aulas
        for (let i = 0; i < modules.length; i++) {
          const moduleData = modules[i];
          const { lessons, ...moduleFields } = moduleData;

          if (moduleData.id && existingModuleIds.has(moduleData.id)) {
            await storage.updateModule(moduleData.id, { ...moduleFields, order: i });
          } else {
            const newModule = await storage.createModule({ courseId: id, title: moduleFields.title, order: i });
            moduleData.id = newModule.id;
          }

          if (lessons && Array.isArray(lessons)) {
            const existingLessons = await storage.getLessonsByModule(moduleData.id);
            const existingLessonIds = new Set(existingLessons.map((l) => l.id));
            const newLessonIds = new Set(lessons.map((l: any) => l.id).filter(Boolean));

            // Remover aulas que não estão mais presentes
            for (const lesson of existingLessons) {
              if (!newLessonIds.has(lesson.id)) await storage.deleteLesson(lesson.id);
            }

            // Criar/atualizar aulas
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

  app.delete("/api/courses/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const modules = await storage.getModulesByCourse(id);
      for (const module of modules) {
        const lessons = await storage.getLessonsByModule(module.id);
        for (const lesson of lessons) await storage.deleteLesson(lesson.id);
        await storage.deleteModule(module.id);
      }
      const deletedCourse = await storage.deleteCourse(id);
      if (!deletedCourse) return res.status(404).json({ message: "Course not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Delete course error:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // 📦 Modules
  app.post("/api/modules", requireAdmin, async (req, res) => {
    try {
      const module = await storage.createModule(req.body);
      res.json(module);
    } catch (error) {
      console.error("Create module error:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  app.put("/api/modules/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const module = await storage.updateModule(id, req.body);
      if (!module) return res.status(404).json({ message: "Module not found" });
      res.json(module);
    } catch (error) {
      console.error("Update module error:", error);
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  app.delete("/api/modules/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const lessons = await storage.getLessonsByModule(id);
      for (const lesson of lessons) await storage.deleteLesson(lesson.id);
      await storage.deleteModule(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete module error:", error);
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  // 🎬 Lessons
  app.post("/api/lessons", requireAdmin, async (req, res) => {
    try {
      const lesson = await storage.createLesson(req.body);
      res.json(lesson);
    } catch (error) {
      console.error("Create lesson error:", error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  app.put("/api/lessons/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const lesson = await storage.updateLesson(id, req.body);
      if (!lesson) return res.status(404).json({ message: "Lesson not found" });
      res.json(lesson);
    } catch (error) {
      console.error("Update lesson error:", error);
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  app.delete("/api/lessons/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLesson(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete lesson error:", error);
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  });

  // 🎥 Community Videos
  app.get("/api/community-videos", requireAuth, async (_req, res) => {
    try {
      const videos = await storage.getAllCommunityVideos();
      res.json(videos);
    } catch (error) {
      console.error("Get community videos error:", error);
      res.status(500).json({ message: "Failed to fetch community videos" });
    }
  });

  app.post("/api/community-videos", requireAuth, async (req, res) => {
    try {
      const video = await storage.createCommunityVideo(req.body);
      res.json(video);
    } catch (error) {
      console.error("Create community video error:", error);
      res.status(500).json({ message: "Failed to create community video" });
    }
  });

  app.put("/api/community-videos/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const video = await storage.updateCommunityVideo(id, req.body);
      if (!video) return res.status(404).json({ message: "Community video not found" });
      res.json(video);
    } catch (error) {
      console.error("Update community video error:", error);
      res.status(500).json({ message: "Failed to update community video" });
    }
  });

  app.delete("/api/community-videos/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCommunityVideo(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete community video error:", error);
      res.status(500).json({ message: "Failed to delete community video" });
    }
  });

  // 🎓 Enrollments
  app.get("/api/enrollments", requireAuth, async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByUser(req.session.userId);
      res.json(enrollments);
    } catch (error) {
      console.error("Get enrollments error:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", requireAuth, async (req, res) => {
    try {
      const { courseId } = req.body;
      const enrollment = await storage.createEnrollment({ userId: req.session.userId, courseId });
      res.json(enrollment);
    } catch (error) {
      console.error("Create enrollment error:", error);
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  app.delete("/api/enrollments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEnrollment(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete enrollment error:", error);
      res.status(500).json({ message: "Failed to delete enrollment" });
    }
  });

  app.post("/api/enrollments/complete-lesson", requireAuth, async (req, res) => {
    try {
      const { courseId, lessonId } = req.body;
      await storage.markLessonComplete({ userId: req.session.userId, courseId, lessonId });
      res.json({ success: true });
    } catch (error) {
      console.error("Complete lesson error:", error);
      res.status(500).json({ message: "Failed to complete lesson" });
    }
  });

  // 👤 Profile
  app.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const { name, avatar } = req.body;
      const updated = await storage.updateUser(req.session.userId, { name, avatar });
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role, avatar: updated.avatar });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // 🔔 Kiwify Webhook (real)
  app.post("/api/webhook/kiwify", async (req, res) => {
    try {
      const event = req.body;

      // Exemplos de campos esperados (ajuste conforme payload da Kiwify)
      // event.type: "order.completed" | ...
      // event.data: { customer_email, product_id, courseId?, ... }
      if (!event || !event.type || !event.data) {
        return res.status(400).json({ message: "Invalid webhook payload" });
      }

      if (event.type === "order.completed") {
        const customerEmail: string = event.data.customer_email;
        const productId: string | undefined = event.data.product_id;
        const courseIdFromPayload: string | undefined = event.data.courseId;

        // obter curso: via courseId direto ou via productId mapeado para curso
        let courseId: string | undefined = courseIdFromPayload;

        if (!courseId && productId && typeof storage.getCourseByExternalId === "function") {
          const course = await storage.getCourseByExternalId(productId);
          courseId = course?.id;
        }

        if (!courseId) {
          console.warn("Webhook received but courseId could not be resolved.");
          return res.status(200).json({ received: true, note: "courseId not resolved" });
        }

        // garantir usuário
        let user = await storage.getUserByEmail(customerEmail);
        if (!user) {
          const randomPass = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
          const username = customerEmail.split("@")[0];
          user = await storage.createUser({
            email: customerEmail,
            password: randomPass,
            name: username,
            role: "user",
            avatar: "https://github.com/shadcn.png",
            username,
          });
        }

        // criar matrícula se não existir
        const existingEnrollments = await storage.getEnrollmentsByUser(user.id);
        const alreadyEnrolled = existingEnrollments.some((enr: any) => enr.courseId === courseId);
        if (!alreadyEnrolled) {
          await storage.createEnrollment({ userId: user.id, courseId });
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook Kiwify error:", error);
      res.status(400).json({ message: "Webhook handler failed" });
    }
  });

  return httpServer;
}
