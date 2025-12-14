import { useState, useEffect, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useCourses, useUpdateCourse, useCreateModule, useUpdateModule, useDeleteModule, useCreateLesson, useUpdateLesson, useDeleteLesson } from "@/lib/api";
import type { Course, Module, Lesson } from "@shared/schema";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Plus, Trash, Save, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CourseWithModulesAndLessons = Course & {
  modules: (Module & { lessons: Lesson[] })[];
};

export default function AdminCourseEditor() {
  const [, params] = useRoute("/admin/course/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: coursesData, isLoading: coursesLoading } = useCourses();
  const updateCourseMutation = useUpdateCourse();
  const createModuleMutation = useCreateModule();
  const updateModuleMutation = useUpdateModule();
  const deleteModuleMutation = useDeleteModule();
  const createLessonMutation = useCreateLesson();
  const updateLessonMutation = useUpdateLesson();
  const deleteLessonMutation = useDeleteLesson();
  const { toast } = useToast();

  const [course, setCourse] = useState<CourseWithModulesAndLessons | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (coursesData && params?.id) {
      const foundCourse = coursesData.find(c => c.id === params.id);
      if (foundCourse) {
        // Normaliza módulos para garantir que sempre tenham lessons: []
        const normalizedModules = foundCourse.modules.map(m => ({
          ...m,
          lessons: m.lessons || []
        }));
        setCourse({ ...foundCourse, modules: normalizedModules });
      }
    }
  }, [coursesData, params?.id]);

  if (!user || user.role !== "admin") {
    return <div>Access Denied</div>;
  }

  if (coursesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
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
  }

  const handleSaveCourse = (showToast = true) => {
    updateCourseMutation.mutate(
      { 
        id: course.id, 
        data: { 
          title: course.title, 
          description: course.description, 
          coverImage: course.coverImage, 
          author: course.author,
          modules: course.modules 
        } 
      },
      {
        onSuccess: () => {
          if (showToast) {
            toast({ title: "Sucesso", description: "Curso salvo com sucesso!" });
          }
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao salvar curso", variant: "destructive" });
        }
      }
    );
  };

  const handleAddModule = () => {
    const newModule = {
      title: "Novo Módulo",
      order: course.modules.length,
      lessons: []
    };
    const updatedCourse = {
      ...course,
      modules: [...course.modules, newModule as any]
    };
    setCourse(updatedCourse);
    setTimeout(() => {
      updateCourseMutation.mutate(
        { id: course.id, data: { ...updatedCourse } },
        { onSuccess: () => toast({ title: "Módulo adicionado", description: "Salvo automaticamente!" }) }
      );
    }, 500);
  };

  const handleDeleteModule = (moduleIndex: number) => {
    if (confirm("Tem certeza que deseja excluir este módulo e todas as suas aulas?")) {
      const updatedModules = course.modules.filter((_, index) => index !== moduleIndex);
      setCourse({ ...course, modules: updatedModules });
      toast({ title: "Módulo removido", description: "Clique em 'Salvar Curso' para confirmar" });
    }
  };

  const handleUpdateModuleTitle = (moduleIndex: number, newTitle: string) => {
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex] = { ...updatedModules[moduleIndex], title: newTitle };
    const updatedCourse = { ...course, modules: updatedModules };
    setCourse(updatedCourse);
    autoSave(updatedCourse);
  };

  const handleAddLesson = (moduleIndex: number) => {
    const module = course.modules[moduleIndex];
    if (!module.lessons) module.lessons = [];
    const newLesson = {
      title: "Nova Aula",
      videoUrl: "",
      duration: "00:00",
      order: module.lessons.length
    };
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex] = {
      ...module,
      lessons: [...module.lessons, newLesson as any]
    };
    const updatedCourse = { ...course, modules: updatedModules };
    setCourse(updatedCourse);
    setTimeout(() => {
      updateCourseMutation.mutate(
        { id: course.id, data: { ...updatedCourse } },
        { onSuccess: () => toast({ title: "Aula adicionada", description: "Salvo automaticamente!" }) }
      );
    }, 500);
  };

  const handleDeleteLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: (updatedModules[moduleIndex].lessons || []).filter((_, index) => index !== lessonIndex)
    };
    setCourse({ ...course, modules: updatedModules });
    toast({ title: "Aula removida", description: "Clique em 'Salvar Curso' para confirmar" });
  };

  const autoSave = (updatedCourse: CourseWithModulesAndLessons) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateCourseMutation.mutate(
        { id: updatedCourse.id, data: { ...updatedCourse } },
        { onSuccess: () => console.log("Auto-saved") }
      );
    }, 2000);
  };

  const handleUpdateLesson = (moduleIndex: number, lessonIndex: number, field: string, value: string) => {
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: (updatedModules[moduleIndex].lessons || []).map((lesson, index) => 
        index === lessonIndex ? { ...lesson, [field]: value } : lesson
      )
    };
    const updatedCourse = { ...course, modules: updatedModules };
    setCourse(updatedCourse);
    autoSave(updatedCourse);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Editar Curso</h1>
              <p className="text-muted-foreground text-sm" data-testid="text-course-title">{course.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/course/${course.id}`}>
              <a target="_blank">
                <Button variant="outline" className="gap-2" data-testid="button-preview">
                  <Eye className="h-4 w-4" /> Visualizar
                </Button>
              </a>
            </Link>
            <Button onClick={handleSaveCourse} className="gap-2" data-testid="button-save" disabled={updateCourseMutation.isPending}>
              {updateCourseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Alterações
            </Button>
          </div>
        </div>

                <Tabs defaultValue="content" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-2">
            <TabsTrigger value="details" data-testid="tab-details">Detalhes do Curso</TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">Conteúdo (Aulas)</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Essas informações aparecem no card do curso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Título do Curso</Label>
                  <Input 
                    value={course.title} 
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    data-testid="input-course-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    value={course.description} 
                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                    rows={4}
                    data-testid="input-course-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL da Imagem de Capa</Label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input 
                        value={course.coverImage} 
                        onChange={(e) => setCourse({ ...course, coverImage: e.target.value })}
                        data-testid="input-course-cover"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Cole a URL de uma imagem hospedada.</p>
                    </div>
                    <div className="h-20 w-32 shrink-0 overflow-hidden rounded-md border bg-muted">
                      <img src={course.coverImage} className="h-full w-full object-cover" alt="Preview" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Estrutura do Curso</h3>
              <Button 
                onClick={handleAddModule} 
                variant="secondary" 
                className="gap-2" 
                data-testid="button-add-module" 
                disabled={createModuleMutation.isPending}
              >
                {createModuleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Adicionar Módulo
              </Button>
            </div>

            {course.modules.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
                Nenhum módulo criado. Comece adicionando um módulo.
              </div>
            ) : (
              <div className="space-y-6">
                {course.modules.map((module, moduleIndex) => (
                  <Card key={moduleIndex}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <Input
                          value={module.title}
                          onChange={(e) => handleUpdateModuleTitle(moduleIndex, e.target.value)}
                          className="font-medium"
                          data-testid={`input-module-title-${moduleIndex}`}
                        />
                      </div>
                      <Button 
                        onClick={() => handleDeleteModule(moduleIndex)} 
                        variant="ghost" 
                        size="icon" 
                        data-testid={`button-delete-module-${moduleIndex}`}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(module.lessons || []).length === 0 ? (
                        <p className="text-muted-foreground text-sm">Nenhuma aula neste módulo.</p>
                      ) : (
                        (module.lessons || []).map((lesson, lessonIndex) => (
                          <div key={lessonIndex} className="flex items-center justify-between border rounded-md p-2">
                            <div className="flex-1 space-y-1">
                              <Input
                                value={lesson.title}
                                onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "title", e.target.value)}
                                placeholder="Título da Aula"
                                data-testid={`input-lesson-title-${moduleIndex}-${lessonIndex}`}
                              />
                              <Input
                                value={lesson.videoUrl}
                                onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "videoUrl", e.target.value)}
                                placeholder="URL do Vídeo"
                                data-testid={`input-lesson-video-${moduleIndex}-${lessonIndex}`}
                              />
                              <Input
                                value={lesson.duration}
                                onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "duration", e.target.value)}
                                placeholder="Duração"
                                data-testid={`input-lesson-duration-${moduleIndex}-${lessonIndex}`}
                              />
                            </div>
                            <Button 
                              onClick={() => handleDeleteLesson(moduleIndex, lessonIndex)} 
                              variant="ghost" 
                              size="icon" 
                              data-testid={`button-delete-lesson-${moduleIndex}-${lessonIndex}`}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))
                      )}
                      <Button 
                        onClick={() => handleAddLesson(moduleIndex)} 
                        variant="secondary" 
                        className="gap-2" 
                        data-testid={`button-add-lesson-${moduleIndex}`}
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Aula
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
