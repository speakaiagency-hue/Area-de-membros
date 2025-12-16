import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User, Course, Module, Lesson, CommunityVideo, Enrollment } from "@shared/schema";

const API_URL = "https://area-de-membros-niuz.onrender.com";

// Type for Course with modules and lessons
export type CourseWithContent = Course & {
  modules: (Module & { lessons: Lesson[] })[];
};

// Auth API
async function fetchWithCredentials(url: string, options?: RequestInit) {
  const response = await fetch(API_URL + url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

// Auth hooks
export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => fetchWithCredentials("/api/auth/me"),
    retry: false,
    staleTime: Infinity,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return fetchWithCredentials("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["currentUser"], user);
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      return fetchWithCredentials("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["currentUser"], user);
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return fetchWithCredentials("/api/auth/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["currentUser"], null);
      queryClient.clear();
    },
  });
}

// Course hooks
export function useCourses() {
  return useQuery<CourseWithContent[]>({
    queryKey: ["courses"],
    queryFn: () => fetchWithCredentials("/api/courses"),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (course: { title: string; description: string; coverImage: string; author: string }) => {
      return fetchWithCredentials("/api/courses", {
        method: "POST",
        body: JSON.stringify(course),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchWithCredentials(`/api/courses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return fetchWithCredentials(`/api/courses/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

// Community Video hooks
export function useCommunityVideos() {
  return useQuery<CommunityVideo[]>({
    queryKey: ["communityVideos"],
    queryFn: () => fetchWithCredentials("/api/community-videos"),
  });
}

export function useCreateCommunityVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (video: { title: string; description: string; videoUrl: string; authorName: string; authorAvatar?: string }) => {
      return fetchWithCredentials("/api/community-videos", {
        method: "POST",
        body: JSON.stringify(video),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityVideos"] });
    },
  });
}

export function useUpdateCommunityVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchWithCredentials(`/api/community-videos/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityVideos"] });
    },
  });
}

export function useDeleteCommunityVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return fetchWithCredentials(`/api/community-videos/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityVideos"] });
    },
  });
}

// Enrollment hooks
export function useEnrollments() {
  return useQuery<Enrollment[]>({
    queryKey: ["enrollments"],
    queryFn: () => fetchWithCredentials("/api/enrollments"),
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      return fetchWithCredentials("/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

export function useCompleteLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, lessonId }: { courseId: string; lessonId: string }) => {
      return fetchWithCredentials("/api/enrollments/complete-lesson", {
        method: "POST",
        body: JSON.stringify({ courseId, lessonId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
}

// Module hooks
export function useCreateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (module: { courseId: string; title: string; order: number }) => {
      return fetchWithCredentials("/api/modules", {
        method: "POST",
        body: JSON.stringify(module),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { courseId: string; title: string; order: number } }) => {
      return fetchWithCredentials(`/api/modules/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return fetchWithCredentials(`/api/modules/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

// ✅ Novo: Update Profile
export async function updateProfile(data: { name: string; avatar: string }) {
  return fetchWithCredentials("/api/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
