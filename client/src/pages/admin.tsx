import { useState } from "react";
import { useApp } from "@/lib/mockData";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, Edit, Trash, CreditCard } from "lucide-react";

export default function AdminDashboard() {
  const { user, courses, simulateWebhook } = useApp();
  const [webhookEmail, setWebhookEmail] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

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

  const handleSimulateWebhook = () => {
    if (webhookEmail && selectedCourseId) {
      simulateWebhook(webhookEmail, selectedCourseId);
      setWebhookEmail("");
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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Curso
          </Button>
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
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
