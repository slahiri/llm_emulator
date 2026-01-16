import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { useModelStore } from "@/stores/modelStore";

// Custom nodes
import { CorpusNode } from "@/components/training/nodes/CorpusNode";
import { ConfigNode } from "@/components/training/nodes/ConfigNode";
import { ModelNode } from "@/components/training/nodes/ModelNode";
import { TrainNode } from "@/components/training/nodes/TrainNode";

// Panels
import { CorpusPanel } from "@/components/training/panels/CorpusPanel";
import { ConfigPanel } from "@/components/training/panels/ConfigPanel";
import { ModelPanel } from "@/components/training/panels/ModelPanel";
import { TrainPanel } from "@/components/training/panels/TrainPanel";

import type { Weights, ModelConfig } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = {
  corpus: CorpusNode,
  config: ConfigNode,
  model: ModelNode,
  train: TrainNode,
};

type SelectedNode = "corpus" | "config" | "model" | "train" | null;

export default function Training() {
  const navigate = useNavigate();
  const {
    model,
    isLoading,
    loadModel,
    saveModel,
    setVocabulary,
    setWeights,
    updateTrainingProgress,
    setStatus,
  } = useModelStore();

  const [selectedNode, setSelectedNode] = useState<SelectedNode>(null);
  const [localCorpus, setLocalCorpus] = useState<string[]>([]);
  const [localConfig, setLocalConfig] = useState<ModelConfig | null>(null);
  const [configuredSteps, setConfiguredSteps] = useState({
    corpus: false,
    config: false,
    model: false,
    train: false,
  });

  // Load model on mount
  useEffect(() => {
    loadModel();
  }, [loadModel]);

  // Initialize local state from model
  useEffect(() => {
    if (model) {
      setLocalCorpus(model.corpus);
      setLocalConfig(model.config);
      setConfiguredSteps({
        corpus: model.corpus.length > 0,
        config: true,
        model: model.weights !== null,
        train: model.status === "completed",
      });
    }
  }, [model]);

  // Create nodes based on current state
  const initialNodes: Node[] = useMemo(() => {
    if (!model || !localConfig) return [];

    const vocabSize = Object.keys(model.vocabulary).length ||
      new Set(localCorpus.join(" ").toLowerCase().replace(/[.,!?]/g, "").split(/\s+/)).size;

    return [
      {
        id: "corpus",
        type: "corpus",
        position: { x: 50, y: 150 },
        data: {
          label: "Corpus",
          sentenceCount: localCorpus.length,
          isConfigured: configuredSteps.corpus,
          isSelected: selectedNode === "corpus",
        },
      },
      {
        id: "config",
        type: "config",
        position: { x: 250, y: 150 },
        data: {
          label: "Config",
          embedDim: localConfig.embedDim,
          numLayers: localConfig.numLayers,
          numHeads: localConfig.numHeads,
          isConfigured: configuredSteps.config,
          isSelected: selectedNode === "config",
        },
      },
      {
        id: "model",
        type: "model",
        position: { x: 450, y: 150 },
        data: {
          label: "Model",
          vocabSize,
          isInitialized: configuredSteps.model,
          isSelected: selectedNode === "model",
        },
      },
      {
        id: "train",
        type: "train",
        position: { x: 650, y: 150 },
        data: {
          label: "Train",
          status: model.status,
          iteration: model.trainingProgress.iteration,
          maxIterations: model.trainingProgress.maxIterations,
          isSelected: selectedNode === "train",
        },
      },
    ];
  }, [model, localCorpus, localConfig, configuredSteps, selectedNode]);

  const initialEdges: Edge[] = [
    {
      id: "corpus-config",
      source: "corpus",
      target: "config",
      animated: selectedNode === "corpus" || selectedNode === "config",
    },
    {
      id: "config-model",
      source: "config",
      target: "model",
      animated: selectedNode === "config" || selectedNode === "model",
    },
    {
      id: "model-train",
      source: "model",
      target: "train",
      animated: selectedNode === "model" || selectedNode === "train",
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when state changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [selectedNode]);

  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id as SelectedNode);
  }, []);

  // Handle corpus change
  const handleCorpusChange = useCallback((newCorpus: string[]) => {
    setLocalCorpus(newCorpus);
    if (model) {
      useModelStore.setState({
        model: { ...model, corpus: newCorpus, vocabulary: {}, weights: null },
      });
      saveModel();
    }
  }, [model, saveModel]);

  const handleCorpusComplete = useCallback(() => {
    setConfiguredSteps((prev) => ({ ...prev, corpus: true }));
    setSelectedNode("config");
  }, []);

  // Handle config change
  const handleConfigChange = useCallback((newConfig: ModelConfig) => {
    setLocalConfig(newConfig);
    if (model) {
      useModelStore.setState({
        model: { ...model, config: newConfig, weights: null },
      });
      saveModel();
    }
  }, [model, saveModel]);

  const handleConfigComplete = useCallback(() => {
    setConfiguredSteps((prev) => ({ ...prev, config: true }));
    setSelectedNode("model");
  }, []);

  // Handle weights change
  const handleWeightsChange = useCallback((weights: Weights) => {
    setWeights(weights);
    setConfiguredSteps((prev) => ({ ...prev, model: true }));
  }, [setWeights]);

  const handleVocabularyChange = useCallback((vocabulary: Record<string, number>) => {
    setVocabulary(vocabulary);
  }, [setVocabulary]);

  const handleModelComplete = useCallback(() => {
    setSelectedNode("train");
  }, []);

  // Handle training
  const handleProgressUpdate = useCallback((iteration: number, loss: number, lossHistory: number[]) => {
    updateTrainingProgress({ iteration, loss, lossHistory });
  }, [updateTrainingProgress]);

  const handleStatusChange = useCallback((status: "idle" | "training" | "completed") => {
    setStatus(status);
    if (status === "completed") {
      setConfiguredSteps((prev) => ({ ...prev, train: true }));
    }
  }, [setStatus]);

  const handleTrainingComplete = useCallback(() => {
    navigate("/execution");
  }, [navigate]);

  // Close panel
  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (isLoading || !model || !localConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Training</h1>
        <p className="text-sm text-muted-foreground">
          Click on each node to configure and learn
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* React Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.5 }}
            minZoom={0.5}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls position="bottom-left" />
          </ReactFlow>

          {/* Instructions overlay when no node selected */}
          {!selectedNode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <Card className="bg-background/95 backdrop-blur">
                <CardContent className="py-3 px-4">
                  <p className="text-sm text-muted-foreground">
                    👆 Click on a node to configure it. Start with <strong>Corpus</strong>.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Inspector Panel */}
        {selectedNode && (
          <div className="w-[400px] border-l bg-background overflow-y-auto">
            <Card className="border-0 rounded-none h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg capitalize">{selectedNode}</CardTitle>
                <Button variant="ghost" size="icon" onClick={handleClosePanel}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {selectedNode === "corpus" && (
                  <CorpusPanel
                    corpus={localCorpus}
                    onCorpusChange={handleCorpusChange}
                    onComplete={handleCorpusComplete}
                  />
                )}
                {selectedNode === "config" && (
                  <ConfigPanel
                    config={localConfig}
                    onConfigChange={handleConfigChange}
                    onComplete={handleConfigComplete}
                  />
                )}
                {selectedNode === "model" && (
                  <ModelPanel
                    corpus={localCorpus}
                    config={localConfig}
                    weights={model.weights}
                    onWeightsChange={handleWeightsChange}
                    onVocabularyChange={handleVocabularyChange}
                    onComplete={handleModelComplete}
                  />
                )}
                {selectedNode === "train" && (
                  <TrainPanel
                    model={model}
                    onWeightsChange={handleWeightsChange}
                    onProgressUpdate={handleProgressUpdate}
                    onStatusChange={handleStatusChange}
                    onComplete={handleTrainingComplete}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
