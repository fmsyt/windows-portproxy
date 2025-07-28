import { invoke } from "@tauri-apps/api/core";

export async function getElevatedState(): Promise<boolean> {
  const elevated = await invoke<boolean>("is_elevated");
  return elevated;
}
