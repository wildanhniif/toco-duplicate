import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PeriodFilterProps {
  value: string | null;
  onChange: (period: string | null) => void;
  dateRange: { start: Date | null; end: Date | null };
  onDateRangeChange: (range: { start: Date | null; end: Date | null }) => void;
}

export default function PeriodFilter({
  value,
  onChange,
  dateRange,
  onDateRangeChange,
}: PeriodFilterProps) {
  const [open, setOpen] = useState(false);

  const presets = [
    { label: "Hari Ini", value: "today" },
    { label: "Kemarin", value: "yesterday" },
    { label: "7 Hari Terakhir", value: "last7days" },
    { label: "30 Hari Terakhir", value: "last30days" },
    { label: "Bulan Ini", value: "thismonth" },
  ];

  const handlePresetClick = (presetValue: string) => {
    onChange(presetValue);
    setOpen(false);
  };

  const handleReset = () => {
    onChange(null);
    onDateRangeChange({ start: null, end: null });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Calendar className="w-4 h-4 mr-2" />
          {value
            ? presets.find((p) => p.value === value)?.label || "Periode"
            : "Semua Periode"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-3">Pilih Periode</h4>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={value === preset.value ? "default" : "outline"}
                  className={cn(
                    "justify-start",
                    value === preset.value &&
                      "bg-orange-500 hover:bg-orange-600"
                  )}
                  onClick={() => handlePresetClick(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Range - Placeholder for future implementation */}
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-500 italic">
              Custom date range akan tersedia segera
            </p>
          </div>

          <div className="flex gap-2 pt-3 border-t">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              Reset
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              onClick={() => setOpen(false)}
            >
              Simpan
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
