import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  Course,
  InsertCourse,
  Module,
  InsertModule,
  Lesson,
  InsertLesson,
  CommunityVideo,
  InsertCommunityVideo,
  Enrollment,
  InsertEnrollment,
} from "@shared/schema";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle(pool, { schema });

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Course operations
  getAllCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<void>;
  
  // Module operations
  getModulesByCourse(courseId: string): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: string, module: Partial<InsertModule>): Promise<Module | undefined>;
  deleteModule(id: string): Promise<void>;
  
  // Lesson operations
  getLessonsByModule(moduleId: string): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: string): Promise<void>;
  
  // Community Video operations
  getAllCommunityVideos(): Promise<CommunityVideo[]>;
  getCommunityVideo(id: string): Promise<CommunityVideo | undefined>;
  createCommunityVideo(video: InsertCommunityVideo): Promise<CommunityVideo>;
  updateCommunityVideo(id: string, video: Partial<InsertCommunityVideo>): Promise<CommunityVideo | undefined>;
  deleteCommunityVideo(id: string): Promise<void>;
  
  // Enrollment operations
  getEnrollmentsByUser(userId: string): Promise<Enrollment[]>;
  getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: string, enrollment: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;
  markLessonComplete(userId: string, courseId: string, lessonId: string): Promise<Enrollment | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  // Course operations
  async getAllCourses(): Promise<Course[]> {
    return db.select().from(schema.courses).orderBy(desc(schema.courses.createdAt));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, id)).limit(1);
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(schema.courses).values(course).returning();
    return newCourse;
  }

  async updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updated] = await db.update(schema.courses).set(course).where(eq(schema.courses.id, id)).returning();
    return updated;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(schema.courses).where(eq(schema.courses.id, id));
  }

  // Module operations
  async getModulesByCourse(courseId: string): Promise<Module[]> {
    return db.select().from(schema.modules).where(eq(schema.modules.courseId, courseId)).orderBy(schema.modules.order);
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(schema.modules).values(module).returning();
    return newModule;
  }

  async updateModule(id: string, module: Partial<InsertModule>): Promise<Module | undefined> {
    const [updated] = await db.update(schema.modules).set(module).where(eq(schema.modules.id, id)).returning();
    return updated;
  }

  async deleteModule(id: string): Promise<void> {
    await db.delete(schema.modules).where(eq(schema.modules.id, id));
  }

  // Lesson operations
  async getLessonsByModule(moduleId: string): Promise<Lesson[]> {
    return db.select().from(schema.lessons).where(eq(schema.lessons.moduleId, moduleId)).orderBy(schema.lessons.order);
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(schema.lessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [updated] = await db.update(schema.lessons).set(lesson).where(eq(schema.lessons.id, id)).returning();
    return updated;
  }

  async deleteLesson(id: string): Promise<void> {
    await db.delete(schema.lessons).where(eq(schema.lessons.id, id));
  }

  // Community Video operations
  async getAllCommunityVideos(): Promise<CommunityVideo[]> {
    return db.select().from(schema.communityVideos).orderBy(desc(schema.communityVideos.createdAt));
  }

  async getCommunityVideo(id: string): Promise<CommunityVideo | undefined> {
    const [video] = await db.select().from(schema.communityVideos).where(eq(schema.communityVideos.id, id)).limit(1);
    return video;
  }

  async createCommunityVideo(video: InsertCommunityVideo): Promise<CommunityVideo> {
    const [newVideo] = await db.insert(schema.communityVideos).values(video).returning();
    return newVideo;
  }

  async updateCommunityVideo(id: string, video: Partial<InsertCommunityVideo>): Promise<CommunityVideo | undefined> {
    const [updated] = await db.update(schema.communityVideos).set(video).where(eq(schema.communityVideos.id, id)).returning();
    return updated;
  }

  async deleteCommunityVideo(id: string): Promise<void> {
    await db.delete(schema.communityVideos).where(eq(schema.communityVideos.id, id));
  }

  // Enrollment operations
  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    return db.select().from(schema.enrollments).where(eq(schema.enrollments.userId, userId));
  }

  async getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(schema.enrollments)
      .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)))
      .limit(1);
    return enrollment;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(schema.enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async updateEnrollment(id: string, enrollment: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const [updated] = await db.update(schema.enrollments).set(enrollment).where(eq(schema.enrollments.id, id)).returning();
    return updated;
  }

  async markLessonComplete(userId: string, courseId: string, lessonId: string): Promise<Enrollment | undefined> {
    const enrollment = await this.getEnrollment(userId, courseId);
    if (!enrollment) return undefined;

    // Validate that the lesson belongs to this course
    const modules = await this.getModulesByCourse(courseId);
    let lessonExists = false;
    let totalLessons = 0;
    
    for (const module of modules) {
      const lessons = await this.getLessonsByModule(module.id);
      totalLessons += lessons.length;
      if (lessons.some(l => l.id === lessonId)) {
        lessonExists = true;
      }
    }

    // If lesson doesn't belong to this course, return undefined
    if (!lessonExists) {
      return undefined;
    }

    // If already completed, return current enrollment
    if (enrollment.completedLessons.includes(lessonId)) {
      return enrollment;
    }

    const completedLessons = [...enrollment.completedLessons, lessonId];
    const progress = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

    const [updated] = await db.update(schema.enrollments)
      .set({ completedLessons, progress })
      .where(eq(schema.enrollments.id, enrollment.id))
      .returning();
    
    return updated;
  }
}

export const storage = new DatabaseStorage();
