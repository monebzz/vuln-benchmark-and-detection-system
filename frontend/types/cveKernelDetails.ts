export interface PatchInfoItem {
  fileContent: string;
  filename: string;
  vulnerable_function: string;
  nonvulnerable_function: string;
}

export interface CveKernalData {
  id: string;
  patchinfo: PatchInfoItem[];
  // add more fields if needed
}
