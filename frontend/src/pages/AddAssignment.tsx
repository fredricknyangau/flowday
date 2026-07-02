import { createAssignment } from "@/api/assignments";
import { fetchClients } from "@/api/clients";
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

  const [clientId, setClientId] = useState("");
  const [assignmentType, setAssignmentType] = useState("");
  const [course, setCourse] = useState("");
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [deadlineDate, setDeadlineDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [deadlineTime, setDeadlineTime] = useState("23:59");
  const [paymentKes, setPaymentKes] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });
  const clientArray = Array.isArray(clients) ? clients : [];

  const { mutate, isPending } = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      navigate("/");
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!clientId) e.clientId = "Select a client";
    if (!assignmentType) e.assignmentType = "Select an assignment type";
    if (!deadlineDate) e.deadlineDate = "Enter a deadline date";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    mutate({
      client_id: clientId,
      assignment_type: assignmentType as any,
      course: course || undefined,
      word_count: wordCount ?? undefined,
      deadline: `${deadlineDate}T${deadlineTime}:00`,
      payment_kes: paymentKes ?? undefined,
      notes: notes || undefined,
    });
  }

  return (
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto space-y-5">
      <h1 className="text-base font-semibold text-gray-800">New Assignment</h1>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          Client <span className="text-red-500">*</span>
        </label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
        >
          <option value="">Select client</option>
          {clientArray.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.clientId && (
          <p className="text-xs text-red-500">{errors.clientId}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          Assignment Type <span className="text-red-500">*</span>
        </label>
        <select
          value={assignmentType}
          onChange={(e) => setAssignmentType(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
        >
          <option value="">Select type</option>
          {ASSIGNMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors.assignmentType && (
          <p className="text-xs text-red-500">{errors.assignmentType}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          Course / Subject
        </label>
        <Input
          placeholder="e.g. NUR 437"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
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

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
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
        {errors.deadlineDate && (
          <p className="text-xs text-red-500">{errors.deadlineDate}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
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

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          Notes
        </label>
        <Textarea
          placeholder="Any special instructions from the client..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-3 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isPending ? "Saving..." : "Save Assignment"}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
