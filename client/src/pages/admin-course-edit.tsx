import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  useCourses,
  useUpdateCourse,
  useCreateModule,
  useDeleteModule,
  useCreateLesson,
  useDeleteLesson,
} from "@/lib/api";
import type { Course, Module, Lesson } from "@shared/schema";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Plus, Trash, Save, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CourseWithModulesAndLessons = Course & {
  modules: (Module & { lessons: Lesson[] })[];
};

export default function AdminCourseEditor() {
  const [, params] = useRoute("/admin/course/:id");
  const { user } = useAuth();
  const { data: coursesData, isLoading: coursesLoading } = useCourses();
  const updateCourseMutation = useUpdateCourse();
  const createModuleMutation = useCreateModule();
  const deleteModuleMutation = useDeleteModule();
  const createLessonMutation = useCreateLesson();
  const deleteLessonMutation = useDeleteLesson();
  const { toast } = useToast();

  const [course, setCourse] = useState<CourseWithModulesAndLessons | null>(null);

  useEffect(() => {
    if (coursesData && params?.id) {
      const foundCourse = coursesData.find((c) => c.id === params.id);
      if (foundCourse) {
        const normalizedModules = (foundCourse.modules ?? []).map((m) => ({
          ...m,
          lessons: (m.lessons ?? []).map((l) => ({
            ...l,
            description: l.description ?? "",
            materials: l.materials ?? "",
            duration:
              typeof l.duration === "number"
                ? l.duration
                : l.duration == null
                ? null
                : Number(l.duration) || null,
          })),
        }));
        setCourse({ ...foundCourse, modules: normalizedModules ?? [] });
      }
    }
  }, [coursesData, params?.id]);

  if (!user || user.role !== "admin") return <div>Access Denied</div>;
  if (coursesLoading)
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  if (!course)
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Curso não encontrado</p>
          <Link href="/admin">
            <Button className="mt-4">Voltar para Administração</Button>
          </Link>
        </div>
      </DashboardLayout>
    );

  const handleSaveCourse = () => {
    const hasMissingDurations = (course?.modules ?? []).some((m) =>
      (m.lessons ?? []).some((l) => l.duration == null)
    );
    if (hasMissingDurations) {
      toast({
        title: "Erro",
        description: "Espere os vídeos carregarem antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const sanitizedCourse = {
      id: course.id,
      title: course.title ?? "",
      description: course.description ?? "",
      coverImage: course.coverImage ?? "",
      author: course.author ?? "",
      modules: (course?.modules ?? []).map((m) => ({
        id: m.id,
        title: m.title ?? "",
        order: m.order ?? 0,
        lessons: (m.lessons ?? []).map((l) => ({
          id: l.id,
          title: l.title ?? "",
          videoUrl: l.videoUrl ?? "",
          order: l.order ?? 0,
          duration: l.duration as number,
          description: l.description ?? "",
          materials: l.materials ?? "",
        })),
      })),
    };

    updateCourseMutation.mutate(
      { id: course.id, data: sanitizedCourse },
      {
        onSuccess: () =>
          toast({ title: "Sucesso", description: "Curso salvo com sucesso!" }),
        onError: () =>
          toast({
            title: "Erro",
            description: "Falha ao salvar curso",
            variant: "destructive",
          }),
      }
    );
  };

  const handleAddModule = () => {
    const newModule = {
      title: "Novo Módulo",
      order: (course?.modules ?? []).length,
      lessons: [],
    };
    setCourse({
      ...course!,
      modules: [...(course?.modules ?? []), newModule as any],
    });
  };

  const handleDeleteModule = (moduleIndex: number) => {
    const updatedModules = (course?.modules ?? []).filter((_, i) => i !== moduleIndex);
    setCourse({ ...course!, modules: updatedModules });
  };

  const handleUpdateModuleTitle = (moduleIndex: number, newTitle: string) => {
    const updatedModules = [...(course?.modules ?? [])];
    if (updatedModules[moduleIndex]) {
      updatedModules[moduleIndex].title = newTitle;
      setCourse({ ...course!, modules: updatedModules });
    }
  };

  const handleAddLesson = (moduleIndex: number) => {
    const updatedModules = [...(course?.modules ?? [])];
    if (!updatedModules[moduleIndex]) return;
    updatedModules[moduleIndex].lessons = [
      ...(updatedModules[moduleIndex].lessons ?? []),
      {
        title: "Nova Aula",
        videoUrl: "",
        order: (updatedModules[moduleIndex].lessons ?? []).length,
        duration: null,
        description: "",
        materials: "",
      } as any,
    ];
    setCourse({ ...course!, modules: updatedModules });
  };

  const handleDeleteLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...(course?.modules ?? [])];
    if (updatedModules[moduleIndex]) {
      updatedModules[moduleIndex].lessons = (updatedModules[moduleIndex].lessons ?? []).filter(
        (_, i) => i !== lessonIndex
      );
      setCourse({ ...course!, modules: updatedModules });
    }
  };

  const handleUpdateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    field: string,
    value: any
  ) => {
    const updatedModules = [...(course?.modules ?? [])];
    if (updatedModules[moduleIndex]) {
      const lessons = [...(updatedModules[moduleIndex].lessons ?? [])];
      const lesson = { ...lessons[lessonIndex] };
      lesson[field] = value;
      lessons[lessonIndex] = lesson;
      updatedModules[moduleIndex].lessons = lessons;
      setCourse({ ...course!, modules: updatedModules });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/admin">
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handleSaveCourse} className="gap-2">
              <Save className="h-4 w-4" /> Salvar Curso
            </Button>
            <Link href={`/course/${course.id}`}>
              <Button variant="outline" className="gap-2">
                <Eye className="h-4 w-4" /> Visualizar
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="modules">
          <TabsList>
            <TabsTrigger value="modules">Módulos</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Curso</CardTitle>
                <CardDescription>Edite as informações básicas do curso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={course.title ?? ""}
                    onChange={(e) => setCourse({ ...course!, title: e.target.value })}
                  />
                </div>
                                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={course.description ?? ""}
                    onChange={(e) =>
                      setCourse({ ...course!, description: e.target.value })
                    }
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Imagem de Capa (URL)</Label>
                  <Input
                    value={course.coverImage ?? ""}
                    onChange={(e) =>
                      setCourse({ ...course!, coverImage: e.target.value })
                    }
                    placeholder="Cole a URL da imagem de capa"
                  />
                </div>
                <div>
                  <Label>Autor</Label>
                  <Input
                    value={course.author ?? ""}
                    onChange={(e) =>
                      setCourse({ ...course!, author: e.target.value })
                    }
                    placeholder="Nome do autor"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules">
            <div className="space-y-6">
              {(course?.modules ?? []).map((module, moduleIndex) => (
                <Card key={moduleIndex}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                      <Input
                        value={module.title ?? ""}
                        onChange={(e) =>
                          handleUpdateModuleTitle(moduleIndex, e.target.value)
                        }
                        placeholder="Título do Módulo"
                      />
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteModule(moduleIndex)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(module.lessons ?? []).map((lesson, lessonIndex) => (
                      <div
                        key={lessonIndex}
                        className="flex flex-col gap-4 border rounded-md p-3"
                      >
                        <Input
                          value={lesson.title ?? ""}
                          onChange={(e) =>
                            handleUpdateLesson(
                              moduleIndex,
                              lessonIndex,
                              "title",
                              e.target.value
                            )
                          }
                          placeholder="Título da Aula"
                        />

                        <Textarea
                          value={lesson.description ?? ""}
                          onChange={(e) =>
                            handleUpdateLesson(
                              moduleIndex,
                              lessonIndex,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Descrição da Aula"
                          rows={3}
                        />

                        <Input
                          value={lesson.videoUrl ?? ""}
                          onChange={(e) =>
                            handleUpdateLesson(
                              moduleIndex,
                              lessonIndex,
                              "videoUrl",
                              e.target.value
                            )
                          }
                          placeholder="Cole a URL do vídeo hospedado"
                        />

                        {lesson.videoUrl && (
                          <video
                            src={lesson.videoUrl}
                            controls
                            className="mt-2 w-full rounded-md border"
                            onLoadedMetadata={(e) => {
                              const durationInSeconds = Math.floor(
                                e.currentTarget.duration || 0
                              );
                              if (
                                Number.isFinite(durationInSeconds) &&
                                durationInSeconds > 0
                              ) {
                                handleUpdateLesson(
                                  moduleIndex,
                                  lessonIndex,
                                  "duration",
                                  durationInSeconds
                                );
                              }
                            }}
                          />
                        )}

                        <div className="flex justify-end">
                          <Button
                            onClick={() =>
                              handleDeleteLesson(moduleIndex, lessonIndex)
                            }
                            variant="ghost"
                            size="icon"
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      onClick={() => handleAddLesson(moduleIndex)}
                      variant="secondary"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Aula
                    </Button>
                  </CardContent>
                </Card>
              ))}
              <Button
                onClick={handleAddModule}
                variant="secondary"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Módulo
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
