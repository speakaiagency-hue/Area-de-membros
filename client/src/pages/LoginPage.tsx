import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // importante se o backend usa cookie httpOnly
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Credenciais inválidas");

      let token: string | undefined;
      try {
        const json = await res.json();
        token = json?.token;
      } catch {
        // se backend só usa cookie, segue sem token
      }

      await login(token);
      navigate("/admin");
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao entrar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Entrar</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          required
        />
        {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
