import { processSubcollections } from "./context/extract-diff-block";

async function run() {
  const res = await fetch("http://127.0.0.1:8001/api/kernel-detail/by-cve?cveId=CVE-2023-2163");
  const data = await res.json();
  const processed = processSubcollections(data);
  console.log(JSON.stringify(processed, null, 2));
}

run();
