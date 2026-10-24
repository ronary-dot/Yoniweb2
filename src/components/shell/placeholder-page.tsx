import { Hammer } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

/** Stand-in for screens scheduled in a later milestone (SPEC §17). */
export function PlaceholderPage({ title, milestone }: { title: string; milestone: string }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState icon={Hammer} title="בבנייה">
        המסך הזה מתוכנן לשלב {milestone}.
      </EmptyState>
    </>
  );
}
