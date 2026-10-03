import { createContext, useContext } from 'react';

export const ProjectSession = createContext<string | undefined>(undefined);
export const useProjectSession = () => useContext(ProjectSession);
