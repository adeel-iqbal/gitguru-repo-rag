"use client";

import { useState } from "react";
import RepoInput, { RepoInfo } from "@/components/RepoInput";
import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  const [activeRepo, setActiveRepo] = useState<RepoInfo | null>(null);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <RepoInput
        activeRepo={activeRepo}
        onRepoLoaded={setActiveRepo}
        onClearRepo={() => setActiveRepo(null)}
      />
      <ChatWindow activeRepo={activeRepo} />
    </div>
  );
}
