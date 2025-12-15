import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useCourses, useEnrollments, useCompleteLesson } from "@/lib/api";
import type { Lesson } from "@shared/schema";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, PlayCircle, FileText, ChevronLeft, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CoursePlayer() {
  const [, params] = useRoute("/course/:id");
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const completeLessonMutation = useCompleteLesson();
  const { toast } = useToast();
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  const course = (courses ?? []).find((c) => c.id === params?.id);

  // Initialize active lesson
  useEffect(() => {
    if (
      course &&
      (course.modules ?? []).length > 0 &&
      (course.modules[0].lessons ?? []).length > 0 &&
      !activeLesson
    ) {
      setActiveLesson(course.modules[0].lessons[0]);
    }
  }, [course, activeLesson]);

  if (coursesLoading || enrollmentsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) return <div>Curso não encontrado</div>;

  const enrollment = (enrollments ?? []).find((e) => e.courseId === course.id);
  const completedLessons = enrollment?.completedLessons ?? [];

  const handleLessonSelect = (lesson: Lesson) => {
    setActiveLesson(lesson);
  };

  const handleMarkComplete = async () => {
    if (activeLesson && course) {
      try {
        await completeLessonMutation.mutateAsync({
          courseId: course.id,
          lessonId: activeLesson.id,
        });
        toast({
          title: "Aula concluída!",
          description: "Seu progresso foi atualizado.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível marcar a aula como concluída.",
          variant: "destructive",
        });
      }
    }
  };

  const isCompleted = (lessonId: string) =>
    completedLessons.includes(lessonId);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/">
            <a className="flex items-center hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar para cursos
            </a>
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{course.title}</span>
        </div>

        <div className="flex gap-6 lg:h-[calc(100vh-theme(spacing.32))] lg:min-h-0 flex-col lg:flex-row lg:overflow-hidden h-auto">
          {/* Main Content Area - Left Column */}
          <div className="flex-1 flex flex-col min-w-0 lg:h-full h-auto lg:overflow-hidden">
            {/* Video Player */}
            <div className="lg:flex-1 w-full aspect-video lg:aspect-auto bg-black rounded-xl overflow-hidden shadow-2xl relative group flex items-center justify-center lg:min-h-0">
              {activeLesson ? (
                activeLesson.videoUrl.includes("embed") ||
                activeLesson.videoUrl.includes("youtube") ? (
                  <iframe
                    className="w-full h-full"
                    src={activeLesson.videoUrl}
                    title={activeLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    src={activeLesson.videoUrl}
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  Selecione uma aula
                </div>
              )}
            </div>

            {/* Lesson Details */}
            <div className="shrink-0 pt-4 pb-2 space-y-4 overflow-y-auto max-h-[40%] pr-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{activeLesson?.title}</h2>
                  <p className="text-muted-foreground mt-1">
                    Módulo:{" "}
                    {(course.modules ?? []).find((m) =>
                      (m.lessons ?? []).some(
                        (l) => l.id === activeLesson?.id
                      )
                    )?.title}
                  </p>
                </div>
                <Button
                  onClick={handleMarkComplete}
                  variant={
                    activeLesson && isCompleted(activeLesson.id)
                      ? "secondary"
                      : "default"
                  }
                  className="gap-2 shrink-0"
                  disabled={completeLessonMutation.isPending}
                  data-testid="button-mark-complete"
                >
                  {activeLesson && isCompleted(activeLesson.id) ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Concluída
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Marcar como Concluída
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Materiais Complementares
                </h3>
                {activeLesson?.pdfUrl ? (
                  <div className="flex items-center p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
                    <div className="h-10 w-10 rounded bg-red-100 text-red-600 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Resumo da Aula (PDF)</div>
                      <div className="text-xs text-muted-foreground">
                        Clique para baixar
                      </div>
                    </div>
                    <Button size="icon" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhum material extra disponível para esta aula.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Playlist */}
          <div className="lg:w-80 shrink-0 bg-card border rounded-xl overflow-hidden flex flex-col lg:h-full h-[500px] shadow-sm">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-semibold">Conteúdo do Curso</h3>
              <div className="text-xs text-muted-foreground mt-1">
                {completedLessons.length} de{" "}
                {(course.modules ?? []).reduce(
                  (acc, m) => acc + (m.lessons ?? []).length,
                  0
                )}{" "}
                aulas concluídas
              </div>
              <div className="w-full bg-secondary h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${enrollment?.progress || 0}%` }}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <Accordion
                type="multiple"
                defaultValue={(course.modules ?? []).map((m) => m.id)}
                className="w-full"
              >
                               {(course.modules ?? []).map((module) => (
                  <AccordionItem
                    key={module.id}
                    value={module.id}
                    className="border-b-0"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline font-medium text-sm">
                      {module.title}
                    </AccordionTrigger>
                    <AccordionContent className="pt-0 pb-0">
                      <div className="flex flex-col">
                        {(module.lessons ?? []).map((lesson) => {
                          const isActive = activeLesson?.id === lesson.id;
                          const isDone = isCompleted(lesson.id);

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonSelect(lesson)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-l-2",
                                isActive
                                  ? "bg-primary/5 border-primary text-primary font-medium"
                                  : "hover:bg-muted/50 border-transparent text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <div
                                className={cn(
                                  "shrink-0",
                                  isDone
                                    ? "text-green-500"
                                    : isActive
                                    ? "text-primary"
                                    : "text-muted-foreground/50"
                                )}
                              >
                                {isDone ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <PlayCircle className="h-4 w-4" />
                                )}
                              </div>
                              <span className="line-clamp-1 flex-1">
                                {lesson.title}
                              </span>
                              <span className="text-xs opacity-60">
                                {lesson.duration}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
