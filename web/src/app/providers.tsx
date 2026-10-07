"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "~/util/queryClient";
import { DemoProvider } from "~/state/DemoContext";
import { SocketProvider } from "~/hooks/useSocket";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <DemoProvider>{children}</DemoProvider>
      </SocketProvider>
    </QueryClientProvider>
  );
}
