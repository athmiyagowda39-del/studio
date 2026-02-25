"use client"

import { Pie, PieChart, Cell } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

type LeadStatusChartProps = {
  data: { name: string; value: number }[]
  onStatusClick?: (status: string) => void
}

const chartConfig = {
  value: {
    label: "Leads",
  },
  "Order closed": {
    label: "Order closed",
    color: "hsl(var(--chart-2))",
  },
  "Pursuing to Purchase": {
    label: "Pursuing to Purchase",
    color: "hsl(var(--primary))",
  },
  "Proposal Sent": {
    label: "Proposal Sent",
    color: "hsl(var(--chart-3))",
  },
  "Quote Sent": {
    label: "Quote Sent",
    color: "hsl(var(--chart-3))",
  },
  "Demo Given": {
    label: "Demo Given",
    color: "hsl(var(--chart-3))",
  },
  Attended: {
    label: "Attended",
    color: "hsl(var(--chart-4))",
  },
  "Not viewed": {
    label: "Not viewed",
    color: "hsl(var(--chart-5))",
  },
  Unattended: {
    label: "Unattended",
    color: "hsl(var(--chart-5))",
  },
  "Not interested": {
    label: "Not interested",
    color: "hsl(var(--destructive))",
  },
  "Do Not Contact": {
    label: "Do Not Contact",
    color: "hsl(var(--destructive))",
  },
  Fake: {
    label: "Fake",
    color: "hsl(var(--muted-foreground))",
  },
  "Existing Users": {
    label: "Existing Users",
    color: "hsl(var(--muted-foreground))",
  },
}

export default function LeadStatusChart({
  data,
  onStatusClick,
}: LeadStatusChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    fill:
      chartConfig[item.name as keyof typeof chartConfig]?.color ||
      "hsl(var(--muted-foreground))",
  }))

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[400px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={80}
          strokeWidth={5}
          onClick={(pieData) => onStatusClick?.(pieData.name)}
          cursor={onStatusClick ? "pointer" : "default"}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )
}
