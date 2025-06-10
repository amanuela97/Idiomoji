"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface GameHistory {
  date: string;
  score: number;
  won: boolean;
  attempts: number;
  usedHint: boolean;
  usedPatternHint: boolean;
  attemptValues: string[];
}

interface StatsChartProps {
  history: GameHistory[];
}

export function StatsChart({ history }: StatsChartProps) {
  // Sort history by date
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const labels = sortedHistory.map((game) => formatDate(game.date));
  const scores = sortedHistory.map((game) => game.score);

  // Create win/loss data
  const winStatus = sortedHistory.map((game) => (game.won ? 1 : 0));

  const data = {
    labels,
    datasets: [
      {
        label: "Score",
        data: scores,
        borderColor: "rgb(147, 51, 234)",
        backgroundColor: "rgba(147, 51, 234, 0.1)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Win/Loss",
        data: winStatus,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        tension: 0,
        pointRadius: 6,
        pointHoverRadius: 8,
        showLine: false,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          color: "rgba(0, 0, 0, 0.6)",
        },
      },
      y1: {
        position: "right" as const,
        beginAtZero: true,
        max: 1,
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "rgba(0, 0, 0, 0.6)",
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 6,
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#000",
        bodyColor: "#666",
        borderColor: "rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          label: (context: TooltipItem<"line">) => {
            if (context.dataset.label === "Win/Loss") {
              return context.raw === 1 ? "Win" : "Loss";
            }
            return `Score: ${context.raw}`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
}
