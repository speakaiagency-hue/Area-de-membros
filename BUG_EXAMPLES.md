# Bug Examples and Reproduction Steps

## Bug #1: Progress Mismatch - Detailed Example

### Scenario Setup
```
Initial State:
- Course "React Basics" has 2 modules
  - Module 1: 3 lessons (L1, L2, L3)
  - Module 2: 2 lessons (L4, L5)
- Total: 5 lessons
- User completes L1, L2, L3 (3/5 = 60%)
```

### Step-by-Step Reproduction

1. **User completes 3 lessons**
   ```
   Database State:
   - completedLessons: ["L1", "L2", "L3"]
   - progress: 60
   
   Frontend Display:
   - "3 de 5 aulas concluídas"
   - Progress bar: 60%
   ✅ Everything matches
   ```

2. **Admin adds 5 more lessons to Module 2**
   ```
   New Course Structure:
   - Module 1: 3 lessons (L1, L2, L3)
   - Module 2: 7 lessons (L4, L5, L6, L7, L8, L9, L10)
   - Total: 10 lessons
   
   Database State (unchanged):
   - completedLessons: ["L1", "L2", "L3"]
   - progress: 60
   ```

3. **User returns to course page**
   ```
   Frontend Calculation:
   - Fetches course with 10 lessons
   - Fetches enrollment with progress: 60
   - completedLessons.length = 3
   - course.modules.reduce(...) = 10
   
   Frontend Display:
   - "3 de 10 aulas concluídas" (30%)
   - Progress bar: 60%
   ❌ MISMATCH! Text says 30%, bar shows 60%
   ```

4. **User completes one more lesson (L4)**
   ```
   Backend Calculation:
   - completedLessons: ["L1", "L2", "L3", "L4"]
   - Queries database for total lessons: 10
   - progress = (4/10) * 100 = 40%
   
   Frontend Display:
   - "4 de 10 aulas concluídas" (40%)
   - Progress bar: 40%
   ✅ Now matches, but was wrong before
   ```

### Root Cause
- Frontend uses **current** course structure from memory
- Backend progress is **stale** until next lesson completion
- Progress only recalculates when marking a lesson complete

---

## Bug #2: Unauthorized Access - Exploitation Example

### Scenario Setup
```
- User "Alice" is NOT enrolled in "Advanced React"
- User "Bob" IS enrolled in "Advanced React"
```

### Reproduction Steps

1. **Alice navigates to course URL directly**
   ```
   URL: /course/advanced-react-id
   
   Expected: Redirect to dashboard or "Not Enrolled" message
   Actual: Course player loads with all content visible
   ```

2. **Alice can watch all videos**
   ```javascript
   // In course.tsx
   const enrollment = enrollments?.find(e => e.courseId === course.id);
   // enrollment = undefined for Alice
   
   const completedLessons = enrollment?.completedLessons || [];
   // completedLessons = [] (empty array)
   
   // No check like:
   // if (!enrollment) return <NotEnrolledMessage />;
   
   // Video player renders anyway:
   <iframe src={activeLesson.videoUrl} />
   ```

3. **Alice tries to mark lesson complete**
   ```
   Click "Marcar como Concluída"
   
   API Call: POST /api/enrollments/complete-lesson
   Body: { courseId: "advanced-react-id", lessonId: "lesson-1" }
   
   Backend:
   - storage.markLessonComplete(alice.id, courseId, lessonId)
   - enrollment = await this.getEnrollment(alice.id, courseId)
   - enrollment = undefined
   - return undefined
   
   API Response: 200 OK with body: undefined
   
   Frontend: Shows error toast (but already watched the video!)
   ```

### Security Impact
- **High**: Complete course content accessible without payment
- Videos can be watched without enrollment
- Only completion tracking is blocked

---

## Bug #3: Invalid Lesson ID - Data Corruption Example

### Scenario Setup
```
- User enrolled in "Course A" (id: course-a)
  - Module 1: Lesson L1, L2
- User also enrolled in "Course B" (id: course-b)
  - Module 1: Lesson L3, L4
```

### Exploitation Steps

1. **Attacker crafts malicious API request**
   ```javascript
   // User is viewing Course A
   // But sends lesson ID from Course B
   
   fetch('/api/enrollments/complete-lesson', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       courseId: 'course-a',
       lessonId: 'L3'  // This lesson is from Course B!
     })
   });
   ```

2. **Backend processes without validation**
   ```javascript
   // storage.markLessonComplete('user-id', 'course-a', 'L3')
   
   // No check that L3 belongs to course-a
   // Just adds L3 to completedLessons array
   
   Database Update:
   {
     courseId: 'course-a',
     completedLessons: ['L1', 'L3'],  // L3 doesn't belong here!
     progress: 50  // Calculated as 2/4 lessons (wrong!)
   }
   ```

3. **Corrupted data causes issues**
   ```
   Course A Progress Calculation:
   - completedLessons: ['L1', 'L3']
   - Total lessons in Course A: 2 (L1, L2)
   - Progress: (2/2) * 100 = 100%
   
   ❌ User shows 100% complete but never watched L2!
   ❌ L3 is marked complete in wrong course
   ```

### Data Integrity Impact
- Progress calculations become meaningless
- Completed lessons array contains invalid IDs
- Could mark all lessons complete without watching

---

## Bug #4: Deleted Lessons - Progress Over 100%

### Scenario Setup
```
Initial Course:
- Module 1: L1, L2, L3, L4, L5
- Total: 5 lessons
```

### Reproduction Steps

1. **User completes all lessons**
   ```
   Database:
   - completedLessons: ['L1', 'L2', 'L3', 'L4', 'L5']
   - progress: 100
   
   Display: "5 de 5 aulas concluídas" ✅
   ```

2. **Admin deletes L4 and L5**
   ```
   New Course Structure:
   - Module 1: L1, L2, L3
   - Total: 3 lessons
   
   Database (unchanged):
   - completedLessons: ['L1', 'L2', 'L3', 'L4', 'L5']
   - progress: 100 (stale)
   ```

3. **User views course**
   ```
   Frontend Display:
   - "5 de 3 aulas concluídas" ❌ Impossible!
   - Progress bar: 100% (from stale data)
   ```

4. **User marks another lesson complete (hypothetically)**
   ```
   If user could mark L1 again or a new lesson:
   
   Backend Calculation:
   - completedLessons: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']
   - Total lessons: 3
   - progress = (6/3) * 100 = 200% ❌
   
   Would need to cap at 100%
   ```

### Issues
- Completed count exceeds total count
- Deleted lesson IDs remain in array forever
- Progress calculation breaks if lessons deleted

---

## Bug #5: Race Condition - Concurrent Completions

### Scenario Setup
```
Course with 10 lessons
User has completed 5 lessons
```

### Reproduction Steps

1. **User opens course in two browser tabs**
   ```
   Tab 1: Viewing Lesson 6
   Tab 2: Viewing Lesson 7
   ```

2. **User clicks "Mark Complete" in both tabs simultaneously**
   ```
   Tab 1: POST /api/enrollments/complete-lesson { lessonId: 'L6' }
   Tab 2: POST /api/enrollments/complete-lesson { lessonId: 'L7' }
   
   Both requests arrive at server ~same time
   ```

3. **Race condition in database updates**
   ```
   Request 1 Processing:
   - Read enrollment: completedLessons = ['L1','L2','L3','L4','L5']
   - Add L6: ['L1','L2','L3','L4','L5','L6']
   - Calculate progress: 6/10 = 60%
   
   Request 2 Processing (before Request 1 writes):
   - Read enrollment: completedLessons = ['L1','L2','L3','L4','L5']
   - Add L7: ['L1','L2','L3','L4','L5','L7']
   - Calculate progress: 6/10 = 60%
   
   Database Writes:
   - Request 1 writes: ['L1','L2','L3','L4','L5','L6']
   - Request 2 writes: ['L1','L2','L3','L4','L5','L7']
   
   Final State:
   - completedLessons: ['L1','L2','L3','L4','L5','L7']
   ❌ L6 is lost!
   ```

### Impact
- Lost lesson completions
- Incorrect progress
- User frustration (marked complete but shows incomplete)

---

## Bug #6: Missing Enrollment Error Handling

### Scenario
```
User tries to mark lesson complete without enrollment
```

### Current Behavior
```javascript
// API Route
app.post("/api/enrollments/complete-lesson", requireAuth, async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;
    const enrollment = await storage.markLessonComplete(req.session.userId!, courseId, lessonId);
    res.json(enrollment);  // enrollment is undefined!
  } catch (error) {
    res.status(500).json({ message: "Failed to mark lesson as complete" });
  }
});

// Response
HTTP 200 OK
Body: undefined
```

### Frontend Receives
```javascript
// api.ts - useCompleteLesson
mutationFn: async ({ courseId, lessonId }) => {
  return fetchWithCredentials("/api/enrollments/complete-lesson", {
    method: "POST",
    body: JSON.stringify({ courseId, lessonId }),
  });
}

// Returns undefined, but no error thrown
// onSuccess callback runs
queryClient.invalidateQueries({ queryKey: ["enrollments"] });

// Toast shows success even though nothing happened!
```

### Expected Behavior
```javascript
// Should return 404
if (!enrollment) {
  return res.status(404).json({ 
    message: "Enrollment not found. Please enroll in this course first." 
  });
}
```

---

## Bug #7: N+1 Query Problem

### Performance Issue

```javascript
// Current implementation
const modules = await this.getModulesByCourse(courseId);  // 1 query
let totalLessons = 0;
for (const module of modules) {
  const lessons = await this.getLessonsByModule(module.id);  // N queries
  totalLessons += lessons.length;
}
// Total: 1 + N queries (N = number of modules)
```

### Example with 5 Modules
```
Query 1: SELECT * FROM modules WHERE course_id = 'course-1'
Query 2: SELECT * FROM lessons WHERE module_id = 'module-1'
Query 3: SELECT * FROM lessons WHERE module_id = 'module-2'
Query 4: SELECT * FROM lessons WHERE module_id = 'module-3'
Query 5: SELECT * FROM lessons WHERE module_id = 'module-4'
Query 6: SELECT * FROM lessons WHERE module_id = 'module-5'

Total: 6 queries for every lesson completion!
```

### Optimized Solution
```sql
-- Single query with JOIN
SELECT COUNT(*) as total_lessons
FROM lessons l
INNER JOIN modules m ON l.module_id = m.id
WHERE m.course_id = 'course-1'
```

### Performance Impact
- Current: O(N) queries where N = number of modules
- Optimized: O(1) query
- For course with 10 modules: 11 queries → 1 query
- Significant improvement for courses with many modules

---

## Summary Table

| Bug # | Severity | Exploitable | Data Corruption | User Impact |
|-------|----------|-------------|-----------------|-------------|
| #1 Progress Mismatch | Medium | No | No | Confusing UI |
| #2 No Auth Check | High | Yes | No | Free access |
| #3 Invalid Lesson ID | High | Yes | Yes | Wrong progress |
| #4 Deleted Lessons | Medium | No | Yes | Broken counts |
| #5 Race Condition | Low | No | Yes | Lost completions |
| #6 Error Handling | Medium | No | No | Poor UX |
| #7 N+1 Queries | Low | No | No | Slow performance |

