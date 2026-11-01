// H.264 硬件编码：实际试编码后再选择，避免 FFmpeg“列出了编码器但机器没有对应显卡”的假阳性。
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";

const run = promisify(execFile);
const require = createRequire(import.meta.url);
const extension = process.platform === "win32" ? ".exe" : "";
export const SOFTWARE_ENCODER = "libx264";
export type HardwareEncoder = "h264_nvenc" | "h264_qsv" | "h264_amf" | "h264_videotoolbox";
export type EncoderPreference = "auto" | "off" | "nvenc" | "qsv" | "amf" | "videotoolbox";
export type EncoderName = HardwareEncoder | typeof SOFTWARE_ENCODER;

const CODEC: Record<Exclude<EncoderPreference, "auto" | "off">, HardwareEncoder> = {
  nvenc: "h264_nvenc", qsv: "h264_qsv", amf: "h264_amf", videotoolbox: "h264_videotoolbox",
};
const PROBE_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAAD0lEQVR4nGNoQAMMI1sAAAUMgAFaSOXNAAAAAElFTkSuQmCC", "base64");

export function hardwareQualityArgs(encoder: HardwareEncoder, crf: number): string[] {
  const q = String(Math.max(0, Math.min(51, Math.round(crf))));
  if (encoder === "h264_nvenc") return ["-preset", "p5", "-tune", "hq", "-rc", "vbr", "-cq", q, "-b:v", "0"];
  if (encoder === "h264_qsv") return ["-preset", "medium", "-global_quality", q];
  if (encoder === "h264_amf") return ["-quality", "quality", "-rc", "cqp", "-qp_i", q, "-qp_p", q];
  return ["-q:v", q];
}

/** 同时覆盖 Remotion 的分段预编码与最终拼接；最终 copy 视频流时不改参数。 */
export function applyHardwareEncoder(args: readonly string[], encoder: HardwareEncoder, crf: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-crf" || args[i] === "-preset") { i++; continue; }
    if (args[i] === "-c:v" && args[i + 1] === SOFTWARE_ENCODER) {
      out.push("-c:v", encoder, ...hardwareQualityArgs(encoder, crf));
      i++;
    } else out.push(args[i]);
  }
  return out;
}

export function parseEncoderPreference(raw: string | undefined): EncoderPreference {
  const value = (raw ?? "auto").trim().toLowerCase();
  if (["auto", "off", "nvenc", "qsv", "amf", "videotoolbox"].includes(value)) return value as EncoderPreference;
  throw new Error("DJIAN_GPU_ENCODER 只支持 auto/off/nvenc/qsv/amf/videotoolbox");
}

function candidates(preference: EncoderPreference, platform: string): HardwareEncoder[] {
  if (preference === "off") return [];
  if (preference !== "auto") return [CODEC[preference]];
  if (platform === "darwin") return ["h264_videotoolbox"];
  if (platform === "win32" || platform === "linux") return ["h264_nvenc", "h264_qsv", "h264_amf"];
  return [];
}

export async function chooseHardwareEncoder(
  preference: EncoderPreference,
  probe: (encoder: HardwareEncoder) => Promise<boolean>,
  platform = process.platform,
): Promise<EncoderName> {
  for (const encoder of candidates(preference, platform)) if (await probe(encoder)) return encoder;
  if (preference !== "auto" && preference !== "off") throw new Error("硬件编码器 " + CODEC[preference] + " 实际试编码失败；请检查显卡驱动，或改用 DJIAN_GPU_ENCODER=auto/off");
  return SOFTWARE_ENCODER;
}

async function removeScratch(directory: string) {
  if (path.dirname(path.resolve(directory)) !== path.resolve(os.tmpdir())) throw new Error("Invalid encoder probe directory");
  await fs.rm(directory, { recursive: true, force: true });
}

async function probeEncoder(executable: string, encoder: HardwareEncoder): Promise<boolean> {
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "djian-gpu-probe-"));
  try {
    const output = path.join(scratch, "probe.mp4");
    const task = run(executable, ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-f", "image2pipe", "-c:v", "png", "-i", "pipe:0",
      "-frames:v", "1", "-an", "-c:v", encoder, ...hardwareQualityArgs(encoder, 20), "-vf", "scale=256:256", "-pix_fmt", "yuv420p", output],
    { timeout: 12_000, maxBuffer: 256_000, windowsHide: true });
    task.child.stdin?.on("error", () => {});
    task.child.stdin?.end(PROBE_PNG);
    await task;
    return (await fs.stat(output)).size >= 128;
  } catch { return false; }
  finally { await removeScratch(scratch); }
}

const selections = new Map<string, Promise<EncoderName>>();
const failed = new Set<string>();
export async function resolveEncoder(executable: string, preference: EncoderPreference): Promise<EncoderName> {
  const key = path.resolve(executable) + "|" + preference;
  if (!selections.has(key)) {
    const task = chooseHardwareEncoder(preference, async (encoder) => {
      const id = path.resolve(executable) + "|" + encoder;
      if (failed.has(id)) return false;
      return probeEncoder(executable, encoder);
    });
    selections.set(key, task);
    void task.catch(() => selections.delete(key));
  }
  return selections.get(key)!;
}

export function markEncoderFailed(executable: string, encoder: EncoderName) {
  if (encoder !== SOFTWARE_ENCODER) failed.add(path.resolve(executable) + "|" + encoder);
  for (const key of [...selections.keys()]) if (key.startsWith(path.resolve(executable) + "|")) selections.delete(key);
}

export function ffmpegExecutable(directory: string | undefined): string {
  if (directory) return path.join(directory, "ffmpeg" + extension);
  // renderMedia 未传 binariesDirectory 时使用 Remotion 随包 FFmpeg；探测必须针对同一个二进制。
  const rendererRequire = createRequire(require.resolve("@remotion/renderer"));
  const names: Record<string, string> = {
    "win32-x64": "compositor-win32-x64-msvc",
    "linux-x64": "compositor-linux-x64-gnu",
    "linux-arm64": "compositor-linux-arm64-gnu",
    "darwin-x64": "compositor-darwin-x64",
    "darwin-arm64": "compositor-darwin-arm64",
  };
  const name = names[process.platform + "-" + process.arch];
  if (!name) throw new Error("当前平台没有随包 FFmpeg，请设置 DJIAN_RENDER_BINARIES_DIR");
  return path.join(path.dirname(rendererRequire.resolve("@remotion/" + name + "/package.json")), "ffmpeg" + extension);
}
