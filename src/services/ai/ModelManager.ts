export interface LoadedModel {
  name: string;
  run(input: Float32Array): Promise<Float32Array>;
}

/**
 * Section 53: loads ONNX models from assets/models/ via ONNX Runtime
 * Mobile. Model training happens separately in Python/PyTorch (Section 2)
 * and is out of this repo's scope — no trained .onnx file ships here, so
 * `load()` fails clearly instead of returning fabricated numbers. Wire in
 * `onnxruntime-react-native`'s InferenceSession once a real model exists.
 */
export class ModelManager {
  private readonly models = new Map<string, LoadedModel>();

  async load(name: string, assetPath: string): Promise<LoadedModel> {
    const cached = this.models.get(name);
    if (cached) {
      return cached;
    }

    // TODO(Phase 13): once a trained model is bundled under assets/models/,
    // replace this with:
    //   const session = await InferenceSession.create(assetPath);
    //   const model: LoadedModel = { name, run: (input) => session.run(...) };
    //   this.models.set(name, model);
    //   return model;
    throw new Error(`Model "${name}" is not available yet (${assetPath} is not bundled).`);
  }

  unload(name: string): void {
    this.models.delete(name);
  }

  isLoaded(name: string): boolean {
    return this.models.has(name);
  }
}
