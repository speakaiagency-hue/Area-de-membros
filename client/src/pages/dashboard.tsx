import { useAuth } from "@/lib/auth";
import { useCourses, useEnrollments } from "@/lib/api";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Lock, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function DashboardHome() {
  const { user } = useAuth();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();

  // Helper to check enrollment status
  const getEnrollment = (courseId: string) =>
    (enrollments ?? []).find(
      (e) => e.userId === user?.id && e.courseId === courseId
    );

  if (coursesLoading || enrollmentsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Cursos</h1>
          <p className="text-muted-foreground mt-2">
            Continue de onde parou ou comece algo novo.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(courses ?? []).map((course) => {
            const enrollment = getEnrollment(course.id);
            const isEnrolled = !!enrollment;
            const progress = enrollment?.progress || 0;

            return (
              <Card
                key={course.id}
                className="group overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 hover:border-primary/20"
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                  {!isEnrolled && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                      <Lock className="text-white h-8 w-8 opacity-80" />
                    </div>
                  )}
                  {isEnrolled && (
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-black/70 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <PlayCircle className="h-3 w-3" />
                        {progress > 0 ? "Continuar" : "Começar"}
                      </div>
                    </div>
                  )}
                </div>

                <CardHeader className="p-5 pb-2">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge
                      variant={isEnrolled ? "default" : "secondary"}
                      className="rounded-sm text-[10px] uppercase tracking-wider font-semibold"
                    >
                      {isEnrolled ? "Inscrito" : "Bloqueado"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                </CardHeader>

                <CardContent className="p-5 pt-2 pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                </CardContent>

                <CardFooter className="p-5 pt-0 flex flex-col gap-3">
                  {isEnrolled ? (
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>Progresso</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <Link href={`/course/${course.id}`}>
                        <Button
                          className="w-full mt-4 group-hover:translate-y-0 translate-y-1 transition-transform"
                          data-testid={`button-course-${course.id}`}
                        >
                          Acessar Aulas
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Aguardando Confirmação
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
