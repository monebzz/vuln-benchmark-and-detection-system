"use client";

import { useState, useEffect } from "react";
import { 
  Upload, FileCode2, ShieldAlert, Loader2, 
  CheckCircle2, AlertTriangle, ShieldCheck, Download, 
  Hash, X, ScanSearch 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Background from "@/components/background";
import { motion, AnimatePresence } from "framer-motion";

// Custom CountUp Component
function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 1000;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span>{count}</span>;
}

export default function ScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filter, setFilter] = useState<"all" | "vulnerable" | "safe">("all");
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setResults(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResults(null);
  }

  const handleScan = async () => {
    if (!file) return;

    setIsScanning(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || "http://localhost:8001";
      const response = await fetch(`${baseUrl}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze file. Please ensure the AI backend is running.");
      }

      const data = await response.json();
      setResults(data);
      toast({
        title: "Scan Complete",
        description: `Analyzed ${data.total_functions} functions. Found ${data.vulnerable_count} vulnerabilities.`,
        variant: data.vulnerable_count > 0 ? "destructive" : "default",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownloadJson = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vuln_report_${file?.name || 'scan'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filtered results
  const filteredFunctions = results?.results?.filter((item: any) => {
    if (filter === "all") return true;
    if (filter === "vulnerable") return item.label === "VULNERABLE";
    if (filter === "safe") return item.label === "SAFE";
    return true;
  }) || [];

  const vulnPct = results && results.total_functions > 0 ? (results.vulnerable_count / results.total_functions) * 100 : 0;
  const safePct = results && results.total_functions > 0 ? (results.safe_count / results.total_functions) * 100 : 0;

  // Render Bar
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    if (results) {
      setTimeout(() => setBarWidth(100), 100);
    } else {
      setBarWidth(0);
    }
  }, [results]);

  return (
    <div className="w-full min-h-screen relative pb-10">
      <Background />
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-icon { 
          0%, 100% { transform: translateY(0) } 
          50% { transform: translateY(-4px) } 
        }
        @keyframes shimmer {
          0% { background-position: -200% center }
          100% { background-position: 200% center }
        }
        @keyframes border-pulse {
          0%, 100% { border-color: rgba(139,92,246,0.3) }
          50% { border-color: rgba(139,92,246,0.8) }
        }
        @keyframes scan-progress {
          0% { background-position: -200% 0 }
          100% { background-position: 200% 0 }
        }
      `}} />

      <div className="relative z-10 p-6 max-w-6xl mx-auto space-y-6 pt-10">
        
        {/* 1. PAGE HEADER */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <div 
              style={{
                background: "rgba(123,97,255,0.15)",
                border: "1px solid rgba(123,97,255,0.3)",
                borderRadius: "14px",
                padding: "10px",
                boxShadow: "0 0 20px rgba(123,97,255,0.2)"
              }}
            >
              <ShieldAlert className="h-8 w-8 text-purple-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ letterSpacing: "-0.5px", fontWeight: 800 }}>
                AI Vuln Detection System
              </h1>
              <p className="text-gray-600 dark:text-white/70 mt-1">
                Upload C/C++ source code to detect vulnerabilities.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span style={{
              background: "rgba(123,97,255,0.12)",
              border: "1px solid rgba(123,97,255,0.25)",
              color: "#A78BFA",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "999px",
              padding: "4px 12px"
            }}>CodeBERT</span>
            <span style={{
              background: "rgba(123,97,255,0.12)",
              border: "1px solid rgba(123,97,255,0.25)",
              color: "#A78BFA",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "999px",
              padding: "4px 12px"
            }}>Joern</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 2. UPLOAD CARD (left panel) */}
          <div className="lg:col-span-1">
            <div 
              style={{
                boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 20px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
                backdropFilter: "blur(16px)",
                transition: "border-color 250ms ease",
                borderColor: isScanning ? "rgba(139,92,246,0.8)" : "transparent",
                animation: isScanning ? "border-pulse 1.5s ease-in-out infinite" : "none",
                borderWidth: "1px",
                borderStyle: "solid"
              }}
              className="rounded-2xl bg-white dark:bg-[hsl(var(--dashboard-card-bg))] overflow-hidden flex flex-col"
              onMouseEnter={(e) => {
                if(!isScanning) e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)";
              }}
              onMouseLeave={(e) => {
                if(!isScanning) e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <div className="p-6 pb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Upload Code</h3>
                <p className="text-sm text-gray-600 dark:text-white/70">Supported formats: .c, .cpp, .h</p>
              </div>
              
              <div className="p-6 pt-0 space-y-6 flex-1 flex flex-col">
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ease-in-out flex flex-col items-center justify-center relative overflow-hidden flex-1 min-h-[200px]`}
                  style={{
                    borderColor: isDragging ? "rgba(139,92,246,1)" : "rgba(156,163,175,0.3)",
                    background: isDragging ? "rgba(123,97,255,0.06)" : "transparent",
                    boxShadow: isDragging ? "inset 0 0 24px rgba(123,97,255,0.05)" : "none",
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="code-upload"
                    className="hidden"
                    accept=".c,.cpp,.h,.cc,.cxx,.hpp"
                    onChange={handleFileChange}
                  />
                  <label 
                    htmlFor="code-upload" 
                    className="cursor-pointer flex flex-col items-center w-full h-full justify-center group"
                  >
                    <div 
                      className="flex items-center justify-center mb-4 transition-colors"
                      style={{
                        width: "52px", height: "52px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "14px",
                        borderColor: isDragging ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)",
                        animation: isDragging ? "bounce-icon 1s infinite" : "none"
                      }}
                    >
                      <Upload className={`h-6 w-6 transition-colors ${isDragging ? "text-purple-400" : "text-gray-400 group-hover:text-purple-400"}`} />
                    </div>
                    {!file ? (
                      <>
                        <span className="font-semibold text-gray-900 dark:text-white">Click to select a file</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">or drag and drop here</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-gray-900 dark:text-white font-mono break-all">{file.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatBytes(file.size)}</span>
                      </>
                    )}
                  </label>
                </div>

                <AnimatePresence>
                  {file && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5" style={{ borderLeft: "2px solid #8B5CF6" }}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileCode2 className="h-5 w-5 text-purple-400 flex-shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold text-white truncate font-mono">{file.name}</span>
                          </div>
                        </div>
                        <button 
                          onClick={clearFile}
                          className="p-1 rounded-md text-gray-400 hover:text-red-400 transition-colors"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(239,68,68,0.12)";
                            e.currentTarget.style.border = "1px solid rgba(239,68,68,0.3)";
                            e.currentTarget.style.color = "#F87171";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.border = "none";
                            e.currentTarget.style.color = ""; 
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button 
                  className="w-full h-12 relative overflow-hidden transition-all duration-200"
                  style={{
                    background: isScanning 
                      ? "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)"
                      : "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                    boxShadow: "0 4px 20px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                    fontWeight: 800,
                    letterSpacing: "0.03em",
                    transform: isScanning ? "translateY(0)" : "",
                    animation: isScanning ? "shimmer 1.5s linear infinite" : "none",
                    backgroundSize: isScanning ? "200% auto" : "auto",
                  }}
                  onMouseEnter={(e) => {
                    if(!isScanning && !e.currentTarget.disabled) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 30px rgba(139,92,246,0.5), inset 0 1px 0 rgba(255,255,255,0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if(!isScanning && !e.currentTarget.disabled) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.15)";
                    }
                  }}
                  onMouseDown={(e) => {
                    if(!isScanning && !e.currentTarget.disabled) {
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                  onMouseUp={(e) => {
                    if(!isScanning && !e.currentTarget.disabled) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onClick={handleScan}
                  disabled={!file || isScanning}
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin relative z-10 text-white" />
                      <span className="relative z-10 text-white">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <FileCode2 className="mr-2 h-5 w-5 relative z-10 text-white" />
                      <span className="relative z-10 text-white">Run Analysis</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6 relative">
            {isScanning && (
              <div 
                style={{
                  height: "2px", position: "absolute", top: -20, left: 0, right: 0,
                  background: "linear-gradient(90deg, transparent, #8B5CF6, #8B5CF6, transparent)",
                  backgroundSize: "200% 100%",
                  animation: "scan-progress 1.6s linear infinite",
                  borderRadius: "2px"
                }}
              />
            )}

            {results && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* 3. SUMMARY STAT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { 
                      title: "Total Functions", value: results.total_functions, 
                      borderColor: "rgba(255,255,255,0.1)", iconBg: "rgba(255,255,255,0.06)", 
                      iconBorder: "transparent", Icon: FileCode2, iconColor: "text-blue-400",
                      valueColor: "text-white", glow: "transparent"
                    },
                    { 
                      title: "Vulnerable", value: results.vulnerable_count, 
                      borderColor: "rgba(239,68,68,0.6)", iconBg: "rgba(239,68,68,0.1)", 
                      iconBorder: "1px solid rgba(239,68,68,0.2)", Icon: AlertTriangle, iconColor: "text-red-400",
                      valueColor: "text-[#F87171]", glow: "radial-gradient(ellipse at 80% 90%, rgba(239,68,68,0.07) 0%, transparent 60%)"
                    },
                    { 
                      title: "Safe", value: results.safe_count, 
                      borderColor: "rgba(34,197,94,0.6)", iconBg: "rgba(34,197,94,0.1)", 
                      iconBorder: "1px solid rgba(34,197,94,0.2)", Icon: ShieldCheck, iconColor: "text-green-400",
                      valueColor: "text-[#4ADE80]", glow: "radial-gradient(ellipse at 80% 90%, rgba(34,197,94,0.07) 0%, transparent 60%)"
                    }
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.4 }}
                    >
                      <Card 
                        className="rounded-2xl border-gray-200 dark:border-white/10 bg-white dark:bg-[hsl(var(--dashboard-card-bg))] relative overflow-hidden transition-all duration-200 group"
                        style={{ borderTop: `2px solid ${stat.borderColor}` }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-3px)";
                          e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.4)${stat.iconBorder !== 'transparent' ? `, 0 0 0 1px ${stat.borderColor.replace('0.6','0.2')}` : ''}`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div 
                          className="absolute inset-0 pointer-events-none" 
                          style={{ background: stat.glow }}
                        />
                        <CardContent className="p-5 flex flex-col relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.title}</p>
                            <div 
                              className="flex items-center justify-center rounded-lg"
                              style={{ width: 38, height: 38, background: stat.iconBg, border: stat.iconBorder }}
                            >
                              <stat.Icon className={`h-5 w-5 ${stat.iconColor}`} />
                            </div>
                          </div>
                          <p className={`text-4xl font-bold ${stat.valueColor}`}>
                            <CountUp value={stat.value} />
                          </p>
                          <div 
                            className="absolute font-bold pointer-events-none leading-none"
                            style={{
                              fontSize: 56, fontWeight: 800, color: "rgba(255,255,255,0.025)",
                              bottom: -8, right: 10
                            }}
                          >
                            {stat.value}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* 4. RISK DISTRIBUTION BAR */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-white/10 bg-[hsl(var(--dashboard-card-bg))] p-4 px-5 mb-4"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-semibold text-gray-400">Risk Distribution</span>
                    <span className="text-[14px] font-bold text-[#EF4444]">{vulnPct.toFixed(1)}% vulnerable</span>
                  </div>
                  <div className="mt-3 h-[5px] rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div 
                      className="h-full transition-all ease-out" 
                      style={{ 
                        width: `${barWidth === 100 ? vulnPct : 0}%`, 
                        background: "linear-gradient(90deg, #EF4444, #DC2626)",
                        transitionDuration: "1s"
                      }}
                    />
                    <div 
                      className="h-full transition-all ease-out" 
                      style={{ 
                        width: `${barWidth === 100 ? safePct : 0}%`, 
                        background: "linear-gradient(90deg, #22C55E, #16A34A)",
                        transitionDuration: "1s"
                      }}
                    />
                  </div>
                  <div className="mt-2 flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-[6px] h-[6px] rounded-full bg-[#EF4444]" />
                      <span className="text-[11px] text-gray-400">Vulnerable ({results.vulnerable_count})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-[6px] h-[6px] rounded-full bg-[#22C55E]" />
                      <span className="text-[11px] text-gray-400">Safe ({results.safe_count})</span>
                    </div>
                  </div>
                </motion.div>

                {/* 5. ANALYSIS RESULTS SECTION */}
                <Card className="rounded-2xl border-gray-200 dark:border-white/10 bg-white dark:bg-[hsl(var(--dashboard-card-bg))] overflow-hidden shadow-lg border-t-[1px] border-t-white/5">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/10 pb-4 border-b border-white/5">
                    <div>
                      <CardTitle className="text-gray-900 dark:text-white">Analysis Results</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-white/70 mt-1">Detailed breakdown of scanned functions.</CardDescription>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: "all", label: `All (${results.total_functions})` },
                        { id: "vulnerable", label: `Vulnerable (${results.vulnerable_count})` },
                        { id: "safe", label: `Safe (${results.safe_count})` }
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setFilter(f.id as any)}
                          className="transition-all duration-200 ease-in-out"
                          style={{
                            background: filter === f.id ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
                            border: filter === f.id ? "1px solid rgba(139,92,246,0.35)" : "1px solid transparent",
                            color: filter === f.id ? "#A78BFA" : "#9CA3AF",
                            borderRadius: "999px",
                            padding: "5px 14px",
                            fontSize: "12px",
                            fontWeight: 600
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full ml-auto border-purple-500/50 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 h-8 text-xs font-semibold px-4 transition-all"
                        onClick={handleDownloadJson}
                      >
                        <Download className="h-3 w-3 mr-2" />
                        Export JSON
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {filteredFunctions.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {/* 6. FUNCTION CARDS */}
                        {filteredFunctions.map((item: any, idx: number) => {
                          const isVuln = item.label === "VULNERABLE";
                          return (
                            <motion.div 
                              key={idx} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.04, duration: 0.25 }}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150 ease-in-out hover:bg-white/[0.02]"
                              style={{
                                borderLeft: `2px solid ${isVuln ? 'rgba(239,68,68,0.7)' : 'rgba(34,197,94,0.7)'}`
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = isVuln ? "rgba(239,68,68,0.05)" : "rgba(34,197,94,0.04)";
                                e.currentTarget.style.borderLeftColor = isVuln ? "rgba(239,68,68,1)" : "rgba(34,197,94,1)";
                                e.currentTarget.style.transform = "translateX(3px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.borderLeftColor = isVuln ? "rgba(239,68,68,0.7)" : "rgba(34,197,94,0.7)";
                                e.currentTarget.style.transform = "translateX(0)";
                              }}
                            >
                              <div className="flex-1 overflow-hidden">
                                <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 font-mono text-[13px] truncate">
                                  {item.function_name}
                                </p>
                                <div className="flex items-center gap-1 mt-1 text-gray-500">
                                  <Hash className="h-[10px] w-[10px]" />
                                  <span className="text-[11px]">Lines {item.start_line}–{item.end_line}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 shrink-0">
                                <div 
                                  style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "6px",
                                    padding: "3px 9px",
                                    fontSize: "11px",
                                    fontFamily: "monospace",
                                    color: "#9CA3AF"
                                  }}
                                >
                                  {(item.confidence * 100).toFixed(1)}% conf.
                                </div>
                                
                                <div 
                                  className="flex items-center justify-center"
                                  style={{
                                    width: "28px", height: "28px",
                                    background: isVuln ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.1)",
                                    border: `1px solid ${isVuln ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.2)'}`,
                                    borderRadius: "7px"
                                  }}
                                >
                                  {isVuln ? (
                                    <ShieldAlert className="h-[15px] w-[15px] text-[#F87171]" />
                                  ) : (
                                    <ShieldCheck className="h-[15px] w-[15px] text-[#4ADE80]" />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center p-12 text-gray-500 dark:text-gray-400">
                        No functions match the selected filter.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* 8. EMPTY STATE (before any scan) */}
            {!results && !isScanning && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full min-h-[500px] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-black/20"
              >
                <div className="p-4 bg-white/5 rounded-full mb-4">
                  <ScanSearch className="h-10 w-10 text-purple-400/50" />
                </div>
                <h3 className="text-[15px] font-medium text-gray-400">No scan results yet</h3>
                <p className="text-[12px] text-gray-500 mt-1">
                  Upload a C/C++ file and run analysis
                </p>
              </motion.div>
            )}
            
            {/* LOADING STATE */}
            {isScanning && (
              <div className="h-full min-h-[500px] border border-purple-500/20 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-purple-500/5 relative overflow-hidden">
                <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analyzing Code...</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-2 text-sm">
                  Please wait while Joern extracts functions and CodeBERT analyzes them. This may take a minute.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
