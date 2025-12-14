import { useState, useEffect } from "react";
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
import { 
  ChevronLeft, 
  Plus, 
  Trash, 
  Video, 
  FileText, 
  Save, 
  Eye,
  Loader2
} from "lucide-react";
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

  useEffect(() => {
    if (coursesData && params?.id) {
      const foundCourse = coursesData.find(c => c.id === params.id);
      if (foundCourse) {
        setCourse(foundCourse);
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

  const handleSaveCourse = () => {
    // Salvar curso completo com módulos e aulas
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
          toast({ title: "Sucesso", description: "Curso atualizado com sucesso!" });
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao atualizar curso", variant: "destructive" });
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
    
    setCourse({
      ...course,
      modules: [...course.modules, newModule as any]
    });
    
    toast({ title: "Módulo adicionado", description: "Clique em 'Salvar Curso' para confirmar" });
          toast({ title: "Sucesso", description: "Módulo criado com sucesso!" });
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao criar módulo", variant: "destructive" });
        }
      }
    );
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
    setCourse({ ...course, modules: updatedModules });
  };

  const handleAddLesson = (moduleIndex: number) => {
    const newLesson = {
      title: "Nova Aula",
      videoUrl: "",
      duration: "00:00",
      order: course.modules[moduleIndex].lessons.length
    };
    
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: [...updatedModules[moduleIndex].lessons, newLesson as any]
    };
    
    setCourse({ ...course, modules: updatedModules });
    toast({ title: "Aula adicionada", description: "Clique em 'Salvar Curso' para confirmar" });
  };

  const handleDeleteLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: updatedModules[moduleIndex].lessons.filter((_, index) => index !== lessonIndex)
    };
    
    setCourse({ ...course, modules: updatedModules });
    toast({ title: "Aula removida", description: "Clique em 'Salvar Curso' para confirmar" });
  };

  const handleUpdateLesson = (moduleIndex: number, lessonIndex: number, field: string, value: string) => {
    const updatedModules = [...course.modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: updatedModules[moduleIndex].lessons.map((lesson, index) => 
        index === lessonIndex ? { ...lesson, [field]: value } : lesson
      )
    };
    
    setCourse({ ...course, modules: updatedModules });
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
                    <Eye className="h-4 w-4" />
                    Visualizar
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
                <Button onClick={handleAddModule} variant="secondary" className="gap-2" data-testid="button-add-module" disabled={createModuleMutation.isPending}>
                    {createModuleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Adicionar Módulo
                </Button>
            </div>

            {course.modules.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
                    Nenhum módulo criado. Comece adicionando um módulo.
                </div>
            ) : (
                <div className="space-y-4">
                    {course.modules.map((module, moduleIndex) => (
                        <Card key={moduleIndex} className="border-l-4 border-l-primary/50" data-testid={`card-module-${moduleIndex}`}>
                            <CardHeader className="py-4 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">
                                        {moduleIndex + 1}
                                    </div>
                                    <Input 
                                        value={module.title}
                                        onChange={(e) => handleUpdateModuleTitle(moduleIndex, e.target.value)}
                                        className="max-w-md font-medium bg-transparent border-transparent hover:border-input focus:bg-background h-9"
                                        data-testid={`input-module-title-${moduleIndex}`}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => handleDeleteModule(moduleIndex)} variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" data-testid={`button-delete-module-${moduleIndex}`}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 pb-6">
                                <div className="space-y-3 pl-4 border-l-2 border-muted ml-4">
                                    {module.lessons.map((lesson, lessonIndex) => (
                                        <div key={lessonIndex} className="group relative grid gap-4 rounded-lg border bg-card p-4 hover:shadow-sm transition-all" data-testid={`card-lesson-${lessonIndex}`}>
                                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button onClick={() => handleDeleteLesson(moduleIndex, lessonIndex)} variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" data-testid={`button-delete-lesson-${lessonIndex}`}>
                                                    <Trash className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">Título da Aula</Label>
                                                    <Input 
                                                        value={lesson.title}
                                                        onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "title", e.target.value)}
                                                        className="h-8"
                                                        data-testid={`input-lesson-title-${lessonIndex}`}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">Duração</Label>
                                                    <Input 
                                                        value={lesson.duration}
                                                        onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "duration", e.target.value)}
                                                        className="h-8"
                                                        placeholder="00:00"
                                                        data-testid={`input-lesson-duration-${lessonIndex}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Video className="h-3 w-3" /> Arquivo de Vídeo
                                                    </Label>
                                                    <div className="flex gap-2">
                                                      <Input 
                                                          value={lesson.videoUrl}
                                                          onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "videoUrl", e.target.value)}
                                                          placeholder="Cole URL ou envie arquivo ->"
                                                          className="h-9 text-xs"
                                                          data-testid={`input-lesson-video-${lessonIndex}`}
                                                      />
                                                      <div className="relative">
                                                        <Input 
                                                            type="file"
                                                            accept="video/*"
                                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                            onChange={(e) => {
                                                              const file = e.target.files?.[0];
                                                              if (file) {
                                                                const url = URL.createObjectURL(file);
                                                                handleUpdateLesson(moduleIndex, lessonIndex, "videoUrl", url);
                                                                toast({ title: "Vídeo Carregado", description: "O vídeo foi carregado temporariamente para visualização." });
                                                              }
                                                            }}
                                                        />
                                                        <Button variant="outline" size="icon" className="h-9 w-9">
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                      </div>
                                                    </div>
                                                    {lesson.videoUrl && (
                                                        <div className="mt-2 rounded-md overflow-hidden border bg-black/5 h-20 w-32 relative group">
                                                            {lesson.videoUrl.includes("http") && !lesson.videoUrl.startsWith("blob:") ? (
                                                                <div className="w-full h-full flex items-center justify-center bg-muted text-[10px] text-muted-foreground p-2 text-center">
                                                                    Link Externo
                                                                </div>
                                                            ) : (
                                                                <video src={lesson.videoUrl} className="w-full h-full object-cover" />
                                                            )}
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="text-white text-xs hover:underline">Ver</a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <FileText className="h-3 w-3" /> URL do PDF (Opcional)
                                                    </Label>
                                                    <Input 
                                                        value={lesson.pdfUrl || ""}
                                                        onChange={(e) => handleUpdateLesson(lesson, "pdfUrl", e.target.value)}
                                                        className="h-8 font-mono text-xs"
                                                        placeholder="https://..."
                                                        data-testid={`input-lesson-pdf-${lesson.id}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <Button onClick={() => handleAddLesson(module.id)} variant="outline" size="sm" className="w-full border-dashed text-muted-foreground hover:text-primary hover:border-primary/50" data-testid={`button-add-lesson-${module.id}`}>
                                        <Plus className="h-3 w-3 mr-2" /> Adicionar Aula
                                    </Button>
                                </div>
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
