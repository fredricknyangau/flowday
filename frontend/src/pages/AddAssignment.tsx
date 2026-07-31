import { createAssignment } from "@/api/assignments";
import { fetchContexts } from "@/api/contexts";
import { EstimatedHoursBadge } from "@/components/EstimatedHoursBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ASSIGNMENT_TYPES } from "@/lib/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function AddAssignment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [contextId, setContextId] = useState("");
  const [assignmentType, setAssignmentType] = useState("");
  const [course, setCourse] = useState("");
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [deadlineDate, setDeadlineDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [paymentKes, setPaymentKes] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [keepOpen, setKeepOpen] = useState(false);

  const {
    data: contexts = [],
    isLoading: contextsLoading,
    isError: contextsError,
    refetch: refetchContexts,
  } = useQuery({
    queryKey: ["contexts"],
    queryFn: fetchContexts,
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ['createAssignment'],
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      if (keepOpen) {
        setSuccessMessage("Assignment saved! Context & deadline kept for next entry.");
        setCourse("");
        setWordCount(null);
        setPaymentKes(null);
        setNotes("");
        setReminderMinutesBefore(null);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        navigate("/");
      }
    },
    onError: (err: Error) => {
      setSubmitError(err.message);
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!contextId) e.contextId = "Select a work context";
    if (!assignmentType) e.assignmentType = "Select an assignment type";
    if (!deadlineDate) e.deadlineDate = "Enter a deadline date";
    if (!deadlineTime) e.deadlineTime = "Enter a deadline time";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(addAnother = false) {
    setSubmitError(null);
    setSuccessMessage(null);
    if (!validate()) return;

    setKeepOpen(addAnother);
    const localDeadline = new Date(`${deadlineDate}T${deadlineTime}:00`);
    mutate({
      context_id: contextId,
      assignment_type: assignmentType as any,
      course: course || undefined,
      word_count: wordCount ?? undefined,
      deadline: localDeadline.toISOString(),
      payment_kes: paymentKes ?? undefined,
      notes: notes || undefined,
      reminder_minutes_before: reminderMinutesBefore,
    });
  }

  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">New Assignment</h1>

      {/* Success banner for multi-add mode */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-3">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{successMessage}</p>
        </div>
      )}

      {/* Submission error banner */}
      {submitError && (
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      {/* Context select */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Work Context <span className="text-red-500">*</span>
        </label>

        {contextsError ? (
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2 flex items-center justify-between">
            <p className="text-xs text-red-600 dark:text-red-400">Could not load contexts</p>
            <button
              onClick={() => refetchContexts()}
              className="text-xs text-red-600 dark:text-red-400 underline font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          <select
            value={contextId}
            onChange={(e) => setContextId(e.target.value)}
            disabled={contextsLoading}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white dark:bg-gray-800 disabled:opacity-50"
          >
            <option value="">
              {contextsLoading ? "Loading contexts…" : "Select work context"}
            </option>
            {contexts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.context_type || 'Client'})
              </option>
            ))}
          </select>
        )}
        {fieldErrors.contextId && (
          <p className="text-xs text-red-500">{fieldErrors.contextId}</p>
        )}
      </div>

      {/* Assignment type */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Assignment Type <span className="text-red-500">*</span>
        </label>
        <select
          value={assignmentType}
          onChange={(e) => setAssignmentType(e.target.value)}
          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white dark:bg-gray-800"
        >
          <option value="">Select type</option>
          {ASSIGNMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {fieldErrors.assignmentType && (
          <p className="text-xs text-red-500">{fieldErrors.assignmentType}</p>
        )}
      </div>

      {/* Course */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Course / Subject
        </label>
        <Input
          placeholder="e.g. NUR 437"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        />
      </div>

      {/* Word count */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Word Count
        </label>
        <Input
          type="number"
          placeholder="e.g. 1200"
          value={wordCount ?? ""}
          onChange={(e) =>
            setWordCount(e.target.value ? Number(e.target.value) : null)
          }
        />
      </div>

      <EstimatedHoursBadge wordCount={wordCount} />

      {/* Deadline */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Deadline <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
          />
          <Input
            type="time"
            value={deadlineTime}
            onChange={(e) => setDeadlineTime(e.target.value)}
          />
        </div>
        {fieldErrors.deadlineDate && (
          <p className="text-xs text-red-500">{fieldErrors.deadlineDate}</p>
        )}
      </div>

      {/* Payment */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Payment (KES)
        </label>
        <Input
          type="number"
          placeholder="e.g. 500"
          value={paymentKes ?? ""}
          onChange={(e) =>
            setPaymentKes(e.target.value ? Number(e.target.value) : null)
          }
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Notes
        </label>
        <Textarea
          placeholder="Any special instructions from the client..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Reminder override */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Reminder Lead Time
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="number"
            placeholder="Workspace default"
            min={5}
            max={1440}
            value={reminderMinutesBefore ?? ""}
            onChange={(e) =>
              setReminderMinutesBefore(e.target.value ? Math.max(5, Math.min(1440, Number(e.target.value))) : null)
            }
            className="w-36"
          />
          <span className="text-xs text-gray-400 dark:text-gray-500">min</span>
          <div className="flex items-center gap-1.5">
            {[30, 60, 120, 240].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReminderMinutesBefore(reminderMinutesBefore === preset ? null : preset)}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  reminderMinutesBefore === preset
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600'
                }`}
              >
                {preset < 60 ? `${preset}m` : `${preset / 60}h`}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">Leave blank to use workspace default. Overrides per-assignment when set.</p>
      </div>

      <div className="space-y-2 pt-2">
        <Button
          onClick={() => handleSubmit(false)}
          disabled={isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          {isPending && !keepOpen ? "Saving…" : "Save Assignment"}
        </Button>

        <Button
          variant="outline"
          onClick={() => handleSubmit(true)}
          disabled={isPending}
          className="w-full border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 font-semibold"
        >
          {isPending && keepOpen ? "Saving…" : "+ Save & Add Another"}
        </Button>

        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="w-full text-gray-500 dark:text-gray-400"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
