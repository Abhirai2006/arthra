import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, UsersRound } from "lucide-react";
import { useLocation } from "wouter";

export default function JoinSpacePage() {
  const [location, navigate] = useLocation(); const token = location.split("/").filter(Boolean).at(-1) ?? ""; const { user, loading } = useAuth(); const preview = trpc.finance.spaces.previewInvite.useQuery({ token }, { enabled: token.length >= 32 }); const accept = trpc.finance.spaces.acceptInvite.useMutation({ onSuccess: () => navigate("/spaces") });
  const invalid = !preview.isLoading && (!preview.data || preview.data.revokedAt || preview.data.acceptedAt || preview.data.expiresAt < new Date());
  return <main className="invite-page"><a className="invite-brand" href="/"><BrandMark /></a><section className="invite-card">{preview.isLoading || loading ? <Loader2 className="animate-spin text-primary" /> : invalid ? <><span className="invite-icon"><UsersRound size={25} /></span><h1>This invite is no longer active.</h1><p>It may have expired, been used, or been revoked by the person who created it.</p><Button onClick={() => navigate("/")} className="rounded-xl">Go to Arthra</Button></> : <><span className="invite-icon"><UsersRound size={25} /></span><p className="workspace-kicker">Expense Space invitation</p><h1>Join <em>{preview.data?.spaceName}</em>.</h1><p>You have been invited as an <strong>{preview.data?.role}</strong>. {preview.data?.role === "editor" ? "You can add and update entries in this shared context." : "You can view the shared context without changing its entries."}</p>{user ? <Button disabled={accept.isPending} onClick={() => accept.mutate({ token })} className="w-full rounded-xl py-6">{accept.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}Accept invitation</Button> : <Button onClick={() => startLogin(`/join/${token}`)} className="w-full rounded-xl py-6">Sign in to join</Button>}</>}</section></main>;
}
