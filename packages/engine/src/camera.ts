// 镜头：kind=camera 的元素不画任何东西，只描述“镜头框”——画面里能看到的区域。
// x/y = 镜头框中心（画布比例），w = 镜头框宽度（1 = 整个画面，0.5 = 放大 2 倍；高度按画布比例）。
// 关键帧：x/y 平移镜头框，scale 缩放镜头框（0.5 = 再放大 2 倍）。
// 作用范围：同 group 的元素（一页幻灯片）；没有 group 的镜头作用于全部元素。字幕不受镜头影响。
import type { Overlay } from "./schema";
import { evalKeyframes } from "./timeline";
import { resolveAnimations } from "./presets";

export interface CameraState { cx: number; cy: number; zoom: number }

/** 镜头在其元素内 sec 时刻的状态（中心像素 + 放大倍数） */
export function cameraState(cam: Overlay, sec: number, W: number, H: number): CameraState {
  const anims = resolveAnimations(cam, cam.endSeconds - cam.startSeconds);
  const dx = evalKeyframes(anims?.x, sec) ?? 0, dy = evalKeyframes(anims?.y, sec) ?? 0;
  const scale = evalKeyframes(anims?.scale, sec) ?? 1;
  const fw = Math.max(0.02, (cam.w ?? 1) * scale);
  return { cx: ((cam.x ?? 0.5) + dx) * W, cy: ((cam.y ?? 0.5) + dy) * H, zoom: 1 / fw };
}

/** 把画布坐标映射到镜头画面的 CSS 变换（transform-origin 为左上角） */
export const cameraTransform = (c: CameraState, W: number, H: number) =>
  "translate(" + W / 2 + "px, " + H / 2 + "px) scale(" + c.zoom + ") translate(" + -c.cx + "px, " + -c.cy + "px)";

/** 绝对时刻 t 作用于元素 ov 的镜头：同组镜头优先，其次不分组的全局镜头 */
export function activeCamera(cameras: readonly Overlay[], ov: Overlay, t: number): Overlay | undefined {
  if ((ov.kind ?? "subtitle") === "subtitle" || ov.kind === "camera") return undefined;
  const live = cameras.filter((c) => t >= c.startSeconds && t < c.endSeconds);
  return (ov.group ? live.find((c) => c.group === ov.group) : undefined) ?? live.find((c) => !c.group);
}
