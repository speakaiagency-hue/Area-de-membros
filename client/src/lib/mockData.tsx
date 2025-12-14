import { createContext, useContext, useState, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import cover1 from "@assets/generated_images/abstract_3d_geometric_shapes_with_blue_purple_gradient.png";
import cover2 from "@assets/generated_images/minimalist_bright_business_workspace.png";
import cover3 from "@assets/generated_images/futuristic_digital_data_visualization.png";

// --- Types ---

export type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
};

export type Lesson = {
  id: string;
  title: string;
  videoUrl: string; // For mockup, we can use YouTube embed links or placeholders
  pdfUrl?: string;
  duration: string;
};

export type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  author: string;
  modules: Module[];
};

export type Enrollment = {
  userId: string;
  courseId: string;
  progress: number; // 0-100
  completedLessons: string[]; // Array of lesson IDs
};

// --- Mock Data ---

const INITIAL_COURSES: Course[] = [
  {
    id: "c1",
    title: "Mastering Digital Marketing",
    description: "Learn how to dominate social media, SEO, and paid advertising strategies in 2025.",
    coverImage: cover1,
    author: "Marketing Pro",
    modules: [
      {
        id: "m1",
        title: "Foundation of Marketing",
        lessons: [
          { id: "l1", title: "Welcome to the Course", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "5:00" },
          { id: "l2", title: "Understanding the Funnel", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "12:30", pdfUrl: "#" },
        ],
      },
      {
        id: "m2",
        title: "Social Media Strategy",
        lessons: [
          { id: "l3", title: "Instagram Growth Hacks", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "15:00" },
        ],
      },
    ],
  },
  {
    id: "c2",
    title: "Modern Web Development",
    description: "Full stack development with React, Node.js, and modern tools for building scalable apps.",
    coverImage: cover3,
    author: "Dev Master",
    modules: [
      {
        id: "m1",
        title: "React Basics",
        lessons: [
          { id: "l4", title: "Components & Props", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "10:00" },
        ],
      },
    ],
  },
  {
    id: "c3",
    title: "Productivity for Entrepreneurs",
    description: "Optimize your workspace and workflow to get more done in less time.",
    coverImage: cover2,
    author: "Productivity Guru",
    modules: [],
  },
];

const MOCK_ADMIN: User = {
  id: "admin1",
  name: "Admin User",
  email: "speakai.agency@gmail.com",
  role: "admin",
  avatar: "https://github.com/shadcn.png",
};

const MOCK_USER: User = {
  id: "user1",
  name: "Student User",
  email: "student@example.com",
  role: "user",
  avatar: "https://github.com/shadcn.png",
};

// --- Context ---

type AppContextType = {
  user: User | null;
  courses: Course[];
  enrollments: Enrollment[];
  login: (email: string, role?: "user" | "admin") => void;
  logout: () => void;
  updateCourse: (course: Course) => void;
  addCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  markLessonComplete: (courseId: string, lessonId: string) => void;
  simulateWebhook: (email: string, courseId: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const { toast } = useToast();

  const login = (email: string, role: "user" | "admin" = "user") => {
    if (role === "admin") {
      setUser(MOCK_ADMIN);
      toast({ title: "Welcome back, Admin!", description: "You have full access." });
    } else {
      setUser({ ...MOCK_USER, email });
      toast({ title: "Welcome back!", description: "Ready to learn?" });
    }
  };

  const logout = () => {
    setUser(null);
    toast({ title: "Logged out", description: "See you soon!" });
  };

  const updateCourse = (updatedCourse: Course) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
    );
    toast({ title: "Success", description: "Course updated successfully." });
  };

  const addCourse = (newCourse: Course) => {
    setCourses((prev) => [...prev, newCourse]);
    toast({ title: "Success", description: "New course added." });
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Success", description: "Course deleted successfully." });
  };

  const markLessonComplete = (courseId: string, lessonId: string) => {
    if (!user) return;

    setEnrollments((prev) => {
      const existing = prev.find((e) => e.courseId === courseId && e.userId === user.id);
      
      if (existing) {
        if (existing.completedLessons.includes(lessonId)) return prev;
        
        const newCompleted = [...existing.completedLessons, lessonId];
        // Calculate progress (simplified)
        const course = courses.find(c => c.id === courseId);
        const totalLessons = course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) || 1;
        const progress = Math.round((newCompleted.length / totalLessons) * 100);

        return prev.map(e => e.courseId === courseId && e.userId === user.id ? { ...e, completedLessons: newCompleted, progress } : e);
      } else {
        // Create new enrollment if somehow missing (shouldn't happen in this logic flow usually)
        return [...prev, { userId: user.id, courseId, progress: 0, completedLessons: [lessonId] }];
      }
    });
  };

  const simulateWebhook = (email: string, courseId: string) => {
    // In a real app, this would happen on the backend.
    // Here we just find the user (or pretend to) and add an enrollment.
    
    // For the mockup, we'll just enroll the CURRENT user or the MOCK_USER if logged out for demo purposes
    const targetUserId = user?.id || MOCK_USER.id;
    
    setEnrollments((prev) => {
      if (prev.find(e => e.userId === targetUserId && e.courseId === courseId)) {
        toast({ title: "Already Enrolled", description: "User already has access to this course." });
        return prev;
      }
      return [...prev, { userId: targetUserId, courseId, progress: 0, completedLessons: [] }];
    });
    
    toast({ title: "Webhook Received", description: `Access granted to course ${courseId} for ${email}` });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        courses,
        enrollments,
        login,
        logout,
        updateCourse,
        addCourse,
        deleteCourse,
        markLessonComplete,
        simulateWebhook,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
