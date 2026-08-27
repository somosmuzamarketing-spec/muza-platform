"use client";
import { useFormState, useFormStatus } from "react-dom";
import { voteInPoll } from "@/app/dashboard/actions";

type Option = { id: string; label: string; voteCount: number };

function VoteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="poll-vote-btn" disabled={pending}>
      {label}
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
  const showResults = hasVoted || state?.ok;

  if (showResults) {
    return (
      <div>
        {options.map((o) => {
          const pct = totalVotes > 0 ? Math.round((o.voteCount / totalVotes) * 100) : 0;
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
        })}
        <p className="poll-voted-note">
          {totalVotes} {totalVotes === 1 ? "voto" : "votos"} · Gracias por participar
        </p>
      </div>
    );
  }

  return (
    <div>
      {options.map((o) => (
        <form action={formAction} key={o.id}>
          <input type="hidden" name="pollId" value={pollId} />
          <input type="hidden" name="optionId" value={o.id} />
          <VoteButton label={o.label} />
        </form>
      ))}
      {state?.error && <p style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{state.error}</p>}
    </div>
  );
}
