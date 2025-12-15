import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  useCommunityVideos,
  useCreateCommunityVideo,
  useUpdateCommunityVideo,
  useDeleteCommunityVideo,
} from "@/lib/api";
import type { CommunityVideo } from "@shared/schema";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash, Edit, Search, Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CommunityPage() {
  const { user } = useAuth();
  const { data: communityVideos, isLoading } = useCommunityVideos();
  const createVideoMutation = useCreateCommunityVideo();
  const updateVideoMutation = useUpdateCommunityVideo();
  const deleteVideoMutation = useDeleteCommunityVideo();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<CommunityVideo | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    authorName: "",
  });

  const isAdmin = user?.role === "admin";

  const filteredVideos =
    (communityVideos ?? []).filter(
      (video) =>
        (video.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.description ?? "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (video.authorName ?? "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    ) ?? [];

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      videoUrl: "",
      authorName: user?.name || "",
    });
  };

  const handleAddVideo = async () => {
    try {
      await createVideoMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        videoUrl: formData.videoUrl,
        authorName: formData.authorName,
        authorAvatar: user?.avatar,
      });
      toast({
        title: "Vídeo Adicionado",
        description: "O vídeo foi publicado na comunidade.",
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o vídeo.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (video: CommunityVideo) => {
    setCurrentVideo(video);
    setFormData({
      title: video.title ?? "",
      description: video.description ?? "",
      videoUrl: video.videoUrl ?? "",
      authorName: video.authorName ?? "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateVideo = async () => {
    if (!currentVideo) return;
    try {
      await updateVideoMutation.mutateAsync({
        id: currentVideo.id,
        data: {
          title: formData.title,
          description: formData.description,
          videoUrl: formData.videoUrl,
          authorName: formData.authorName,
          authorAvatar: currentVideo.authorAvatar,
        },
      });
      toast({
        title: "Vídeo Atualizado",
        description: "As alterações foram salvas.",
      });
      setIsEditDialogOpen(false);
      setCurrentVideo(null);
      resetForm();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o vídeo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este vídeo?")) return;
    try {
      await deleteVideoMutation.mutateAsync(id);
      toast({
        title: "Vídeo Removido",
        description: "O vídeo foi removido da comunidade.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível remover o vídeo.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Comunidade</h1>
            <p className="text-muted-foreground mt-1">
              Vídeos e conteúdos compartilhados pelos alunos e professores.
            </p>
          </div>

          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="gap-2">
                  <Plus className="h-4 w-4" /> Novo Vídeo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Vídeo à Comunidade</DialogTitle>
                  <DialogDescription>
                    Compartilhe conhecimento com outros alunos.
                  </DialogDescription>
                </DialogHeader>
                {/* Formulário de adicionar vídeo */}
                <div className="grid gap-4 py-4">
                  {/* campos */}
                </div>
                <DialogFooter>
                  <Button onClick={handleAddVideo}>Publicar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Vídeo</DialogTitle>
              <DialogDescription>
                Atualize as informações do vídeo selecionado.
              </DialogDescription>
            </DialogHeader>
            {/* Formulário de edição */}
            <div className="grid gap-4 py-4">{/* campos */}</div>
            <DialogFooter>
              <Button onClick={handleUpdateVideo}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar vídeos..."
            className="pl-9 max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <Video className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Nenhum vídeo encontrado</h3>
            <p className="text-muted-foreground mt-1">
              Tente buscar com outros termos ou adicione um novo vídeo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(filteredVideos ?? []).map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-black relative group">
                  {video.videoUrl?.includes("embed") ||
                  video.videoUrl?.includes("youtube") ? (
                    <iframe
                      className="w-full h-full"
                      src={video.videoUrl}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video
                      src={video.videoUrl}
                      className="w-full h-full object-cover"
                      controls
                                      />
                </div>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="line-clamp-1 text-lg">
                    {video.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={video.authorAvatar || ""} />
                      <AvatarFallback>
                        {(video.authorName ?? "").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {video.authorName}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex-1">
                  <CardDescription className="line-clamp-2">
                    {video.description}
                  </CardDescription>
                </CardContent>
                {isAdmin && (
                  <CardFooter className="p-4 pt-0 flex justify-end gap-2 border-t bg-muted/20 mt-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(video)}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteVideo(video.id)}
                      data-testid={`button-delete-video-${video.id}`}
                    >
                      <Trash className="h-4 w-4 mr-2" /> Excluir
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
