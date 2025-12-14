# Proposed Fixes for Course Player Bugs

## Critical Fix #1: Add Enrollment Verification

### File: `client/src/pages/course.tsx`

**Current Code (Lines 40-44):**
```typescript
if (!course) return <div>Curso não encontrado</div>;

const enrollment = enrollments?.find(e => e.courseId === course.id);
const completedLessons = enrollment?.completedLessons || [];
```

**Fixed Code:**
```typescript
if (!course) return <div>Curso não encontrado</div>;

const enrollment = enrollments?.find(e => e.courseId === course.id);

// Add enrollment verification
if (!enrollment) {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Lock className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Curso Bloqueado</h2>
          <p className="text-muted-foreground mb-4">
            Você não está inscrito neste curso.
          </p>
          <Link href="/">
            <Button>Voltar para Dashboard</Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

const completedLessons = enrollment.completedLessons || [];
```

---

## Critical Fix #2: Add Lesson Validation

### File: `server/storage.ts`

**Current Code (Lines 193-224):**
```typescript
async markLessonComplete(userId: string, courseId: string, lessonId: string): Promise<Enrollment | undefined> {
  const enrollment = await this.getEnrollment(userId, courseId);
  if (!enrollment) return undefined;

  if (enrollment.completedLessons.includes(lessonId)) {
    return enrollment;
  }

  const completedLessons = [...enrollment.completedLessons, lessonId];
  
  // Calculate progress
  const modules = await this.getModulesByCourse(courseId);
  let totalLessons = 0;
  for (const module of modules) {
    const lessons = await this.getLessonsByModule(module.id);
    totalLessons += lessons.length;
  }
  
  const progress = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

  const [updated] = await db.update(schema.enrollments)
    .set({ completedLessons, progress })
    .where(eq(schema.enrollments.id, enrollment.id))
    .returning();
  
  return updated;
}
```

**Fixed Code:**
```typescript
async markLessonComplete(userId: string, courseId: string, lessonId: string): Promise<Enrollment | undefined> {
  const enrollment = await this.getEnrollment(userId, courseId);
  if (!enrollment) return undefined;

  if (enrollment.completedLessons.includes(lessonId)) {
    return enrollment;
  }

  // VALIDATION: Verify lesson belongs to course
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
  
  // Throw error if lesson doesn't belong to course
  if (!lessonExists) {
    throw new Error(`Lesson ${lessonId} does not belong to course ${courseId}`);
  }

  const completedLessons = [...enrollment.completedLessons, lessonId];
  
  // Cap progress at 100%
  const progress = totalLessons > 0 
    ? Math.min(100, Math.round((completedLessons.length / totalLessons) * 100))
    : 0;

  const [updated] = await db.update(schema.enrollments)
    .set({ completedLessons, progress })
    .where(eq(schema.enrollments.id, enrollment.id))
    .returning();
  
  return updated;
}
```

---

## Critical Fix #3: Fix Error Handling

### File: `server/routes.ts`

**Current Code (Lines 336-345):**
```typescript
app.post("/api/enrollments/complete-lesson", requireAuth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;
    const enrollment = await storage.markLessonComplete(req.session.userId!, courseId, lessonId);
    res.json(enrollment);
  } catch (error) {
    console.error("Complete lesson error:", error);
    res.status(500).json({ message: "Failed to mark lesson as complete" });
  }
});
```

**Fixed Code:**
```typescript
app.post("/api/enrollments/complete-lesson", requireAuth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;
    
    // Validate input
    if (!courseId || !lessonId) {
      return res.status(400).json({ message: "courseId and lessonId are required" });
    }
    
    const enrollment = await storage.markLessonComplete(req.session.userId!, courseId, lessonId);
    
    // Check if enrollment exists
    if (!enrollment) {
      return res.status(404).json({ 
        message: "Enrollment not found. Please enroll in this course first." 
      });
    }
    
    res.json(enrollment);
  } catch (error: any) {
    console.error("Complete lesson error:", error);
    
    // Handle validation errors
    if (error.message?.includes("does not belong to course")) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: "Failed to mark lesson as complete" });
  }
});
```

---

## Medium Priority Fix #1: Synchronize Progress Calculation

### Option A: Calculate on Frontend (Recommended)

**File: `client/src/pages/course.tsx`**

Add utility function:
```typescript
// Add at top of file
const calculateProgress = (completedLessons: string[], course: CourseWithContent): number => {
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  return totalLessons > 0 
    ? Math.min(100, Math.round((completedLessons.length / totalLessons) * 100))
    : 0;
};
```

Update display code:
```typescript
// Replace line 173
const currentProgress = calculateProgress(completedLessons, course);

// In JSX
<div 
  className="bg-primary h-full transition-all duration-500" 
  style={{ width: `${currentProgress}%` }}
/>
```

### Option B: Recalculate on Backend When Course Changes

**File: `server/routes.ts`**

Add recalculation after course update:
```typescript
app.put("/api/courses/:id", requireAdmin, async (req, res) => {
  try {
    // ... existing update logic ...
    
    // Recalculate progress for all enrollments
    const enrollments = await storage.getEnrollmentsByCourse(id);
    for (const enrollment of enrollments) {
      await storage.recalculateProgress(enrollment.id);
    }
    
    res.json({ ...course, modules: modulesWithLessons });
  } catch (error) {
    // ... error handling ...
  }
});
```

Add new method to storage:
```typescript
async recalculateProgress(enrollmentId: string): Promise<void> {
  const [enrollment] = await db
    .select()
    .from(schema.enrollments)
    .where(eq(schema.enrollments.id, enrollmentId))
    .limit(1);
    
  if (!enrollment) return;
  
  const modules = await this.getModulesByCourse(enrollment.courseId);
  let totalLessons = 0;
  
  for (const module of modules) {
    const lessons = await this.getLessonsByModule(module.id);
    totalLessons += lessons.length;
  }
  
  const progress = totalLessons > 0 
    ? Math.min(100, Math.round((enrollment.completedLessons.length / totalLessons) * 100))
    : 0;
    
  await db.update(schema.enrollments)
    .set({ progress })
    .where(eq(schema.enrollments.id, enrollmentId));
}
```

---

## Medium Priority Fix #2: Clean Up Deleted Lessons

### File: `server/storage.ts`

**Add to markLessonComplete function:**
```typescript
async markLessonComplete(userId: string, courseId: string, lessonId: string): Promise<Enrollment | undefined> {
  const enrollment = await this.getEnrollment(userId, courseId);
  if (!enrollment) return undefined;

  // Get all valid lesson IDs for this course
  const modules = await this.getModulesByCourse(courseId);
  const validLessonIds = new Set<string>();
  let totalLessons = 0;
  
  for (const module of modules) {
    const lessons = await this.getLessonsByModule(module.id);
    totalLessons += lessons.length;
    lessons.forEach(l => validLessonIds.add(l.id));
  }
  
  // Validate new lesson
  if (!validLessonIds.has(lessonId)) {
    throw new Error(`Lesson ${lessonId} does not belong to course ${courseId}`);
  }
  
  // Clean up deleted lessons from completedLessons array
  const cleanedCompletedLessons = enrollment.completedLessons.filter(
    id => validLessonIds.has(id)
  );
  
  // Check if already completed (after cleanup)
  if (cleanedCompletedLessons.includes(lessonId)) {
    // Update with cleaned array if it changed
    if (cleanedCompletedLessons.length !== enrollment.completedLessons.length) {
      const progress = totalLessons > 0 
        ? Math.min(100, Math.round((cleanedCompletedLessons.length / totalLessons) * 100))
        : 0;
        
      const [updated] = await db.update(schema.enrollments)
        .set({ completedLessons: cleanedCompletedLessons, progress })
        .where(eq(schema.enrollments.id, enrollment.id))
        .returning();
        
      return updated;
    }
    return enrollment;
  }

  const completedLessons = [...cleanedCompletedLessons, lessonId];
  
  const progress = totalLessons > 0 
    ? Math.min(100, Math.round((completedLessons.length / totalLessons) * 100))
    : 0;

  const [updated] = await db.update(schema.enrollments)
    .set({ completedLessons, progress })
    .where(eq(schema.enrollments.id, enrollment.id))
    .returning();
  
  return updated;
}
```

---

## Low Priority Fix #1: Optimize Database Queries

### File: `server/storage.ts`

**Replace N+1 queries with single query:**

```typescript
async markLessonComplete(userId: string, courseId: string, lessonId: string): Promise<Enrollment | undefined> {
  const enrollment = await this.getEnrollment(userId, courseId);
  if (!enrollment) return undefined;

  // Single query to get all lessons and validate
  const lessonsInCourse = await db
    .select({
      lessonId: schema.lessons.id,
    })
    .from(schema.lessons)
    .innerJoin(schema.modules, eq(schema.lessons.moduleId, schema.modules.id))
    .where(eq(schema.modules.courseId, courseId));
  
  const validLessonIds = new Set(lessonsInCourse.map(l => l.lessonId));
  const totalLessons = lessonsInCourse.length;
  
  // Validate lesson belongs to course
  if (!validLessonIds.has(lessonId)) {
    throw new Error(`Lesson ${lessonId} does not belong to course ${courseId}`);
  }
  
  // Clean up deleted lessons
  const cleanedCompletedLessons = enrollment.completedLessons.filter(
    id => validLessonIds.has(id)
  );
  
  // Check if already completed
  if (cleanedCompletedLessons.includes(lessonId)) {
    if (cleanedCompletedLessons.length !== enrollment.completedLessons.length) {
      const progress = totalLessons > 0 
        ? Math.min(100, Math.round((cleanedCompletedLessons.length / totalLessons) * 100))
        : 0;
        
      const [updated] = await db.update(schema.enrollments)
        .set({ completedLessons: cleanedCompletedLessons, progress })
        .where(eq(schema.enrollments.id, enrollment.id))
        .returning();
        
      return updated;
    }
    return enrollment;
  }

  const completedLessons = [...cleanedCompletedLessons, lessonId];
  
  const progress = totalLessons > 0 
    ? Math.min(100, Math.round((completedLessons.length / totalLessons) * 100))
    : 0;

  const [updated] = await db.update(schema.enrollments)
    .set({ completedLessons, progress })
    .where(eq(schema.enrollments.id, enrollment.id))
    .returning();
  
  return updated;
}
```

---

## Low Priority Fix #2: Add Optimistic Updates

### File: `client/src/pages/course.tsx`

**Update the mutation hook:**

```typescript
const completeLessonMutation = useCompleteLesson({
  onMutate: async ({ courseId, lessonId }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['enrollments'] });
    
    // Snapshot previous value
    const previousEnrollments = queryClient.getQueryData(['enrollments']);
    
    // Optimistically update
    queryClient.setQueryData(['enrollments'], (old: Enrollment[] | undefined) => {
      if (!old) return old;
      
      return old.map(enrollment => {
        if (enrollment.courseId !== courseId) return enrollment;
        
        // Add lesson to completed
        const completedLessons = [...enrollment.completedLessons, lessonId];
        
        // Calculate new progress
        const totalLessons = course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) || 0;
        const progress = totalLessons > 0 
          ? Math.min(100, Math.round((completedLessons.length / totalLessons) * 100))
          : 0;
        
        return {
          ...enrollment,
          completedLessons,
          progress,
        };
      });
    });
    
    return { previousEnrollments };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousEnrollments) {
      queryClient.setQueryData(['enrollments'], context.previousEnrollments);
    }
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['enrollments'] });
  },
});
```

---

## Low Priority Fix #3: Add Transaction Support

### File: `server/storage.ts`

**Use database transaction:**

```typescript
async markLessonComplete(userId: string, courseId: string, lessonId: string): Promise<Enrollment | undefined> {
  // Use transaction to prevent race conditions
  return await db.transaction(async (tx) => {
    // Lock the enrollment row
    const [enrollment] = await tx
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.userId, userId),
          eq(schema.enrollments.courseId, courseId)
        )
      )
      .for('update')  // Row-level lock
      .limit(1);
    
    if (!enrollment) return undefined;
    
    // Get all lessons (within transaction)
    const lessonsInCourse = await tx
      .select({ lessonId: schema.lessons.id })
      .from(schema.lessons)
      .innerJoin(schema.modules, eq(schema.lessons.moduleId, schema.modules.id))
      .where(eq(schema.modules.courseId, courseId));
    
    const validLessonIds = new Set(lessonsInCourse.map(l => l.lessonId));
    const totalLessons = lessonsInCourse.length;
    
    // Validate
    if (!validLessonIds.has(lessonId)) {
      throw new Error(`Lesson ${lessonId} does not belong to course ${courseId}`);
    }
    
    // Clean and update
    const cleanedCompletedLessons = enrollment.completedLessons.filter(
      id => validLessonIds.has(id)
    );
    
    if (cleanedCompletedLessons.includes(lessonId)) {
      return enrollment;
    }
    
    const completedLessons = [...cleanedCompletedLessons, lessonId];
    const progress = totalLessons > 0 
      ? Math.min(100, Math.round((completedLessons.length / totalLessons) * 100))
      : 0;
    
    const [updated] = await tx
      .update(schema.enrollments)
      .set({ completedLessons, progress })
      .where(eq(schema.enrollments.id, enrollment.id))
      .returning();
    
    return updated;
  });
}
```

---

## Complete Fixed Version (All Critical + Medium Fixes)

### File: `server/storage.ts` - Complete markLessonComplete

```typescript
async markLessonComplete(userId: string, courseId: string, lessonId: string): Promise<Enrollment | undefined> {
  const enrollment = await this.getEnrollment(userId, courseId);
  if (!enrollment) return undefined;

  // Single optimized query to get all lessons
  const lessonsInCourse = await db
    .select({
      lessonId: schema.lessons.id,
    })
    .from(schema.lessons)
    .innerJoin(schema.modules, eq(schema.lessons.moduleId, schema.modules.id))
    .where(eq(schema.modules.courseId, courseId));
  
  const validLessonIds = new Set(lessonsInCourse.map(l => l.lessonId));
  const totalLessons = lessonsInCourse.length;
  
  // Validate lesson belongs to course
  if (!validLessonIds.has(lessonId)) {
    throw new Error(`Lesson ${lessonId} does not belong to course ${courseId}`);
  }
  
  // Clean up deleted lessons from completedLessons array
  const cleanedCompletedLessons = enrollment.completedLessons.filter(
    id => validLessonIds.has(id)
  );
  
  // Check if already completed (after cleanup)
  if (cleanedCompletedLessons.includes(lessonId)) {
    // Update with cleaned array if it changed
    if (cleanedCompletedLessons.length !== enrollment.completedLessons.length) {
      const progress = totalLessons > 0 
        ? Math.min(100, Math.round((cleanedCompletedLessons.length / totalLessons) * 100))
        : 0;
        
      const [updated] = await db.update(schema.enrollments)
        .set({ completedLessons: cleanedCompletedLessons, progress })
        .where(eq(schema.enrollments.id, enrollment.id))
        .returning();
        
      return updated;
    }
    return enrollment;
  }

  const completedLessons = [...cleanedCompletedLessons, lessonId];
  
  // Cap progress at 100%
  const progress = totalLessons > 0 
    ? Math.min(100, Math.round((completedLessons.length / totalLessons) * 100))
    : 0;

  const [updated] = await db.update(schema.enrollments)
    .set({ completedLessons, progress })
    .where(eq(schema.enrollments.id, enrollment.id))
    .returning();
  
  return updated;
}
```

---

## Testing the Fixes

### Test Case 1: Enrollment Verification
```typescript
// Test: User without enrollment cannot access course
test('should redirect when user not enrolled', () => {
  // Mock enrollments without target course
  const enrollments = [{ courseId: 'other-course', ... }];
  
  render(<CoursePlayer />, { enrollments });
  
  expect(screen.getByText('Curso Bloqueado')).toBeInTheDocument();
  expect(screen.queryByRole('video')).not.toBeInTheDocument();
});
```

### Test Case 2: Lesson Validation
```typescript
// Test: Cannot mark lesson from different course
test('should reject lesson from different course', async () => {
  const response = await request(app)
    .post('/api/enrollments/complete-lesson')
    .send({
      courseId: 'course-a',
      lessonId: 'lesson-from-course-b'
    })
    .expect(400);
    
  expect(response.body.message).toContain('does not belong to course');
});
```

### Test Case 3: Error Handling
```typescript
// Test: Returns 404 when enrollment not found
test('should return 404 when not enrolled', async () => {
  const response = await request(app)
    .post('/api/enrollments/complete-lesson')
    .send({
      courseId: 'non-enrolled-course',
      lessonId: 'some-lesson'
    })
    .expect(404);
    
  expect(response.body.message).toContain('Enrollment not found');
});
```

---

## Deployment Checklist

- [ ] Review all code changes
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Test manually in development
- [ ] Review security implications
- [ ] Update API documentation
- [ ] Add logging for new error cases
- [ ] Deploy to staging
- [ ] Test in staging environment
- [ ] Monitor error rates
- [ ] Deploy to production
- [ ] Monitor production metrics
- [ ] Verify no regressions

