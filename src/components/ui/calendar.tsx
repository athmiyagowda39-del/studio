"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DropdownProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  onClearClick?: () => void
  onTodayClick?: () => void
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  onClearClick,
  onTodayClick,
  ...props
}: CalendarProps) {
  return (
    <>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "hidden",
          caption_dropdowns: "flex gap-2",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
          row: "flex w-full mt-2",
          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          Dropdown: (props: DropdownProps) => {
            const { value, onChange, name, options } = props;
            
            if (!options) return null;

            const handleChange = (value: string) => {
              const changeEvent = {
                target: { value },
              } as React.ChangeEvent<HTMLSelectElement>;
              onChange?.(changeEvent);
            };

            const selected = options.find((option) => option.value === value);

            return (
              <Select
                value={value?.toString()}
                onValueChange={handleChange}
              >
                <SelectTrigger className="pr-1.5 focus:ring-0 w-fit">
                  <SelectValue>{selected?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent position="popper">
                  <ScrollArea className={name === 'years' ? 'h-48' : 'h-auto'}>
                    {options.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            );
          },
          IconLeft: () => <ChevronLeft className="h-4 w-4" />,
          IconRight: () => <ChevronRight className="h-4 w-4" />,
        }}
        captionLayout="dropdown"
        fromYear={new Date().getFullYear() - 50}
        toYear={new Date().getFullYear() + 5}
        {...props}
      />
      {(onClearClick || onTodayClick) && (
        <div className="flex justify-between p-3 pt-0 border-t mt-2">
          <Button
            variant="ghost"
            onClick={onClearClick}
            className={!onClearClick ? "invisible" : ""}
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            onClick={onTodayClick}
            className={!onTodayClick ? "invisible" : ""}
          >
            Today
          </Button>
        </div>
      )}
    </>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
