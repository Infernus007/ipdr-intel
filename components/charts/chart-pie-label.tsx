"use client"

import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A pie chart with labels for IPDR analytics"

const chartData = [
  { browser: "TCP", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "UDP", visitors: 200, fill: "var(--color-safari)" },
  { browser: "HTTP", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "HTTPS", visitors: 173, fill: "var(--color-edge)" },
  { browser: "Other", visitors: 90, fill: "var(--color-other)" },
]

const chartConfig = {
  visitors: {
    label: "Connections",
  },
  chrome: {
    label: "TCP",
    color: "var(--chart-1)",
  },
  safari: {
    label: "UDP",
    color: "var(--chart-2)",
  },
  firefox: {
    label: "HTTP",
    color: "var(--chart-3)",
  },
  edge: {
    label: "HTTPS",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export function ChartPieLabel() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Protocol Distribution</CardTitle>
        <CardDescription>Network traffic by protocol type</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="visitors" label nameKey="browser" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing protocol distribution for network analysis
        </div>
      </CardFooter>
    </Card>
  )
}
