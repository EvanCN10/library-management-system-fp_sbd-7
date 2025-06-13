import { NextResponse } from "next/server"
import { getCollection } from "@/lib/db/mongodb"
import { mapActivityToFrontend } from "@/lib/utils"

export async function GET() {
  try {
    const activities = await getCollection("activities")

    // Get the 10 most recent activities
    const recentActivities = await activities.find({}).sort({ createdAt: -1 }).limit(10).toArray()

    // Map activities to frontend format
    const formattedActivities = recentActivities.map(mapActivityToFrontend)

    return NextResponse.json(formattedActivities)
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return NextResponse.json({ error: "Failed to fetch recent activities" }, { status: 500 })
  }
}
