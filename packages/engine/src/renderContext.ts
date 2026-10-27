// 合成内共享的上下文：素材地址解析、素材加载失败回调（TimelineVideo 与元素渲染共用，避免循环引用）
import React from "react";
import { staticFile } from "remotion";

export type Resolver = (src: string) => string;
export const AssetResolver = React.createContext<Resolver>(staticFile);
export const MediaErrorHandler = React.createContext<((src: string) => void) | undefined>(undefined);
