"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { submitBoardPost, type BoardPostResult } from "@/lib/boardPost";
import { revalidatePath } from "next/cache";

export async function createOpportunityPost(_prev: BoardPostResult, formData: FormData): Promise<BoardPostResult> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const result = await submitBoardPost("OPORTUNIDAD", userId, formData);
  if (result?.ok) revalidatePath("/oportunidades");
  return result;
}
