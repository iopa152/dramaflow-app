import { Dramaflow } from "./dramaflow";
import type { Channel } from "./types";

const channels = new Map<string, Channel>([["dramaflow", new Dramaflow()]]);

export function getChannel(): Channel {
  const source = channels.get(process.env.DRAMAFLOW_CHANNEL?.trim() || "dramaflow");
  if (!source) throw Object.assign(new Error("渠道未配置，请检查 DRAMAFLOW_CHANNEL"), { status: 503 });
  return source;
}
