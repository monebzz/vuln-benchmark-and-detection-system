document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const codeInput = document.getElementById("code-input");
    const btnScan = document.getElementById("btn-scan");
    const btnClear = document.getElementById("btn-clear");
    const btnLoadSample = document.getElementById("btn-load-sample");
    const btnUpload = document.getElementById("btn-upload");
    const fileUpload = document.getElementById("file-upload");
    const btnExport = document.getElementById("btn-export");
    const fileIndicator = document.getElementById("file-indicator");
    const fileNameSpan = document.getElementById("file-name");
    
    const placeholderView = document.getElementById("placeholder-view");
    const loadingView = document.getElementById("loading-view");
    const contentView = document.getElementById("content-view");
    
    const cardVerdict = document.getElementById("card-verdict");
    const valVerdict = document.getElementById("val-verdict");
    const valProb = document.getElementById("val-prob");
    const gaugeFill = document.getElementById("gauge-fill");
    const codeVisualizer = document.getElementById("code-visualizer");
    
    let currentResults = null;
    let currentFilename = "snippet.c";

    // Sample Vulnerable Code snippet
    const sampleVulnerableCode = `void process_user_data(char *user_input) {
    char buffer[64];
    
    // VULNERABLE: Direct strcpy into fixed buffer can cause stack overflow
    strcpy(buffer, user_input);
    
    printf("Processed input: %s\\n", buffer);
}`;

    // Event Listeners
    btnLoadSample.addEventListener("click", () => {
        codeInput.value = sampleVulnerableCode;
        currentFilename = "sample_buffer_overflow.c";
        if (fileIndicator) {
            fileIndicator.style.display = "inline-flex";
            fileNameSpan.innerText = currentFilename;
        }
    });

    btnClear.addEventListener("click", () => {
        codeInput.value = "";
        currentResults = null;
        if (fileIndicator) {
            fileIndicator.style.display = "none";
            fileNameSpan.innerText = "";
        }
        showPlaceholder();
    });

    // File Upload handling
    btnUpload.addEventListener("click", () => {
        fileUpload.click();
    });

    fileUpload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        currentFilename = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            codeInput.value = event.target.result;
            if (fileIndicator) {
                fileIndicator.style.display = "inline-flex";
                fileNameSpan.innerText = file.name;
            }
        };
        reader.readAsText(file);
    });

    // Drag and drop onto textarea
    codeInput.addEventListener("dragover", (e) => {
        e.preventDefault();
        codeInput.style.borderColor = "var(--color-primary)";
    });

    codeInput.addEventListener("dragleave", (e) => {
        e.preventDefault();
        codeInput.style.borderColor = "";
    });

    codeInput.addEventListener("drop", (e) => {
        e.preventDefault();
        codeInput.style.borderColor = "";
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            currentFilename = file.name;
            const reader = new FileReader();
            reader.onload = (event) => {
                codeInput.value = event.target.result;
                if (fileIndicator) {
                    fileIndicator.style.display = "inline-flex";
                    fileNameSpan.innerText = file.name;
                }
            };
            reader.readAsText(file);
        }
    });

    // Export JSON report
    if (btnExport) {
        btnExport.addEventListener("click", () => {
            if (!currentResults) return;
            const blob = new Blob([JSON.stringify(currentResults, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `linevul_report_${currentFilename.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    btnScan.addEventListener("click", async () => {
        const code = codeInput.value.trim();
        if (!code) {
            alert("Please paste or upload some C/C++ code first.");
            return;
        }

        // Show loading state
        showLoading();
        btnScan.classList.add("loading", "disabled");
        
        try {
            const response = await fetch("/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    code: code,
                    filename: currentFilename
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Prediction request failed.");
            }

            const result = await response.json();
            currentResults = result;
            renderResults(result);
        } catch (error) {
            console.error("Error running scan:", error);
            alert("Error running the LineVul prediction model: " + error.message);
            showPlaceholder();
        } finally {
            btnScan.classList.remove("loading", "disabled");
        }
    });

    // Helper functions for view switching
    function showPlaceholder() {
        placeholderView.classList.remove("hidden");
        loadingView.classList.add("hidden");
        contentView.classList.add("hidden");
    }

    function showLoading() {
        placeholderView.classList.add("hidden");
        loadingView.classList.remove("hidden");
        contentView.classList.add("hidden");
    }

    function showContent() {
        placeholderView.classList.add("hidden");
        loadingView.classList.add("hidden");
        contentView.classList.remove("hidden");
    }

    // Render Results on UI
    function renderResults(result) {
        showContent();
        
        // Update Verdict Card
        const percentage = (result.probability * 100).toFixed(1);
        valProb.innerText = `${percentage}%`;
        gaugeFill.style.width = `${percentage}%`;

        const iconBox = cardVerdict.querySelector(".stat-icon-box");
        const verdictIcon = cardVerdict.querySelector(".verdict-icon");

        if (result.vulnerable) {
            valVerdict.innerText = "VULNERABLE";
            valVerdict.style.color = "var(--color-vuln)";
            cardVerdict.style.backgroundColor = "var(--bg-vuln-card)";
            cardVerdict.style.borderColor = "var(--color-vuln-glow)";
            iconBox.className = "stat-icon-box bg-vuln";
            verdictIcon.className = "fa-solid fa-circle-exclamation verdict-icon";
        } else {
            valVerdict.innerText = "SECURE";
            valVerdict.style.color = "var(--color-safe)";
            cardVerdict.style.backgroundColor = "var(--bg-safe-card)";
            cardVerdict.style.borderColor = "var(--color-safe-glow)";
            iconBox.className = "stat-icon-box bg-safe";
            verdictIcon.className = "fa-solid fa-circle-check verdict-icon";
        }

        // Render Mapped CVE Card
        const cveCard = document.getElementById("cve-card");
        if (cveCard) {
            if (result.mapped_cve) {
                cveCard.style.display = "block";
                const cveIdEl = document.getElementById("val-cve-id");
                const cveSevEl = document.getElementById("val-cve-severity");
                const cveCweEl = document.getElementById("val-cve-cwe");
                const cveReasonEl = document.getElementById("val-cve-reason");
                const cveDescEl = document.getElementById("val-cve-desc");

                if (cveIdEl) cveIdEl.innerText = result.mapped_cve.cve_id;
                if (cveSevEl) cveSevEl.innerText = `${result.mapped_cve.severity || 'HIGH'} (CVSS ${result.mapped_cve.basescore || 'N/A'})`;
                if (cveCweEl) cveCweEl.innerText = result.mapped_cve.category_type || result.mapped_cve.cwe_info?.split(':')[0] || 'CWE';
                if (cveReasonEl) cveReasonEl.innerText = result.mapped_cve.match_reason || '';
                if (cveDescEl) cveDescEl.innerText = result.mapped_cve.description || 'Full CVE description available in database.';
            } else {
                cveCard.style.display = "none";
            }
        }

        // Render Patch Diff Card
        const patchCard = document.getElementById("patch-card");
        if (patchCard) {
            if (result.mapped_cve && result.mapped_cve.patch) {
                patchCard.style.display = "block";
                const badge = document.getElementById("patch-cve-badge");
                const diffContainer = document.getElementById("patch-diff-container");
                const btnCopy = document.getElementById("btn-copy-patch");

                if (badge) badge.innerText = result.mapped_cve.cve_id;
                if (diffContainer) {
                    diffContainer.innerHTML = "";
                    const patchLines = result.mapped_cve.patch.split("\n");
                    patchLines.forEach(l => {
                        const lineDiv = document.createElement("div");
                        lineDiv.style.whiteSpace = "pre";
                        lineDiv.innerText = l || " ";
                        if (l.startsWith("+") && !l.startsWith("+++")) {
                            lineDiv.style.backgroundColor = "rgba(16, 185, 129, 0.18)";
                            lineDiv.style.color = "#6ee7b7";
                            lineDiv.style.fontWeight = "600";
                            lineDiv.style.padding = "1px 4px";
                            lineDiv.style.borderRadius = "2px";
                        } else if (l.startsWith("-") && !l.startsWith("---")) {
                            lineDiv.style.backgroundColor = "rgba(239, 68, 68, 0.18)";
                            lineDiv.style.color = "#fca5a5";
                            lineDiv.style.fontWeight = "600";
                            lineDiv.style.padding = "1px 4px";
                            lineDiv.style.borderRadius = "2px";
                        } else if (l.startsWith("@@")) {
                            lineDiv.style.color = "#38bdf8";
                            lineDiv.style.fontWeight = "bold";
                        }
                        diffContainer.appendChild(lineDiv);
                    });
                }
                if (btnCopy) {
                    btnCopy.onclick = () => {
                        navigator.clipboard.writeText(result.mapped_cve.patch);
                        btnCopy.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                        setTimeout(() => {
                            btnCopy.innerHTML = '<i class="fa-solid fa-copy"></i> Copy Patch';
                        }, 2000);
                    };
                }
            } else {
                patchCard.style.display = "none";
            }
        }

        // Render code line-by-line with attention weights
        codeVisualizer.innerHTML = "";
        
        result.lines.forEach((line) => {
            const lineEl = document.createElement("div");
            lineEl.className = "visualizer-line";
            
            // Apply attention styling if any
            if (line.normalized_score > 0.1) {
                lineEl.classList.add("highlighted");
                // Variable soft opacity of red based on normalized score (0.1 to 0.7)
                const opacity = Math.min(0.08 + line.normalized_score * 0.45, 0.55);
                lineEl.style.backgroundColor = `rgba(239, 68, 68, ${opacity})`;
                lineEl.title = `Attention Score: ${line.attention_score} (Normalized: ${(line.normalized_score * 100).toFixed(1)}%)`;
            }

            const numEl = document.createElement("span");
            numEl.className = "line-number";
            numEl.innerText = line.line_no;

            const codeEl = document.createElement("span");
            codeEl.className = "line-content";
            codeEl.innerText = line.code;

            lineEl.appendChild(numEl);
            lineEl.appendChild(codeEl);
            codeVisualizer.appendChild(lineEl);
        });
    }
});
