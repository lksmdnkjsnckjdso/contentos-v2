import { Sidebar, Topbar } from "@/components/app-shell/sidebar";

export function AppShell({
  active,
  title,
  subtitle,
  children,
}: {
  active: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar active={active} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
