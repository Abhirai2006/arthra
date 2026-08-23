import { AlertCircle, RotateCw } from "lucide-react";

export function WorkspaceErrorState({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return <section className="workspace-error" role="alert"><AlertCircle size={24} /><div><p className="workspace-kicker">Something needs another try</p><h2>{title}</h2><p>{message}</p><button className="workspace-add" type="button" onClick={onRetry}><RotateCw size={15} /> Try again</button></div></section>;
}
