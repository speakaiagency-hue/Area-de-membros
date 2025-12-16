import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  useCourses,
  useCreateModule,
  useDeleteModule,
  useCreateLesson,
  useDeleteLesson,
} from "@/lib/api";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminCourseEditPage() {
  const { user } = useAuth();
  const { data: courses } = useCourses();
  const createModule = useCreateModule();
  const deleteModule = useDeleteModule();
  const createLesson = useCreateLesson();
  const deleteLesson = useDeleteLesson();
  const { toast } = useToast();

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");

  if (!user || user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleCreateModule = async () => {
    if (!selectedCourseId || !newModuleTitle) return;
    try {
      await createModule.mutateAsync({
        courseId: selectedCourseId,
        title: newModuleTitle,
        order: 1,
      });
      toast({ title: "Módulo criado com sucesso" });
      setNewModuleTitle("");
    } catch {
      toast({ title: "Erro ao criar módulo", variant: "destructive" });
    }
  };

  const handleDeleteModule = async (id: string) => {
    try {
      await deleteModule.mutateAsync(id);
      toast({ title: "Módulo excluído com sucesso" });
    } catch {
      toast({ title: "Erro ao excluir módulo", variant: "destructive" });
    }
  };

  const handleCreateLesson = async (moduleId: string) => {
    if (!newLessonTitle) return;
    try {
      await createLesson.mutateAsync({
        moduleId,
        title: newLessonTitle,
        order: 1,
      });
      toast({ title: "Aula criada com sucesso" });
      setNewLessonTitle("");
    } catch {
      toast({ title: "Erro ao criar aula", variant: "destructive" });
    }
  };

  const handleDeleteLesson = async (id: string) => {
    try {
      await deleteLesson.mutateAsync(id);
      toast({ title: "Aula excluída com sucesso" });
    } catch {
      toast({ title: "Erro ao excluir aula", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Editar Curso</h1>

        {/* Selecionar curso */}
        <div className="space-y-2">
          <Label>Selecione um curso</Label>
          <select
            className="w-full border rounded p-2"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">-- Escolha --</option>
            {courses?.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {/* Criar módulo */}
        <Card>
          <CardHeader>
            <CardTitle>Novo Módulo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Título do módulo"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
            />
            <Button onClick={handleCreateModule} disabled={!newModuleTitle || !selectedCourseId}>
              <Plus className="h-4 w-4 mr-2" /> Criar Módulo
            </Button>
          </CardContent>
        </Card>

        {/* Listar módulos e aulas */}
        {courses
          ?.find((c) => c.id === selectedCourseId)
          ?.modules?.map((module) => (
            <Card key={module.id}>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>{module.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleDeleteModule(module.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {/* Criar aula */}
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Título da aula"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                  />
                  <Button onClick={() => handleCreateLesson(module.id)} disabled={!newLessonTitle}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Aula
                  </Button>
                </div>

                {/* Listar aulas */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {module.lessons?.map((lesson) => (
                      <TableRow key={lesson.id}>
                        <TableCell>{lesson.title}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteLesson(lesson.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
      </div>
    </DashboardLayout>
  );
}
