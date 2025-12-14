import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useRegister } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await loginMutation.mutateAsync({ email, password });
      toast({
        title: "Bem-vindo de volta!",
        description: "Login realizado com sucesso.",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await registerMutation.mutateAsync({ name: regName, email: regEmail, password: regPassword });
      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode acessar a plataforma.",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Erro no registro",
        description: error.message || "Não foi possível criar a conta",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center mb-8">
        <div className="bg-primary/10 p-3 rounded-xl mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Membros Premium</h1>
        <p className="text-muted-foreground text-sm">Acesse seus cursos exclusivos</p>
      </div>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">Entrar</TabsTrigger>
          <TabsTrigger value="register">Cadastrar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Bem-vindo de volta</CardTitle>
              <CardDescription>Digite suas credenciais para acessar sua conta.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="voce@exemplo.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loginMutation.isPending} data-testid="button-login">
                  {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="register">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Criar conta</CardTitle>
              <CardDescription>Preencha seus dados para começar.</CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input 
                    id="name" 
                    placeholder="Seu nome" 
                    required 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="voce@exemplo.com" 
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    data-testid="input-reg-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Senha</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    data-testid="input-reg-password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" variant="secondary" disabled={registerMutation.isPending} data-testid="button-register">
                  {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar conta
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
}
