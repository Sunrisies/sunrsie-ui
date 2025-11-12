import React from "react"

interface ButtonProps {
  onClick?: () => void
  children?: React.ReactNode
  className?: string
  type?: "button" | "submit" | "reset"
}

export const Button: React.FC<ButtonProps> = ({ onClick, children, className, type = "button" }) => {
  return (
    <button
      className={`bg-blue-500 !text-red-400 border-2 border-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded ${className || ""}`}
      type={type}
      onClick={onClick}
    >
      {children || "Button"}
    </button>
  )
}
