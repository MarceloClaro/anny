import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Database, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

const COLORS = {
  BENIGNO: "#10b981", // green
  MALIGNO: "#ef4444"  // red
};

export default function AdminDataset() {
  const [isRetraining, setIsRetraining] = useState(false);

  // Buscar estatísticas do dataset
  const { data: stats, isLoading, refetch } = trpc.dataset.getStatistics.useQuery(undefined, {
    refetchInterval: 10000 // Atualizar a cada 10 segundos
  });
  
  // Buscar histórico de retreinos
  const { data: history, isLoading: isLoadingHistory } = trpc.dataset.getHistory.useQuery(undefined, {
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  // Mutation para retreinamento
  const retrainMutation = trpc.dataset.triggerRetrain.useMutation({
    onSuccess: () => {
      toast.success("🚀 Retreinamento iniciado!", {
        description: "O modelo está sendo treinado com o dataset atualizado."
      });
      setIsRetraining(true);
      // Polling para verificar status
      const interval = setInterval(async () => {
        const status = await refetch();
        if (status.data?.retraining_status === "completed") {
          setIsRetraining(false);
          clearInterval(interval);
          
          // Toast detalhado com métricas
          const lastRetrain = status.data.last_retrain;
          toast.success("✅ Retreinamento concluído!", {
            description: lastRetrain ? 
              `Acurácia: ${(lastRetrain.accuracy * 100).toFixed(2)}% | Imagens: ${lastRetrain.images_used} | Épocas: ${lastRetrain.epochs}` :
              "Modelo atualizado com sucesso!",
            action: {
              label: "Ver Dashboard",
              onClick: () => window.location.href = "/admin/dataset"
            },
            duration: 10000
          });
        } else if (status.data?.retraining_status === "failed") {
          setIsRetraining(false);
          clearInterval(interval);
          toast.error("Retreinamento falhou!");
        }
      }, 5000);
    },
    onError: (error: any) => {
      toast.error(`Erro ao iniciar retreinamento: ${error.message}`);
      setIsRetraining(false);
    }
  });

  const handleRetrain = () => {
    if (confirm("Tem certeza que deseja iniciar o retreinamento do modelo? Isso pode levar vários minutos.")) {
      retrainMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Erro ao Carregar Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Não foi possível carregar as estatísticas do dataset.
            </p>
            <Button onClick={() => refetch()} className="mt-4">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preparar dados para gráficos
  const classDistribution = [
    { name: "BENIGNO", value: stats.total_by_class.BENIGNO || 0 },
    { name: "MALIGNO", value: stats.total_by_class.MALIGNO || 0 }
  ];

  const temporalData = stats.temporal_distribution || [];

  const totalImages = stats.total_images || 0;
  const canRetrain = totalImages >= 2;
  const isBalanced = Math.abs((stats.total_by_class.BENIGNO || 0) - (stats.total_by_class.MALIGNO || 0)) <= 5;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="w-8 h-8" />
            Dashboard do Dataset
          </h1>
          <p className="text-muted-foreground mt-1">
            Métricas e gerenciamento do dataset incremental
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Imagens</CardDescription>
              <CardTitle className="text-4xl">{totalImages}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {stats.duplicates_detected || 0} duplicatas detectadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Imagens Benignas</CardDescription>
              <CardTitle className="text-4xl text-green-600">
                {stats.total_by_class.BENIGNO || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {totalImages > 0 ? ((stats.total_by_class.BENIGNO || 0) / totalImages * 100).toFixed(1) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Imagens Malignas</CardDescription>
              <CardTitle className="text-4xl text-red-600">
                {stats.total_by_class.MALIGNO || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {totalImages > 0 ? ((stats.total_by_class.MALIGNO || 0) / totalImages * 100).toFixed(1) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Status do Dataset</CardDescription>
              <CardTitle className="text-2xl">
                {isBalanced ? "✅ Balanceado" : "⚠️ Desbalanceado"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {canRetrain ? "Pronto para retreinamento" : "Aguardando mais imagens"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Distribuição por Classe (Pizza) */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Classe</CardTitle>
              <CardDescription>
                Proporção de imagens benignas vs malignas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={classDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {classDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição Temporal (Linha) */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição Temporal</CardTitle>
              <CardDescription>
                Imagens adicionadas ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {temporalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={temporalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="BENIGNO" stroke={COLORS.BENIGNO} strokeWidth={2} />
                    <Line type="monotone" dataKey="MALIGNO" stroke={COLORS.MALIGNO} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado temporal disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ação de Retreinamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Retreinamento Automático
            </CardTitle>
            <CardDescription>
              O modelo será retreinado automaticamente quando o dataset atingir 2 novas imagens.
              {!isBalanced && " Imagens sintéticas serão geradas para balancear as classes."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleRetrain}
                disabled={!canRetrain || isRetraining || retrainMutation.isPending}
                size="lg"
              >
                {(isRetraining || retrainMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Retreinando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Iniciar Retreinamento Manual
                  </>
                )}
              </Button>
              
              {!canRetrain && (
                <p className="text-sm text-muted-foreground">
                  Necessário pelo menos 2 imagens no dataset para retreinar.
                </p>
              )}
              
              {stats.retraining_status === "running" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Retreinamento em andamento...
                </div>
              )}
            </div>

            {stats.last_retrain && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Último Retreinamento</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Data:</span>{" "}
                    <span className="font-medium">
                      {new Date(stats.last_retrain.timestamp).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Acurácia:</span>{" "}
                    <span className="font-medium">
                      {(stats.last_retrain.accuracy * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Imagens Usadas:</span>{" "}
                    <span className="font-medium">
                      {stats.last_retrain.images_used}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Épocas:</span>{" "}
                    <span className="font-medium">
                      {stats.last_retrain.epochs}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Histórico de Retreinos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Histórico de Retreinos
            </CardTitle>
            <CardDescription>
              Últimos retreinamentos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : history && history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Data</th>
                      <th className="text-left py-3 px-4 font-medium">Acurácia</th>
                      <th className="text-left py-3 px-4 font-medium">Loss</th>
                      <th className="text-left py-3 px-4 font-medium">Imagens</th>
                      <th className="text-left py-3 px-4 font-medium">Épocas</th>
                      <th className="text-left py-3 px-4 font-medium">Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry: any, index: number) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          {new Date(entry.timestamp).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${
                            entry.accuracy >= 0.9 ? "text-green-600" :
                            entry.accuracy >= 0.8 ? "text-yellow-600" :
                            "text-red-600"
                          }`}>
                            {(entry.accuracy * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {entry.loss ? entry.loss.toFixed(4) : "N/A"}
                        </td>
                        <td className="py-3 px-4">{entry.images_used}</td>
                        <td className="py-3 px-4">{entry.epochs}</td>
                        <td className="py-3 px-4">
                          {Math.floor(entry.training_time_seconds / 60)}m {entry.training_time_seconds % 60}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum retreinamento registrado ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
