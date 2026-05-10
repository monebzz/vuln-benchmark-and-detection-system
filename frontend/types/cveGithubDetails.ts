export interface GithubPatchInfo {
  id: string;
  fileContent: string;
  filename: string;
  vulnerable_function: string;
  nonvulnerable_function: string;
  [key: string]: any; // allow flexibility if fields vary
}

export interface CveGithubData {
  id: string;
  [key: string]: any; // main doc fields
  patchinfo: GithubPatchInfo[];
}
