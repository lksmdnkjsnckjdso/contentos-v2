"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSlot } from "@/app/actions/content";
import { toast } from "sonner";

const mediaTypes = [
  { value: "REEL", label: "Reel" },
  { value: "CAROUSEL", label: "Carousel" },
  { value: "STORY", label: "Story" },
  { value: "SINGLE", label: "Post" },
];

export function NewSlotButton({ weekStart }: { weekStart: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [date, setDate] = React.useState(weekStart.slice(0, 10));
  const [time, setTime] = React.useState("18:00");
  const [mediaType, setMediaType] = React.useState("REEL");
  const [pillar, setPillar] = React.useState("");

  const save = async () => {
    setSaving(true);
    const res = await createSlot({ date, time, mediaType: mediaType as never, pillar: pillar || null });
    setSaving(false);
    if (res.ok) {
      toast.success("Slot created");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to create slot");
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> New slot
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New content slot</DialogTitle>
            <DialogDescription>
              Reserve a time — the AI fills in topic, script and caption later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slot-date">Date</Label>
              <Input id="slot-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot-time">Time</Label>
              <Input id="slot-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={mediaType} onValueChange={setMediaType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mediaTypes.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot-pillar">Pillar (optional)</Label>
              <Input
                id="slot-pillar"
                placeholder="e.g. Systems"
                value={pillar}
                onChange={(e) => setPillar(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={saving || !date}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {saving ? "Creating…" : "Create slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
