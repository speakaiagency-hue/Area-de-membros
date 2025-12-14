import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useApp, Course, Module, Lesson } from "@/lib/mockData";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  ChevronLeft, 
  Plus, 
  Trash, 
  Video, 
  FileText, 
  GripVertical, 
  Save, 
  Eye
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminCourseEditor() {
  const [, params] = useRoute("/admin/course/:id");
  const [, setLocation] = useLocation();
  const { courses, updateCourse, user } = useApp();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load course data
  useEffect(() => {
    const foundCourse = courses.find(c => c.id === params?.id);
    if (foundCourse) {
      setCourse(JSON.parse(JSON.stringify(foundCourse))); // Deep copy to avoid mutating context directly
    }
    setIsLoading(false);
  }, [courses, params?.id]);

  if (!user || user.role !== "admin") {
    return <div>Access Denied</div>;
  }

  if (isLoading) return <div>Loading...</div>;
  if (!course) return <div>Course not found</div>;

  const handleSave = () => {
    updateCourse(course);
    // Optionally redirect or just show success
  };

  const handleAddModule = () => {
    const newModule: Module = {
      id: `m${Date.now()}`,
      title: "Novo Módulo",
      lessons: []
    };
    setCourse({
      ...course,
      modules: [...course.modules, newModule]
    });
  };

  const handleDeleteModule = (moduleId: string) => {
    if (confirm("Tem certeza que deseja excluir este módulo e todas as suas aulas?")) {
      setCourse({
        ...course,
        modules: course.modules.filter(m => m.id !== moduleId)
      });
    }
  };

  const handleUpdateModuleTitle = (moduleId: string, newTitle: string) => {
    setCourse({
      ...course,
      modules: course.modules.map(m => m.id === moduleId ? { ...m, title: newTitle } : m)
    });
  };

  const handleAddLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: `l${Date.now()}`,
      title: "Nova Aula",
      videoUrl: "",
      duration: "00:00"
    };
    
    setCourse({
      ...course,
      modules: course.modules.map(m => {
        if (m.id === moduleId) {
          return { ...m, lessons: [...m.lessons, newLesson] };
        }
        return m;
      })
    });
  };

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    setCourse({
      ...course,
      modules: course.modules.map(m => {
        if (m.id === moduleId) {
          return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
        }
        return m;
      })
    });
  };

  const handleUpdateLesson = (moduleId: string, lessonId: string, field: keyof Lesson, value: string) => {
    setCourse({
      ...course,
      modules: course.modules.map(m => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.map(l => l.id === lessonId ? { ...l, [field]: value } : l)
          };
        }
        return m;
      })
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Editar Curso</h1>
              <p className="text-muted-foreground text-sm">{course.title}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/course/${course.id}`}>
              <a target="_blank">
                <Button variant="outline" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Visualizar
                </Button>
              </a>
            </Link>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-2">
            <TabsTrigger value="details">Detalhes do Curso</TabsTrigger>
            <TabsTrigger value="content">Conteúdo (Aulas)</TabsTrigger>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    value={course.description} 
                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL da Imagem de Capa</Label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input 
                        value={course.coverImage} 
                        onChange={(e) => setCourse({ ...course, coverImage: e.target.value })} 
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
                <Button onClick={handleAddModule} variant="secondary" className="gap-2">
                    <Plus className="h-4 w-4" /> Adicionar Módulo
                </Button>
            </div>

            {course.modules.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
                    Nenhum módulo criado. Comece adicionando um módulo.
                </div>
            ) : (
                <div className="space-y-4">
                    {course.modules.map((module, index) => (
                        <Card key={module.id} className="border-l-4 border-l-primary/50">
                            <CardHeader className="py-4 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <Input 
                                        value={module.title}
                                        onChange={(e) => handleUpdateModuleTitle(module.id, e.target.value)}
                                        className="max-w-md font-medium bg-transparent border-transparent hover:border-input focus:bg-background h-9"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button onClick={() => handleDeleteModule(module.id)} variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 pb-6">
                                <div className="space-y-3 pl-4 border-l-2 border-muted ml-4">
                                    {module.lessons.map((lesson) => (
                                        <div key={lesson.id} className="group relative grid gap-4 rounded-lg border bg-card p-4 hover:shadow-sm transition-all">
                                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button onClick={() => handleDeleteLesson(module.id, lesson.id)} variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                                    <Trash className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">Título da Aula</Label>
                                                    <Input 
                                                        value={lesson.title}
                                                        onChange={(e) => handleUpdateLesson(module.id, lesson.id, "title", e.target.value)}
                                                        className="h-8"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground">Duração</Label>
                                                    <Input 
                                                        value={lesson.duration}
                                                        onChange={(e) => handleUpdateLesson(module.id, lesson.id, "duration", e.target.value)}
                                                        className="h-8"
                                                        placeholder="00:00"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Video className="h-3 w-3" /> URL do Vídeo (Embed)
                                                    </Label>
                                                    <Input 
                                                        value={lesson.videoUrl}
                                                        onChange={(e) => handleUpdateLesson(module.id, lesson.id, "videoUrl", e.target.value)}
                                                        className="h-8 font-mono text-xs"
                                                        placeholder="https://youtube.com/embed/..."
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <FileText className="h-3 w-3" /> URL do PDF (Opcional)
                                                    </Label>
                                                    <Input 
                                                        value={lesson.pdfUrl || ""}
                                                        onChange={(e) => handleUpdateLesson(module.id, lesson.id, "pdfUrl", e.target.value)}
                                                        className="h-8 font-mono text-xs"
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <Button onClick={() => handleAddLesson(module.id)} variant="outline" size="sm" className="w-full border-dashed text-muted-foreground hover:text-primary hover:border-primary/50">
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
