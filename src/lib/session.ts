import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./auth";
import { getProfile, isPro, type Profile } from "./progress";

export interface Viewer {
  id: string;
  name: string;
  email: string;
  profile: Profile;
  pro: boolean;
}

// cache: header, footer and page share one session lookup per request.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const profile = getProfile(session.user.id);
  return { id: session.user.id, name: session.user.name, email: session.user.email, profile, pro: isPro(profile) };
});
