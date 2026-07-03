import { fetchTodayAssignments } from "@/api/assignments";
import { AssignmentCard } from "@/components/AssignmentCard";
import { SchedulePanel } from "@/components/SchedulePanel";
import { sortAssignmentsByUrgency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export function Today() {
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments", "today"],
    queryFn: fetchTodayAssignments,
    refetchInterval: 60_000,
  });

  const assignmentArray = Array.isArray(assignments) ? assignments : [];
  const sorted = sortAssignmentsByUrgency(
    assignmentArray.filter((a) => a.status !== "Cancelled"),
  );

  const pending = sorted.filter((a) => a.status !== "Submitted");
  const submitted = sorted.filter((a) => a.status === "Submitted");

  return (
    <div className="pb-20">
      <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
        <p className="text-sm text-emerald-700 font-medium">
          {isLoading
            ? "Loading..."
            : `${pending.length} assignment${pending.length !== 1 ? "s" : ""} pending today`}
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:px-6 lg:pt-6">
        <section>
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider lg:px-0 lg:pt-0">
            Today's Assignments
          </h2>
          <div className="px-4 space-y-3 lg:px-0">
            {isLoading &&
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            {!isLoading && pending.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <p className="text-sm">No pending assignments today</p>
              </div>
            )}
            {pending.map((a) => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}
            {submitted.length > 0 && (
              <>
                <p className="text-xs text-gray-400 pt-2 font-medium">
                  Submitted
                </p>
                {submitted.map((a) => (
                  <AssignmentCard key={a.id} assignment={a} />
                ))}
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className="px-4 pt-6 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider lg:px-0 lg:pt-0">
            Today's Schedule
          </h2>
          <div className="px-4 space-y-2 lg:px-0">
            <SchedulePanel />
          </div>
        </section>
      </div>
    </div>
  );
}
