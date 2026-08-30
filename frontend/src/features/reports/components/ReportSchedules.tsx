"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useReportSchedules, useCreateReportSchedule, useDeleteReportSchedule } from "../index";
import { ReportScheduleCreateSchema, type ReportScheduleCreateFormData } from "../index";
import { Trash2, Calendar, Mail, Loader2, AlertCircle, Plus } from "lucide-react";

export function ReportSchedulesPanel() {
  const { data: schedules, isLoading, error } = useReportSchedules();
  const createMutation = useCreateReportSchedule();
  const deleteMutation = useDeleteReportSchedule();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportScheduleCreateFormData>({
    resolver: zodResolver(ReportScheduleCreateSchema),
    defaultValues: {
      report_name: "",
      report_type: "EXECUTIVE_RISK",
      frequency: "weekly",
      recipients: [],
    },
  });

  const onSubmit = async (data: ReportScheduleCreateFormData) => {
    // Convert comma-separated string to array if string is input
    const recipients = typeof data.recipients === "string"
      ? (data.recipients as string).split(",").map((e) => e.trim())
      : data.recipients;
    await createMutation.mutateAsync({ ...data, recipients });
    reset();
  };

  if (isLoading) return <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-400" />;
  if (error) return <p className="text-red-400">Failed to load schedules.</p>;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* List */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-semibold text-white">Active Schedules</h3>
        {!schedules?.length ? (
          <div className="rounded-xl border border-white/10 bg-slate-800/40 p-8 text-center">
            <Calendar className="mx-auto h-8 w-8 text-gray-500 mb-2" />
            <p className="text-gray-400">No report schedules configured.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-white/10 bg-slate-800/60 p-4 flex justify-between items-start"
              >
                <div>
                  <h4 className="font-semibold text-white">{s.report_name}</h4>
                  <p className="text-xs text-indigo-400 mt-0.5 capitalize">{s.frequency}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Mail className="h-3 w-3" />
                    <span>{s.recipients.join(", ")}</span>
                  </div>
                  {s.next_scheduled && (
                    <p className="text-xs text-gray-500 mt-2">
                      Next run: {new Date(s.next_scheduled).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(s.id)}
                  disabled={deleteMutation.isPending}
                  className="rounded-md p-1.5 text-gray-500 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Form */}
      <div className="rounded-xl border border-white/10 bg-slate-800/60 p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Create Schedule</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400">Schedule Name</label>
            <input
              {...register("report_name")}
              placeholder="e.g. Weekly CISO Report"
              className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
            {errors.report_name && (
              <p className="mt-1 text-xs text-red-400">{errors.report_name.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400">Report Type</label>
            <select
              {...register("report_type")}
              className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="EX_RISK">Executive Risk</option>
              <option value="COMPLIANCE">Compliance Gap</option>
              <option value="FIN_RISK">Financial Risk</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400">Frequency</label>
            <select
              {...register("frequency")}
              className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400">Recipients (comma-separated emails)</label>
            <input
              {...register("recipients")}
              placeholder="ciso@corp.com, ceo@corp.com"
              className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
            {errors.recipients && (
              <p className="mt-1 text-xs text-red-400">{errors.recipients.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Scheduling…</>
            ) : (
              <><Plus className="h-4 w-4" /> Save Schedule</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
