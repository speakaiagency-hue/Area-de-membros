import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCourses, useCreateCourse, useDeleteCourse, useSimulateWebhook } from "@/lib/api";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, Edit, Trash, CreditCard, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: courses, isLoading } = useCourses();
  const createCourseMutation = useCreateCourse();
  const deleteCourseMutation = useDeleteCourse();
  const simulateWebhookMutation = useSimulateWebhook();
  const { toast } = useToast();
  
  const [webhookEmail, setWebhookEmail] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [, setLocation] = useLocation();

  // New Course State
  const [isNewCourseOpen, setIsNewCourseOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [newCourseCover, setNewCourseCover] = useState("https://placehold.co/600x400/2563eb/white?text=Nova+Capa");

  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSimulateWebhook = async () => {
    if (webhookEmail && selectedCourseId) {
      try {
        await simulateWebhookMutation.mutateAsync({ email: webhookEmail, courseId: selectedCourseId });
        toast({
          title: "Webhook Recebido",
          description: `Acesso concedido para ${webhookEmail}`,
        });
        setWebhookEmail("");
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Erro ao processar webhook",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (confirm(`Tem certeza que deseja excluir o curso "${title}"? Esta ação não pode ser desfeita.`)) {
      try {
        await deleteCourseMutation.mutateAsync(id);
        toast({
          title: "Sucesso",
          description: "Curso excluído com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir o curso.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourseTitle) return;

    try {
      const result = await createCourseMutation.mutateAsync({
        title: newCourseTitle,
        description: newCourseDesc || "Sem descrição",
        coverImage: newCourseCover,
        author: user?.name || "Admin",
      });
      
      toast({
        title: "Sucesso",
        description: "Novo curso criado.",
      });
      
      setIsNewCourseOpen(false);
      setNewCourseTitle("");
      setNewCourseDesc("");
      
      setLocation(`/admin/course/${result.id}`);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o curso.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
            <p className="text-muted-foreground mt-2">Gerencie cursos, conteúdos e integrações.</p>
          </div>
          
          <Dialog open={isNewCourseOpen} onOpenChange={setIsNewCourseOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Curso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Curso</DialogTitle>
                <DialogDescription>
                  Preencha as informações básicas. Você poderá adicionar módulos e aulas na próxima tela.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título do Curso</Label>
                  <Input 
                    placeholder="Ex: Curso Completo de Design" 
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição Curta</Label>
                  <Textarea 
                    placeholder="O que os alunos vão aprender?" 
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Imagem de Capa</Label>
                  <div className="space-y-3">
                    {newCourseCover && (
                      <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                        <img 
                          src={newCourseCover} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast({
                                title: "Arquivo muito grande",
                                description: "A imagem deve ter no máximo 5MB",
                                variant: "destructive"
                              });
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewCourseCover(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <Button variant="outline" className="w-full" type="button">
                        <Upload className="h-4 w-4 mr-2" />
                        Escolher Imagem de Capa
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recomendado: 600x400px (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewCourseOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateCourse} disabled={!newCourseTitle}>Criar Curso</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="courses">Cursos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="integrations">Integrações (Kiwifi)</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cursos Cadastrados</CardTitle>
                <CardDescription>Gerencie o conteúdo visível para seus alunos.</CardDescription>
              </CardHeader>
              <CardContent>
                {!courses || courses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum curso cadastrado.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Capa</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Módulos</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <img src={course.coverImage} className="h-10 w-16 object-cover rounded-md" alt={course.title} />
                          </TableCell>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>{course.modules.length}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/admin/course/${course.id}`}>
                                <Button variant="ghost" size="icon" title="Editar Conteúdo">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteCourse(course.id, course.title)}
                                title="Excluir Curso"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração Webhook Kiwifi</CardTitle>
                  <CardDescription>URL para receber notificações de venda.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted rounded-md text-xs font-mono break-all border border-dashed border-primary/30">
                    https://api.seusite.com/webhooks/kiwifi
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Copie esta URL e configure no painel da Kiwifi para liberar o acesso automaticamente após o pagamento.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Simular Compra (Teste)
                  </CardTitle>
                  <CardDescription>Use esta ferramenta para testar a liberação automática sem pagar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email do Usuário</Label>
                    <Input 
                      placeholder="ex: aluno@email.com" 
                      value={webhookEmail}
                      onChange={(e) => setWebhookEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Curso para Liberar</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                    >
                      <option value="">Selecione um curso...</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSimulateWebhook} className="w-full">
                    Simular Pagamento Aprovado
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
