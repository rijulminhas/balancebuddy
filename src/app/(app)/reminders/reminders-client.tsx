"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReminderList } from "@/components/reminders/reminder-list";
import { ReminderForm } from "@/components/reminders/reminder-form";
import type { Reminder } from "@/db/schema";

interface RemindersClientProps {
  initialReminders: Reminder[];
}

export function RemindersClient({ initialReminders }: RemindersClientProps) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [formOpen, setFormOpen] = useState(false);

  function handleSaved() {
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((d) => setReminders(d.reminders ?? []));
  }

  return (
    <>
      {/* Add button */}
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)} size="lg">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Reminder
        </Button>
      </div>

      <ReminderList initialReminders={reminders} />

      <ReminderForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}
