// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

// export function formatDate(dateString: string): string {
//   const date = new Date(dateString);
//   return date.toLocaleDateString("zh-CN", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
// }
export function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs.filter(Boolean).join(" ");
}
