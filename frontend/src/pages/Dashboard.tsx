import { useEffect, useState } from "react";
import { fetchApi } from "../lib/api";
import { CredentialForm } from "../components/CredentialForm";
import { ShareCredentialForm } from "../components/ShareCredentialForm";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Plus, Edit3, Share2, Trash2, Download, Upload, History, X, Eye, EyeOff, Copy } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import React from "react";

function TiltCard({ children, layoutId }: any) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };
  return (
    <motion.div layoutId={layoutId} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="group relative p-6 border border-white/10 bg-black/40 backdrop-blur-md hover:bg-white/5 transition-colors cursor-default">
      {children}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
}

export default function Dashboard() {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [editingCred, setEditingCred] = useState<any>(null);
  const [shareCredId, setShareCredId] = useState<string | null>(null);
  const [sharesList, setSharesList] = useState<any[]>([]);
  const [historyCredId, setHistoryCredId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [revealedCreds, setRevealedCreds] = useState<Set<string>>(new Set());
  const [revealedHistory, setRevealedHistory] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const { name, id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const filterCategory = searchParams.get("category") || name;
  const filterClient = searchParams.get("client") || id;
  const navigate = useNavigate();

  const toggleReveal = (cid: string) => setRevealedCreds(prev => { const n = new Set(prev); n.has(cid) ? n.delete(cid) : n.add(cid); return n; });
  const toggleRevealH = (hid: string) => setRevealedHistory(prev => { const n = new Set(prev); n.has(hid) ? n.delete(hid) : n.add(hid); return n; });
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); };

  const loadData = () => {
    fetchApi("/credentials").then(d => setCredentials(Array.isArray(d) ? d : [])).catch(console.error);
    fetchApi("/dashboard").then(d => setStats(d)).catch(console.error);
    fetchApi("/categories").then(d => setCategories(Array.isArray(d) ? d : [])).catch(console.error);
  };
  useEffect(() => { loadData(); }, []);

  const handleDelete = async (cid: string) => {
    if (!confirm("Permanently erase this record?")) return;
    try { await fetchApi(`/credentials/${cid}`, { method: "DELETE" }); toast.success("Record erased"); loadData(); }
    catch (e: any) { toast.error(e.message || "Failed to delete"); }
  };

  const handleExport = async () => {
    try {
      const data = await fetchApi("/credentials/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `vault-export-${new Date().toISOString().split("T")[0]}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.length} credentials`);
    } catch (e: any) { toast.error(e.message || "Export failed"); }
  };

  const handleImport = () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string);
          const creds = Array.isArray(parsed) ? parsed : parsed.credentials;
          const res = await fetchApi("/credentials/import", { method: "POST", body: JSON.stringify({ credentials: creds }) });
          toast.success(`Imported ${res.imported} credentials`); loadData();
        } catch (e: any) { toast.error(e.message || "Import failed"); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const openShareModal = async (cid: string) => {
    setShareCredId(cid);
    try { const s = await fetchApi(`/credentials/${cid}/shares`); setSharesList(Array.isArray(s) ? s : []); }
    catch { setSharesList([]); }
  };

  const revokeShare = async (cid: string, sid: string) => {
    try { await fetchApi(`/credentials/${cid}/share/${sid}`, { method: "DELETE" }); toast.success("Access revoked"); openShareModal(cid); }
    catch (e: any) { toast.error(e.message || "Failed to revoke"); }
  };

  const openHistoryModal = async (cid: string) => {
    setHistoryCredId(cid); setRevealedHistory(new Set());
    try { const d = await fetchApi(`/credentials/${cid}/history`); setHistoryData(Array.isArray(d) ? d : []); }
    catch { setHistoryData([]); }
  };

  const displayedCredentials = credentials.filter(c => {
    if (filterCategory) {
      const cat = categories.find(ca => ca.name.toLowerCase() === filterCategory.toLowerCase());
      if (cat && c.category_id !== cat.id) return false;
      if (!cat && !c.title.toLowerCase().includes(filterCategory.toLowerCase())) return false;
    }
    if (filterClient && c.client_id !== filterClient) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !(c.data?.username?.toLowerCase().includes(q)) && !(c.tags?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  useEffect(() => { setPage(1); }, [filterCategory, filterClient, searchQuery]);
  const totalPages = Math.ceil(displayedCredentials.length / ITEMS_PER_PAGE);
  const pagedCredentials = displayedCredentials.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="w-full">
      <div className="mb-12 border-b border-white/10 pb-6">
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div>
            <span className="text-white/50 tracking-[0.2em] text-[10px] uppercase font-display block">Secure Repository</span>
            <h2 className="text-4xl font-serif">{filterCategory || (filterClient ? "Client Vault" : "Vault")}</h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={handleExport} className="border border-white/20 hover:border-white/60 px-4 py-2 rounded-full text-xs font-display uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer bg-transparent text-white/60 hover:text-white"><Download size={12} /> Export</button>
            <button onClick={handleImport} className="border border-white/20 hover:border-white/60 px-4 py-2 rounded-full text-xs font-display uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer bg-transparent text-white/60 hover:text-white"><Upload size={12} /> Import</button>
            <button onClick={() => setOpenAdd(true)} className="border border-white/30 hover:border-white px-6 py-3 rounded-full text-xs font-display uppercase tracking-widest transition-all hover:bg-white hover:text-black flex items-center gap-2 cursor-pointer bg-transparent text-white"><Plus size={14} /> Initialize Entity</button>
          </div>
        </div>
        <div className="mt-6">
          <input type="text" placeholder="Search vault..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full max-w-md bg-transparent border-b border-white/20 px-0 py-2 text-white focus:outline-none focus:border-white transition-colors font-display text-sm tracking-widest placeholder:text-white/30" />
        </div>
      </div>

      {stats && !filterCategory && !filterClient && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[{ label: "Total Records", value: stats.total_credentials }, { label: "Company", value: stats.company_credentials }, { label: "Client", value: stats.client_credentials }, { label: "Shared", value: stats.shared_credentials }].map(s => (
            <div key={s.label} className="border border-white/10 p-6 bg-black/20">
              <span className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-display block mb-2">{s.label}</span>
              <span className="text-4xl font-serif">{s.value ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      {displayedCredentials.length === 0 && <p className="text-white/40 italic font-serif text-xl">No records found in this vault.</p>}

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {pagedCredentials.map(cred => (
            <TiltCard key={cred.id} layoutId={cred.id}>
              <div className="flex justify-between items-start mb-12 relative z-10">
                <div>
                  <span className="text-white/40 font-display text-[10px] uppercase tracking-[0.2em] block mb-2">{cred.credential_type}</span>
                  <h3 className="font-serif text-2xl">{cred.title}</h3>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openHistoryModal(cred.id)} title="History" className="text-white/40 hover:text-amber-400 cursor-pointer transition-colors bg-transparent border-none"><History size={14} /></button>
                  <button onClick={() => openShareModal(cred.id)} className="text-white/40 hover:text-white cursor-pointer transition-colors bg-transparent border-none"><Share2 size={14} /></button>
                  <button onClick={() => { setEditingCred(cred); setOpenAdd(true); }} className="text-white/40 hover:text-white cursor-pointer transition-colors bg-transparent border-none"><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(cred.id)} className="text-white/40 hover:text-red-500 cursor-pointer transition-colors bg-transparent border-none"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 relative z-10">
                {cred.data?.username && <div><span className="text-white/30 text-[10px] uppercase tracking-widest block mb-1">Identity</span><span className="text-white/80 truncate block">{cred.data.username}</span></div>}
                {cred.data?.api_key && <div><span className="text-white/30 text-[10px] uppercase tracking-widest block mb-1">API Key</span><div onClick={() => toggleReveal(cred.id)} onDoubleClick={() => copyToClipboard(cred.data.api_key)} className="text-white/80 font-mono tracking-widest truncate block cursor-pointer hover:text-indigo-300 transition-colors" title="Click to reveal, Double-click to copy">{revealedCreds.has(cred.id) ? cred.data.api_key : "••••••••••••••••"}</div></div>}
                {cred.data?.password && <div><span className="text-white/30 text-[10px] uppercase tracking-widest block mb-1">Passphrase</span><div onClick={() => toggleReveal(cred.id)} onDoubleClick={() => copyToClipboard(cred.data.password)} className="text-white/80 font-mono tracking-widest truncate block cursor-pointer hover:text-indigo-300 transition-colors" title="Click to reveal, Double-click to copy">{revealedCreds.has(cred.id) ? cred.data.password : "••••••••••••••••"}</div></div>}
                {cred.data?.secret_key && <div><span className="text-white/30 text-[10px] uppercase tracking-widest block mb-1">Secret Key</span><div onClick={() => toggleReveal(cred.id)} onDoubleClick={() => copyToClipboard(cred.data.secret_key)} className="text-white/80 font-mono tracking-widest truncate block cursor-pointer hover:text-indigo-300 transition-colors" title="Click to reveal, Double-click to copy">{revealedCreds.has(cred.id) ? cred.data.secret_key : "••••••••••••••••"}</div></div>}
                {cred.data?.url && <div className="col-span-2"><span className="text-white/30 text-[10px] uppercase tracking-widest block mb-1">Access URL</span><a href={cred.data.url} target="_blank" rel="noreferrer" className="text-indigo-400/80 hover:text-indigo-300 truncate block hover:underline font-mono text-sm">{cred.data.url}</a></div>}
                {cred.data?.notes && <div className="col-span-2"><span className="text-white/30 text-[10px] uppercase tracking-widest block mb-1">Notes</span><span className="text-white/60 text-xs block whitespace-normal break-words">{cred.data.notes}</span></div>}
                {cred.tags && <div className="col-span-2"><span className="text-white/30 text-[10px] uppercase tracking-widest block mb-1">Tags</span><span className="text-indigo-400/60 font-bold truncate block">{cred.tags}</span></div>}
              </div>
            </TiltCard>
          ))}
        </AnimatePresence>
      </motion.div>

      {totalPages > 1 && (
        <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-center gap-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-5 py-2 border border-white/20 rounded-full text-xs font-display uppercase tracking-widest text-white/60 hover:text-white hover:border-white/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer">Previous</button>
          <span className="text-white/40 font-display text-xs tracking-widest uppercase">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-5 py-2 border border-white/20 rounded-full text-xs font-display uppercase tracking-widest text-white/60 hover:text-white hover:border-white/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer">Next</button>
        </div>
      )}

      <AnimatePresence>
        {openAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-8 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => { setOpenAdd(false); setEditingCred(null); }} className="absolute top-6 right-6 text-white/40 hover:text-white cursor-pointer bg-transparent border-none"><X size={20} /></button>
              <h2 className="font-serif text-2xl border-b border-white/10 pb-4 mb-6">{editingCred ? "Edit Record" : "Initialize Entity"}</h2>
              <CredentialForm initialData={editingCred} onSuccess={() => { setOpenAdd(false); setEditingCred(null); loadData(); }} onCancel={() => { setOpenAdd(false); setEditingCred(null); }} />
            </motion.div>
          </div>
        )}

        {shareCredId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-8 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => { setShareCredId(null); setSharesList([]); }} className="absolute top-6 right-6 text-white/40 hover:text-white cursor-pointer bg-transparent border-none"><X size={20} /></button>
              <h2 className="font-serif text-2xl border-b border-white/10 pb-4 mb-6">Distribute Access</h2>
              {sharesList.length > 0 && (
                <div className="mb-6">
                  <span className="text-white/40 text-[10px] uppercase tracking-widest font-display block mb-3">Active Shares</span>
                  <div className="space-y-2">
                    {sharesList.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-3 border border-white/10 bg-white/5">
                        <div>
                          <span className="text-white/80 text-sm font-mono">{s.email}</span>
                          <span className="ml-3 text-white/40 text-[10px] uppercase tracking-widest font-display">{s.access_level}</span>
                          {s.expires_at && <span className="ml-3 text-amber-400/60 text-[10px] font-display">Expires {new Date(s.expires_at).toLocaleDateString()}</span>}
                        </div>
                        <button onClick={() => revokeShare(shareCredId, s.id)} className="text-white/30 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="my-6 border-t border-white/10" />
                </div>
              )}
              <span className="text-white/40 text-[10px] uppercase tracking-widest font-display block mb-4">Grant New Access</span>
              <ShareCredentialForm credentialId={shareCredId} onSuccess={() => { openShareModal(shareCredId); toast.success("Access granted"); }} onCancel={() => { setShareCredId(null); setSharesList([]); }} />
            </motion.div>
          </div>
        )}

        {historyCredId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-8 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => { setHistoryCredId(null); setHistoryData([]); }} className="absolute top-6 right-6 text-white/40 hover:text-white cursor-pointer bg-transparent border-none"><X size={20} /></button>
              <h2 className="font-serif text-2xl border-b border-white/10 pb-4 mb-6">Version History</h2>
              {historyData.length === 0 ? (
                <p className="text-white/40 italic font-serif">No version history yet. History is captured on every edit.</p>
              ) : (
                <div className="space-y-4">
                  {historyData.map((h: any, i: number) => (
                    <div key={h.id} className="border border-white/10 p-4 bg-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white/40 font-display text-[10px] uppercase tracking-widest">Version {historyData.length - i}</span>
                        <div className="text-right">
                          <span className="text-white/60 text-xs font-display block">{new Date(h.changed_at).toLocaleString()}</span>
                          {h.changed_by && <span className="text-white/30 text-[10px] font-mono">{h.changed_by}</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {h.data && Object.entries(h.data).map(([key, val]: [string, any]) => {
                          const isSensitive = ["password", "api_key", "secret_key"].includes(key);
                          const hKey = `${h.id}-${key}`;
                          return (
                            <div key={key}>
                              <span className="text-white/30 text-[10px] uppercase tracking-widest block mb-1">{key}</span>
                              {isSensitive ? (
                                <div className="flex items-center gap-2">
                                  <span onClick={() => toggleRevealH(hKey)} className="text-white/70 font-mono text-sm cursor-pointer hover:text-indigo-300 transition-colors">{revealedHistory.has(hKey) ? String(val) : "••••••••"}</span>
                                  <button onClick={() => toggleRevealH(hKey)} className="text-white/30 hover:text-white bg-transparent border-none cursor-pointer">{revealedHistory.has(hKey) ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                                  <button onClick={() => copyToClipboard(String(val))} className="text-white/30 hover:text-white bg-transparent border-none cursor-pointer"><Copy size={12} /></button>
                                </div>
                              ) : (
                                <span className="text-white/70 text-sm break-words">{String(val)}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {(filterCategory || filterClient) && (
        <div className="mt-8">
          <button onClick={() => navigate("/")} className="text-white/40 hover:text-white font-display text-xs uppercase tracking-widest transition-colors bg-transparent border-none cursor-pointer">? Back to Full Vault</button>
        </div>
      )}
    </div>
  );
}
