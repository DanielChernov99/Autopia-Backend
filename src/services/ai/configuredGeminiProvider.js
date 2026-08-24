import { getGeminiConfig } from "../../config/geminiConfig.js";
import {
  createGeminiClient,
  createGeminiProvider,
} from "./geminiProvider.js";

export const createConfiguredGeminiProvider = ({
  environment = process.env,
  createClient = createGeminiClient,
  createProvider = createGeminiProvider,
} = {}) => {
  const { apiKey, model, timeoutMs } = getGeminiConfig(environment);
  const client = createClient({ apiKey });

  return createProvider({ client, model, timeoutMs });
};
