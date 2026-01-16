import { create } from "zustand";
import { storage } from "@/db/storage";
import type { Model, TrainingStage, Weights, TrainingProgress } from "@/lib/types";
import { createInitialModel } from "@/lib/types";

const MODEL_KEY = "llm-model";

interface ModelStore {
  // State
  model: Model | null;
  isLoading: boolean;

  // Playback state
  isPlaying: boolean;
  playbackSpeed: number; // 1 = normal, 0.5 = slow, 2 = fast

  // Actions
  loadModel: () => Promise<void>;
  saveModel: () => Promise<void>;
  resetModel: () => Promise<void>;

  // Training actions
  setStage: (stage: TrainingStage) => void;
  setVocabulary: (vocabulary: Record<string, number>) => void;
  setWeights: (weights: Weights) => void;
  updateTrainingProgress: (progress: Partial<TrainingProgress>) => void;
  setStatus: (status: Model["status"]) => void;

  // Playback actions
  play: () => void;
  pause: () => void;
  step: () => void;
  setPlaybackSpeed: (speed: number) => void;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  // Initial state
  model: null,
  isLoading: true,
  isPlaying: false,
  playbackSpeed: 1,

  // Load model from storage
  loadModel: async () => {
    set({ isLoading: true });
    const saved = await storage.get<Model>(MODEL_KEY);
    if (saved) {
      set({ model: saved, isLoading: false });
    } else {
      set({ model: createInitialModel(), isLoading: false });
    }
  },

  // Save model to storage
  saveModel: async () => {
    const { model } = get();
    if (model) {
      await storage.set(MODEL_KEY, model);
    }
  },

  // Reset model to initial state
  resetModel: async () => {
    await storage.remove(MODEL_KEY);
    set({ model: createInitialModel() });
  },

  // Set training stage
  setStage: (stage) => {
    const { model } = get();
    if (model) {
      set({ model: { ...model, stage } });
      get().saveModel();
    }
  },

  // Set vocabulary
  setVocabulary: (vocabulary) => {
    const { model } = get();
    if (model) {
      set({ model: { ...model, vocabulary } });
      get().saveModel();
    }
  },

  // Set weights
  setWeights: (weights) => {
    const { model } = get();
    if (model) {
      set({ model: { ...model, weights } });
      get().saveModel();
    }
  },

  // Update training progress
  updateTrainingProgress: (progress) => {
    const { model } = get();
    if (model) {
      set({
        model: {
          ...model,
          trainingProgress: { ...model.trainingProgress, ...progress },
        },
      });
      get().saveModel();
    }
  },

  // Set model status
  setStatus: (status) => {
    const { model } = get();
    if (model) {
      set({ model: { ...model, status } });
      get().saveModel();
    }
  },

  // Playback controls
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  step: () => {
    // Step logic will be implemented in training/execution components
    set({ isPlaying: false });
  },
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
}));
