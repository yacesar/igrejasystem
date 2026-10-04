import type { PresetId } from "@mca/validators";
import { assembleiaDeDeus } from "./assembleia-de-deus";
import { generico } from "./generico";
import type { Preset } from "./types";

export * from "./types";
export { assembleiaDeDeus, generico };

export const PRESETS: Record<PresetId, Preset> = {
  "assembleia-de-deus": assembleiaDeDeus,
  generico,
};

export function getPreset(id: PresetId | string | null | undefined): Preset {
  return (id && (PRESETS as Record<string, Preset>)[id]) || generico;
}
