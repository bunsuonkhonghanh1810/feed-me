"use client";

import React, { ReactNode } from "react";
import dynamic from "next/dynamic";

const DynamicMeshProvider = dynamic(
  () => import("@meshsdk/react").then((mod) => mod.MeshProvider),
  { ssr: false }
);

export function MeshProviderWrapper({ children }: { children: ReactNode }) {
  return <DynamicMeshProvider>{children}</DynamicMeshProvider>;
}
