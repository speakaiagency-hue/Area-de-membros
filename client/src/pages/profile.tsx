import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Shield, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "@/lib/api"; // ✅ caminho corrigido

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
  });

  const handleSave = async () => {
    try {
      await updateProfile({
        name: formData.name,
        avatar: formData.avatar,
      });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu perfil.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas informações pessoais
          </p>
        </div>

        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize suas informações de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.avatar || ""} alt={formData.name || "avatar"} />
                <AvatarFallback className="text-2xl">
                  {(formData.name ?? "").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Label>Foto de Perfil</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                toast({
                                  title: "Arquivo muito grande",
                                  description: "A imagem deve ter no máximo 2MB",
                                  variant: "destructive",
                                });
                                return;
                              }
                              if (!file.type.startsWith("image/")) {
                                toast({
                                  title: "Formato inválido",
                                  description: "Por favor, selecione uma imagem",
                                  variant: "destructive",
                                });
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData({ ...formData, avatar: reader.result as string });
                                toast({
                                  title: "Imagem carregada",
                                  description: "Clique em 'Salvar' para confirmar",
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <Button variant="outline" className="w-full">
                          <User className="h-4 w-4 mr-2" />
                          Escolher Imagem
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: JPG, PNG, GIF (máx. 2MB)
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Clique em "Editar Perfil" para alterar sua foto
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Tipo de Conta
              </Label>
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  }`}
                >
                  {user.role === "admin" ? "Administrador" : "Usuário"}
                </div>
              </div>
            </div>

            <Separator />

            {/* Botões */}
            <div className="flex gap-3">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
              ) : (
                <>
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        name: user?.name || "",
                        email: user?.email || "",
                        avatar: user?.avatar || "",
                      });
                      setIsEditing(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
            <CardDescription>Seu progresso na plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Cursos Matriculados</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Aulas Concluídas</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">0%</div>
                <div className="text-sm text-muted-foreground">Progresso Médio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
