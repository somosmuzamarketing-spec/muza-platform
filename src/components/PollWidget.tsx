"use client";
import { useFormState, useFormStatus } from "react-dom";
import { voteInPoll } from "@/app/dashboard/actions";

type Option = { id: string; label: string; voteCount: number };

function VoteButton({ label, pct }: { label: string; pct: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="poll-vote-btn" disabled={pending} style={{ background: "transparent" }}>
      <div className="poll-opt" style={{ margin: 0 }}>
        <div className="poll-opt-label">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
        <div className="poll-opt-bar">
          <div className="poll-opt-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </button>
  );
}

export default function PollWidget({
  pollId,
  options,
  hasVoted,
}: {
  pollId: string;
  options: Option[];
  hasVoted: boolean;
}) {
  const [state, formAction] = useFormState(voteInPoll, null);
  const totalVotes = options.reduce((sum, o) => sum + o.voteCount, 0);
  const voted = hasVoted || !!state?.ok;

  return (
    <div>
      {options.map((o) => {
        const pct = totalVotes > 0 ? Math.round((o.voteCount / totalVotes) * 100) : 0;
        if (voted) {
          return (
            <div className="poll-opt" key={o.id}>
              <div className="poll-opt-label">
                <span>{o.label}</span>
                <span>{pct}%</span>
              </div>
              <div className="poll-opt-bar">
                <div className="poll-opt-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        }
        return (
          <form action={formAction} key={o.id}>
            <input type="hidden" name="pollId" value={pollId} />
            <input type="hidden" name="optionId" value={o.id} />
            <VoteButton label={o.label} pct={pct} />
          </form>
        );
      })}
      {state?.error && <p style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{state.error}</p>}
      <p className="poll-voted-note">
        {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
        {voted ? " · Gracias por participar" : ""}
      </p>
    </div>
  );
}
