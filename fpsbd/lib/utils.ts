import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { v4 as uuidv4 } from "uuid"
import { getCollection } from "./db/mongodb"

// Generate a unique ID
export const generateId = (): string => {
  return uuidv4()
}

// Format date to locale string
export const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Calculate days between two dates
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000 // hours*minutes*seconds*milliseconds
  const firstDate = new Date(date1)
  const secondDate = new Date(date2)

  return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay))
}

// Calculate fine for overdue books (Rp 1000 per day)
export const calculateFine = (dueDate: Date, returnDate: Date = new Date()): number => {
  const days = daysBetween(dueDate, returnDate)
  return dueDate < returnDate ? days * 1000 : 0
}

// Log activity to MongoDB
export const logActivity = async (
  action: string,
  description: string,
  entityType: string,
  entityId?: string,
  userId?: string,
) => {
  try {
    const activities = await getCollection("activities")

    const activity = {
      id: generateId(),
      action,
      description,
      entityType,
      entityId,
      userId,
      createdAt: new Date(),
    }

    await activities.insertOne(activity)
    return activity
  } catch (error) {
    console.error("Failed to log activity:", error)
    // Don't throw error to prevent disrupting the main flow
  }
}

// Format relative time (e.g., "2 hours ago")
export const getRelativeTime = (date: Date | string): string => {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()

  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)

  if (diffSec < 60) {
    return `${diffSec} detik lalu`
  } else if (diffMin < 60) {
    return `${diffMin} menit lalu`
  } else if (diffHour < 24) {
    return `${diffHour} jam lalu`
  } else if (diffDay < 30) {
    return `${diffDay} hari lalu`
  } else {
    return formatDate(date)
  }
}

// Map activity to frontend format
export const mapActivityToFrontend = (activity: any) => {
  let icon = "fa-info-circle"
  let type = "info"

  // Determine icon and type based on action
  if (activity.action.includes("add") || activity.action.includes("create")) {
    icon = "fa-plus"
    type = "success"
  } else if (activity.action.includes("update") || activity.action.includes("edit")) {
    icon = "fa-edit"
    type = "info"
  } else if (activity.action.includes("delete") || activity.action.includes("remove")) {
    icon = "fa-trash"
    type = "danger"
  } else if (activity.action.includes("borrow")) {
    icon = "fa-exchange-alt"
    type = "warning"
  } else if (activity.action.includes("return")) {
    icon = "fa-undo"
    type = "success"
  } else if (activity.action.includes("overdue")) {
    icon = "fa-exclamation-triangle"
    type = "danger"
  }

  return {
    id: activity.id,
    icon,
    text: activity.description,
    time: getRelativeTime(activity.createdAt),
    type,
  }
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
