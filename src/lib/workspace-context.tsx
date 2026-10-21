"use client";
import { createContext, useContext } from "react";
import { packagingScopes, type PackagingScope } from "./packaging-scopes";
export const WorkspaceContext = createContext<{
  userId: string;
  scopes: readonly PackagingScope[];
}>({ userId: "", scopes: packagingScopes });
export const useWorkspace = () => useContext(WorkspaceContext);
